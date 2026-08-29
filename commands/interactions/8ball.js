'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const answers = [
    "🎱 *Sì*, decisamente!",
    "🎱 *No*, assolutamente no.",
    "🎱 Forse... chiedimi dopo.",
    "🎱 Le stelle dicono di *sì*!",
    "🎱 Le stelle dicono di *no*!",
    "🎱 Non ci contare.",
    "🎱 Certo che sì!",
    "🎱 Nemmeno per sogno.",
    "🎱 È probabile.",
    "🎱 È molto dubbio.",
    "🎱 I segni indicano di *sì*.",
    "🎱 Meglio non saperlo ora.",
    "🎱 Assolutamente *sì*!",
    "🎱 Assolutamente *no*!",
    "🎱 Sì, ma con cautela.",
    "🎱 No, ma non disperare.",
    "🎱 Chiedilo al muro, tanto ti risponde uguale.",
    "🎱 La risposta è nel vento... e il vento dice *sì*.",
    "🎱 La risposta è nel vento... e il vento dice *no*.",
    "🎱 Secondo il bot: *sì*, secondo la logica: *boh*.",
];

module.exports = {
    name: '8ball',
    aliases: ['magicball', 'pallamagica', 'domanda'],
    description: "La palla magica risponde alla tua domanda.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        if (!textArgs) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Fai una domanda! Es: .8ball mi vuoi bene?')}
${boxEnd()}`);
        const a = answers[Math.floor(Math.random() * answers.length)];
        await sendButtons(sock, from, `🎱 *_PALLA MAGICA_*\n━━━━━━━━━━━━━━\n▸ *Domanda:* _${textArgs}_\n━━━━━━━━━━━━━━\n${a}\n━━━━━━━━━━━━━━\n`, [
            { label: '.8ball', id: '8ball ' + textArgs },
        ], msg);
    },
};
