'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'riavvia',
    aliases: [],
    description: "Esegue il comando .riavvia.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
            
            await reply(`${sec('SISTEMA')}\n${boxOpen()}\n${line('🔄 Riavvio del processo...')}\n${line('Torno operativo a breve! 🚀')}\n${boxEnd()}`);
            try {
                const p = require('path');
                const flag = p.join(p.dirname(p.dirname(__dirname)), '.restart');
                require('fs').writeFileSync(flag, String(Date.now()), 'utf-8');
            } catch (_) {}
            setTimeout(() => {
                try {
                    const { spawn } = require('child_process');
                    const p = require('path');
                    // Se non è gestito da PM2/start.sh, rilancia da solo
                    const managed = !!process.env.PM2_HOME || !!process.env.PM2_USAGE;
                    if (!managed) {
                        const entry = p.join(p.dirname(p.dirname(__dirname)), 'index.js');
                        spawn(process.execPath, [entry], { detached: true, stdio: 'ignore', cwd: p.dirname(entry) }).unref();
                    }
                } catch (_) {}
                process.exit(0);
            }, 1500);
    },
};
