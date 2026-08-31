'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toStyle } = require('../../lib/font');
const antibotLib = require('../../lib/antibot');

const B = (t) => toStyle(String(t), 'sansBold');

module.exports = {
    name: 'antibot',
    aliases: [],
    description: "Attiva/disattiva filtro antibot: quando qualcuno esegue un comando, caccia gli altri bot che rispondono.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, isBotAdmin, isSenderAdmin, reply, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        if (!db._antibot) db._antibot = {};
        if (!db._antibot[from]) db._antibot[from] = { enabled: false, whitelist: [] };
        const cfg = db._antibot[from];

        const subRaw = (textArgs || '').trim();
        const sub = subRaw.toLowerCase();

        // --- on / off ---
        if (sub === 'on' || sub === 'true' || sub === '1' || sub === 'attiva') {
            cfg.enabled = true;
            saveDB();
            const txt = `✅ ${B('ANTIBOT ATTIVATO')}\n\n▸ Stato: ✅ ${B('ATTIVO')}\n▸ Finestra: ${antibotLib.WATCH_WINDOW_MS / 1000}s dopo ogni comando\n▸ Soglia: ${antibotLib.THRESHOLD || 4} punti\n\n🤖 Gli altri bot che rispondono\ncon pulsanti/box/header\nverranno rimossi.\n\n◈ ${B('Vex Bot')}`;
            try {
                await sendButtons(sock, from, txt, [
                    { label: '❌ Disattiva', id: 'antibot off' },
                    { label: '📊 Stats', id: 'antibot stats' },
                ], msg);
            } catch (_) { await reply(txt); }
            return;
        }
        if (sub === 'off' || sub === 'false' || sub === '0' || sub === 'disattiva') {
            cfg.enabled = false;
            saveDB();
            const txt = `❌ ${B('ANTIBOT DISATTIVATO')}\n\n▸ Stato: ❌ ${B('DISATTIVO')}\n▸ Finestra: ${antibotLib.WATCH_WINDOW_MS / 1000}s\n▸ Soglia: ${antibotLib.THRESHOLD || 4} punti\n\n◈ ${B('Vex Bot')}`;
            try {
                await sendButtons(sock, from, txt, [
                    { label: '✅ Attiva', id: 'antibot on' },
                    { label: '📊 Stats', id: 'antibot stats' },
                ], msg);
            } catch (_) { await reply(txt); }
            return;
        }

        // --- stats ---
        if (sub === 'stats' || sub === 'stat' || sub === 'info') {
            let stats;
            try { stats = antibotLib.getStats(); } catch (_) { stats = { hits: [], recentHits: [] }; }
            const hits = stats.hits || stats.recentHits || [];
            const armed = typeof stats.armedGroups === 'number' ? stats.armedGroups : 0;
            const wl = cfg.whitelist?.length ? cfg.whitelist.map(w => `▸ _${w}_`).join('\n') : '▸ _Nessuno_';
            let hitsBlock = '';
            if (hits.length) {
                hitsBlock = hits.slice(0, 5).map((h, i) => {
                    const when = new Date(h.ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                    const senderShort = String(h.sender || h.jid || '').split('@')[0].slice(-4);
                    return `▸ ${i + 1}. …${senderShort} — ${h.evidence}pt _${h.reason}_ [${when}]`;
                }).join('\n');
            } else {
                hitsBlock = '▸ _Nessuno_';
            }
            const statusIcon = cfg.enabled ? '✅' : '❌';
            const statusLabel = cfg.enabled ? B('ATTIVO') : B('DISATTIVO');
            const txt =
`${statusIcon} ${B('ANTIBOT')} — ${B('STATS')}\n` +
`\n` +
`▸ Stato: ${statusIcon} ${statusLabel}\n` +
`▸ Finestra: ${antibotLib.WATCH_WINDOW_MS / 1000}s\n` +
`▸ Soglia: ${antibotLib.THRESHOLD || 4}pt\n` +
`▸ Gruppi armati: ${armed}\n` +
`▸ Sender tracciati: ${stats.totalSenders ?? 0}\n` +
`\n` +
`📋 ${B('Ultimi hit')}\n` +
`${hitsBlock}\n` +
`\n` +
`📋 ${B('Whitelist')}\n` +
`${wl}\n` +
`\n` +
`◈ ${B('Vex Bot')}`;
            try {
                await sendButtons(sock, from, txt, [
                    { label: '✅ Attiva', id: 'antibot on' },
                    { label: '❌ Disattiva', id: 'antibot off' },
                    { label: '📊 Stats', id: 'antibot stats' },
                ], msg);
            } catch (_) { await reply(txt); }
            return;
        }

        // --- whitelist ---
        if (sub.startsWith('whitelist ') || sub.startsWith('wl ')) {
            const num = sub.replace(/^(whitelist|wl)\s+/, '').replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('numero non valido. ▸ .antibot whitelist <numero>')}
${boxEnd()}`);
            if (!Array.isArray(cfg.whitelist)) cfg.whitelist = [];
            if (cfg.whitelist.includes(num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w !== num);
                saveDB();
                return reply(`✅ _${num}_ rimosso dalla whitelist antibot.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ _${num}_ aggiunto alla whitelist antibot.`);
        }
        if (sub === 'whitelist' || sub === 'wl' || sub === 'whitelist list' || sub === 'wl list') {
            const wlList = cfg.whitelist?.length ? cfg.whitelist.map(w => `▸ _${w}_`).join('\n') : '▸ _Nessuno_';
            return reply(`${B('ANTIBOT')} — ${B('WHITELIST')}\n\n${wlList}\n\n▸ Uso: \`.antibot whitelist <n>\`\n◈ ${B('Vex Bot')}`);
        }
        if (sub === 'clear' && isOwner) {
            try { antibotLib.clear(); } catch (_) {}
            return reply(`🧹 ${B('ANTIBOT')} — memoria pulita.`);
        }

        // --- default status ---
        const enabled = !!cfg.enabled;
        const statusIcon = enabled ? '✅' : '❌';
        const statusLabel = enabled ? B('ATTIVO') : B('DISATTIVO');
        let stats;
        try { stats = antibotLib.getStats(); } catch (_) { stats = { hits: [] }; }
        const hits = stats.hits || stats.recentHits || [];
        let hitsBlock = '';
        if (hits.length) {
            hitsBlock = hits.slice(0, 3).map((h) => {
                const short = String(h.sender || h.jid || '').split('@')[0].slice(-6);
                return `▸ …${short} — ${h.evidence}pt _${String(h.reason).slice(0, 40)}_`;
            }).join('\n');
        } else {
            hitsBlock = '▸ _Nessuno_';
        }
        const wlList = cfg.whitelist?.length ? cfg.whitelist.map(w => `▸ _${w}_`).join('\n') : '▸ _Nessuno_';

        const isArmedNow = (() => { try { return antibotLib.isArmed(from); } catch (_) { return false; } })();
        const armedLabel = isArmedNow ? '🟢 armata' : '⚪ idle';

        const txt =
