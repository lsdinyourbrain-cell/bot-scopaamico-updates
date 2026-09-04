'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const { parseDuration, humanizeMs } = require('../../lib/timeparse');

module.exports = {
    name: 'promemoria',
    aliases: ['reminder', 'ricordami'],
    description: "Imposta un promemoria. Uso: .promemoria <testo> in <tempo> (es. .promemoria in 10 minuti, .promemoria tra 2 ore, .promemoria 30s).",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, reply, services } = context;

        const parsed = parseDuration(textArgs);
        if (!parsed) {
            return reply(`${sec('COME SI USA')}\n${boxOpen()}\n${line('.promemoria <testo> in <tempo>')}\n${line('*Esempi:*')}\n${line(' .promemoria compra il latte in 10 minuti')}\n${line(' .promemoria pausa caffè tra 2 ore')}\n${line(' .promemoria 30s')}\n${boxEnd()}`);
        }

        const clean = String(textArgs)
            .replace(parsed.match, '')
            .replace(/\b(?:in|tra|fra|entro|dopo|per)\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
        const reminderText = clean || '…ti avevo chiesto di ricordarti qualcosa!';

        await reply(`${sec('PROMEMORIA IMPOSTATO')}\n${boxOpen()}\n${line(`${sec('PROMEMORIA IMPOSTATO')}\n${boxOpen()}\n${line(`⏰ *_Promemoria impostato!_*\n\n▸ 📝 _${reminderText.slice(0, 300)}_\n▸ ⏳ Tra _${humanizeMs(parsed.ms)}_\n▸ Ti avviserò quando sarà\n  il momento.\n\n`)}\n${boxEnd()}`)}\n${boxEnd()}`);

        setTimeout(() => {
            const text = `${sec('PROMEMORIA')}\n${boxOpen()}\n${line(`${sec('PROMEMORIA')}\n${boxOpen()}\n${line(`⏰ *_PROMEMORIA_* @${dispOf(sender)}\n\n▸ 📝 _${reminderText}_\n\n`)}\n${boxEnd()}`)}\n${boxEnd()}`;
            sock.sendMessage(from, { text, mentions: [sender] }).catch(() => {});
        }, parsed.ms);
    },
};