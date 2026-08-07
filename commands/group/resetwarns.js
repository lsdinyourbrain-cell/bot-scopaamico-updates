'use strict';

module.exports = {
    name: 'resetwarns',
    aliases: ['clearwarn', 'resetwarn'],
    description: "Resetta i warning di un utente (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");
        let tgt = targetJid;
        if (!tgt && isReply) {
            const quoted = contextInfo?.quotedMessage;
            if (quoted) tgt = contextInfo?.participant || null;
        }
        if (!tgt) return reply("Tagga o rispondi a chi resettare i warn.");

        const data = getUser(tgt, from);
        data.warnings = 0;
        data.warnLog = [];
        saveDB();

        await sock.sendMessage(from, {
            text: `✅ @${tgt.split('@')[0]} — warn resettati.`,
            mentions: [tgt],
        });
    },
};
