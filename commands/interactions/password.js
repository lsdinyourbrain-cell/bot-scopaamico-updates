'use strict';

module.exports = {
    name: 'password',
    aliases: ['pass', 'genpass'],
    description: "Genera una password sicura casuale.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        const len = Math.min(Math.max(parseInt(textArgs) || 16, 8), 64);
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let pass = '';
        for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];

        await sendButtons(sock, from, `🔐 *Password* (${len} caratteri):\n\`${pass}\``, [
            { label: '🔁 .password', id: 'password ' + len },
        ], msg);
    },
};
