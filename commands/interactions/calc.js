'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'calc',
    aliases: ['calcola', 'math'],
    description: "Calcola un'espressione matematica.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Usa: .calc 2+2')}
${boxEnd()}`);
        const safe = textArgs.replace(/[^0-9+\-*/.() ]/g, '');
        if (!safe) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Espressione non valida.')}
${boxEnd()}`);
        try {
            const result = Function('"use strict"; return (' + safe + ')')();
            await reply(`🧮 *_CALCOLATRICE_*\n━━━━━━━━━━━━━━\n▸ _${safe}_ =\n▸ _*${result}*_\n━━━━━━━━━━━━━━\n`);
        } catch (e) {
            await reply("⚠️ _Errore di calcolo._");
        }
    },
};
