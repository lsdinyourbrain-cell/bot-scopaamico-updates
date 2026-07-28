'use strict';

module.exports = {
    name: 'count',
    aliases: ['conta', 'char'],
    description: "Conta caratteri e parole in un testo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("Usa: .count <testo>");
        const chars = textArgs.length;
        const words = textArgs.trim() ? textArgs.trim().split(/\s+/).length : 0;
        const lines = textArgs.split('\n').length;

        await reply(
`╭─── ✦ *COUNT* ✦ ───╮
│                     │
│ 📝 Caratteri: ${chars}
│ 📖 Parole: ${words}
│ 📃 Righe: ${lines}
│                     │
╰─────────────────────╯`);
    },
};
