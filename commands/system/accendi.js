'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'accendi',
    aliases: [],
    description: "Riaccende il bot globalmente (owner) o solo nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (isGroup && db[from]?._muted && (isSenderAdmin || isOwner)) {
            db[from]._muted = false;
            saveDB();
            return reply(
`${sec('BOT RIPRESO')}\n${boxOpen()}\n${line('Il bot è di nuovo attivo')}\n${line('in questo gruppo! 🚀')}\n${boxEnd()}`);
        }

        if (!isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);

        setBotActive(true);
        await reply(`${sec('SISTEMA')}\n${boxOpen()}\n${line('✅ Bot _ATTIVO_ e pronto! 🚀')}\n${boxEnd()}`);
    },
};
