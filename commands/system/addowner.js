'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'addowner',
    aliases: ['setowner'],
    description: "Aggiunge un utente come owner del bot (privilegi identici all'owner principale).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, ownerNumber } = services;

        if (!isOwner) return reply("Solo l'Owner può fare questo.");

        if (!mentioned || !mentioned.length) return reply("Tagga la persona.");

        const target = mentioned[0];

        if (sameJid(target, ownerNumber)) return reply("Quello è già l'owner principale.");

        if (!db._owners) db._owners = [];

        const exists = db._owners.some(o => sameJid(o.number, target));

        if (exists) return reply("Questo utente è già owner.");

        const now = new Date().toLocaleString('it-IT');
        db._owners.push({ number: target, addedAt: now });
        saveDB();

        await reply(
`╭─── ✦ ${SB('ADDOWNER')} ✦ ───╮
│                          │
│ 👑 @${target.split('@')[0]} è ora owner!  │
│                          │
│ aggiunto alle: ${now}     │
╰──────────────────────────╯`);
    },
};
