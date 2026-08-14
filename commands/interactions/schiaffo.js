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


            if (!targetJid) return reply("⚠️ _Tagga qualcuno oppure rispondi a un suo messaggio._");

            let text;
            if (command === 'schiaffo') {
                text = `💥 *_SCHIAFFO_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.schiaffi)} @${targetJid.split('@')[0]}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'insulta') {
                text = `🤬 *_INSULTA_*\n━━━━━━━━━━━━━━\n▸ @${targetJid.split('@')[0]}:\n▸ _*«${randomChoice(ARRAYS.insulti)}»*_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'paccasulculo') {
                text = `🍑 *_PACCASULCULO_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.paccasulculo)} @${targetJid.split('@')[0]}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'uccidi') {
                text = `🎮 *_UCCIDI_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.uccidi)} @${targetJid.split('@')[0]}. _GG!_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'bacia') {
                text = `💋 *_BACIA_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.bacia)} @${targetJid.split('@')[0]}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'abbraccia') {
                text = `🫂 *_ABBRACCIA_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.abbraccia)} @${targetJid.split('@')[0]}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else if (command === 'sposa') {
                text = `💍 *_SPOSA_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.sposa)} @${targetJid.split('@')[0]}\n▸ _Il gruppo aspetta la risposta!_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            } else {
                text = `🔥 *_CAOS_*\n━━━━━━━━━━━━━━\n▸ @${sender.split('@')[0]} ${randomChoice(ARRAYS.caos)} @${targetJid.split('@')[0]}\n▸ _Fine dei dettagli, siamo in chat 😭_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`;
            }
            await sock.sendMessage(from, { text, mentions: [sender, targetJid] });
    },
};
