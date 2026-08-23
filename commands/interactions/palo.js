'use strict';

const BOLD_UP = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭';
const BOLD_LO = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';
const BOLD_DI = '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
const toBold = (s) => String(s||'').split('').map(ch=>{
    const c=ch.charCodeAt(0);
    if(c>=65&&c<=90) return BOLD_UP[c-65]||ch;
    if(c>=97&&c<=122) return BOLD_LO[c-97]||ch;
    if(c>=48&&c<=57) return BOLD_DI[c-48]||ch;
    return ch;
});
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
