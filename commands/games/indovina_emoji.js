'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  INDOVINA_EMOJI — Vex Bot
//  Indovina film/serie/canzoni dai "rebus" a emoji. Livelli facile/media/
//  difficile come l'impiccato. Risposta via pulsanti (3 opzioni).
//  Stato della partita in db[from].emojiGame.
// 

// Rebus: { emoji, answer (nome), hints: [risposte sbagliate] }
const PUZZLES = [
    // 🟢 Facile — molto noti
    { level: 'facile', emoji: '🚗💨', answer: 'Fast & Furious', hints: ['Taxi Driver', 'Speed'] },
    { level: 'facile', emoji: '🧙♂️⏳💍', answer: 'Il Signore degli Anelli', hints: ['Harry Potter', 'Game of Thrones'] },
    { level: 'facile', emoji: '🦇🏙️', answer: 'Batman', hints: ['Spiderman', 'Superman'] },
    { level: 'facile', emoji: '🐭🏰', answer: 'Topolino', hints: ['Paperino', 'Pluto'] },
    { level: 'facile', emoji: '🟡🔴', answer: 'Pikachu', hints: ['Snorlax', 'Eevee'] },
    { level: 'facile', emoji: '💣🕰️', answer: 'Bomberman', hints: ['Mario', 'Sonic'] },
    { level: 'facile', emoji: '👑🦁', answer: 'Il Re Leone', hints: ['Biancaneve', 'La Sirenetta'] },
    { level: 'facile', emoji: '🍔🍟', answer: 'McDonald', hints: ['Burger King', 'KFC'] },
    { level: 'facile', emoji: '🟠🎃', answer: 'Halloween', hints: ['Natale', 'Pasqua'] },
    { level: 'facile', emoji: '🐠🔍', answer: 'Alla ricerca di Nemo', hints: ['Dory', 'Shark Tale'] },
    { level: 'facile', emoji: '🌊🤴', answer: 'La Sirenetta', hints: ['Pocahontas', 'Rapunzel'] },
    { level: 'facile', emoji: '⚡👑', answer: 'Frozen', hints: ['Re Leone', 'Encanto'] },
    { level: 'facile', emoji: '👻🍀', answer: 'Casper', hints: ['Ghostbuster', 'Monsters Inc'] },
    { level: 'facile', emoji: '🐼🥋', answer: 'Kung Fu Panda', hints: ['Madagascar', 'Ice Age'] },
    { level: 'facile', emoji: '👸🐉', answer: 'Shrek', hints: ['Come d\'incanto', 'Brave'] },

    // 🟡 Media — meno scontati
    { level: 'media', emoji: '🐺🏛️', answer: 'Il Gladiatore', hints: ['300', 'Troia'] },
    { level: 'media', emoji: '🔍🧠', answer: 'Sherlock Holmes', hints: ['Hercule Poirot', 'Colombo'] },
    { level: 'media', emoji: '🌍🦕', answer: 'Jurassic Park', hints: ['King Kong', 'Godzilla'] },
    { level: 'media', emoji: '👻🔫', answer: 'Ghostbusters', hints: ['Men in Black', 'Casper'] },
    { level: 'media', emoji: '🚢❄️', answer: 'Titanic', hints: ['Poseidon', 'Speed'] },
    { level: 'media', emoji: '🕷️🦸', answer: 'Spiderman', hints: ['Batman', 'Flash'] },
    { level: 'media', emoji: '⏰🕐', answer: 'Ritorno al futuro', hints: ['Interstellar', 'Prima di mezzanotte'] },
    { level: 'media', emoji: '🍌🐵', answer: 'Tarzan', hints: ['Madagascar', 'Il libro della giungla'] },
    { level: 'media', emoji: '🥷🐢', answer: 'Tartarughe Ninja', hints: ['Voltron', 'Power Rangers'] },
    { level: 'media', emoji: '💍🔥', answer: 'Il trono di spade', hints: ['L\'anello del Nibelungo', 'La ruota del tempo'] },
    { level: 'media', emoji: '👽🌍', answer: 'Men in Black', hints: ['Alien', 'ET'] },
    { level: 'media', emoji: '🎸🔥', answer: 'Bohemian Rhapsody', hints: ['Whiplash', 'Yesterday'] },
    { level: 'media', emoji: '🍷🎭', answer: 'Romeo e Giulietta', hints: ['Otello', 'Amleto'] },
    { level: 'media', emoji: '🌊🦈', answer: 'Lo squalo', hints: ['Megalodon', 'Piranha'] },
    { level: 'media', emoji: '💊🔴', answer: 'Matrix', hints: ['Ghost in the Shell', 'Dark City'] },

    // 🔴 Difficile — niche/culturale
    { level: 'difficile', emoji: '🏔️🐻', answer: 'L\'orso', hints: ['Into the Wild', 'Il lupo'] },
    { level: 'difficile', emoji: '📚🔥', answer: 'Fahrenheit 451', hints: ['1984', 'Brave New World'] },
    { level: 'difficile', emoji: '🌙🎬', answer: 'Moonlight', hints: ['La la land', 'Birdman'] },
    { level: 'difficile', emoji: '🤖🧠', answer: 'Ex Machina', hints: ['Her', 'Automata'] },
    { level: 'difficile', emoji: '🧊👸', answer: 'Frozen', hints: ['Ice Age', 'Ritorno al futuro'] },
    { level: 'difficile', emoji: '🐙🎲', answer: 'Blade Runner 2049', hints: ['Ghost in the Shell', 'Akira'] },
    { level: 'difficile', emoji: '🌹👁️', answer: 'Il nome della rosa', hints: ['Il codice Da Vinci', 'Angeli e demoni'] },
    { level: 'difficile', emoji: '🔮💭', answer: 'Inception', hints: ['Mr. Robot', 'Black Mirror'] },
];

