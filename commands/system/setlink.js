'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'setlink',
    aliases: [],
    description: "Salva il link del gruppo sponsor (owner only).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isOwner) return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");

        const link = textArgs?.trim();
        if (!link) {
            const current = db._config?.sponsorLink || 'nessuno';
            return reply(
`🔗 *SETLINK*
━━━━━━━━━━━━━━━━━━
Link attuale: ${current}
Usa: .setlink <url>
per cambiarlo.
━━━━━━━━━━━━━━━━━━`);
        }

        if (!db._config) db._config = {};
        db._config.sponsorLink = link;
        saveDB();

        await reply(
`🔗 *SETLINK*
━━━━━━━━━━━━━━━━━━
✅ Link aggiornato!
${link}
Sarà visibile nel menu
e in .sponsor su tutti
i gruppi. 🚀
━━━━━━━━━━━━━━━━━━`);
    },
};
