'use strict';

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

        const SEP = '━━━━━━━━━━━━━━━━━━━━';
        const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';

        const target = targetJid || sender;
        const isSelf = target === sender && !targetJid;
        const frase = randomChoice(ARRAYS.tette);
        const pct = randomInt(1, 100);
        const b = bar(pct);

        const title = `🍒  ${toBold('METRO CURVE')}`;
        const txt =
`${title}
${SEP}
👤  @${target.split('@')[0]}${isSelf ? `  ${toBold('(tu)')}` : ''}
${DOT}
${frase}
${DOT}
📊  ${b}
${SEP}
◈ Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [target] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `tette @${target.split('@')[0]}` },
            { label: '👤 Altra vittima', id: `tette` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${toBold('ANCORA?')}  ·  🍒 ${toBold('TETTE')}
${SEP}
▸ @${target.split('@')[0]}  ·  ${b}
${DOT}
Scegli sotto
${SEP}
◈ Vex Bot`;
        await sendButtons(sock, from, after, btns, msg, [target], { headerTitle: '🍒 TETTE', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
