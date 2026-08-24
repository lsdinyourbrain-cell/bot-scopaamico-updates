'use strict';

const toBold = (s) => '*' + String(s||'').trim() + '*';
module.exports = {
    name: 'cazzo',
    aliases: [],
    description: "Misura ironica con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, services } = context;
        const { ARRAYS, randomChoice, sendButtons } = services;

        const SEP = '━━━━━━━━━━━━━━━━━━━━';
        const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';

        const target = targetJid || sender;
        const valore = Math.floor(Math.random() * 30) + 1;
        const pct = Math.round((valore/30)*100);
        const filled = Math.round(pct/10);
        const b = '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${pct}%`;
        const tipo = valore < 5 ? 'Microscopico' : valore < 15 ? 'Sotto media' : valore < 25 ? 'Media' : 'Illegale 🚨';

        const txt =
`🍆  ${toBold('MISURAZIONE')}
${SEP}
👤  @${target.split('@')[0]}
📏  ${toBold(valore + ' cm')}  ·  ${tipo}
${DOT}
${b}
${DOT}
💬  ${randomChoice(ARRAYS.cazzo)}
${SEP}
◈ Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [target] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `cazzo @${target.split('@')[0]}` },
            { label: '👤 Altra vittima', id: `cazzo` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${toBold('ANCORA?')}  ·  🍆 ${toBold('CAZZO')}
${SEP}
▸ @${target.split('@')[0]}  ·  ${valore}cm  ·  ${b}
${DOT}
Scegli sotto
${SEP}
◈ Vex Bot`;
        await sendButtons(sock, from, after, btns, msg, [target], { headerTitle: '🍆 CAZZO', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
