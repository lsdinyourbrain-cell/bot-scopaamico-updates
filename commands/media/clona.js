'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'clona',
    aliases: [],
    description: "Esegue il comando .clona.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: scrivi qualcosa da girare al contrario._ ▸ Esempio: \`.clona ciao\`')}
${boxEnd()}`);
            await reply(`${sec('CLONA')}\n${boxOpen()}\n${line(`🪞 *_CLONA_*\n\n▸ _${Array.from(textArgs).reverse().join('')}_\n`)}\n${boxEnd()}`);
    },
};
