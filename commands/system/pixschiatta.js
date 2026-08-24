'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  PIXSCHIATTA — Vex Bot (solo OWNER)
//  Usa i link impostati con `.giudizio set link1/link2/link3`.
//  `.pixschiatta <n>`   → spamma n link (max 500) con hide tag a tutti,
//                         ruotando i link impostati, alla massima velocità
//                         sicura. Ogni messaggio è stile "WhatsApp Business".
//  `.pixschiatta stop`  → ferma spam e watchdog.
//  ANTI-CANCELLAZIONE: mentre la sessione è attiva (15 min, prolungata a
//  ogni reinvio), se un admin cancella un messaggio il bot lo rimanda
//  SUBITO. Solo l'owner può cancellare davvero (nessun reinvio).
// ─────────────────────────────────────────────────────────────────────────────

const estorsione = require('../../lib/estorsione');

const MAX_SPAM = 500;
const DEFAULT_SPAM = 500;
const SEND_DELAY = 150;        // ms tra un invio e l'altro (ultra veloce)
const ERROR_BACKOFF = 2000;    // ms di pausa se il server strozza
const MAX_CONSECUTIVE_ERRORS = 25;

// Gruppi con spam in corso: groupJid -> true
const spamActive = new Map();

module.exports = {
    name: 'pixschiatta',
    aliases: [],
    hidden: true,
    description: "Spamma fino a 500 link con hide tag, ultra veloce, anti-cancellazione (solo owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, reply, services } = context;
        const { db, ownerNumber } = services;

        if (!isOwner) {
            return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━\n▸ Comando riservato\n  all'Owner del bot.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_");
        }

        const sub = String(args[0] || '').toLowerCase();

        // ── STOP ──────────────────────────────────────────────────────────
        if (sub === 'stop') {
            const was = spamActive.get(from);
            spamActive.delete(from);
            estorsione.stopSession(from);
            return reply(was
                ? "🛑 *SPAM FERMATO*\n━━━━━━━━━━━━━━\n▸ Spam e watchdog\n  interrotti.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_"
                : "▸ Nessuno spam attivo qui.");
        }

        // ── CHAT PRIVATA ──────────────────────────────────────────────────
        if (!isGroup) {
            const cfg = db._giudizio || {};
            const set = [1, 2, 3].map(n => cfg['link' + n]).filter(Boolean);
            return reply(`💥 *PIXSCHIATTA*\n━━━━━━━━━━━━━━\n${set.length ? `▸ Link pronti: *${set.length}*\n▸ ${set.join('\n▸ ')}` : '▸ Nessun link impostato.'}\n━━━━━━━━━━━━━━\n▸ Imposta: \`.giudizio set link1/2/3 <url>\`\n▸ Nei gruppi: \`.pixschiatta <n>\`\n▸ Ferma: \`.pixschiatta stop\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }

        if (spamActive.has(from)) {
            return reply("⏳ Spam già in corso qui.\nFerma prima con `.pixschiatta stop`");
        }

        // ── LINKS DA ROTARE ───────────────────────────────────────────────
        const cfg = db._giudizio || {};
        const links = [cfg.link1, cfg.link2, cfg.link3].filter(l => typeof l === 'string' && /^https?:\/\//i.test(l));
        if (!links.length) {
            return reply("⚠️ *NESSUN LINK*\n━━━━━━━━━━━━━━\n▸ Prima imposta i link:\n▸ `.giudizio set link1 <url>`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_");
        }

        let times = parseInt(String(textArgs || '').trim(), 10);
        if (!Number.isInteger(times) || times < 1) times = DEFAULT_SPAM;
        times = Math.min(times, MAX_SPAM);

        try {
            // Partecipanti letti UNA volta sola: serve per l'hide tag.
            const meta = await sock.groupMetadata(from);
            const allJids = (Array.isArray(meta?.participants) ? meta.participants : [])
                .map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);

            // Watchdog anti-cancellazione: gli admin che cancellano fanno
            // rigirare il link all'istante; l'owner può cancellare davvero.
            const ownerJids = [ownerNumber, ...(db._owners || []).flatMap(o => [o.number, o.lid])]
                .filter(Boolean);
            estorsione.startSession(from, links, { mode: 'pix', ownerJids });

            spamActive.set(from, true);
            let consecutiveErrors = 0;

            for (let i = 0; i < times; i++) {
                if (!spamActive.get(from)) break; // fermato con .pixschiatta stop
                const link = links[i % links.length];
                try {
                    await estorsione.sendBareLink(sock, from, link, allJids);
                    consecutiveErrors = 0;
                } catch (e) {
                    consecutiveErrors++;
                    console.error('[pixschiatta] errore invio:', e.message);
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;
                    await new Promise(r => setTimeout(r, ERROR_BACKOFF));
                    continue;
                }
                await new Promise(r => setTimeout(r, SEND_DELAY));
            }

            spamActive.delete(from);
            // La sessione watchdog resta attiva (15 min): le cancellazioni
            // degli admin continuano a essere annullate dai reinvii.
            return;
        } catch (e) {
            spamActive.delete(from);
            console.error('[pixschiatta]', e.message);
            return reply(`⚠️ *_ERRORE_*\n━━━━━━━━━━━━━━\n▸ ${e.message}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }
    },
};
