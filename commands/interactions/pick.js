'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'pick',
    aliases: ['scegli', 'choose'],
    description: "Sceglie una opzione tra quelle elencate (separate da |).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Usa: .pick opzione1 | opzione2 | opzione3')}
${boxEnd()}`);
        const options = textArgs.split('|').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Metti almeno 2 opzioni separate da |')}
${boxEnd()}`);
        const chosen = options[Math.floor(Math.random() * options.length)];
        await sendButtons(sock, from, `🎯 *_PICK_*\n\n▸ *Scelto:* _${chosen}_\n\n`, [
            { label: '.pick', id: 'pick ' + textArgs },
        ], msg);
    },
};
