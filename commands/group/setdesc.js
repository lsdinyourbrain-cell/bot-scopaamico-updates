'use strict';

module.exports = {
    name: 'setdesc',
    aliases: ['descset', 'settopic'],
    description: "Cambia la descrizione del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin possono cambiare la descrizione.");
        if (!isBotAdmin) return reply("⚠️ _[uso]:_ rendimi admin prima.");
        if (!textArgs) return reply("⚠️ _[uso]:_ inserisci la nuova descrizione.");

        await sock.groupUpdateDescription(from, textArgs);
        await reply(`✅ *_DESCRIZIONE_*
━━━━━━━━━━━━━━
▸ Descrizione *aggiornata*.
━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};
