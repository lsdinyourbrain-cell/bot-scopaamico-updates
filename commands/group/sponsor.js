'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'sponsor',
    aliases: [],
    description: "Mostra lo sponsor del bot con un messaggio stupendo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        const link = db._config?.sponsorLink || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo?s=cl&p=a&ilr=0';
        await sock.sendMessage(from, {
            text:
`╭─ ✦ ${SB('SPONSOR')} ✦ ─╮
│                          │
│  Ciao, sono il           │
│  *ScopaAmico Bot* 🤖    │
│                          │
│  Unisciti al gruppo      │
│  ufficiale! 🫶          │
│                          │
│  👇 *CLICCA QUI* 👇     │
│  ${link}
│                          │
╰──────────────────────────╯`,
        }, { quoted: msg });
    },
};
