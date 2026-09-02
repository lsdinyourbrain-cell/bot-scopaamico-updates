'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'sasso',
    aliases: ["carta","forbici"],
    description: "Esegue il comando .sasso.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const choices = ['sasso', 'carta', 'forbici'];
            const userChoice = (args[0] || '').toString().toLowerCase() || command;
            if (!choices.includes(userChoice)) {
                return await sendButtons(sock, from, `${sec('SASSO CARTA FORBICI')}\n${boxOpen()}\n${line('Scegli la tua mossa:')}\n${boxEnd()}`, [
                    { label: '.sasso', id: 'sasso' },
                    { label: '.carta', id: 'carta' },
                    { label: '.forbici', id: 'forbici' },
                ], msg);
            }
            const botChoice = randomChoice(choices);
            const beats = { sasso: 'forbici', carta: 'sasso', forbici: 'carta' };
            const result = userChoice === botChoice
                ? '🤝 Pari! Stessi pensieri.'
                : beats[userChoice] === botChoice
                    ? '🥳 Hai vinto, easy.'
                    : '😅 Stavolta vince il bot.';
            await sendButtons(sock, from, `${sec('SASSO CARTA FORBICI')}\n${boxOpen()}\n${line(`*Tu:* _${userChoice}_`)}\n${line(`*Bot:* _${botChoice}_`)}\n${line('')}\n${line(result)}\n${boxEnd()}`, [
                { label: '.sasso', id: 'sasso' },
                { label: '.carta', id: 'carta' },
                { label: '.forbici', id: 'forbici' },
            ], msg);
    },
};
