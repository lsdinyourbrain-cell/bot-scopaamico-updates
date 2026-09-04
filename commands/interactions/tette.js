'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const toBold = (s) => '*' + String(s||'').trim() + '*';
const bar = (pct) => {
    const filled = Math.round(pct/10);
    return '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${pct}%`;
};

module.exports = {
    name: 'tette',
    aliases: [],
    description: "Misura ironica con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, reply, services } = context;
        const { ARRAYS, randomChoice, randomInt, sendButtons } = services;
        const DOT = '';

        const target = targetJid || sender;
        const isSelf = target === sender && !targetJid;
        const frase = randomChoice(ARRAYS.tette);
        const pct = randomInt(1, 100);
        const b = bar(pct);

        const title = `🍒  ${toBold('METRO CURVE')}`;
        const txt =
`${title}

👤  @${dispOf(target)}${isSelf ? `  ${toBold('(tu)')}` : ''}
${DOT}
${frase}
${DOT}
📊  ${b}

 Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [target] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `tette @${dispOf(target)}` },
            { label: '👤 Altra vittima', id: `tette` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${sec('INFO')}\n${boxOpen()}\n${line(`${toBold('ANCORA?')}  ·  🍒 ${toBold('TETTE')}`)}\n${line(``)}\n${line(`@${dispOf(target)}  ·  ${b}`)}\n${line(`${DOT}`)}\n${line('Scegli sotto')}\n${line(``)}\n${line(' Vex Bot')}\n${boxEnd()}`;
        await sendButtons(sock, from, after, btns, msg, [target], { headerTitle: '🍒 TETTE', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
