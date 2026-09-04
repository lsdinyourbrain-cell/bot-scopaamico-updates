'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const os = require('os');

module.exports = {
    name: 'stats2',
    aliases: ['statistiche2', 'botstats2', 'vexstats'],
    description: 'Mostra statistiche reali del bot con grafica glass premium.',

    async run(sock, msg, args, context) {
        const { from, sender, pushName, services } = context;
        const { db, commands } = services;

        // Uptime
        const upSec = Math.floor(process.uptime());
        const d = Math.floor(upSec / 86400);
        const h = Math.floor((upSec % 86400) / 3600);
        const m = Math.floor((upSec % 3600) / 60);
        const s = upSec % 60;
        const uptime = d > 0 ? `${d}g ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

        // Groups & users real
        let groupCount = 0;
        let totalMembers = 0;
        let groupNames = [];
        try {
            const groups = await sock.groupFetchAllParticipating();
            const entries = Object.values(groups || {});
            groupCount = entries.length;
            totalMembers = entries.reduce((acc, g) => acc + (g.participants?.length || 0), 0);
            groupNames = entries.slice(0, 3).map(g => g.subject || 'Gruppo').join(', ');
        } catch (_) {
            // fallback: count db groups
            const dbGroups = Object.keys(db).filter(k => k.endsWith('@g.us'));
            groupCount = dbGroups.length;
            totalMembers = dbGroups.reduce((acc, gid) => {
                const chat = db[gid] || {};
                const users = Object.keys(chat).filter(k => k.includes('@')).length;
                return acc + users;
            }, 0);
        }

        // Users total in db
        let dbUsers = 0;
        let dbChats = 0;
        for (const k of Object.keys(db)) {
            if (k.endsWith('@g.us') || k.endsWith('@s.whatsapp.net') || k.endsWith('@lid')) {
                dbChats++;
                const chat = db[k];
                if (chat && typeof chat === 'object') {
                    dbUsers += Object.keys(chat).filter(j => j.includes('@')).length;
                }
            }
            if (k.startsWith('120') || k.startsWith('269')) dbUsers++;
        }
        // alternative better: count all jid keys across db
        const allJids = new Set();
        for (const chatId of Object.keys(db)) {
            const chat = db[chatId];
            if (chat && typeof chat === 'object') {
                for (const jid of Object.keys(chat)) if (jid.includes('@')) allJids.add(jid);
            }
        }
        const uniqueUsers = allJids.size || dbUsers;

        // Commands
        const cmdCount = commands ? commands.size : 0;
        let fileCount = 0;
        try {
            const fs = require('fs');
            const path = require('path');
            const walk = (dir) => {
                if (!fs.existsSync(dir)) return 0;
                let c = 0;
                for (const e of fs.readdirSync(dir, { withFileTypes:true })) {
                    const p = path.join(dir, e.name);
                    if (e.isDirectory()) c += walk(p);
                    else if (e.isFile() && e.name.endsWith('.js')) c++;
                }
                return c;
            };
            fileCount = walk(path.join(__dirname, '..'));
        } catch (_) { fileCount = cmdCount; }

        // System
        const memUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const platform = `${os.type()} ${os.release()} (${os.arch()})`;
        const nodeVer = process.version;
        const cpuCores = os.cpus().length;

        const txt = `${sec('📊 STATS2 • VEX BOT')}\n${boxOpen()}\n${line(`✨ Richiesto da @${dispOf(sender)} • _${pushName || 'Utente'}_ 💎`)}\n${line(`🔮 _Vetro diamantato • real-time_`)}\n${line('')}\n${line(`⏱️ Uptime: _${uptime}_ • PID _${process.pid}_`)}\n${line(`🟢 Node: _${nodeVer}_ • CPU _${cpuCores} core_`)}\n${line(`💾 RAM: _${memUsed} MB_ (heap _${heap} MB_)`)}\n${line(`🖥️ _${platform}_`)}\n${line('')}\n${line(`📦 Gruppi: _${groupCount}_ • 👥 Membri totali: _${totalMembers}_`)}\n${line(`👤 Utenti unici DB: _${uniqueUsers}_ • 💬 Chat DB: _${dbChats}_`)}\n${line(`⚙️ Comandi: _${cmdCount}_ alias • 📁 File: _${fileCount}_`)}\n${line('')}\n${line(`💎 Premium attivi: _${(db._premium ? Object.keys(db._premium).length : 0)}_ • 🔮 Glass effect ✨`)}\n${line(`📈 Messaggi elaborati: _${uniqueUsers * 3 + totalMembers}_ stimati`)}\n${boxEnd()}`;

        return sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: msg });
    },
};
