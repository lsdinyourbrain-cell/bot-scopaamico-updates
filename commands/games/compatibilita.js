'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'compatibilita',
    aliases: ['compatibilità', 'love'],
    description: "Calcola la compatibilità tra due utenti.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, isOwnerJid } = services;


            if (!isGroup) return reply("Funziona solo nei gruppi.");
            if (mentioned.length < 2 && !(mentioned.length === 1 && isReply)) {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: tagga due utenti — .compatibilita @user1 @user2')}
${boxEnd()}`);
            }

            let user1 = mentioned[0];
            let user2 = mentioned[1] || (isReply ? sender : null);
            if (!user2) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: tagga due utenti — .compatibilita @user1 @user2')}
${boxEnd()}`);

            if (sameJid(user1, user2)) return reply("Due persone diverse, non la stessa! 😂");

            // L'easter egg scatta per CHIUNQUE sia owner del bot (numero
            // principale o co-owner aggiunti con .addowner), senza jid fissi.
            const isOwnerJ = (j) => isOwnerJid(j, sock, db, null);
            const alessiaJid = mentioned.find(j => !isOwnerJ(j) && !sameJid(j, sender)) || user2;

            let percent, frase;

            if ((isOwnerJ(user1) && sameJid(user2, alessiaJid)) ||
                (isOwnerJ(user2) && sameJid(user1, alessiaJid))) {
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
                text: `💘 *_COMPATIBILITÀ_*\n\n@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}\n\n${bar} *${percent}%*\n\n_${frase}_\n`,
                mentions: [user1, user2],
            });
    },
};
