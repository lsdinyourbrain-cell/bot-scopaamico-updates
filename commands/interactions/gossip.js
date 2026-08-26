'use strict';

const { S, SEP, header, footer, bullet, section } = require('../../lib/ui');

module.exports = {
    name: 'gossip',
    aliases: [],
    description: "Esegue il comando .gossip.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const frase = randomChoice(ARRAYS.gossip).replace('[sender]', `@${sender.split('@')[0]}`);
            await sock.sendMessage(from, {
                text: `${S.star} ${S.dia}  *GOSSIP*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`💬 _${frase}_`)}\n${SEP.stars}\n${footer()}`,
                mentions: [sender],
            });
    },
};
