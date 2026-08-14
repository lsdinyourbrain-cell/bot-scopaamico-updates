'use strict';

module.exports = {
    name: 'incinta',
    aliases: [],
    description: "Esegue il comando .incinta.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!targetJid) return reply("⚠️ _Tagga una persona oppure rispondi a un suo messaggio._");
            const percent = randomInt(1, 100);
            await sock.sendMessage(from, {
                text: `🍼 *_TEST DI FANTASIA_*\n━━━━━━━━━━━━━━\n▸ @${targetJid.split('@')[0]} oggi risulta al _*${percent}%*_ incinta/o\n▸ _È solo un gioco eh 😭_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                mentions: [targetJid],
            });
    },
};
