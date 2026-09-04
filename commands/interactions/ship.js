'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

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
                    const { getCachedGroupMeta } = services;
                    const meta = typeof getCachedGroupMeta === 'function' ? await getCachedGroupMeta(sock, from) : await sock.groupMetadata(from);
                    const parts = (meta?.participants || []).filter(p => !sameJid(p.id || p.jid, sock.user?.id));
                    if (parts.length < 2) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Non ci sono abbastanza membri nel gruppo per fare ship!')}
${boxEnd()}`);
                    const shuffled = parts.sort(() => Math.random() - 0.5).slice(0, 2);
                    user1 = shuffled[0].id || shuffled[0].jid || shuffled[0].phoneNumber;
                    user2 = shuffled[1].id || shuffled[1].jid || shuffled[1].phoneNumber;
                } catch (e) {
                    return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Non riesco a leggere i membri del gruppo.')}
${boxEnd()}`);
                }
            } else {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Tagga qualcuno o usa questo comando in un gruppo!')}
${boxEnd()}`);
            }

            const percent = randomInt(1, 100);
            const mood = percent >= 85 ? '💞 MATCH PAZZESCO!'
                : percent >= 60 ? '✨ C\'è potenziale!'
                : percent >= 35 ? '😬 Ci vuole impegno...'
                : '🫶 Meglio amici.';

            await sock.sendMessage(from, {
                text: `   *SHIP!*   \n\n${line(`💘 @${dispOf(user1)} + @${dispOf(user2)}`)}\n${line(`*Compatibilità:* _*${percent}%*_`)}\n${line(`${mood}`)}\n\n`,
                mentions: [user1, user2],
            }, { quoted: msg });
    },
};
