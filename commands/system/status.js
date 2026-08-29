'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

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
`${sec('STATUS')}
${boxOpen()}
${line(`⏱️ Uptime: _${uptimeStr}_`)}
${line(`📦 Gruppi: _${groupCount}_`)}
${line(`👥 Utenti: _${totalMem}_`)}
${line(`🖥️ CPU sistema: _${cpu === null ? 'N/D' : cpu.toFixed(1) + '%'}_`)}
${line(`🔧 CPU processo: _${procCpu === null ? 'N/D' : procCpu + '%'}_`)}
${line(`💾 RAM: _${memUsage}MB_`)}
${line(`🟢 Node: _${nodeVer}_`)}
${line(`🔋 PID: _${process.pid}_`)}
${boxEnd()}`;

        await sendButtons(sock, from, txt, [
            { label: '🔄 Status', id: 'status' },
            { label: '⚡ Ping', id: 'ping' },
        ], msg);
    },
};
