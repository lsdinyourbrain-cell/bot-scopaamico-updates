'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'del',
    aliases: ['cancella', 'eliminamsg'],
    description: "Esegue il comando .del.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isReply || !contextInfo.stanzaId) return reply("Rispondi al messaggio che vuoi eliminare.");
            if (isGroup && !isSenderAdmin) return reply("Questo comando è per gli admin del gruppo.");
            if (isGroup && !isBotAdmin) return reply("Prima rendimi amministratore, così posso eliminare i messaggi.");
            try {
                await sock.sendMessage(from, { delete: getQuotedKey(from, contextInfo) });
            } catch (_) {
                await reply("Non riesco a eliminare quel messaggio.");
            }
    },
};
