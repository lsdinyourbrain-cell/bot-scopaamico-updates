'use strict';

module.exports = {
    name: 'say',
    aliases: ['dì', 'parla'],
    description: "Fa dire al bot un messaggio nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin && !isOwner) return reply("⚠️ _[uso]:_ solo gli admin possono usare questo comando.");
        if (!textArgs) return reply("⚠️ _[uso]:_ scrivi il messaggio da farmi dire. Esempio: `.say Ciao a tutti!`");

        await sock.sendMessage(from, { text: textArgs, mentions: mentioned.length ? mentioned : undefined });
    },
};
