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
            const pingMsg = await sock.sendMessage(from, { text: '✨ *_Elaborazione dati di sistema..._*' }, { quoted: msg });
            const latency = Date.now() - start;

            // CPU del sistema e del processo bot misurate in parallelo.
            const sysPromise  = getCpuUsage();
            const procPromise = getProcessCpu();
            const info = await getSysInfo(sysPromise, procPromise);

            const txt =
`⚡ *_BOT STATUS_*
━━━━━━━━━━━━━━━━━━
▸ ⏱️ Latenza: _${latency} ms_
▸ 🖥️ Processore: _${info.cpuModel}_
▸ 🧠 Core: _${info.cpuCores}_
▸ 💻 Uso sistema: _${info.cpu}_
▸ 🔧 CPU processo bot: _${info.cpuProcess}_
▸ 💾 RAM sistema:
  _${info.ramUsed} GB / ${info.ramTotal} GB (${info.ramPercent}%)_
▸ 🤖 Processo bot: _${info.processRam} MB RAM_
▸ 📚 Heap: _${info.heapUsed} MB_
▸ ⏳ Uptime bot: _${info.uptime}_
▸ 🧩 Sistema: _${info.platform}_
▸ 🟢 Node.js: _${info.node}_
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`;

            try { await sock.sendMessage(from, { delete: pingMsg.key }); } catch (_) {}

            await sendButtons(sock, from, txt, [
                { label: '.ping', id: 'ping' },
                { label: '.status', id: 'status' },
                { label: '.clear',  id: 'clear' },
            ], msg);
    },
};
