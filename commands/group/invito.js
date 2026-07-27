'use strict';

module.exports = {
    name: 'invito',
    aliases: ['linkgruppo', 'grouplink'],
    description: "Ottieni il link d'invito del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin && !isOwner) return reply("Solo gli admin possono ottenere il link del gruppo.");
        if (!isBotAdmin) return reply("Rendimi admin così posso generare il link.");

        try {
            const code = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            await reply(
`╭━━━━━ 🔗 *LINK GRUPPO* 🔗 ━━━━━╮
┃                              ┃
┃  ${link}
┃                              ┃
┃  Condividilo con chi vuoi!   ┃
╰──────────────────────────────╯`);
        } catch (e) {
            await reply("❌ Non riesco a generare il link. Controlla i permessi.");
        }
    },
};
