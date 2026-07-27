'use strict';

module.exports = {
    name: 'unwarn',
    aliases: [],
    description: "Rimuove un avviso a un utente taggato.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono togliere avvisi.");
        if (!targetJid) return reply("Tagga la persona a cui rimuovere l'avviso.");

        const targetData = getUser(targetJid, from);
        if (targetData.warnings <= 0) {
            return await sock.sendMessage(from, {
                text: `✅ @${targetJid.split('@')[0]} non ha avvisi da rimuovere.`,
                mentions: [targetJid],
            });
        }

        targetData.warnings -= 1;
        saveDB();

        await sock.sendMessage(from, {
            text: `✅ @${targetJid.split('@')[0]} ha ricevuto un perdono! Avvisi: *${targetData.warnings}/3*`,
            mentions: [targetJid],
        });
    },
};
