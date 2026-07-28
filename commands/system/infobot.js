'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

const BF = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D56C + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D586 + cc - 97);
    return c;
}).join('');

const MS = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D670 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D68A + cc - 97);
    return c;
}).join('');

module.exports = {
    name: 'infobot',
    aliases: [],
    description: "Mostra contatti owner e co-owner del bot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, ownerNumber } = services;

        if (!isOwner) return reply("╭────〔 ⛔ ACCESSO NEGATO 〕────╮\n│ Solo l'Owner può usare questo comando.\n╰──────────────────────────────╯");

        const owners = db._owners || [];
        const coowners = db._coowners || [];

        let txt = `╔══════════════════════════════════════╗\n`;
        txt += `║    👑 *InfoBot - Configurazione*      ║\n`;
        txt += `╠══════════════════════════════════════╣\n`;

        if (owners.length > 0) {
            txt += `║  ${BF('Owner (.Bot Owner)')}\n`;
            txt += owners.map(o => `║     📲 ${o.number}`).join('\n') + '\n';
        }

        if (coowners.length > 0) {
            txt += `║\n`;
            txt += `║  ${MS('Co-Owner Bot')}\n`;
            txt += coowners.map(c => `║     📲 ${c.number}`).join('\n') + '\n';
        }

        txt += `║\n`;
        txt += `╚══════════════════════════════════════╝`;

        await reply(txt);
    },
};
