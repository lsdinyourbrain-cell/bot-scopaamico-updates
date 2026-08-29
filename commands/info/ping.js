'use strict';

const { sec, boxOpen, boxEnd, cmd, line } = require('../../lib/ui');

module.exports = {
    name: 'ping',
    aliases: [],
    description: "Esegue il comando .ping.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getProcessCpu, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

            const msgTs = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();
            const latency = Math.max(0, Date.now() - msgTs);
            const sysPromise  = getCpuUsage();
            const procPromise = getProcessCpu();
            const info = await getSysInfo(sysPromise, procPromise);

            const txt =
`${sec('PING')}
${boxOpen()}
${line(`⚡ Latenza: _${latency} ms_`)}
${line(`🖥️ Processore: _${info.cpuModel}_`)}
${line(`🧠 Core: _${info.cpuCores}_`)}
${line(`💻 Uso sistema: _${info.cpu}_`)}
${line(`🔧 CPU processo: _${info.cpuProcess}_`)}
${line(`💾 RAM: _${info.ramUsed}GB / ${info.ramTotal}GB (${info.ramPercent}%)_`)}
${line(`🤖 Processo bot: _${info.processRam}MB_`)}
${line(`📚 Heap: _${info.heapUsed}MB_`)}
${line(`⏳ Uptime: _${info.uptime}_`)}
${line(`🧩 Sistema: _${info.platform}_`)}
${line(`🟢 Node: _${info.node}_`)}
${boxEnd()}`;

            await sendButtons(sock, from, txt, [
                { label: '🔄 Ping', id: 'ping' },
                { label: '📊 Status', id: 'status' },
                { label: '🧹 Clear', id: 'clear' },
            ], msg);
    },
};
