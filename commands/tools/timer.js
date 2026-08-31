'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { parseDuration, humanizeMs, formatCountdown } = require('../../lib/timeparse');

module.exports = {
    name: 'timer',
    aliases: ['countdown', 'cronometro'],
    description: "Avvia un countdown che parte subito e si aggiorna fino allo scadere. Uso: .timer <durata> (es. .timer 5 minuti).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply } = context;

        const parsed = parseDuration(textArgs);
        if (!parsed) {
            return reply("⏳ *_Come si usa_*\n\n▸ .timer <durata>\n▸ *Esempi:*\n▸ ✦ .timer 5 minuti\n▸ ✦ .timer 1 ora\n▸ ✦ .timer 90s\n");
        }

        const total = parsed.ms;
        const label = humanizeMs(total);
        const interval = total > 600000 ? 30000 : Math.min(5000, Math.max(1000, total));

        let sent;
        try {
            sent = await sock.sendMessage(from, { text: `⏳ *_Timer avviato_* (_${label}_)\n\n▸ 🔻 Residuo: _${formatCountdown(total)}_\n\n` }, { quoted: msg });
        } catch (_) {
            return reply("❌ Non riesco a inviare il timer.");
        }
        const key = sent?.key || null;
        const started = Date.now();

        const iv = setInterval(() => {
            const remain = total - (Date.now() - started);
            if (remain <= 0) {
                clearInterval(iv);
                const final = `⏰ *_TEMPO SCADUTO!_*\n\n▸ Il timer da _${label}_ è terminato.\n\n`;
                if (key) sock.sendMessage(from, { text: final, edit: key }).catch(() => {});
                else sock.sendMessage(from, { text: final }).catch(() => {});
            } else if (key) {
                sock.sendMessage(from, {
                    text: `⏳ *_Timer avviato_* (_${label}_)\n\n▸ 🔻 Residuo: _${formatCountdown(remain)}_\n\n`,
                    edit: key,
                }).catch(() => {});
            }
        }, interval);
        iv.unref?.();
    },
};