'use strict';

module.exports = {
    name: 'list',
    aliases: ['membri', 'members'],
    description: "Mostra la lista dei membri del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");

        try {
            const meta = await sock.groupMetadata(from);
            const parts = meta?.participants || [];
            const admins = parts.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const normal = parts.filter(p => !p.admin);
            const total = parts.length;

            let txt = `👥 *MEMBRI*\n━━━━━━━━━━━━━━\n👥 *${total}* partecipanti\n👑 *${admins.length}* admin\n👤 *${normal.length}* utenti\n`;
            if (admins.length > 0) {
                txt += `👑 *Admin:*\n`;
                txt += admins.map(a => `@${(a.id || a.jid).split('@')[0]}`).join('\n') + '\n';
            }
            txt += `━━━━━━━━━━━━━━`;

            const mentions = parts.map(p => p.id || p.jid).filter(Boolean);
            await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg });
        } catch (e) {
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};
