'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'casino',
    aliases: [],
    description: "Esegue il comando .casino.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

            const txt = `${sec('🎰 CASINÒ')}\n${boxOpen()}\n${line('Benvenuto nel *Casino VEX*')}\n${line('🎲 Comandi: _.dadi 100_ • _.slot 100_ • _.roulette 100_')}\n${line('🍀 _tenta la sorte, bro_')}\n${boxEnd()}`;
            await sock.sendMessage(from, { text: txt }, { quoted: msg });
    },
};
