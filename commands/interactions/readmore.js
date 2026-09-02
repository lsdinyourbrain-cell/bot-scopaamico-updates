'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'readmore',
    aliases: ['lengthen', 'espandi', 'nascondi'],
    description: "Crea un testo 'leggi di più' stile WhatsApp usando caratteri invisibili. Uso: .readmore parte1 | parte2",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;

        const input = String(textArgs || '').trim();
        if (!input) {
            return reply(`${sec('READMORE')}\n${boxOpen()}\n${line('Uso: `.readmore parte1 | parte2`')}\n${line('La prima parte appare, la seconda nascosta dietro "leggi di più".')}\n${boxEnd()}`);
        }

        const parts = input.split('|');
        const shown = (parts[0] || '').trim();
        const rest = parts.slice(1).join('|').trim();
        const hidden = '\u200b'.repeat(4000);
        const result = rest ? shown + hidden + rest : shown;
        await reply(result.slice(0, 4000));
    },
};
