'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'gossip',
    aliases: [],
    description: "Esegue il comando .gossip.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

            const frase = randomChoice(ARRAYS.gossip).replace('[sender]', `@${sender.split('@')[0]}`);
            await sock.sendMessage(from, {
                text: `   *GOSSIP*   \n\n${line(`💬 _${frase}_`)}\n\n`,
                mentions: [sender],
            });
    },
};
