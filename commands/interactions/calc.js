'use strict';

module.exports = {
    name: 'calc',
    aliases: ['calcola', 'math'],
    description: "Calcola un'espressione matematica.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("⚠️ _[uso]: Usa: .calc 2+2_");
        const safe = textArgs.replace(/[^0-9+\-*/.() ]/g, '');
        if (!safe) return reply("⚠️ _[uso]: Espressione non valida._");
        try {
            const result = Function('"use strict"; return (' + safe + ')')();
            await reply(`🧮 *_CALCOLATRICE_*\n━━━━━━━━━━━━━━\n▸ _${safe}_ =\n▸ _*${result}*_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        } catch (e) {
            await reply("⚠️ _Errore di calcolo._");
        }
    },
};
