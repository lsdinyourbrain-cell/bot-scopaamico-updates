'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'schiaffo',
    aliases: ["paccasulculo","uccidi","insulta","bacia","abbraccia","sposa"],
    description: "Esegue il comando .schiaffo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!targetJid) return reply("Tagga qualcuno oppure rispondi a un suo messaggio.");

            let text;
            if (command === 'schiaffo') {
                text = `💥 @${sender.split('@')[0]} ${randomChoice(ARRAYS.schiaffi)} @${targetJid.split('@')[0]}`;
            } else if (command === 'insulta') {
                text = `🤬 @${targetJid.split('@')[0]}:\n*«${randomChoice(ARRAYS.insulti)}»*`;
            } else if (command === 'paccasulculo') {
                text = `🍑 @${sender.split('@')[0]} ${randomChoice(ARRAYS.paccasulculo)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'uccidi') {
                text = `🎮 @${sender.split('@')[0]} ${randomChoice(ARRAYS.uccidi)} @${targetJid.split('@')[0]}. GG!`;
            } else if (command === 'bacia') {
                text = `💋 @${sender.split('@')[0]} ${randomChoice(ARRAYS.bacia)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'abbraccia') {
                text = `🫂 @${sender.split('@')[0]} ${randomChoice(ARRAYS.abbraccia)} @${targetJid.split('@')[0]}.`;
            } else if (command === 'sposa') {
                text = `💍 @${sender.split('@')[0]} ${randomChoice(ARRAYS.sposa)} @${targetJid.split('@')[0]}. Il gruppo aspetta la risposta!`;
            } else {
                text = `🔥 @${sender.split('@')[0]} ${randomChoice(ARRAYS.caos)} @${targetJid.split('@')[0]}. Fine dei dettagli, siamo in chat 😭`;
            }
            await sock.sendMessage(from, { text, mentions: [sender, targetJid] });
    },
};
