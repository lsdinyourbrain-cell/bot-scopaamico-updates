'use strict';

module.exports = {
    name: 'pick',
    aliases: ['scegli', 'choose'],
    description: "Sceglie una opzione tra quelle elencate (separate da |).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (!textArgs) return reply("Usa: .pick opzione1 | opzione2 | opzione3");
        const options = textArgs.split('|').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return reply("Metti almeno 2 opzioni separate da |");
        const chosen = options[Math.floor(Math.random() * options.length)];
        await sendButtons(sock, from, `🎯 *Scelto:* ${chosen}`, [
            { label: '.pick', id: 'pick ' + textArgs },
        ], msg);
    },
};
