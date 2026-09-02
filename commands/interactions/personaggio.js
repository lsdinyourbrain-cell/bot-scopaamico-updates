'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'personaggio',
    aliases: [],
    description: "Esegue il comando .personaggio.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const role = randomChoice(['Eroe/a del gruppo', 'Mago/a delle scuse', 'Boss finale', 'Spalla comica', 'Leggenda urbana']);
            const power = randomChoice(['arriva sempre al momento giusto', 'trova cibo ovunque', 'fa ridere anche quando non vuole', 'sopravvive a ogni figuraccia', 'sparisce quando c’è da pagare']);
            await sock.sendMessage(from, {
                text: `${sec('PERSONAGGIO')}\n${boxOpen()}\n${line(`🎭 *_PERSONAGGIO_*\n\n▸ @${sender.split('@')[0]} è: _*${role}*_\n▸ 💥 *Superpotere:* _${power}_\n\n`)}\n${boxEnd()}`,
                mentions: [sender],
            });
    },
};
