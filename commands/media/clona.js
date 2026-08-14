'use strict';

module.exports = {
    name: 'clona',
    aliases: [],
    description: "Esegue il comando .clona.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!textArgs) return reply("⚠️ _[uso]: scrivi qualcosa da girare al contrario._\n▸ Esempio: `.clona ciao`");
            await reply(`🪞 *_CLONA_*\n━━━━━━━━━━━━━━\n▸ _${Array.from(textArgs).reverse().join('')}_\n◈ _Vex Bot_`);
    },
};
