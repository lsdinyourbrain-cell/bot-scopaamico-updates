'use strict';

const { WORDLE_POOL, WORD_LEN, MAX_ATTEMPTS, GAME_TIMEOUT_MS, renderWordleGrid, pickTarget } = require('../../lib/wordle');

const DIFFICULTIES = {
    facile:    { key: 'facile',    emoji: '🟢', description: 'più tentativi', attempts: 6 },
    media:     { key: 'media',     emoji: '🟡', description: 'tentativi medi', attempts: 5 },
    difficile: { key: 'difficile', emoji: '🔴', description: 'pochi tentativi', attempts: 4 },
};

module.exports = {
    name: 'wordle',
    aliases: ['wordle-ita', 'wordleita'],
    description: "Indovina la parola segreta di 5 lettere in 6 tentativi. Difficoltà: .wordle facile/media/difficile (o .wordle e scegli). Verde = giusta, giallo = spostata, grigio = assente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, randomChoice, sharp } = services;

        if (!isGroup) return reply("Il Wordle si gioca solo nei gruppi.");

        if (db[from]?.wordleGame?.active) {
            return reply("C'è già un Wordle in corso! Scrivi una parola di 5 lettere per provare.");
        }

        const arg = String(textArgs || '').trim().toLowerCase();
        const diff = DIFFICULTIES[arg] || DIFFICULTIES.media;

        // Parole già usate da questo giocatore → anti-ripetizione.
        const used = db[from]?.wordleUsed?.[sender] || [];
        const picked = pickTarget({ exclude: used, random: Math.random });
        const target = picked.word;

        db[from] = db[from] || {};
        db[from].wordleGame = {
            active: true,
            target,
            difficulty: diff.key,
            maxAttempts: diff.attempts,
            attempts: [],
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
        // Aggiorna l'elenco parole già usate dal giocatore (persistito).
        db[from].wordleUsed = db[from].wordleUsed || {};
        db[from].wordleUsed[sender] = picked.used;
        saveDB();

        let boardBuffer;
        try {
            boardBuffer = await renderWordleGrid(sharp, []);
        } catch (e) {
            console.error('[wordle] render iniziale:', e.message);
            delete db[from].wordleGame;
            saveDB();
            return reply("❌ Errore nella generazione della griglia.");
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `${diff.emoji} *WORDLE* · ${diff.key.toUpperCase()}\n━━━━━━━━━━━━━━━━━━\n🎉 Dai, si parte!\nChe figata 🔥\n🎯 Parola segreta di *${WORD_LEN}* lettere.\n🟩 verde = giusta, posto giusto\n🟨 giallo = giusta, ma spostata\n⬛ grigio = lettera assente\n\n_Hai ${diff.attempts} tentativi!_ \n_Scrivi una parola._\n━━━━━━━━━━━━━━━━━━`,
        }, { quoted: msg });

        db[from].wordleGame.lastMsgKey = sent?.key || null;
        saveDB();

        setTimeout(() => {
            const g = db[from]?.wordleGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text: `⏰ *Tempo finito!*\nLa parola era *${g.target}*.`, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text: `⏰ *Tempo finito!*\nLa parola era *${g.target}*.` }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};