'use strict';

module.exports = {
    name: 'base64',
    aliases: ['b64'],
    description: "Codifica o decodifica un testo in Base64.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("Usa: .base64 encode <testo> o .base64 decode <testo>");
        const parts = textArgs.split(' ');
        const action = parts[0].toLowerCase();
        const input = parts.slice(1).join(' ');
        if (!input) return reply("Inserisci il testo.");

        if (action === 'encode' || action === 'e') {
            const encoded = Buffer.from(input).toString('base64');
            await reply(`📦 *Base64 Encode:*\n\`${encoded}\``);
        } else if (action === 'decode' || action === 'd') {
            try {
                const decoded = Buffer.from(input, 'base64').toString('utf-8');
                await reply(`📦 *Base64 Decode:*\n\`${decoded}\``);
            } catch { await reply("❌ Testo non valido per decodifica Base64."); }
        } else {
            // Default: encode
            const encoded = Buffer.from(textArgs).toString('base64');
            await reply(`📦 *Base64 Encode:*\n\`${encoded}\``);
        }
    },
};
