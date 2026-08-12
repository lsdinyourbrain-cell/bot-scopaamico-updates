'use strict';

module.exports = {
    name: 'riavvia',
    aliases: [],
    description: "Esegue il comando .riavvia.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isOwner) return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");
            
            await reply("⚙️ *SISTEMA*\n━━━━━━━━━━━━━━━━━━\n🔄 Riavvio del processo...\nTorno operativo a breve! 🚀\n━━━━━━━━━━━━━━━━━━");
            // Codice 42 = "riavviami": start.bat lo rileva e rilancia node.
            setTimeout(() => process.exit(42), 1500);
    },
};
