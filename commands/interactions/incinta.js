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
    name: 'incinta',
    aliases: [],
    description: "Test ironico con grafica curata.",

    async run(sock, msg, args, context) {
        const { from, targetJid, reply, services } = context;
        const { randomInt, sendButtons } = services;

        const SEP = '━━━━━━━━━━━━━━━━━━━━';
        const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';

        if (!targetJid) return reply(`Tagga una persona o rispondi a un suo messaggio. Esempio: ${toBold('.incinta @nome')}`);

        const percent = randomInt(1, 100);
        const filled = Math.round(percent/10);
        const b = '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${percent}%`;

        const level = percent < 30 ? 'Basso' : percent < 70 ? 'Medio' : 'Alto';
        const txt =
`🍼  ${toBold('TEST FANTASIA')}
${SEP}
👤  @${targetJid.split('@')[0]}
📊  ${toBold(percent + '%')}  ·  ${level}
${DOT}
${b}
${DOT}
Solo un gioco.
${SEP}
◈ Vex Bot`;

        await sock.sendMessage(from, { text: txt, mentions: [targetJid] }, { quoted: msg });

        const btns = [
            { label: '🔄 Ancora', id: `incinta @${targetJid.split('@')[0]}` },
            { label: '👤 Altra vittima', id: `incinta` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const after =
`${toBold('ANCORA?')}  ·  🍼 ${toBold('INCINTA')}
${SEP}
▸ @${targetJid.split('@')[0]}  ·  ${b}
${DOT}
Scegli sotto
${SEP}
◈ Vex Bot`;
        await sendButtons(sock, from, after, btns, msg, [targetJid], { headerTitle: '🍼 INCINTA', footerText: '⬇️ Ancora o nuova vittima' });
    },
};
