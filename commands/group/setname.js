'use strict';

module.exports = {
    name: 'setname',
    aliases: ['nameset', 'setsubject'],
    description: "Cambia il nome del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin possono cambiare il nome.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");
        if (!textArgs) return reply("⚠️ _[uso]:_ inserisci il nuovo nome.");

        await sock.groupUpdateSubject(from, textArgs);
        await reply(`✅ *_NOME GRUPPO_*
━━━━━━━━━━━━━━
▸ Nome cambiato in: *${textArgs}*
━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};
