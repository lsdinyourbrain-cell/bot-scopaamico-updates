'use strict';

module.exports = {
    name: 'bestemmiometro',
    aliases: ['bestemmie'],
    description: "Attiva/disattiva il bestemmiometro nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin && !isOwner) return reply("Solo gli admin possono usare questo comando.");

        if (!db._bestemmiometro) db._bestemmiometro = {};

        const sub = (textArgs || '').trim().toLowerCase();
        if (sub === 'on' || sub === 'true' || sub === '1') {
            db._bestemmiometro[from] = true;
            saveDB();
            return reply("🤬 *Bestemmiometro ATTIVATO* in questo gruppo.");
        }
        if (sub === 'off' || sub === 'false' || sub === '0') {
            db._bestemmiometro[from] = false;
            saveDB();
            return reply("🤬 *Bestemmiometro DISATTIVATO* in questo gruppo.");
        }

        const status = db._bestemmiometro[from] !== false ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        return reply(
`╭─── ✦ *BESTEMMIOMETRO* ✦ ───╮
│ ${status}
│                              │
│ .bestemmiometro on/off       │
╰──────────────────────────────╯`);
    },
};
