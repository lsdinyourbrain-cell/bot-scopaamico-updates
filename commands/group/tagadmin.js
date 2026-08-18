'use strict';

module.exports = {
    name: 'tagadmin',
    aliases: ['taggaadmin', 'menzionaadmin'],
    description: "Tagga tutti gli amministratori del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli admin.");

        try {
            const meta = await sock.groupMetadata(from);
            const admins = (meta?.participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const mentions = admins.map(a => a.phoneNumber || a.id || a.jid).filter(Boolean);
            if (!mentions.length) return reply("⚠️ _[uso]:_ nessun admin trovato.");
            const tag = admins.map(a => `@${(a.phoneNumber || a.id || a.jid).split('@')[0]}`).join(' ');
            await sock.sendMessage(from, { text: `👑 *_ADMIN DEL GRUPPO_*
━━━━━━━━━━━━━━
${tag}
━━━━━━━━━━━━━━
◈ _Vex Bot_`, mentions }, { quoted: msg });
        } catch (e) {
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};
