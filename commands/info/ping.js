'use strict';

module.exports = {
    name: 'ping',
    aliases: [],
    description: "Esegue il comando .ping.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getProcessCpu, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            // Latenza misurata sul round-trip di un primo messaggio.
            const start = Date.now();
            const pingMsg = await sock.sendMessage(from, { text: '✨ *Elaborazione dati di sistema...*' }, { quoted: msg });
            const latency = Date.now() - start;

            // CPU del sistema e del processo bot misurate in parallelo.
            const sysPromise  = getCpuUsage();
            const procPromise = getProcessCpu();
            const info = await getSysInfo(sysPromise, procPromise);

            const txt =
`╭────〔 ⚡ ${'BOT STATUS'} 〕────╮
│ ⏱️ *Latenza:* ${latency} ms
│ 🖥️ *Processore:* ${info.cpuModel}
│ 🧠 *Core:* ${info.cpuCores} | *Uso sistema:* ${info.cpu}
│ 🔧 *CPU processo bot:* ${info.cpuProcess}
│ 💾 *RAM sistema:* ${info.ramUsed} GB / ${info.ramTotal} GB (${info.ramPercent}%)
│ 🤖 *Processo bot:* ${info.processRam} MB RAM | Heap ${info.heapUsed} MB
│ ⏳ *Uptime bot:* ${info.uptime}
│ 🧩 *Sistema:* ${info.platform}
│ 🟢 *Node.js:* ${info.node}
╰──────────────────────────╯`;

            try { await sock.sendMessage(from, { delete: pingMsg.key }); } catch (_) {}

            await sendButtons(sock, from, txt, [
                { label: '.ping', id: 'ping' },
                { label: '.status', id: 'status' },
                { label: '.clear',  id: 'clear' },
            ], msg);
    },
};
