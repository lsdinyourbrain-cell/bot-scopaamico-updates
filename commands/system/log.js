'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    if (cc >= 48 && cc <= 57) return String.fromCodePoint(0x1D7E2 + cc - 48);
    return c;
}).join('');

module.exports = {
    name: 'log',
    aliases: ['logs', 'logbot'],
    description: "Mostra gli ultimi log del bot (più di quelli visibili su Termux).",

    async run(sock, msg, args, context) {
        const { from, textArgs, reply } = context;

        if (!context.isOwner) {
            return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");
        }

        const requested = parseInt(textArgs.trim(), 10);
        const n = Math.min(Math.max(Number.isFinite(requested) ? requested : 80, 5), 400);
        const { getBotLog } = require('../../lib/logger');
        const log = getBotLog(n);

        if (!log.trim()) {
            return reply('📄 Nessun log trovato.');
        }

        // WhatsApp accetta ~4000 char per messaggio: spezzo in blocchi
        const chunks = [];
        let current = '';
        for (const line of log.split('\n')) {
            if ((current + line + '\n').length > 3800) {
                chunks.push(current.trimEnd());
                current = line + '\n';
            } else {
                current += line + '\n';
            }
        }
        if (current.trim()) chunks.push(current.trimEnd());

        const header = `📄 *LOG BOT*\n━━━━━━━━━━━━━━━━━━\n${chunks.length === 1 ? `ultime ${n} righe` : `log in ${chunks.length} parti`}\n━━━━━━━━━━━━━━━━━━`;
        await reply(header + '\n```\n' + chunks[0] + '\n```');

        for (let i = 1; i < chunks.length; i++) {
            await sock.sendMessage(from, { text: '```\n' + chunks[i] + '\n```' }, { quoted: msg });
        }
    },
};
