'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  CORSA — Vex Bot
//  Gara di gruppo a turni: ogni partecipante risponde a mini-sfide a scelta
//  multipla (pulsanti). Chi arriva prima al traguardo (3 risposte giuste)
//  vince il montepremi. Lo stato vive in db[from].corsaGame.
// 
const ROUNDS_TO_WIN = 3;
const MAX_PLAYERS = 8;
const JOIN_TIME_MS = 60000; // finestra di iscrizione
const ANSWER_TIME_MS = 25000;

// Mini-sfide a scelta multipla.
const QUESTIONS = [
    { q: 'Qual è la capitale della Francia?', a: 'Parigi', w: ['Roma', 'Londra'] },
    { q: 'Quanti giorni ha un anno bisestile?', a: '366', w: ['365', '364'] },
    { q: 'Che animale è il re della giungla?', a: 'Leone', w: ['Tigre', 'Elefante'] },
    { q: 'Qual è il colore del cielo di giorno?', a: 'Azzurro', w: ['Verde', 'Rosso'] },
    { q: 'Quante zampe ha un cane?', a: '4', w: ['2', '6'] },
    { q: 'Chi ha dipinto la Gioconda?', a: 'Leonardo', w: ['Picasso', 'Van Gogh'] },
    { q: 'Qual è il pianeta più vicino al Sole?', a: 'Mercurio', w: ['Venere', 'Marte'] },
    { q: 'Che cosa fa il sole al mattino?', a: 'Sorge', w: ['Tramonta', 'Dorme'] },
    { q: 'Qual è il continente più grande?', a: 'Asia', w: ['Africa', 'Europa'] },
    { q: 'Quante corde ha una chitarra?', a: '6', w: ['4', '8'] },
];

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Prepara una domanda: { q, options: [{label, correct}] (mescolate) }.
const pickQuestion = (used) => {
    const pool = QUESTIONS.filter((_, i) => !used.includes(i));
    const idx = pool.length ? QUESTIONS.indexOf(pool[Math.floor(Math.random() * pool.length)]) : Math.floor(Math.random() * QUESTIONS.length);
    const q = QUESTIONS[idx];
    const correct = q.a;
    const wrongs = shuffle(q.w).slice(0, 2);
    const options = shuffle([correct, ...wrongs]).map(o => ({ label: o, correct: o === correct }));
    return { idx, q: q.q, options };
};

