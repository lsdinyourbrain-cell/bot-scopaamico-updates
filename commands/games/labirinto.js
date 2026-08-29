'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// ─────────────────────────────────────────────────────────────────────────────
//  LABIRINTO — Vex Bot
//  Flusso in 3 passi con UI nativa WhatsApp (carosello: come in .cerca, ogni
//  card DEVE avere un'immagine o WhatsApp mostra "messaggio non supportato").
//   1. `.labirinto`                      → scegli la DIFFICOLTÀ (pulsanti)
//   2. premi una difficoltà              → CAROSELLO di 5 labirinti casuali
//   3. premi *Gioca* su una card         → parte la partita
//  In partita i pulsanti "Muovi · Fine" sotto la board muovono il giocatore,
//  e si può giocare anche coi comandi di testo *u/d/l/r* e *fine*.
//  Lo stato vive in db[from].mazeGame (partita) e db[from].mazePending
//  (carosello in attesa di scelta, con TTL). Se il carosello non si può
//  inviare, si parte comunque con un labirinto casuale della difficoltà.
// ─────────────────────────────────────────────────────────────────────────────

const { generateMaze, renderMaze, stepMaze, moveNavButton, MOVES_TEXT } = require('../../lib/maze');

const GAME_TIMEOUT_MS = 240000;
const CAROUSEL_COUNT = 5;
const CAROUSEL_TTL_MS = 120000;

// Parole che chiudono una partita in corso (scritte a mano o via pulsante).
const QUIT_WORDS = ['fine', 'stop', 'esci', 'termina', 'basta', 'chiudi'];

// Difficoltà → dimensioni della griglia (più celle = più facile perdersi).
const DIFFICULTIES = {
    facile:    { key: 'facile',    emoji: '🟢', label: 'FACILE',    rows: 5,  cols: 7 },
    media:     { key: 'media',     emoji: '🟡', label: 'MEDIA',     rows: 9,  cols: 13 },
    difficile: { key: 'difficile', emoji: '🔴', label: 'DIFFICILE', rows: 13, cols: 19 },
};

const DIFF_BUTTONS = [
    { label: '🟢 Facile', id: 'labirinto dim facile' },
    { label: '🟡 Media', id: 'labirinto dim media' },
    { label: '🔴 Difficile', id: 'labirinto dim difficile' },
];

// Passo 1: menu con le tre difficoltà.
const showDifficultyMenu = async (sock, msg, context) => {
    const { from, services } = context;
    const { sendButtons } = services;
    await sendButtons(sock, from,
        `🌀 *LABIRINTO*\n━━━━━━━━━━━━━━━━━━\nScegli la *difficoltà*:\nti mostro 5 labirinti\ncasuali tra cui scegliere.\n\n🟢 facile · reticolo piccolo\n🟡 media · intermedio\n🔴 difficile · labirinto grande\n━━━━━━━━━━━━━━━━━━`,
        DIFF_BUTTONS,
        msg);
};

