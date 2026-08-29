'use strict';

const { S, SEP, footer, bullet, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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
                .replace(/X/g, `@${vincitore.split('@')[0]}`)
                .replace(/Y/g, `@${perdente.split('@')[0]}`);
            await sock.sendMessage(from, {
                text: `${S.star} ${S.dia}  *RISSA*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`⚔️ @${sender.split('@')[0]} vs @${targetJid.split('@')[0]}`)}\n${bullet(`💬 _${frase}_`)}\n${SEP.lineL}\n${bullet(`🏆 *Vincitore:* @${vincitore.split('@')[0]}`)}\n${SEP.stars}\n${footer()}`,
                mentions: [sender, targetJid],
            });
    },
};
