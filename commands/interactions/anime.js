'use strict';

module.exports = {
    name: 'anime',
    aliases: [],
    description: "Esegue il comando .anime.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const anime = randomChoice(['protagonista shōnen', 'villain col passato triste', 'sensei rilassatissimo', 'salvatore in ritardo', 'friend che ruba la scena']);
            await sock.sendMessage(from, {
                text: `✨ *_ANIME_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} in un anime sarebbe: _*${anime}*_\n━━━━━━━━━━━━━━\n🎶 _Opening già in playlist, ovvio._\n◈ _Vex Bot_`,
                mentions: [sender],
            });
    },
};