// Passo 2: carosello di 5 labirinti casuali della difficoltà scelta.
// IMPORTANTE: ogni card deve avere l'immagine, altrimenti WhatsApp mostra
// "messaggio non supportato" (le card senza media rompono l'intero carosello).
const showCarousel = async (sock, msg, context, diff) => {
    const { from, sender, services } = context;
    const { db, saveDB, sendCarousel, sendButtons, sharp } = services;

    const mazes = [];
    const buffers = [];
    let fallbackImg = null;
    for (let i = 0; i < CAROUSEL_COUNT; i++) {
        const m = generateMaze(diff.rows, diff.cols);
        mazes.push(m);
        try {
            const b = await renderMaze(sharp, m, { r: 0, c: 0 });
            buffers.push(b);
            if (!fallbackImg) fallbackImg = b;
        } catch (e) {
            buffers.push(null);
        }
    }

    // Ultima card: tornare a cambiare difficoltà (anch'essa con immagine).
    let changeImg = fallbackImg;
    if (!changeImg) {
        try {
            changeImg = await renderMaze(sharp, generateMaze(5, 7), { r: 0, c: 0 });
        } catch (_) { changeImg = null; }
    }

    const cards = [];
    for (let i = 0; i < mazes.length; i++) {
        if (!buffers[i]) continue; // niente card senza immagine
        cards.push({
            title: `${diff.emoji} ${diff.label} · Lab ${i + 1}`,
            subtitle: `${mazes[i].rows} × ${mazes[i].cols}`,
            body: `Labirinto casuale #${i + 1}.\nPremi *Gioca* per provarlo!`,
            imageBuffer: buffers[i],
            buttons: [{ label: '🎮 Gioca', id: `labirinto gioca ${i}` }],
        });
    }
    if (changeImg) {
        cards.push({
            title: '⚙️ Altre difficoltà',
            subtitle: 'Facile · Media · Difficile',
            body: 'Vuoi cambiare livello?\nTorna alla scelta difficoltà.',
            imageBuffer: changeImg,
            buttons: [{ label: '↩️ Cambia livello', id: 'labirinto dim' }],
        });
    }

    // Nessuna immagine disponibile: non possiamo fare un carosello valido.
    if (!cards.length) return false;

    db[from] = db[from] || {};
    db[from].mazePending = { mazes, difficulty: diff.key, sender, ts: Date.now() };
    saveDB();

    setTimeout(() => {
        if (db[from]?.mazePending) {
            delete db[from].mazePending;
            saveDB();
        }
    }, CAROUSEL_TTL_MS);

    const sent = await sendCarousel(sock, from, {
        text: `🌀 *LABIRINTO · ${diff.emoji} ${diff.label}*\nScorri e scegli il labirinto 👇`,
        cards,
    }, msg);

    // Carosello non inviato → niente messaggi "fantasma": si parte comunque
    // con un labirinto casuale della difficoltà scelta.
    if (!sent) {
        await startRandomGame(sock, msg, context, diff);
    }
    return sent;
};

// Passo 3: avvia la partita sul labirinto scelto.
const startGame = async (sock, msg, context, { maze, difficulty }) => {
    const { from, sender, reply, services } = context;
    const { db, saveDB, sendButtonsWithKey, sharp } = services;

    if (db[from]?.mazePending) {
        delete db[from].mazePending;
        saveDB();
    }

    db[from] = db[from] || {};
    db[from].mazeGame = {
        active: true,
        maze,
        difficulty,
        pos: { r: 0, c: 0 },
        moves: 0,
        sender,
        timestamp: Date.now(),
        lastMsgKey: null,
        btnKey: null,
    };
    saveDB();

    let boardBuffer;
    try {
        boardBuffer = await renderMaze(sharp, maze, { r: 0, c: 0 });
    } catch (e) {
        console.error('[labirinto] render iniziale:', e.message);
        delete db[from].mazeGame;
        saveDB();
        return reply('❌ Errore nella generazione del labirinto.');
    }

    const diff = DIFFICULTIES[difficulty] ? DIFFICULTIES[difficulty] : DIFFICULTIES.media;

    const sent = await sock.sendMessage(from, {
        image: boardBuffer,
        caption: `🌀 *LABIRINTO · ${diff.emoji} ${diff.label}*\n━━━━━━━━━━━━━━━━━━\n🔴 Tu · 🟢 Uscita\n\n🎮 Muoviti con i pulsanti\nqui sotto, oppure scrivi\n*u/d/l/r* in chat.`,
    }, { quoted: msg });

    const btnKey = await sendButtonsWithKey(sock, from, MOVES_TEXT, [moveNavButton()], msg);

    db[from].mazeGame.lastMsgKey = sent?.key || null;
    db[from].mazeGame.btnKey = btnKey;
    saveDB();

    setTimeout(() => {
        const gg = db[from]?.mazeGame;
        if (gg?.active && Date.now() - gg.timestamp >= GAME_TIMEOUT_MS) {
            delete db[from].mazeGame;
            saveDB();
            if (gg.lastMsgKey) { try { sock.sendMessage(from, { delete: gg.lastMsgKey }); } catch (_) {} }
            if (gg.btnKey) { try { sock.sendMessage(from, { delete: gg.btnKey }); } catch (_) {} }
            sock.sendMessage(from, { text: '⏰ *Tempo scaduto!*\nNon sei riuscito a uscire\ndal labirinto.' }).catch(() => {});
        }
    }, GAME_TIMEOUT_MS);
};

