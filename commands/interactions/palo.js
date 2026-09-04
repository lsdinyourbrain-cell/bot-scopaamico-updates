'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const toBold = (s) => '*' + String(s||'').trim() + '*';
const bar = (pct) => '█'.repeat(Math.round(pct/10)) + '░'.repeat(10-Math.round(pct/10)) + ` ${pct}%`;

module.exports = {
    name: 'palo',
    aliases: [],
    description: "Palo ironico con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, sender, targetJid, reply, services } = context;
        const { ARRAYS, randomChoice, randomInt, sendButtons } = services;
        if (!targetJid) return reply(`Tagga chi ti ha dato palo. Esempio: ${toBold('.palo @nome')}`);

        const pct = randomInt(55, 100);
        const b = bar(pct);

        const txt =
`🪵  ${toBold('PALO')}

💔  @${dispOf(sender)}  →  @${dispOf(targetJid)}
${b}  ·  rifiuto ${pct}%

💬  ${randomChoice(ARRAYS.palo)}

 Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [sender, targetJid] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `palo @${dispOf(targetJid)}` },
            { label: '👤 Altra vittima', id: `palo` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${sec('INFO')}\n${boxOpen()}\n${line(`${toBold('ANCORA?')}  ·  🪵 ${toBold('PALO')}`)}\n${line(``)}\n${line(`@${dispOf(sender)} ↔ @${dispOf(targetJid)}`)}\n${line(`${b}`)}\n${line(``)}\n${line('Scegli sotto')}\n${line(' Vex Bot')}\n${boxEnd()}`;
        await sendButtons(sock, from, after, btns, msg, [sender, targetJid], { headerTitle: '🪵 PALO', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
