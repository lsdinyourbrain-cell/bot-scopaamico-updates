'use strict';

const { parseDuration, humanizeMs } = require('../../lib/timeparse');

module.exports = {
    name: 'promemoria',
    aliases: ['reminder', 'ricordami'],
    description: "Imposta un promemoria. Uso: .promemoria <testo> in <tempo> (es. .promemoria in 10 minuti, .promemoria tra 2 ore, .promemoria 30s).",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, reply, services } = context;

        const parsed = parseDuration(textArgs);
        if (!parsed) {
            return reply("⏰ *Come si usa*\n\n.promemoria <testo> in <tempo>\n\nEsempi:\n• `.promemoria compra il latte in 10 minuti`\n• `.promemoria pausa caffè tra 2 ore`\n• `.promemoria 30s`");
        }

        const clean = String(textArgs)
            .replace(parsed.match, '')
            .replace(/\b(?:in|tra|fra|entro|dopo|per)\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
        const reminderText = clean || '…ti avevo chiesto di ricordarti qualcosa!';

        await reply(`⏰ *Promemoria impostato!*\n\n📝 ${reminderText.slice(0, 300)}\n⏳ Tra *${humanizeMs(parsed.ms)}*\n\nTi avviserò quando sarà il momento.`);

        setTimeout(() => {
            const text = `⏰ *PROMEMORIA* @${sender.split('@')[0]}\n\n📝 ${reminderText}`;
            sock.sendMessage(from, { text, mentions: [sender] }).catch(() => {});
        }, parsed.ms);
    },
};