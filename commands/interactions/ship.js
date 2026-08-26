'use strict';

const { S, SEP, footer, bullet } = require('../../lib/ui');

module.exports = {
    name: 'ship',
    aliases: [],
    description: "Calcola l'affinità tra due persone.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            let user1, user2;

            if (targetJid && isGroup) {
                user1 = sender;
                user2 = targetJid;
            } else if (isGroup) {
                try {
                    const meta = await sock.groupMetadata(from);
                    const parts = (meta?.participants || []).filter(p => !sameJid(p.id || p.jid, sock.user?.id));
                    if (parts.length < 2) return reply("⚠️ _Non ci sono abbastanza membri nel gruppo per fare ship!_");
                    const shuffled = parts.sort(() => Math.random() - 0.5).slice(0, 2);
                    user1 = shuffled[0].id || shuffled[0].jid || shuffled[0].phoneNumber;
                    user2 = shuffled[1].id || shuffled[1].jid || shuffled[1].phoneNumber;
                } catch (e) {
                    return reply("⚠️ _Non riesco a leggere i membri del gruppo._");
                }
            } else {
                return reply("⚠️ _Tagga qualcuno o usa questo comando in un gruppo!_");
            }

            const percent = randomInt(1, 100);
            const mood = percent >= 85 ? '💞 MATCH PAZZESCO!'
                : percent >= 60 ? '✨ C\'è potenziale!'
                : percent >= 35 ? '😬 Ci vuole impegno...'
                : '🫶 Meglio amici.';

            await sock.sendMessage(from, {
                text: `${S.star} ${S.dia}  *SHIP!*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`💘 @${user1.split('@')[0]} + @${user2.split('@')[0]}`)}\n${bullet(`*Compatibilità:* _*${percent}%*_`)}\n${bullet(`${mood}`)}\n${SEP.stars}\n${footer()}`,
                mentions: [user1, user2],
            }, { quoted: msg });
    },
};
