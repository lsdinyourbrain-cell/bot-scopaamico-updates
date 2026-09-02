'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'sclero',
    aliases: [],
    description: "Esegue il comando .sclero.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            await sock.sendMessage(from, {
                text: `${sec('SCLERO')}\n${boxOpen()}\n${line(`🤯 *_SCLERO_*\n\n▸ 👤 @${sender.split('@')[0]}\n▸ 💢 _${randomChoice(ARRAYS.sclero)}_\n\n`)}\n${boxEnd()}`,
                mentions: [sender],
            });
    },
};
