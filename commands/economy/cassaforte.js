'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'cassaforte',
    aliases: [],
    description: "Esegue il comando .cassaforte.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const uDB = getUser(sender, from);
            const wallet = uDB.money || 0;
            const bank = uDB.bank || 0;
            await reply(
`🏦 *_CASSAFORTE_*
▸ 👤 Titolare: _${pushName}_
▸ 💰 Contante: _${wallet}€_
▸ 🏦 Banca: _${bank}€_
▸ 💵 Totale: _${wallet + bank}€_
`
            );
    },
};
