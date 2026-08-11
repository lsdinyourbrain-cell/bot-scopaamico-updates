'use strict';

const { parseDuration, humanizeMs, formatCountdown } = require('../../lib/timeparse');

module.exports = {
    name: 'timer',
    aliases: ['countdown', 'cronometro'],
    description: "Avvia un countdown che parte subito e si aggiorna fino allo scadere. Uso: .timer <durata> (es. .timer 5 minuti).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply } = context;

        const parsed = parseDuration(textArgs);
        if (!parsed) {
            return reply("⏳ *Come si usa*\n\n.timer <durata>\n\nEsempi:\n• `.timer 5 minuti`\n• `.timer 1 ora`\n• `.timer 90s`");
        }

        const total = parsed.ms;
        const label = humanizeMs(total);
        const interval = total > 600000 ? 30000 : Math.min(5000, Math.max(1000, total));

        let sent;
        try {
            sent = await sock.sendMessage(from, { text: `⏳ *Timer avviato* (${label})\n\n🔻 Residuo: ${formatCountdown(total)}` }, { quoted: msg });
        } catch (_) {
            return reply("❌ Non riesco a inviare il timer.");
        }
        const key = sent?.key || null;
        const started = Date.now();

        const iv = setInterval(() => {
            const remain = total - (Date.now() - started);
            if (remain <= 0) {
                clearInterval(iv);
                const final = `⏰ *TEMPO SCADUTO!*\n\nIl timer da ${label} è terminato.`;
                if (key) sock.sendMessage(from, { text: final, edit: key }).catch(() => {});
                else sock.sendMessage(from, { text: final }).catch(() => {});
            } else if (key) {
                sock.sendMessage(from, {
                    text: `⏳ *Timer avviato* (${label})\n\n🔻 Residuo: ${formatCountdown(remain)}`,
                    edit: key,
                }).catch(() => {});
            }
        }, interval);
        iv.unref?.();
    },
};