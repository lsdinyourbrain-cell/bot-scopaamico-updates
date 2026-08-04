'use strict';

module.exports = {
    name: 'casino',
    aliases: [],
    description: "Esegue il comando .casino.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            await sendButtons(sock, from,
                "🎰 *Benvenuto al casinò!*\n\nPremi un pulsante per giocare. Buona fortuna, ma senza vendere il divano 😭",
                [
                    { label: '🎲 .dadi', id: 'dadi 100' },
                    { label: '🎰 .slot', id: 'slot 100' },
                    { label: '🔴 .roulette', id: 'roulette 100' },
                ],
                msg);
    },
};
