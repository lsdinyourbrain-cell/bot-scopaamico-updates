'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { parseDuration, humanizeMs } = require('../../lib/timeparse');

module.exports = {
    name: 'promemoria',
    aliases: ['reminder', 'ricordami'],
    description: "Imposta un promemoria. Uso: .promemoria <testo> in <tempo> (es. .promemoria in 10 minuti, .promemoria tra 2 ore, .promemoria 30s).",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, reply, services } = context;

        const parsed = parseDuration(textArgs);
        if (!parsed) {
            return reply("⏰ *_Come si usa_*\n━━━━━━━━━━━━━━━━━━\n▸ .promemoria <testo> in <tempo>\n▸ *Esempi:*\n▸ ✦ .promemoria compra il latte in 10 minuti\n▸ ✦ .promemoria pausa caffè tra 2 ore\n▸ ✦ .promemoria 30s\n━━━━━━━━━━━━━━━━━━");
        }

        const clean = String(textArgs)
            .replace(parsed.match, '')
            .replace(/\b(?:in|tra|fra|entro|dopo|per)\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
        const reminderText = clean || '…ti avevo chiesto di ricordarti qualcosa!';

        await reply(`⏰ *_Promemoria impostato!_*\n━━━━━━━━━━━━━━━━━━\n▸ 📝 _${reminderText.slice(0, 300)}_\n▸ ⏳ Tra _${humanizeMs(parsed.ms)}_\n▸ Ti avviserò quando sarà\n  il momento.\n━━━━━━━━━━━━━━━━━━\n`);

        setTimeout(() => {
            const text = `⏰ *_PROMEMORIA_* @${sender.split('@')[0]}\n━━━━━━━━━━━━━━━━━━\n▸ 📝 _${reminderText}_\n━━━━━━━━━━━━━━━━━━\n`;
            sock.sendMessage(from, { text, mentions: [sender] }).catch(() => {});
        }, parsed.ms);
    },
};