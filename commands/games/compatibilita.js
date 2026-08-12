'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'compatibilita',
    aliases: ['compatibilità', 'love'],
    description: "Calcola la compatibilità tra due utenti.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!isGroup) return reply("Funziona solo nei gruppi.");
            if (mentioned.length < 2 && !(mentioned.length === 1 && isReply)) {
                return reply("Tagga due utenti. Esempio: `.compatibilita @user1 @user2`");
            }

            let user1 = mentioned[0];
            let user2 = mentioned[1] || (isReply ? sender : null);
            if (!user2) return reply("Tagga due utenti!");

            if (sameJid(user1, user2)) return reply("Due persone diverse, non la stessa! 😂");

            const ownerJid = "269956662956146@lid";
            const alessiaJid = mentioned.find(j => !sameJid(j, ownerJid) && !sameJid(j, sender)) || user2;

            let percent, frase;

            if ((sameJid(user1, ownerJid) && sameJid(user2, alessiaJid)) ||
                (sameJid(user2, ownerJid) && sameJid(user1, alessiaJid))) {
                percent = 100;
                frase = "💞 *AMORE VERO* 💞\n\nQuesto è speciale! L'algoritmo\nha riconosciuto un amore unico:\nquello tra il creatore e la sua\nAlessia. Il destino ha deciso:\n*100%* sempre e per sempre. ✨💕";
            } else {
                percent = randomInt(1, 100);
                const frasiFile = path.join(projectDir, 'data', 'compatibilita_frasi.txt');
                let frasi = [];
                try {
                    frasi = fs.readFileSync(frasiFile, 'utf-8').split('\n').map(s => s.trim()).filter(Boolean);
                } catch (_) {}
                frase = frasi.length ? frasi[Math.floor(Math.random() * frasi.length)] : "Il destino vi ha uniti!";
            }

            const bar = '█'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));

            await sock.sendMessage(from, {
                text: `💘 *COMPATIBILITÀ*\n━━━━━━━━━━━━━━━━━━\n@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}\n\n${bar} *${percent}%*\n\n_${frase}_\n━━━━━━━━━━━━━━━━━━`,
                mentions: [user1, user2],
            });
    },
};
