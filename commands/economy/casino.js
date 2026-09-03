'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'casino',
    aliases: [],
    description: "Esegue il comando .casino.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            await sendButtons(sock, from,
                `${sec('🎰 CASINÒ GLASS')}\n${boxOpen()}\n${line('💎 Benvenuto nel *Casino VEX* ✨🔮')}\n${line('🎲 Premi un pulsante e tenta la sorte 💫')}\n${line('🍀 _Vetro cromato, fortuna diamantata_')}\n${boxEnd()}`,
                [
                    { label: '🎲 Dadi 100 ✨', id: 'dadi 100' },
                    { label: '🎰 Slot 100 💎', id: 'slot 100' },
                    { label: '🎡 Roulette 100 🔮', id: 'roulette 100' },
                ],
                msg);
    },
};
