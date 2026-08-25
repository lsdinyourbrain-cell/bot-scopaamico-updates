'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ORGIA — Vex Bot
//  Tagga 3 partecipanti a caso del gruppo (o i taggati nel comando) in una
//  scena caotica con valutazioni assurde. Grafica unicode, niente linee ASCII.
// ─────────────────────────────────────────────────────────────────────────────

const { toStyle } = require('../../lib/font');

const T = (s) => toStyle(String(s).toUpperCase(), 'scriptBold');
const SEP = '✦ ✦ ✦';

const SCENE = [
    "la luce si spegne, la musica alza il volume…",
    "qualcuno ha chiuso le tende…",
    "il divano è stato appena sanificato…",
    "il condizionatore è andato a 18° per una ragione precisa…",
];

const ROLES = [
    '🔥 il capobanda', '💋 il/la tentatore/tentatrice', '🥵 quello/ quella che guarda',
    '😈 l\'istigatore/ice', '💦 l\'idraulico/a della situazione', '🕺 il/la performer',
    '🧯 l\'antincendio ufficiale', '🐍 il serpente', '🍒 la ciliegina sulla torta',
];

module.exports = {
    name: 'orgia',
    aliases: ['orgy'],
    description: "Scena di gruppo con membri random del gruppo. Solo per gruppi perversi.",

    async run(sock, msg, args, context) {
        const { from, isGroup, mentioned, reply, services } = context;
        const { getCachedGroupMeta, randomChoice, randomInt } = services;

        if (!isGroup) return reply(`❓ Solo nei gruppi: servono almeno 4 vittime.`);

        const meta = await getCachedGroupMeta(sock, from).catch(() => null);
        const participants = (meta?.participants || [])
            .map(p => p.phoneNumber || p.id || p.jid)
            .filter(Boolean);

        // Bersagli: i taggati nel comando; se mancano, estratti a caso
        let targets = mentioned.filter(Boolean);
        const pool = participants.filter(p => !targets.includes(p));
        while (targets.length < 3 && pool.length) {
            const idx = randomInt(0, pool.length - 1);
            targets.push(pool.splice(idx, 1)[0]);
        }
        targets = [...new Set(targets)].slice(0, 4);
        if (targets.length < 2) return reply(`😅 In questo gruppo non c'è abbastanza gente coraggiosa.`);

        const lines = targets.map((t, i) => `▸ @${String(t).split('@')[0]} — ${randomChoice(ROLES)}`);
        const valutazione = randomInt(60, 100);
        const bar = '█'.repeat(Math.round(valutazione / 10)) + '░'.repeat(10 - Math.round(valutazione / 10));

        await sock.sendMessage(from, {
            text: `${T('Orgia')} 🔥\n${SEP}\n_${randomChoice(SCENE)}_\n\n${lines.join('\n')}\n\n${SEP}\n📊 Caosometro\n${bar} *${valutazione}%*\n🔒 _La porta è stata chiusa a chiave._\n\n◈ _Vex Bot_`,
            mentions: targets,
        });
    },
};
