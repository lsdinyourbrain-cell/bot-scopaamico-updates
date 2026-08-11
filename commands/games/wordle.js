'use strict';

const { WORDLIST, WORD_LEN, MAX_ATTEMPTS, GAME_TIMEOUT_MS, renderWordleGrid } = require('../../lib/wordle');

module.exports = {
    name: 'wordle',
    aliases: ['wordle-ita', 'wordleita'],
    description: "Indovina la parola segreta di 5 lettere in 6 tentativi. Uso: .wordle, poi scrivi una parola di 5 lettere (verde = giusta, giallo = spostata).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, randomChoice, sharp } = services;

        if (!isGroup) return reply("Il Wordle si gioca solo nei gruppi.");

        if (db[from]?.wordleGame?.active) {
            return reply("C'è già un Wordle in corso! Scrivi una parola di 5 lettere per provare.");
        }

        const target = randomChoice(WORDLIST);

        db[from] = db[from] || {};
        db[from].wordleGame = {
            active: true,
            target,
            attempts: [],
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
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
            caption: `🟩 *WORDLE* — Partita iniziata!\n\n🎯 Parola segreta di *${WORD_LEN}* lettere.\n🟩 verde = lettera giusta al posto giusto\n🟨 giallo = lettera giusta ma spostata\n⬛ grigio = lettera assente\n\n_Hai ${MAX_ATTEMPTS} tentativi! Scrivi una parola._`,
        }, { quoted: msg });

        db[from].wordleGame.lastMsgKey = sent?.key || null;
        saveDB();

        setTimeout(() => {
            const g = db[from]?.wordleGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!* La parola era *${g.target}*.`, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!* La parola era *${g.target}*.` }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};