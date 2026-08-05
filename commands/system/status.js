'use strict';

module.exports = {
    name: 'status',
    aliases: ['stats', 'botstatus', 'uptime'],
    description: "Mostra lo stato del bot.",

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, reply, services } = context;
        const { os, getCpuUsage, getProcessCpu, db, sendButtons } = services;

        const uptimeSec = Math.floor(process.uptime());
        const d = Math.floor(uptimeSec / 86400);
        const h = Math.floor((uptimeSec % 86400) / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = uptimeSec % 60;
        const uptimeStr = `${d}g ${h}h ${m}m ${s}s`;

        const groups = await sock.groupFetchAllParticipating() || {};
        const groupCount = Object.keys(groups).length;
        const totalMem = Object.values(groups).reduce((acc, g) => acc + (g.participants?.length || 0), 0);
        const cpu = await getCpuUsage();
        const procCpu = await getProcessCpu();
        const memUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const nodeVer = process.version;

        const txt =
`╭── ✦ *BOT STATUS* ✦ ──╮
│                    
│ ⏱️ Uptime: *${uptimeStr}*
│ 📦 Gruppi: *${groupCount}*
│ 👥 Utenti: *${totalMem}*
│ 🖥️ CPU sistema: *${cpu === null ? 'N/D' : cpu.toFixed(1) + '%'}*
│ 🔧 CPU processo: *${procCpu === null ? 'N/D' : procCpu + '%'}*
│ 💾 RAM: *${memUsage}MB*
│ 🟢 Node: *${nodeVer}*
│ 🔋 PID: *${process.pid}*
│                    
╰──────────────────────╯`;

        await sendButtons(sock, from, txt, [
            { label: '🔁 .status', id: 'status' },
            { label: '⚡ .ping', id: 'ping' },
        ], msg);
    },
};
