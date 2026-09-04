'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'oroscopo',
    aliases: [],
    description: "Esegue il comando .oroscopo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            await sock.sendMessage(from, {
                text: `${sec('OROSCOPO')}\n${boxOpen()}\n${line(`🔮 *_OROSCOPO_*\n\n▸ 👤 @${dispOf(sender)}\n▸ ✨ _${randomChoice(ARRAYS.oroscopo)}_\n\n`)}\n${boxEnd()}`,
                mentions: [sender],
            });
    },
};
