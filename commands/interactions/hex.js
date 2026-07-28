'use strict';

module.exports = {
    name: 'hex',
    aliases: [],
    description: "Converte testo in hex e viceversa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("Usa: .hex encode <testo> o .hex decode <hex>");
        const parts = textArgs.split(' ');
        const action = parts[0].toLowerCase();
        const input = parts.slice(1).join(' ');
        if (!input) return reply("Inserisci il testo.");

        if (action === 'encode' || action === 'e') {
            const encoded = Buffer.from(input).toString('hex');
            await reply(`🔢 *Hex Encode:*\n\`${encoded}\``);
        } else if (action === 'decode' || action === 'd') {
            try {
                const decoded = Buffer.from(input, 'hex').toString('utf-8');
                await reply(`🔢 *Hex Decode:*\n\`${decoded}\``);
            } catch { await reply("❌ Hex non valido."); }
        } else {
            const encoded = Buffer.from(textArgs).toString('hex');
            await reply(`🔢 *Hex Encode:*\n\`${encoded}\``);
        }
    },
};
