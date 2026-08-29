'use strict';

const fs = require('fs');
const path = require('path');
const { S, SEP, footer, bullet, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'schiaffo',
    aliases: ["paccasulculo","uccidi","insulta","bacia","abbraccia","sposa"],
    description: "Esegue il comando .schiaffo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!targetJid) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Tagga qualcuno oppure rispondi a un suo messaggio.')}
${boxEnd()}`);

            let title, action, extra;
            if (command === 'schiaffo') {
                title = 'SCHIAFFO'; action = randomChoice(ARRAYS.schiaffi); extra = null;
            } else if (command === 'insulta') {
                title = 'INSULTA'; action = null; extra = `_*«${randomChoice(ARRAYS.insulti)}»*_`;
            } else if (command === 'paccasulculo') {
                title = 'PACCASULCULO'; action = randomChoice(ARRAYS.paccasulculo); extra = null;
            } else if (command === 'uccidi') {
                title = 'UCCIDI'; action = randomChoice(ARRAYS.uccidi); extra = '_GG!_';
            } else if (command === 'bacia') {
                title = 'BACIA'; action = randomChoice(ARRAYS.bacia); extra = null;
            } else if (command === 'abbraccia') {
                title = 'ABBRACCIA'; action = randomChoice(ARRAYS.abbraccia); extra = null;
            } else if (command === 'sposa') {
                title = 'SPOSA'; action = randomChoice(ARRAYS.sposa); extra = '_Il gruppo aspetta la risposta!_';
            } else {
                title = 'CAOS'; action = randomChoice(ARRAYS.caos); extra = '_Fine dei dettagli, siamo in chat 😭_';
            }

            const lines = [
                `${S.star} ${S.dia}  *${title}*  ${S.dia} ${S.star}`,
                SEP.line,
            ];

            if (command === 'insulta') {
                lines.push(bullet(`@${targetJid.split('@')[0]}:`));
                lines.push(bullet(extra));
            } else if (action) {
                lines.push(bullet(`@${sender.split('@')[0]} ${action} @${targetJid.split('@')[0]}`));
                if (extra) lines.push(bullet(extra));
            }

            lines.push(SEP.stars);
            lines.push(footer());

            await sock.sendMessage(from, { text: lines.join('\n'), mentions: [sender, targetJid] });
    },
};
