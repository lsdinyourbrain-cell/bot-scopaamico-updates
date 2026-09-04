'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'fiore',
    aliases: [],
    description: "Esegue il comando .fiore.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const recipient = targetJid || sender;
            const flower = randomChoice(ARRAYS.fiori);
            await sock.sendMessage(from, {
                text: `${sec('UN FIORE PER TE')}\n${boxOpen()}\n${line(`🌷 *_UN FIORE PER TE_*\n\n▸ @${dispOf(sender)} regala a @${dispOf(recipient)}\n▸ ${flower} ✨\n\n`)}\n${boxEnd()}`,
                mentions: [sender, recipient],
            }, { quoted: msg });
    },
};
