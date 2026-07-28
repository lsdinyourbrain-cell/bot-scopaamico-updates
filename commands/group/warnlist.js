'use strict';

module.exports = {
    name: 'warnlist',
    aliases: ['warns', 'warnings'],
    description: "Mostra la lista degli utenti con warning nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin.");

        const chatData = db[from];
        if (!chatData) return reply("Nessun dato trovato per questo gruppo.");

        const warned = Object.entries(chatData)
            .filter(([jid, data]) => data.warnings > 0)
            .map(([jid, data]) => ({ jid, warnings: data.warnings }));

        if (!warned.length) return reply("✅ Nessun utente con warning.");

        let txt = `╭─── ✦ *WARN LIST* ✦ ───╮\n│ ⚠️ *${warned.length}* utenti warnati\n│\n`;
        warned.forEach((w, i) => {
            const short = w.jid.split('@')[0];
            txt += `│ ${i+1}. @${short} — ${w.warnings} warn\n`;
        });
        txt += `╰───────────────────────╯`;

        const mentions = warned.map(w => w.jid).filter(Boolean);
        await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg });
    },
};
