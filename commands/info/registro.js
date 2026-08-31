'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// 
//  REGISTRO — Vex Bot
//  .registro → mostra le ultime modifiche del gruppo (entrate, uscite,
//  promote/demote, avvisi, nome, descrizione, impostazioni...).
//  .registro <numero> → mostra le ultime N modifiche (max 50).
// 

const TIPO_EMOJI = {
    add: '➕', remove: '➖', promote: '📈', demote: '📉',
    warn: '⚠️', kick: '🚨', mute: '🔇', unmute: '🔊',
    ban: '🚫', settings: '⚙️', evento: '⚡', other: '📝',
};

const fmtTime = (ts) => {
    try {
        return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return ''; }
};

module.exports = {
    name: 'registro',
    aliases: ['loggruppo', 'storico', 'registrimodifiche'],
    description: "Mostra il registro delle modifiche del gruppo: entrate, uscite, admin, avvisi, nome e impostazioni.",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, reply, services } = context;
        const { db, dispOf } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('funziona solo nei gruppi.')}
${boxEnd()}`);

        const log = db._grouplog?.[from];
        if (!Array.isArray(log) || !log.length) {
            return reply(
`📜 *REGISTRO MODIFICHE*
▸ Nessuna modifica registrata
  per questo gruppo... ancora.
▸ Entrate, uscite, admin, avvisi,
  nome e impostazioni verranno
  annotati qui.
`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 50) : 12;

        const recent = log.slice(-limit).reverse();
        const lines = recent.map(e => {
            const emoji = TIPO_EMOJI[e.tipo] || TIPO_EMOJI.other;
            const chi = e.target ? `@${dispOf(e.target, e.attoreAlt || null)}` : '';
            const attore = e.attore && !e.target ? `@${dispOf(e.attore, e.attoreAlt || null)}` : '';
            return `${fmtTime(e.ts)} ${emoji} ${chi || attore || '—'} ${e.dettaglio ? '· ' + e.dettaglio : ''}`.slice(0, 60);
        }).join('\n');

        const mentionJids = [];
        for (const e of recent) {
            if (e.target && e.target.endsWith('@lid')) mentionJids.push(e.target);
            if (e.attore && !e.target && e.attore.endsWith('@lid')) mentionJids.push(e.attore);
            if (mentionJids.length >= 12) break;
        }

        const txt =
`📜 *REGISTRO MODIFICHE*
${lines}
▸ Ultime ${Math.min(limit, log.length)} di ${log.length}
▸ Di più: \`.registro 50\`
`;

        return sock.sendMessage(from, { text: txt, mentions: mentionJids }, { quoted: msg })
            .catch(() => reply(txt));
    },
};