module.exports = {
    name: 'corsa',
    aliases: ['gara', 'race'],
    description: "Gara di gruppo a turni: mini-sfide a pulsanti, il primo a 3 risposte giuste vince. Uso: .corsa (partecipa), .corsa inizia",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, senderAlt, pushName, isGroup, reply, services } = context;
        const { db, saveDB, getUser, sendButtons } = services;

        if (!isGroup) return reply('La corsa si gioca nei gruppi!');

        const q = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = q.split(/\s+/);
        let g = db[from]?.corsaGame;

        // In LID mode il sender è un @lid: nei testi mostriamo il PN reale.
        const show = (jid, alt) => String(alt || jid || '').split('@')[0];

        // ── PARTECIPA 
        if (w1 === 'partecipa' || w1 === 'join' || w1 === 'io') {
            if (!g || !g.active || g.phase !== 'join') {
                return sendButtons(sock, from,
`🏁 *CORSA DI GRUPPO*

Creo la gara! Premi
*Partecipa* per entrare
(altri amici possono unirsi),
poi *Inizia* per partire.

Obiettivo: *${ROUNDS_TO_WIN} risposte
giuste*, il primo vince!`,
                    [
                        { label: '🙋 Partecipa', id: 'corsa partecipa' },
                        { label: '🏁 Inizia', id: 'corsa inizia' },
                    ], msg);
            }
            if (g.players.length >= MAX_PLAYERS) return reply('Gara al completo!');
            if (g.players.some(p => p.jid === sender)) return reply('Sei già in gara!');
            g.players.push({ jid: sender, name: (pushName || show(sender, senderAlt)).slice(0, 20), points: 0 });
            saveDB();
            return sendButtons(sock, from,
`🙋 *@${show(sender, senderAlt)}* è in gara! 🏁

Giocatori (${g.players.length}/${MAX_PLAYERS}):
${g.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}

Quando siete pronti, premi
*🏁 Inizia* (min 2 giocatori)`,
                [
                    { label: '🙋 Partecipa', id: 'corsa partecipa' },
                    { label: '🏁 Inizia', id: 'corsa inizia' },
                ], msg, [sender]);
        }

        // ── INIZIA 
        if (w1 === 'inizia' || w1 === 'start') {
            if (!g || !g.active || g.phase !== 'join') {
                return reply('Non c\'è una gara in iscrizione. Usa `.corsa partecipa`!');
            }
            if (g.players.length < 2) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Servono almeno 2 giocatori per partire!')}
${boxEnd()}`);
            g.phase = 'playing';
            g.turn = 0;
            g.used = [];
            g.question = pickQuestion([]);
            g.answered = [];
            saveDB();
            return askTurn(sock, from, msg, services);
        }

        // ── RISPOSTA (da pulsante) 
        if (w1 === 'risp') {
            const gioc = g?.players?.find(p => p.jid === sender);
            if (!g || !g.active || g.phase !== 'playing') return reply('Nessuna gara in corso. `.corsa partecipa`!');
            if (!gioc) return reply('Non sei in questa gara!');
            if (g.answered.includes(sender)) return reply('⏳ Hai già risposto in questo giro!');

            const answer = (w2 || '').replace(/\+/g, ' ');
            const option = g.question?.options?.find(o => o.label === answer);
            if (!option) return reply('❌ Risposta non riconosciuta.');

            g.answered.push(sender);
            if (option.correct) {
                gioc.points += 1;
                saveDB();
                if (gioc.points >= ROUNDS_TO_WIN) {
                    const prize = 20 + g.players.length * 15;
                    const u = getUser(sender, from);
                    u.money = (u.money || 0) + prize;
                    db[from].corsaGame = null;
                    saveDB();
                    return sendButtons(sock, from,
`🏁 *@${show(sender, senderAlt)} HA VINTO LA CORSA!* 🏆

${g.players.map((p, i) => `${medal(i + 1)} ${p.name} · ${p.points} pt`).join('\n')}

💰 Premio: *${prize}€* a ${show(sender, senderAlt).slice(0, 12)}!`,
                        [{ label: '🔁 Nuova gara', id: 'corsa partecipa' }, { label: '🏠 Menu', id: 'menu' }], msg, [sender]);
                }
                // Passa al turno successivo.
                g.answered = [];
                g.used.push(g.question.idx);
                g.question = pickQuestion(g.used);
                saveDB();
                return sendButtons(sock, from,
`✅ *RISPOSTA GIUSTA* @${show(sender, senderAlt)}!

${g.players.map((p, i) => `${medal(i + 1)} ${p.name} · ${p.points} pt`).join('\n')}

Prossima sfida 👇`,
                    [], msg, [sender]).then(() => askTurn(sock, from, msg, services));
            }

            // Risposta sbagliata: prosegue comunque (gli altri possono rispondere).
            saveDB();
            return reply(`❌ Sbagliata @${show(sender, senderAlt)}! Hai risposto "*(${answer})*". ${g.question?.q}`);
        }

        // ── STATO 
        if (w1 === 'stato' || w1 === 'status') {
            if (!g || !g.active) return reply('Nessuna gara attiva.');
            return sendButtons(sock, from,
`🏁 *STATO GARA*

Fase: ${g.phase === 'join' ? 'iscrizione' : 'in corso'}
${g.players.map((p, i) => `${medal(i + 1)} ${p.name} · ${p.points} pt`).join('\n')}
`,
                [
                    { label: '🙋 Partecipa', id: 'corsa partecipa' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── DEFAULT: crea lobby (se nessuna) 
        if (!g || !g.active) {
            db[from] = db[from] || {};
            db[from].corsaGame = {
                active: true,
                phase: 'join',
                players: [{ jid: sender, name: (pushName || show(sender, senderAlt)).slice(0, 20), points: 0 }],
                ts: Date.now(),
                question: null,
                used: [],
                answered: [],
            };
            saveDB();
            return sendButtons(sock, from,
`🏁 *CORSA DI GRUPPO* 🏁

@${show(sender, senderAlt)} ha creato la gara!
Premi *🙋 Partecipa* per entrare,
poi *🏁 Inizia* (min 2 giocatori).

🎯 Obiettivo: *${ROUNDS_TO_WIN}* risposte giuste.
Primo arrivato, primo vince!`,
                [
                    { label: '🙋 Partecipa', id: 'corsa partecipa' },
                    { label: '🏁 Inizia', id: 'corsa inizia' },
                ], msg, [sender]);
        }

        return reply('⏳ Gara in corso. Aspetta il tuo turno o premi un pulsante!');
    },
};

const medal = (pos) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '🔹');

// Invia la domanda corrente con i pulsanti di risposta.
async function askTurn(sock, from, msg, services) {
    const { db, sendButtons } = services;
    const g = db[from]?.corsaGame;
    if (!g?.question) return;

    const buttons = g.question.options.slice(0, 3).map(o => ({
        label: o.label.slice(0, 25),
        id: `corsa risp ${o.label}`,
    }));

    await sendButtons(sock, from,
`🧠 *PROSSIMA SFIDA*

${g.question.q}

Premi la risposta giusta!
(chi risponde per primo guadagna punti)`,
        buttons, msg);

    // Timer: se nessuno risponde entro 25s, si passa oltre.
    setTimeout(() => {
        const cur = db[from]?.corsaGame;
        if (cur?.active && cur.phase === 'playing') {
            cur.answered = [];
            cur.used.push(cur.question.idx);
            cur.question = pickQuestion(cur.used);
            saveDB();
            askTurn(sock, from, msg, services);
        }
    }, ANSWER_TIME_MS);
}

module.exports.askTurn = askTurn;
module.exports.QUESTIONS = QUESTIONS;
module.exports.pickQuestion = pickQuestion;