// Le risposte valide (senza placeholder).
const cleanAnswers = (arr) => arr.filter(p => {
    const clean = String(p.answer || '').trim();
    return Boolean(clean);
});
const LEVELS = {
    facile:    { emoji: '🟢', label: 'FACILE',    color: '🟢', timeout: 10000, reward: 30 },
    media:     { emoji: '🟡', label: 'MEDIA',     color: '🟡', timeout: 7000,  reward: 60 },
    difficile: { emoji: '🔴', label: 'DIFFICILE', color: '🔴', timeout: 5000,  reward: 100 },
};

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {
    name: 'indovina_emoji',
    aliases: ['rebus', 'indovinello_emoji', 'emojiquiz'],
    description: "Indovina film/serie/canzoni dai rebus a emoji, con livelli facile/media/difficile. Uso: .indovina_emoji, .indovina_emoji facile",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, reply, services } = context;
        const { db, saveDB, randomChoice, sendButtons } = services;

        if (!isGroup) return reply('Si gioca solo nei gruppi!');

        const q = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = q.split(/\s+/);

        // ── RISPOSTA DA PULSANTE 
        if (w1 === 'risp' && w2) {
            const g = db[from]?.emojiGame;
            if (!g || !g.active) return reply('Nessuna partita attiva. Usa `.indovina_emoji`!');
            try {
                const guess = decodeURIComponent(w2).trim().toLowerCase();
                const correct = String(g.answer).trim().toLowerCase();
                if (guess === correct) {
                    g.active = false;
                    saveDB();
                    // Premio scalato per difficoltà: facile 30, media 60, difficile 100
                    const u = context.services.getUser(sender, from);
                    const lvl = LEVELS[g.level] || LEVELS.facile;
                    const reward = g.reward || lvl.reward || 30;
                    u.money = (u.money || 0) + reward;
                    saveDB();
                    return sendButtons(sock, from,
`✅ *ESATTO!* 🎉

🛑 Era: *${g.answer}*!
${lvl.emoji} ${lvl.label} · ⏳ ${lvl.timeout/1000}s
💰 Premio: *+${reward}€*
`,
                        [
                            { label: `🔁 Nuova (${LEVELS[g.level]?.label || ''})`, id: `indovina_emoji ${g.level}` },
                            { label: '🏠 Menu', id: 'menu' },
                        ], msg);
                }
                return sendButtons(sock, from,
`❌ *SBAGLIATO!*

Ancora: *${g.emoji}*
💡 Continua a provare!`,
                    [
                        { label: `🟩 Facile`, id: 'indovina_emoji facile' },
                        { label: `🟨 Media`, id: 'indovina_emoji media' },
                        { label: `🟥 Difficile`, id: 'indovina_emoji difficile' },
                    ], msg);
            } catch (_) {
                return reply('❌ Risposta non valida.');
            }
        }

        const quitWordsEmoji = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'];
        if (quitWordsEmoji.includes(w1) || quitWordsEmoji.includes(q)) {
            const g = db[from]?.emojiGame;
            if (!g?.active) return reply('Nessuna partita attiva.');
            const ans = g.answer;
            g.active = false;
            saveDB();
            return sendButtons(sock, from,
`🛑 *REBUS TERMINATO!* Era: *${ans}*
`,
                [
                    { label: '🔄 Nuova partita', id: 'indovina_emoji' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── RIVELA / PASSA 
        if (w1 === 'passa' || w1 === 'rivela' || w1 === 'answer') {
            const g = db[from]?.emojiGame;
            if (!g?.active) return reply('Nessuna partita attiva.');
            g.active = false;
            saveDB();
            return sendButtons(sock, from,
`🏳️ Passo! Era: *${g.answer}*
`,
                [
                    { label: '🔁 Nuova', id: 'indovina_emoji' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── SELEZIONE LIVELLO 
        const level = LEVELS[q];
        if (!level) {
            if (db[from]?.emojiGame?.active) {
                const gActive = db[from].emojiGame;
                return sendButtons(sock, from,
`🔍 *REBUS ATTIVO!* ${gActive.emoji}
Rispondi con un pulsante oppure termina.`,
                    [
                        { label: '❌ Termina', id: 'indovina_emoji termina' },
                        { label: '🔄 Nuova partita', id: 'indovina_emoji termina' },
                    ], msg);
            }
            return sendButtons(sock, from,
`🔮 *INDOVINA L'EMOJI*

Ti lancio un rebus a emoji:
indovina film, serie o canzone!
Scegli la difficoltà:

🟢 Facile · molto noti
🟡 Media · un po' di testa
🔴 Difficile · vero culto!
`,
                [
                    { label: '🟢 Facile', id: 'indovina_emoji facile' },
                    { label: '🟡 Media', id: 'indovina_emoji media' },
                    { label: '🔴 Difficile', id: 'indovina_emoji difficile' },
                ], msg);
        }

        // ── NUOVO REBUS 
        const pool = cleanAnswers(PUZZLES).filter(p => p.level === q || (!q && true));
        const pick = randomChoice(pool.length ? pool : cleanAnswers(PUZZLES));

        // Costruisci le 3 opzioni (1 giusta + 2 dai ferri) e mescola.
        const wrongHints = (pick.hints || []).filter(h => String(h).toLowerCase() !== String(pick.answer).toLowerCase());
        const options = shuffle([pick.answer, ...wrongHints].slice(0, 3));
        if (!options.includes(pick.answer)) options[Math.floor(Math.random() * options.length)] = pick.answer;

        db[from] = db[from] || {};
        db[from].emojiGame = {
            active: true,
            level: q,
            emoji: pick.emoji,
            answer: pick.answer,
            sender,
            timestamp: Date.now(),
            reward: level.reward,
            timeout: level.timeout,
        };
        saveDB();

        const btns = options.map(o => ({ label: o.slice(0, 28), id: `indovina_emoji risp ${encodeURIComponent(o)}` }));
        // Keep max 2 answer options + 2 control buttons = 4 total (WhatsApp limit)
        const finalBtns = btns.length <= 2 ? [...btns, { label: '❌ Termina', id: 'indovina_emoji termina' }, { label: '🔄 Nuova', id: 'indovina_emoji termina' }].slice(0,4)
            : [...btns.slice(0,2), { label: '❌ Termina', id: 'indovina_emoji termina' }, { label: '🔄 Nuova', id: 'indovina_emoji termina' }];
        // Timer 10s/7s/5s in base a difficoltà
        setTimeout(() => {
            const cur = db[from]?.emojiGame;
            if (cur?.active && cur.answer === pick.answer && cur.emoji === pick.emoji) {
                cur.active = false;
                saveDB();
                sock.sendMessage(from, { text: `⏰ *TEMPO SCADUTO!* ${level.emoji} ${level.label}\nEra: *${pick.answer}* ${pick.emoji}\n⏳ ${level.timeout/1000}s scaduti — troppo lento!` }).catch(() => {});
            }
        }, level.timeout);
        return sendButtons(sock, from,
`${level.emoji} *EMOJI QUIZ* · ${level.label} · ⏳ ${level.timeout/1000}s · 💰 ${level.reward}€

🌠 ${pick.emoji}

Indovina cosa rappresento!
Premi la risposta giusta 👇`,
            finalBtns,
            msg);
    },
};