'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'id',
    aliases: ['jid', 'myid'],
    description: "Mostra il tuo ID WhatsApp o l'ID del gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        const userJid = sender || from;
        const groupJid = isGroup ? from : null;

        let txt = `📱 *_ID INFO_*\n\n▸ 👤 *Tu:*\n▸ 📱 _${userJid}_\n`;
        if (groupJid) txt += `▸ 👥 *Gruppo:*\n▸ 📱 _${groupJid}_\n`;
        txt += `\n`;
        await reply(txt);
    },
};