`${statusIcon} ${B('ANTIBOT')}\n` +
`\n` +
`▸ Stato: ${statusIcon} ${statusLabel}  (${armedLabel})\n` +
`▸ Finestra: ${antibotLib.WATCH_WINDOW_MS / 1000}s dopo comando\n` +
`▸ Soglia: ${antibotLib.THRESHOLD || 4} punti evidenza\n` +
`\n` +
`📋 ${B('Come funziona')}\n` +
`▸ Quando un membro usa un\n` +
`  comando (es. .menu), gli altri\n` +
`  bot che rispondono con\n` +
`  pulsanti/liste/box vengono\n` +
`  rilevati e cacciati.\n` +
`\n` +
`📊 ${B('Ultimi hit')}\n` +
`${hitsBlock}\n` +
`\n` +
`📋 ${B('Whitelist')}\n` +
`${wlList}\n` +
`▸ Uso: \`.antibot on/off\`\n` +
`  \`.antibot stats\`\n` +
`  \`.antibot whitelist <n>\`\n` +
`\n` +
`◈ ${B('Vex Bot')}`;

        try {
            await sendButtons(sock, from, txt, [
                { label: '✅ Attiva', id: 'antibot on' },
                { label: '❌ Disattiva', id: 'antibot off' },
                { label: '📊 Stats', id: 'antibot stats' },
            ], msg);
        } catch (_) {
            await reply(txt);
        }
    },
};
