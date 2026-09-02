'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'spara',
    aliases: [],
    description: "Spara alla taglia attiva per incassarla.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const result = claimBounty(from, sender);
            if (result === null) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Nessuna taglia attiva in questo gruppo 🤷')}
${boxEnd()}`);
            if (result === 0) {
                return reply(`${sec('INFO')}\n${boxOpen()}\n${line('💥 Hai sparato ma il bersaglio si è schivato!')}\n${line('😂 Per stavolta niente taglia!')}\n${boxEnd()}`);
            }
            const userData = getUser(sender, from);
            userData.money += result;
            saveDB();
            await reply(
`${sec('TAGLIA')}\n${boxOpen()}\n${line('💥 Hai centrato il bersaglio!')}\n${line(`💰 Intascato: _${result}€_`)}\n${line(`💳 Saldo: _${userData.money}€_`)}\n${boxEnd()}`);
    },
};
