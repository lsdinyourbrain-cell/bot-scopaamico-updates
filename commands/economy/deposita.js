'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'deposita',
    aliases: ['dep'],
    description: "Deposita soldi in banca.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const amount = parseInt(textArgs);
            if (!amount || amount <= 0) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: .deposita <importo>')}
${boxEnd()}`);

            const userData = getUser(sender, from);
            if (userData.money < amount) return reply(`❌ Non hai abbastanza soldi. Hai solo *${userData.money}€*.`);
            if (!userData.bank) userData.bank = 0;

            userData.money -= amount;
            userData.bank += amount;
            saveDB();

            await reply(
`${sec('DEPOSITO')}\n${boxOpen()}\n${line(`📥 Depositato: _${amount}€_`)}\n${line(`💰 Contante: _${userData.money}€_`)}\n${line(`🏦 Banca: _${userData.bank}€_`)}\n${boxEnd()}`);
    },
};
