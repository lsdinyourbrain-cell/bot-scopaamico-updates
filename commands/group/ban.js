'use strict';

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'ban',
    aliases: ['banna', 'espelli'],
    description: "Esegue il comando .ban.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("⚠️ _[uso]:_ questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("⚠️ _[uso]:_ prima rendimi amministratore, così posso farlo.");
            if (!targetJid) return reply("⚠️ _[uso]:_ tagga la persona da rimuovere.");
            if (sameJid(targetJid, sender)) return reply("⚠️ _[uso]:_ non puoi rimuovere te stesso/a con il bot.");
            try {
                await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
                await sock.sendMessage(from, { text: `👋 ${toDecorated('BAN', 'mono', '⏣')}
━━━━━━━━━━━━━━
▸ @${targetJid.split('@')[0]} è stato/a *rimosso/a* dal gruppo.
━━━━━━━━━━━━━━
◈ _Vex Bot_`, mentions: [targetJid] });
            } catch (_) {
                await reply("⚠️ _[uso]:_ non riesco a rimuovere questa persona. Controlla i permessi del bot.");
            }
    },
};
