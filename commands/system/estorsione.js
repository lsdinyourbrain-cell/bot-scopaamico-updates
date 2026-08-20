'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot (solo OWNER)
//  L'owner imposta il link nella chat privata del bot: `.estorsione set <link>`.
//  Nei gruppi: `.estorsione <n>` spamma il link n volte (max 200) come
//  messaggi BUSINESS (scritta "WhatsApp Business" sopra la bolla, NON
//  cancellabili dagli admin: restano in chat anche se il bot esce dal gruppo)
//  con hide tag a tutti e NON invia alcun messaggio finale. In più il watchdog
//  di lib/estorsione rimanda il link se qualcuno lo elimina (sessione 15 min).
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';
const estorsione = require('../../lib/estorsione');

const MAX_SPAM = 200;
const SPAM_DELAY = 2500; // ms tra un messaggio e l'altro (il server strozza i burst rapidi con rate-overlimit)

module.exports = {
    name: 'estorsione',
    aliases: [],
    hidden: true,
    description: "Spamma il link impostato n volte con hide tag a tutti (solo owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, reply, services } = context;
        const { db, saveDB } = services;

        if (!isOwner) {
            return reply(
`⛔ *_ACCESSO NEGATO_*
${SEP}
▸ Solo l'*OWNER* può usare
  *.estorsione*.
${SEP}
◈ _Vex Bot_`);
        }

        const sub = String(args[0] || '').toLowerCase();
        const stored = db._estorsione;

        // ── SET DEL LINK (chat privata del bot) ───────────────────────────
        if (sub === 'set') {
            if (isGroup) {
                return reply(
`⚠️ *_USO_*
${SEP}
▸ Il link si imposta nella
  *chat privata* del bot:
  \`.estorsione set <link>\`
${SEP}
◈ _Vex Bot_`);
            }
            const link = String(textArgs || '').replace(/^set\s+/i, '').trim();
            if (!link || !/^https?:\/\/\S+$/i.test(link)) {
                return reply(
`⚠️ *_USO_*
${SEP}
▸ \`.estorsione set <link>\`
  (in chat privata del bot)
${SEP}
◈ _Vex Bot_`);
            }
            db._estorsione = { link };
            saveDB();
            return reply(
`✅ *_LINK IMPOSTATO_*
${SEP}
▸ ${link}
${SEP}
▸ Ora nei gruppi:
  \`.estorsione <n>\`
${SEP}
◈ _Vex Bot_`);
        }

        // ── CHAT PRIVATA (senza subcomando) ───────────────────────────────
        if (!isGroup) {
            const cur = stored?.link;
            return reply(
`💣 *_ESTORSIONE_*
${SEP}
${cur ? `▸ Link attuale:\n▸ ${cur}` : '▸ Nessun link impostato.'}
${SEP}
▸ Imposta: \`.estorsione set <link>\`
▸ Nei gruppi: \`.estorsione <n>\`
${SEP}
◈ _Vex Bot_`);
        }

        // ── SPAM NEL GRUPPO ───────────────────────────────────────────────
        const link = stored?.link;
        if (!link) {
            return reply(
`⚠️ *_USO_*
${SEP}
▸ Nessun link impostato.
▸ L'owner deve fare:
  \`.estorsione set <link>\`
  nella chat privata del bot.
${SEP}
◈ _Vex Bot_`);
        }

        let times = parseInt(String(textArgs || '').trim(), 10);
        if (!Number.isInteger(times) || times < 1) times = 10;
        times = Math.min(times, MAX_SPAM);

        // Arma il watchdog anti-cancellazione: se gli admin eliminano i
        // messaggi, il bot li rimanda subito (la sessione scade da sola).
        estorsione.startSession(from, link);

        try {
            for (let i = 0; i < times; i++) {
                await estorsione.sendLink(sock, from, link);
                if (i < times - 1) await new Promise(r => setTimeout(r, SPAM_DELAY));
            }

            // Nessun messaggio finale: il comando invia SOLO il link.
            return;
        } catch (e) {
            console.error('[estorsione]', e.message);
            return reply(
`⚠️ *_ERRORE_*
${SEP}
▸ ${e.message}
${SEP}
◈ _Vex Bot_`);
        }
    },
};