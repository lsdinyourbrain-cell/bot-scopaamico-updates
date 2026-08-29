'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'warnlist',
    aliases: ['warns', 'warnings'],
    description: "Mostra la lista degli utenti con warning nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, getUser } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);
        if (!isSenderAdmin) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin.')}
${boxEnd()}`);

        const chatData = db[from];
        if (!chatData) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('nessun dato trovato per questo gruppo.')}
${boxEnd()}`);

        // In LID mode i warn sono registrati sotto @lid: risolviamo il PN
        // reale dai partecipanti per mostrarli leggibili.
        let pnMap = new Map();
        try {
            const meta = await sock.groupMetadata(from);
            for (const p of meta.participants || []) {
                pnMap.set(p.id, p.phoneNumber || p.id.split('@')[0]);
            }
        } catch (_) {}

        const warned = Object.entries(chatData)
            .filter(([jid, data]) => (data.warnings || 0) > 0)
            .map(([jid, data]) => ({
                jid,
                display: pnMap.get(jid) || jid.split('@')[0],
                warnings: data.warnings,
                warnLog: Array.isArray(data.warnLog) ? data.warnLog : [],
            }))
            .sort((a, b) => b.warnings - a.warnings);

        if (!warned.length) return reply("✅ Nessun utente con warning.");

        let txt = `⚠️ *WARN LIST*\n━━━━━━━━━━━━━━\n⚠️ *${warned.length}* utenti warnati\n`;
        warned.forEach((w, i) => {
            txt += `${i+1}. @${w.display} — ${w.warnings} warn\n`;
            w.warnLog.forEach((entry, j) => {
                txt += `${j+1}. ${String(entry.reason || '—').slice(0, 28)}\n`;
            });
        });
        txt += `━━━━━━━━━━━━━━`;

        const mentions = warned.map(w => w.jid).filter(Boolean);
        await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg });
    },
};
