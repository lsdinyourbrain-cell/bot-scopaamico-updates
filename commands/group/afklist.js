'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'afklist',
    aliases: ['listaafk', 'afk-list'],
    description: "Mostra tutti gli utenti AFK nel gruppo. Uso: .afklist",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { db } = services;

        const entries = Object.entries(db.afk || {}).filter(([, v]) => v && v.from === from);
        if (!entries.length) {
            return reply(`🌙 *_AFK LIST_*
Nessun utente è *AFK* in questo gruppo. Tutti in piedi! 💪
`);
        }

        const mentions = entries.map(([jid]) => jid);
        const lines = entries.map(([jid, v]) => {
            const mins = Math.max(1, Math.floor((Date.now() - (v.ts || Date.now())) / 60000));
            const reason = String(v.reason || 'nessun motivo').slice(0, 60);
            return `▸ @${jid.split('@')[0]} — _${reason}_ _(da ${mins} min)_`;
        });

        return sock.sendMessage(from, {
            text: `🌙 *_AFK LIST_*\n━━━━━━━━━━━━━━\n▸ *Utenti AFK:* ${entries.length}\n` +
                lines.join('\n') +
                `\n━━━━━━━━━━━━━━\n_Torna in chat con un messaggio per uscire dall'AFK._\n`,
            mentions,
        }, { quoted: msg });
    },
};