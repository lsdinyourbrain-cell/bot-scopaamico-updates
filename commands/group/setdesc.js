'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'setdesc',
    aliases: ['descset', 'settopic'],
    description: "Cambia la descrizione del gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono cambiare la descrizione.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);
        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('inserisci la nuova descrizione.')}
${boxEnd()}`);

        await sock.groupUpdateDescription(from, textArgs);
        await reply(`${sec('DESCRIZIONE')}\n${boxOpen()}\n${line('Descrizione *aggiornata*.')}\n${boxEnd()}`);
    },
};
