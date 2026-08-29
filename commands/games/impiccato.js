'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// Impiccato (hangman) — versione SINGLE-PLAYER: ogni persona ha la propria
// partita (stato per-sender), con parole pescate dall'archivio gigante di
// lib/words.js e senza ripetere parole già usate dal singolo giocatore.
// Arte ASCII del boia, categoria, lettere provate e timer.

const { pickWord } = require('../../lib/words');

// 7 stadi del boia (0 = solo forca, 6 = boia completo = game over).
const HANGMAN_STAGES = [
    // 0 errori
    `  ┌───┐
  │   │
  │
  │
  │
  │
───┴──`,
    // 1 errore (testa)
    `  ┌───┐
  │   │
  │   O
  │
  │
  │
───┴──`,
    // 2 errori (testa + corpo)
    `  ┌───┐
  │   │
  │   O
  │   │
  │
  │
───┴──`,
    // 3 errore (testa + corpo + braccio sx)
    `  ┌───┐
  │   │
  │   O
  │  /│
  │
  │
───┴──`,
    // 4 errori (testa + corpo + 2 braccia)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │
  │
───┴──`,
    // 5 errori (testa + corpo + 2 braccia + gamba sx)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │  /
  │
───┴──`,
    // 6 errori (boia completo)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │  / \\
  │
───┴──`,
];

const MAX_WRONG = 6;
const GAME_TIMEOUT_MS = 120000; // 2 minuti

// Emoji per categoria, mostrata accanto al nome nella board.
const CATEGORY_EMOJI = {
    'Animali': '🐾',
    'Cibo': '🍕',
    'Tecnologia': '💻',
    'Natura': '🌿',
    'Spazio': '🚀',
    'Geografia': '🌍',
    'Luoghi': '🏙️',
    'Mestieri': '🛠️',
    'Musica': '🎵',
    'Sport': '⚽',
    'Auto': '🏎️',
    'Mezzi': '🚂',
    'Mitologia': '🐉',
    'Altro': '✨',
    'Personaggi': '🦸',
    'Videogiochi': '🎮',
    'Social': '📱',
    'Scuola': '🎒',
    'Città': '🏛️',
    'Anime e Cartoni': '🧸',
    'Film e Serie': '🎬',
};
const withCat = (c) => `${CATEGORY_EMOJI[c] || '📂'} ${c}`;

// Difficoltà: cambiano la lunghezza delle parole (min-max lettere) e quanti
// errori sono ammessi prima che il boia sia completo.
const DIFFICULTIES = {
    facile:    { key: 'facile',    emoji: '🟢', label: 'FACILE',    maxWrong: 7, wordLen: [3, 5] },
    media:     { key: 'media',     emoji: '🟡', label: 'MEDIA',     maxWrong: 6, wordLen: [5, 8] },
    difficile: { key: 'difficile', emoji: '🔴', label: 'DIFFICILE', maxWrong: 4, wordLen: [8, 99] },
};

const maskWord = (word, guessed) => {
    const parts = word.split('').map((ch) => (guessed.includes(ch) ? ch : '_'));
    return parts.join(parts.length > 10 ? '' : ' ');
};

const formatGuessed = (guessed) => {
    if (!guessed.length) return '—';
    const arr = guessed.slice().sort();
    const lines = [];
    for (let i = 0; i < arr.length; i += 10) lines.push(arr.slice(i, i + 10).join(' '));
    return lines.join('\n');
};

const buildBoardText = (game) => {
    // Il livello "facile" può arrivare a maxWrong > stadi disegnati: clampa.
    const art = HANGMAN_STAGES[Math.min(game.wrong, HANGMAN_STAGES.length - 1)];
    const masked = maskWord(game.word, game.guessed);
    const maxWrong = game.maxWrong || MAX_WRONG;
    const remaining = Math.max(0, maxWrong - game.wrong);
    return `${art}

🔤 Parola:  *${masked}*
📂 Categoria: ${game.categoria}
❌ Errori: ${game.wrong}/${maxWrong}  (mancano ${remaining})
📝 Lettere provate:
${formatGuessed(game.guessed)}

Manda una *lettera* o prova
la *parola intera*!`;
};

module.exports = {
    name: 'impiccato',
    aliases: ['hangman', 'boia'],
    description: "Gioca all'impiccato da solo: scegli la difficoltà e indovina la parola prima che il boia sia completo. Ogni giocatore ha la sua partita. Uso: .impiccato, .impiccato facile/media/difficile, .impiccato stop",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply("L'impiccato si gioca solo nei gruppi.");

        const args2 = String(textArgs || '').trim().toLowerCase();

        // Ferma la partita del giocatore che la invoca (o di tutti con 'stop tutti').
        if (['stop', 'esci', 'fine', 'basta', 'abbandona', 'lascia'].includes(args2) || args2.startsWith('stop ')) {
            db[from] = db[from] || {};
            const games = db[from].impiccatoGames || {};
            if (args2.includes('tutti')) {
                const n = Object.keys(games).length;
                db[from].impiccatoGames = {};
                saveDB();
                return reply(n ? `🛑 Ho fermato le *${n}* partite di impiccato in corso.` : "Nessuna partita di impiccato in corso.");
            }            if (games[sender]) {
                games[sender].active = false;
                const parola = games[sender].word;
                delete games[sender];
                saveDB();
                return reply(`🛑 Partita fermata!\nLa parola era *${parola}*.`);
            }
            return reply("Non hai partite di impiccato attive, fra.");
        }

        const diff = DIFFICULTIES[args2];

        // Nessuna difficoltà indicata → menu di scelta con i pulsanti.
        if (!diff) {
            return sendButtons(sock, from,
`🔴 *IMPICCATO*
Scegli la *difficoltà* della
parola da indovinare:

🟢 Facile · parole corte
🟡 Media · parole medie
🔴 Difficile · parole
lunghe e poche chances!
━━━━━━━━━━━━━━━━━━`,
                [
                    { label: '🟢 Facile', id: 'impiccato facile' },
                    { label: '🟡 Media', id: 'impiccato media' },
                    { label: '🔴 Difficile', id: 'impiccato difficile' },
                ],
                msg);
        }

        db[from] = db[from] || {};
        const games = db[from].impiccatoGames || (db[from].impiccatoGames = {});

        // Una partita per giocatore: se ne ha già una attiva, niente doppioni.
        if (games[sender]?.active) {
            return reply("Hai già una partita in corso! Manda una lettera o chiudila con `.impiccato stop`, fra.");
        }

        // Parole della giusta lunghezza per la difficoltà scelta, evitando
        // quelle già usate dal giocatore (anti-ripetizione).
        const used = db[from].impiccatoUsed?.[sender] || [];
        const [minLen, maxLen] = diff.wordLen;
        const picked = pickWord({ minLen, maxLen, exclude: used, random: Math.random });
        const word = picked.word;

        // Aggiorna l'elenco parole già usate (persistito) per non ripeterle.
        db[from].impiccatoUsed = db[from].impiccatoUsed || {};
        db[from].impiccatoUsed[sender] = picked.used;

        const boardText =
            `${diff.emoji} *IMPICCATO* · ${diff.label}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `${buildBoardText({ word, categoria: withCat(picked.categoria), wrong: 0, guessed: [], maxWrong: diff.maxWrong })}\n` +
            `⏳ Tempo: 2 minuti` +
            `\n━━━━━━━━━━━━━━━━━━`;

        // Invio come messaggio "pulito" (senza pulsante Ripeti) per poterlo
        // modificare dopo con l'edit di Baileys. Il key viene salvato nello
        // stato di gioco in modo che l'handler possa fare edit successivi.
        let sent;
        try {
            sent = await sock.sendMessage(from, { text: boardText }, { quoted: msg });
        } catch (_) {
            return reply(boardText);
        }

        games[sender] = {
            active: true,
            word,
            categoria: withCat(picked.categoria),
            wrong: 0,
            maxWrong: diff.maxWrong,
            guessed: [],
            sender,
            timestamp: Date.now(),
            lastMsgKey: sent?.key || null,
        };
        saveDB();

        // Timer di scadenza
        setTimeout(() => {
            const g = db[from]?.impiccatoGames?.[sender];
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                const text = `⏰ *Tempo finito!*\nLa parola era *${g.word}*.\n📂 Categoria: ${g.categoria}`;
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};

module.exports.MAX_WRONG = MAX_WRONG;
module.exports.GAME_TIMEOUT_MS = GAME_TIMEOUT_MS;
module.exports.buildBoardText = buildBoardText;
module.exports.HANGMAN_STAGES = HANGMAN_STAGES;
module.exports.maskWord = maskWord;
module.exports.formatGuessed = formatGuessed;