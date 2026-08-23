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
