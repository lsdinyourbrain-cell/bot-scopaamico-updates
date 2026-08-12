'use strict';

module.exports = {
    name: 'calc',
    aliases: ['calcola', 'math'],
    description: "Calcola un'espressione matematica.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("Usa: .calc 2+2");
        const safe = textArgs.replace(/[^0-9+\-*/.() ]/g, '');
        if (!safe) return reply("Espressione non valida.");
        try {
            const result = Function('"use strict"; return (' + safe + ')')();
            await reply(`🧮 *CALCOLATRICE*\n━━━━━━━━━━━━━━━━━━\n${safe} =\n*${result}*\n━━━━━━━━━━━━━━━━━━`);
        } catch (e) {
            await reply("❌ Errore di calcolo.");
        }
    },
};
