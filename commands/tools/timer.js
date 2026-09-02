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
            return reply(`${sec('TIMER')}\n${boxOpen()}\n${line('.timer <durata>')}\n${line('Esempi:')}\n${line('✦ .timer 5 minuti')}\n${line('✦ .timer 1 ora')}\n${line('✦ .timer 90s')}\n${boxEnd()}`);
        }

        const total = parsed.ms;
        const label = humanizeMs(total);
        const interval = total > 600000 ? 30000 : Math.min(5000, Math.max(1000, total));

        let sent;
        try {
            sent = await sock.sendMessage(from, { text: `${sec('TIMER AVVIATO')}\n${boxOpen()}\n${line(`_${label}_`)}\n${line(`🔻 Residuo: _${formatCountdown(total)}_` )}\n${boxEnd()}` }, { quoted: msg });
        } catch (_) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('❌ Non riesco a inviare il timer.')}\n${boxEnd()}`);
        }
        const key = sent?.key || null;
        const started = Date.now();

        const iv = setInterval(() => {
            const remain = total - (Date.now() - started);
            if (remain <= 0) {
                clearInterval(iv);
                const final = `${sec('TEMPO SCADUTO')}\n${boxOpen()}\n${line(`Il timer da _${label}_ è terminato.`)}\n${boxEnd()}`;
                if (key) sock.sendMessage(from, { text: final, edit: key }).catch(() => {});
                else sock.sendMessage(from, { text: final }).catch(() => {});
            } else if (key) {
                sock.sendMessage(from, {
                    text: `${sec('TIMER AVVIATO')}\n${boxOpen()}\n${line(`_${label}_`)}\n${line(`🔻 Residuo: _${formatCountdown(remain)}_` )}\n${boxEnd()}`,
                    edit: key,
                }).catch(() => {});
            }
        }, interval);
        iv.unref?.();
    },
};
