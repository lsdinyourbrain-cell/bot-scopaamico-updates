'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'revoke',
    aliases: ['revocalink', 'newlink'],
    description: "Revoca il link del gruppo e ne genera uno nuovo (admin).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono revocare il link.')}
${boxEnd()}`);
        if (!isBotAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('rendimi admin prima.')}
${boxEnd()}`);

        try {
            const code = await sock.groupRevokeInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            await reply(`${sec('NUOVO LINK')}\n${boxOpen()}\n${line(`${link}`)}\n${boxEnd()}`);
        } catch (e) {
            await reply("⚠️ _[uso]:_ errore: " + e.message);
        }
    },
};
