'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'rissa',
    aliases: [],
    description: "Esegue il comando .rissa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

            if (!targetJid) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Tagga qualcuno con cui fare a botte. Esempio: .rissa @nome')}
${boxEnd()}`);
            const vincitore  = Math.random() > 0.5 ? sender : targetJid;
            const perdente   = vincitore === sender ? targetJid : sender;
            const frase = randomChoice(ARRAYS.rissa)
                .replace(/X/g, `@${dispOf(vincitore)}`)
                .replace(/Y/g, `@${dispOf(perdente)}`);
            await sock.sendMessage(from, {
                text: `   *RISSA*   \n\n${line(`⚔️ @${dispOf(sender)} vs @${dispOf(targetJid)}`)}\n${line(`💬 _${frase}_`)}\n\n${line(`🏆 *Vincitore:* @${dispOf(vincitore)}`)}\n\n`,
                mentions: [sender, targetJid],
            });
    },
};
