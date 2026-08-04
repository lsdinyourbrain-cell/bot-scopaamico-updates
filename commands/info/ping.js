'use strict';

module.exports = {
    name: 'ping',
    aliases: [],
    description: "Esegue il comando .ping.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const cpuUsagePromise = getCpuUsage();
            let pfpUrl;
            try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (e) { pfpUrl = null; }

            const start = Date.now();
            const pingMsg = await sock.sendMessage(from, { text: '✨ *Elaborazione dati di sistema...*' }, { quoted: msg });
            const latency = Date.now() - start;
            const info    = await getSysInfo(cpuUsagePromise);

            const txt = 
`╭────〔 ⚡ ${'BOT STATUS'} 〕────╮
│ ⏱️ *Latenza:* ${latency} ms
│ 🖥️ *CPU:* ${info.cpuModel}
│ 🧠 *Core:* ${info.cpuCores} | *Uso:* ${info.cpu}
│ 💾 *RAM sistema:* ${info.ramUsed} GB / ${info.ramTotal} GB (${info.ramPercent}%)
│ 🤖 *Processo bot:* ${info.processRam} MB RAM | Heap ${info.heapUsed} MB
│ ⏳ *Uptime bot:* ${info.uptime}
│ 🧩 *Sistema:* ${info.platform}
│ 🟢 *Node.js:* ${info.node}
╰──────────────────────────╯`;

            if (pfpUrl) {
                await sock.sendMessage(from, { delete: pingMsg.key });
                await sock.sendMessage(from, { image: { url: pfpUrl }, caption: txt }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: txt, edit: pingMsg.key });
            }
    },
};
