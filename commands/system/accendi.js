'use strict';

module.exports = {
    name: 'accendi',
    aliases: [],
    description: "Riaccende il bot globalmente (owner) o solo nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (isGroup && db[from]?._muted && (isSenderAdmin || isOwner)) {
            db[from]._muted = false;
            saveDB();
            return reply(
`▶️ *BOT RIPRESO*
━━━━━━━━━━━━━━━━━━
Il bot è di nuovo attivo
in questo gruppo! 🚀
━━━━━━━━━━━━━━━━━━`);
        }

        if (!isOwner) return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nSolo l'Owner può riaccendere\nil bot globalmente.\n━━━━━━━━━━━━━━━━━━");

        setBotActive(true);
        await reply("⚙️ *SISTEMA*\n━━━━━━━━━━━━━━━━━━\n✅ Bot ATTIVO e pronto! 🚀\n━━━━━━━━━━━━━━━━━━");
    },
};
