'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'ephemeral',
    aliases: ['scomparsa', 'tempomsg'],
    description: "Attiva/disattiva messaggi temporanei nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);

        const sub = (textArgs || '').trim().toLowerCase();
        const durations = {
            'off': 0, 'no': 0, 'false': 0, '0': 0,
            '24h': 86400, '1gg': 86400, 'day': 86400,
            '7gg': 604800, '7d': 604800, 'week': 604800,
            '90gg': 7776000, '90d': 7776000,
        };
        let duration;
        if (sub === 'on' || sub === 'true' || sub === '1') duration = 86400;
        else if (durations[sub] !== undefined) duration = durations[sub];
        else return reply(`${sec('ERRORE')}
${boxOpen()}
${line('.ephemeral on/off/24h/7gg/90gg')}
${boxEnd()}`);

        await sock.groupToggleEphemeral(from, duration);
        const label = duration === 0 ? 'DISATTIVATI' : `ATTIVATI (${duration / 3600}h)`;
        await reply(`${sec('MESSAGGI TEMPORANEI')}\n${boxOpen()}\n${line(`*Stato:* ${label}`)}\n${boxEnd()}`);
    },
};
