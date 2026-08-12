'use strict';

module.exports = {
    name: 'antiflame',
    aliases: ['flame'],
    description: "Attiva/disattiva filtro antiflame (parole pesanti).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");

        if (!db._antiflame) db._antiflame = {};
        if (!db._antiflame[from]) db._antiflame[from] = { enabled: false };

        const sub = (textArgs || '').trim().toLowerCase();
        if (sub === 'on' || sub === 'true' || sub === '1') {
            db._antiflame[from].enabled = true;
            saveDB();
            return reply("🔥 *Antiflame ATTIVATO* — parole pesanti bloccate.");
        }
        if (sub === 'off' || sub === 'false' || sub === '0') {
            db._antiflame[from].enabled = false;
            saveDB();
            return reply("🔥 *Antiflame DISATTIVATO*.");
        }

        const status = db._antiflame[from].enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        return reply(`🔥 *ANTIFLAME*\n━━━━━━━━━━━━━━━━━━\n${status}\nBlocca frasi come:\n"ucciditi", "ammazzati",\n"fucilati" e simili.\n.antiflame on/off\n━━━━━━━━━━━━━━━━━━`);
    },
};
