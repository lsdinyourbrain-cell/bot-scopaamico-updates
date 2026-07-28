'use strict';

module.exports = {
    name: 'link',
    aliases: ['grouplink', 'linkgruppo'],
    description: "Mostra il link del gruppo e tagga tutti.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Questo comando funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono generare il link del gruppo.");
        try {
            const inviteCode = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${inviteCode}`;
            const meta = await sock.groupMetadata(from);
            const allJids = (meta?.participants || []).map(p => p.id || p.jid).filter(Boolean);
            await sock.sendMessage(from, {
                text: `🔗 *Link del gruppo*\n\n${link}\n\n${allJids.map(j => `@${j.split('@')[0]}`).join(' ')}`,
                mentions: allJids,
            });
        } catch (_) {
            await reply("Non riesco a generare il link. Assicurati che il bot sia admin del gruppo.");
        }
    },
};
