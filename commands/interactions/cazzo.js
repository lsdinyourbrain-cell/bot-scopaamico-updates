'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const toBold = (s) => '*' + String(s||'').trim() + '*';
module.exports = {
    name: 'cazzo',
    aliases: [],
    description: "Misura ironica con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, services } = context;
        const { ARRAYS, randomChoice, sendButtons } = services;
        const DOT = '';

        const target = targetJid || sender;
        const valore = Math.floor(Math.random() * 30) + 1;
        const pct = Math.round((valore/30)*100);
        const filled = Math.round(pct/10);
        const b = '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${pct}%`;
        const tipo = valore < 5 ? 'Microscopico' : valore < 15 ? 'Sotto media' : valore < 25 ? 'Media' : 'Illegale 🚨';

        const txt =
`🍆  ${toBold('MISURAZIONE')}

👤  @${dispOf(target)}
📏  ${toBold(valore + ' cm')}  ·  ${tipo}
${DOT}
${b}
${DOT}
💬  ${randomChoice(ARRAYS.cazzo)}

 Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [target] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `cazzo @${dispOf(target)}` },
            { label: '👤 Altra vittima', id: `cazzo` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${sec('INFO')}\n${boxOpen()}\n${line(`${toBold('ANCORA?')}  ·  🍆 ${toBold('CAZZO')}`)}\n${line(``)}\n${line(`@${dispOf(target)}  ·  ${valore}cm  ·  ${b}`)}\n${line(`${DOT}`)}\n${line('Scegli sotto')}\n${line(``)}\n${line(' Vex Bot')}\n${boxEnd()}`;
        await sendButtons(sock, from, after, btns, msg, [target], { headerTitle: '🍆 CAZZO', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
