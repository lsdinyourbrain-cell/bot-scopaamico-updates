'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const toBold = (s) => '*' + String(s||'').trim() + '*';
module.exports = {
    name: 'incinta',
    aliases: [],
    description: "Test ironico con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, targetJid, reply, services } = context;
        const { randomInt, sendButtons } = services;
        const DOT = '';

        if (!targetJid) return reply(`Tagga una persona o rispondi a un suo messaggio. Esempio: ${toBold('.incinta @nome')}`);

        const percent = randomInt(1, 100);
        const filled = Math.round(percent/10);
        const b = '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${percent}%`;

        const level = percent < 30 ? 'Basso' : percent < 70 ? 'Medio' : 'Alto';
        const txt =
`🍼  ${toBold('TEST FANTASIA')}

👤  @${targetJid.split('@')[0]}
📊  ${toBold(percent + '%')}  ·  ${level}
${DOT}
${b}
${DOT}
Solo un gioco.

 Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [targetJid] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `incinta @${targetJid.split('@')[0]}` },
            { label: '👤 Altra vittima', id: `incinta` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${sec('INFO')}\n${boxOpen()}\n${line(`${toBold('ANCORA?')}  ·  🍼 ${toBold('INCINTA')}`)}\n${line(``)}\n${line(`@${targetJid.split('@')[0]}  ·  ${b}`)}\n${line(`${DOT}`)}\n${line('Scegli sotto')}\n${line(``)}\n${line(' Vex Bot')}\n${boxEnd()}`;
        await sendButtons(sock, from, after, btns, msg, [targetJid], { headerTitle: '🍼 INCINTA', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
