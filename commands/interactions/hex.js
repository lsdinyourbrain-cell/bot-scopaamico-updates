'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'hex',
    aliases: [],
    description: "Converte testo in hex e viceversa.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Usa: .hex encode <testo> o .hex decode <hex>')}
${boxEnd()}`);
        const parts = textArgs.split(' ');
        const action = parts[0].toLowerCase();
        const input = parts.slice(1).join(' ');
        if (!input) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Inserisci il testo.')}
${boxEnd()}`);

        if (action === 'encode' || action === 'e') {
            const encoded = Buffer.from(input).toString('hex');
            await reply(`🔢 *_HEX ENCODE_*\n━━━━━━━━━━━━━━\n▸ \`${encoded}\`\n━━━━━━━━━━━━━━\n`);
        } else if (action === 'decode' || action === 'd') {
            try {
                const decoded = Buffer.from(input, 'hex').toString('utf-8');
                await reply(`🔢 *_HEX DECODE_*\n━━━━━━━━━━━━━━\n▸ \`${decoded}\`\n━━━━━━━━━━━━━━\n`);
            } catch { await reply("⚠️ _Hex non valido._"); }
        } else {
            const encoded = Buffer.from(textArgs).toString('hex');
            await reply(`🔢 *_HEX ENCODE_*\n━━━━━━━━━━━━━━\n▸ \`${encoded}\`\n━━━━━━━━━━━━━━\n`);
        }
    },
};
