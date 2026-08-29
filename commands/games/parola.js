'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { pickWord } = require('../../lib/words');

module.exports = {
    name: 'parola',
    aliases: ['indovinaparola'],
    description: "Indovina la parola lettera per lettera e vinci 100€. Ogni volta una parola nuova, mai ripetuta per te. Uso: .parola",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, randomChoice, getUser } = services;

            const cooldownKey = 'parola';
            const userData = getUser(sender, from);
            if (!userData.cooldowns) userData.cooldowns = {};
            const last = userData.cooldowns[cooldownKey] || 0;
            const now = Date.now();
            const cdMs = 10000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Puoi giocare tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            if (db[from]?.wordGame?.active) {
                return reply("⏳ C'è già una partita di parola in corso! Scrivi una lettera o la parola intera.");
            }

            // Anti-ripetizione: parole già usate da questo giocatore.
            const used = db[from]?.wordUsed?.[sender] || [];
            const picked = pickWord({ minLen: 3, maxLen: 20, exclude: used, random: Math.random });
            const word = picked.word.toLowerCase();

            if (!db[from]) db[from] = {};
            db[from].wordGame = {
                active: true,
                word,
                wrong: 0,
                guessed: [],
                sender,
                timestamp: Date.now(),
            };
            // Persiste l'elenco parole già usate dal giocatore.
            db[from].wordUsed = db[from].wordUsed || {};
            db[from].wordUsed[sender] = picked.used;
            saveDB();

            const mask = (wg) => wg.word.split('').map(ch => wg.guessed.includes(ch) ? ch : ' _ ').join('');

            await reply(
`🧩 *_INDOVINA LA PAROLA_*
${mask(db[from].wordGame)}

✏️ Scrivi una *lettera* o la
*parola intera*!
⏳ 90 secondi · 6 errori = fine.
`
            );

            setTimeout(() => {
                const wg = db[from]?.wordGame;
                if (wg?.active && Date.now() - wg.timestamp >= 90000) {
                    wg.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `⏰ *TEMPO SCADUTO*\n━━━━━━━━━━━━━━\nLa parola era: *${wg.word}*\n━━━━━━━━━━━━━━` }).catch(() => {});
                }
            }, 90000);
    },
};