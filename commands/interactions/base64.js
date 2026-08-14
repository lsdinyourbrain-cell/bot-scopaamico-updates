'use strict';

module.exports = {
    name: 'base64',
    aliases: ['b64'],
    description: "Codifica o decodifica un testo in Base64.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("⚠️ _[uso]: Usa: .base64 encode <testo> o .base64 decode <testo>_");
        const parts = textArgs.split(' ');
        const action = parts[0].toLowerCase();
        const input = parts.slice(1).join(' ');
        if (!input) return reply("⚠️ _[uso]: Inserisci il testo._");

        if (action === 'encode' || action === 'e') {
            const encoded = Buffer.from(input).toString('base64');
            await reply(`📦 *_BASE64 ENCODE_*\n━━━━━━━━━━━━━━\n▸ \`${encoded}\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        } else if (action === 'decode' || action === 'd') {
            try {
                const decoded = Buffer.from(input, 'base64').toString('utf-8');
                await reply(`📦 *_BASE64 DECODE_*\n━━━━━━━━━━━━━━\n▸ \`${decoded}\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
            } catch { await reply("⚠️ _Testo non valido per decodifica Base64._"); }
        } else {
            // Default: encode
            const encoded = Buffer.from(textArgs).toString('base64');
            await reply(`📦 *_BASE64 ENCODE_*\n━━━━━━━━━━━━━━\n▸ \`${encoded}\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }
    },
};
