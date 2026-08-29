'use strict';

const { S, SEP, footer, bullet, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'drink',
    aliases: [],
    description: "Esegue il comando .drink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            await sock.sendMessage(from, {
                text: `${S.star} ${S.dia}  *DRINK*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`🍹 @${sender.split('@')[0]} offre a @${target.split('@')[0]}:`)}\n${bullet(`🥂 _*${randomChoice(ARRAYS.drink)}*_`)}\n${bullet(`_Cin cin! 🎉_`)}\n${SEP.stars}\n${footer()}`,
                mentions: [sender, target],
            });
    },
};
