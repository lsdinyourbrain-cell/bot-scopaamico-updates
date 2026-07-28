'use strict';

module.exports = {
    name: 'status',
    aliases: ['stats', 'botstatus', 'uptime'],
    description: "Mostra lo stato del bot.",

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, reply, services } = context;
        const { os, getCpuUsage, db } = services;
        const os_ = require('os');

        const uptimeSec = Math.floor(process.uptime());
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = uptimeSec % 60;
        const uptimeStr = `${d}g ${h}h ${m}m ${s}s`;

        const groups = await sock.groupFetchAllParticipating() || {};
        const groupCount = Object.keys(groups).length;
        const totalMem = Object.values(groups).reduce((acc, g) => acc + (g.participants?.length || 0), 0);
        const cpu = os_.loadavg ? os_.loadavg()[0].toFixed(2) : 'N/A';
        const memUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const nodeVer = process.version;

        await reply(
`╭── ✦ *BOT STATUS* ✦ ──╮
│                    
│ ⏱️ Uptime: *${uptimeStr}*
│ 📦 Gruppi: *${groupCount}*
│ 👥 Utenti: *${totalMem}*
│ 🖥️ CPU: *${cpu}%*
│ 💾 RAM: *${memUsage}MB*
│ 🟢 Node: *${nodeVer}*
│ 🔋 PID: *${process.pid}*
│                    
╰──────────────────────╯`);
    },
};
