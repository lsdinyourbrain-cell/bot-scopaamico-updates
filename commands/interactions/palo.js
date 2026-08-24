'use strict';

const toBold = (s) => '*' + String(s||'').trim() + '*';
const bar = (pct) => '█'.repeat(Math.round(pct/10)) + '░'.repeat(10-Math.round(pct/10)) + ` ${pct}%`;

module.exports = {
    name: 'palo',
    aliases: [],
    description: "Palo ironico con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, reply, services } = context;
        const { ARRAYS, randomChoice, randomInt, sendButtons } = services;

        const SEP = '━━━━━━━━━━━━━━━━━━━━';

        if (!targetJid) return reply(`Tagga chi ti ha dato palo. Esempio: ${toBold('.palo @nome')}`);

        const pct = randomInt(55, 100);
        const b = bar(pct);

        const txt =
`🪵  ${toBold('PALO')}
${SEP}
💔  @${sender.split('@')[0]}  →  @${targetJid.split('@')[0]}
${b}  ·  rifiuto ${pct}%
${SEP}
💬  ${randomChoice(ARRAYS.palo)}
${SEP}
◈ Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [sender, targetJid] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `palo @${targetJid.split('@')[0]}` },
            { label: '👤 Altra vittima', id: `palo` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${toBold('ANCORA?')}  ·  🪵 ${toBold('PALO')}
${SEP}
▸ @${sender.split('@')[0]} ↔ @${targetJid.split('@')[0]}
▸ ${b}
${SEP}
Scegli sotto
◈ Vex Bot`;
        await sendButtons(sock, from, after, btns, msg, [sender, targetJid], { headerTitle: '🪵 PALO', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
