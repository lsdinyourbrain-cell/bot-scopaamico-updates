'use strict';

module.exports = {
    name: 'ban',
    aliases: ['banna', 'espelli'],
    description: "Esegue il comando .ban.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
            if (!isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (!isBotAdmin) return reply("Prima rendimi amministratore, così posso farlo.");
            if (!targetJid) return reply("Tagga la persona da rimuovere.");
            if (sameJid(targetJid, sender)) return reply("Non puoi rimuovere te stesso/a con il bot.");
            try {
                await sock.groupParticipantsUpdate(from, [targetJid], 'remove');
                await sock.sendMessage(from, { text: `👋 @${targetJid.split('@')[0]} è stato/a rimosso/a dal gruppo.`, mentions: [targetJid] });
            } catch (_) {
                await reply("Non riesco a rimuovere questa persona. Controlla i permessi del bot.");
            }
    },
};
