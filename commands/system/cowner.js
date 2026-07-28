'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'cowner',
    aliases: [],
    description: "Fa diventare co-owner del bot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isOwner) return reply("╭────〔 ⛔ ACCESSO NEGATO 〕────╮\n│ Solo l'Owner può fare questo.\n╰──────────────────────────────╯");

        if (!mentioned || !mentioned.length) return reply("╭────〔 ⚠️ ERRORE 〕────╮\n│ Tagga la persona.  \n╰──────────────────────────────╯");

        const target = mentioned[0];

        const number = target.split('@')[0];

        if (!db._owners) db._owners = [];
        if (!db._coowners) db._coowners = [];

        const isOwnerAlready = db._owners.some(o => sameJid(o.number, number));
        const isCoownerAlready = db._coowners.some(c => sameJid(c.number, number));

        if (isOwnerAlready || isCoownerAlready) {
            return reply(
`╭─── ✦ ${SB('COOWNER')} ✦ ───╮
│                          │
│ 📲 ${number} è già               │
│ owner o co-owner. 🫠     │
╰──────────────────────────╯`);
        }

        const now = new Date().toLocaleString('it-IT');
        db._coowners.push({ number, addedAt: now });
        saveDB();

        await reply(
`╭─── ✦ ${SB('COOWNER')} ✦ ───╮
│                          │
│ 🤝 ${number} è ora co-owner!    │
│                          │
│ aggiunto alle: ${now}     │
╰──────────────────────────╯`);
    },
};
