'use strict';

module.exports = {
    name: 'spegni',
    aliases: [],
    description: "Spegne il bot globalmente (owner) o solo nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (isGroup && isSenderAdmin && !isOwner) {
            if (!db[from]) db[from] = {};
            db[from]._muted = true;
            saveDB();
            return sendButtons(sock, from,
`⏸️ *BOT IN PAUSA*
━━━━━━━━━━━━━━━━━━
Il bot è stato disattivato
in questo gruppo
da un amministratore.
Premi il pulsante per
riattivarlo.
━━━━━━━━━━━━━━━━━━`,
                [{ label: '.accendi', id: 'accendi' }],
                msg);
        }

        if (!isOwner) return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");

        setBotActive(false);
        await reply("⚙️ *SISTEMA*\n━━━━━━━━━━━━━━━━━━\n🛑 Bot in modalità\nSOSPENSIONE.\nNon risponderò a nessuno,\ntranne che all'Owner.\n━━━━━━━━━━━━━━━━━━");
    },
};
