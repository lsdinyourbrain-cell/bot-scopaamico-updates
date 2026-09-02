'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'count',
    aliases: ['conta', 'char'],
    description: "Conta caratteri e parole in un testo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply("Usa: .count <testo>");
        const chars = textArgs.length;
        const words = textArgs.trim() ? textArgs.trim().split(/\s+/).length : 0;
        const lines = textArgs.split('\n').length;

        await reply(
`${sec('COUNT')}\n${boxOpen()}\n${line(`📝 *Caratteri:* _${chars}_`)}\n${line(`📖 *Parole:* _${words}_`)}\n${line(`📃 *Righe:* _${lines}_`)}\n${boxEnd()}`);
    },
};
