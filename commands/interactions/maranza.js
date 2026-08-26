'use strict';

const { S, SEP, header, footer, bullet } = require('../../lib/ui');

module.exports = {
    name: 'maranza',
    aliases: [],
    description: "Esegue il comando .maranza.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const target = targetJid || sender;
            const pct    = Math.floor(Math.random() * 101);
            const frase  = pct <= 20 ? 'Praticamente un cittadino modello 😇'
                         : pct <= 40 ? 'Un po\' di sbruffoneria, ma niente di grave'
                         : pct <= 60 ? 'Borsello sospetto, ma ancora recuperabile'
                         : pct <= 80 ? 'Tuta in acetato e AirPods a palla 🎧'
                         : 'Borsello falso, cassa Bluetooth sulla metro, codice penale aperto 🚔';
            await sock.sendMessage(from, {
                text: `${S.star} ${S.dia}  *MARANZA TEST*  ${S.dia} ${S.star}\n${SEP.line}\n${bullet(`👤 @${target.split('@')[0]}`)}\n${bullet(`📊 *Percentuale:* _*${pct}%*_`)}\n${SEP.lineL}\n${bullet(`💬 _${frase}_`)}\n${SEP.stars}\n${footer()}`,
                mentions: [target],
            });
    },
};
