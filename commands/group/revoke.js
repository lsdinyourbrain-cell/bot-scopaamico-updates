'use strict';

module.exports = {
    name: 'revoke',
    aliases: ['revocalink', 'newlink'],
    description: "Revoca il link del gruppo e ne genera uno nuovo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono revocare il link.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        try {
            const code = await sock.groupRevokeInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            await reply(`🔗 *Nuovo link del gruppo:*\n${link}`);
        } catch (e) {
            await reply("❌ Errore: " + e.message);
        }
    },
};