// Ripiego: parte subito con un labirinto casuale della difficoltà scelta
// (usato quando il carosello non riesce a essere inviato).
const startRandomGame = async (sock, msg, context, diff) => {
    const { from } = context;
    const maze = generateMaze(diff.rows, diff.cols);
    return startGame(sock, msg, context, { maze, difficulty: diff.key });
};

module.exports = {
    name: 'labirinto',
    aliases: ['maze', 'labyrinth'],
    description: "Esci dal labirinto: scegli la difficoltà, scorri i 5 labirinti casuali e gioca con i pulsanti (o con u/d/l/r). Uso: .labirinto",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons, sendCarousel, sendButtonsWithKey, sharp, getUser } = services;

        if (!isGroup) return reply("Il labirinto si gioca solo nei gruppi.");

        const t = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = t.split(/\s+/);
        const g = db[from]?.mazeGame;

        // ── PARTITA IN CORSO ──────────────────────────────────────────────
        if (g?.active) {
            if (QUIT_WORDS.includes(w1)) {
                delete db[from].mazeGame;
                saveDB();
                if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
                if (g.btnKey) { try { await sock.sendMessage(from, { delete: g.btnKey }); } catch (_) {} }
                return reply('🏁 *Labirinto terminato!*\nTorna quando vuoi con `.labirinto`. 🌀');
            }
            if (w1 === 'muovi') {
                // Pulsante di movimento premuto → stessa logica dell'handler testo.
                try {
                    await stepMaze({ sock, from, sender, raw: w2 || '', db, saveDB, getUser, sharp, quoted: msg });
                } catch (e) {
                    console.error('[labirinto] muovi:', e.message);
                }
                return;
            }
            return reply("C'è già un labirinto in corso!\nUsa i pulsanti sotto la\nboard o scrivi *u/d/l/r*.");
        }

        // ── PAROLE DI USCITA SENZA PARTITA ────────────────────────────────
        if (QUIT_WORDS.includes(w1)) {
            return reply('Non c\u2019è nessun labirinto in corso.\nAvviane uno con `.labirinto`! 🌀');
        }

        // ── SCELTA DEL LABIRINTO DAL CAROSELLO ────────────────────────────
        if (w1 === 'gioca') {
            const pending = db[from]?.mazePending;
            const n = parseInt(w2, 10);
            if (!pending || !Array.isArray(pending.mazes) || !Number.isFinite(n) ||
                n < 0 || n >= pending.mazes.length) {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Scelta non valida o scaduta. Rifai \`.labirinto\`.')}
${boxEnd()}`);
            }
            return startGame(sock, msg, context, {
                maze: pending.mazes[n],
                difficulty: pending.difficulty,
            });
        }

        // ── CAROSELLO PER DIFFICOLTÀ (id "labirinto dim <x>" o ".labirinto <x>")
        const diffKey = w1 === 'dim' ? w2 : (DIFFICULTIES[w1] ? w1 : null);
        if (diffKey && DIFFICULTIES[diffKey]) {
            return showCarousel(sock, msg, context, DIFFICULTIES[diffKey]);
        }

        // ── MENU DIFFICOLTÀ (default: nessun argomento) ───────────────────
        return showDifficultyMenu(sock, msg, context);
    },
};