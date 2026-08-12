'use strict';

module.exports = {
    name: 'assemblapc',
    aliases: [],
    description: "Esegue il comando .assemblapc.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const cpu = randomChoice(['Ryzen 5 7600', 'Ryzen 7 7800X3D', 'Intel i5-14600K', 'Intel i7-14700K']);
            const gpu = randomChoice(['RTX 4060', 'RTX 4070 Super', 'RX 7700 XT', 'RX 7900 GRE']);
            const ram = randomChoice(['16 GB DDR5', '32 GB DDR5', '64 GB DDR5']);
            const storage = randomChoice(['1 TB NVMe', '2 TB NVMe', '1 TB NVMe + 2 TB SSD']);
            await reply(
`🖥️ *PC DEL GIORNO*
━━━━━━━━━━━━━━━━━━
CPU: *${cpu}*
GPU: *${gpu}*
RAM: *${ram}*
Spazio: *${storage}*
━━━━━━━━━━━━━━━━━━
Perfetto per giocare
e fare tutto senza stress.`);
    },
};
