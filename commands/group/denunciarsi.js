'use strict';

const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const config = require('../../config');

const URL_RE = /https?:\/\/[^\s]+/i;
const WA_INVITE_RE = /(?:https?:\/\/)?chat\.whatsapp\.com\/[A-Za-z0-9]+/i;
const DEFAULT_SPAM = 100;
const MAX_SPAM = 100;

const getSavedLink = (db) => {
    return db?._config?.denunciarsiLink
        || db?._config?.heheheLink
        || db?._config?.sponsorLink
        || config.SPONSOR_LINK
        || '';
};

module.exports = {
    name: 'denunciarsi',
    aliases: [],
    description: 'Spam messaggio non eliminabile con link personalizzabile (owner only, solo gruppi). Default 100 invii.',

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, textArgs, reply, services } = context;
        const { db, saveDB, getCachedGroupMeta } = services || {};

        if (!isGroup) {
            return reply(`${sec('DENUNCIARSI')}\n${boxOpen()}\n${line('Funziona solo nei gruppi.')}\n${boxEnd()}`);
        }
        if (!isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}\n${boxOpen()}\n${line('Comando riservato')}\n${line("all'Owner del bot.")}\n${boxEnd()}`);
        }

        let raw = (textArgs || '').trim();

        // ── Sub-comandi gestione link (niente spam) ───────────────────
        if (/^set\s+/i.test(raw)) {
            const linkPart = raw.replace(/^set\s+/i, '').trim();
            const m = linkPart.match(URL_RE) || linkPart.match(WA_INVITE_RE);
            if (!m) {
                return reply(`${sec('DENUNCIARSI — SET LINK')}\n${boxOpen()}\n${line('Uso: .denunciarsi set <link>')}\n${boxEnd()}`);
            }
            let newLink = m[0];
            if (!/^https?:\/\//i.test(newLink)) newLink = 'https://' + newLink;
            if (!db._config) db._config = {};
            db._config.denunciarsiLink = newLink;
            try { saveDB && saveDB(); } catch (_) {}
            return reply(`${sec('DENUNCIARSI — LINK SALVATO')}\n${boxOpen()}\n${line('Nuovo link:')}\n${line(newLink)}\n${boxEnd()}\n▸ Ora basta fare .denunciarsi`);
        }
        if (/^link$/i.test(raw)) {
            const cur = getSavedLink(db);
            return reply(`${sec('DENUNCIARSI — LINK')}\n${boxOpen()}\n${line(cur || 'nessuno')}\n${boxEnd()}\n▸ .denunciarsi set <link> per cambiarlo`);
        }

        // ── Numero di volte: primo token numerico, altrimenti 100 ─────
        let times = DEFAULT_SPAM;
        const firstTok = (args && args[0]) ? String(args[0]).trim() : '';
        if (/^\d+$/.test(firstTok)) {
            times = parseInt(firstTok, 10);
            if (!Number.isFinite(times) || times < 1) times = DEFAULT_SPAM;
            if (times > MAX_SPAM) times = MAX_SPAM;
            // togli il numero dal testo/link
            raw = raw.replace(/^\d+\s*/, '').trim();
        }

        // ── Link + testo personalizzabili ─────────────────────────────
        let link = getSavedLink(db);
        let customText = raw;

        const urlMatch = raw.match(URL_RE);
        const inviteMatch = raw.match(WA_INVITE_RE);
        const found = urlMatch ? urlMatch[0] : (inviteMatch ? inviteMatch[0] : null);
        if (found) {
            link = /^https?:\/\//i.test(found) ? found : 'https://' + found;
            customText = raw.replace(found, '').trim();
            try {
                if (!db._config) db._config = {};
                db._config.denunciarsiLink = link;
                saveDB && saveDB();
            } catch (_) {}
        }

        if (!link) {
            return reply(`${sec('DENUNCIARSI')}\n${boxOpen()}\n${line('Nessun link salvato.')}\n${line('Uso: .denunciarsi [volte] <link> [testo]')}\n${boxEnd()}`);
        }

        let finalText;
        if (customText) {
            finalText = customText.includes(link)
                ? customText
                : `${customText}\n${link}`;
        } else {
            finalText = `CI SPOSTIAMO\nENTRATE TUTTI QUI:\n${link}\nENTRATE TUTTI`;
        }

        // ── Partecipanti da menzionare ────────────────────────────────
        let allJids = [];
        try {
            const meta = getCachedGroupMeta
                ? await getCachedGroupMeta(sock, from)
                : await sock.groupMetadata(from);
            const parts = Array.isArray(meta?.participants) ? meta.participants : [];
            allJids = parts.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
        } catch (e) {
            console.error('[denunciarsi] groupMetadata:', e.message);
            return reply(`${sec('DENUNCIARSI')}\n${boxOpen()}\n${line('Non riesco a leggere')}\n${line('i partecipanti.')}\n${boxEnd()}`);
        }
        if (!allJids.length) {
            return reply(`${sec('DENUNCIARSI')}\n${boxOpen()}\n${line('Gruppo senza partecipanti?')}\n${boxEnd()}`);
        }

        // ── Spam messaggio non eliminabile ────────────────────────────
        const content = {
            requestPaymentMessage: {
                currencyCodeIso4217: 'EUR',
                amount1000: 53550,
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: {
                        text: finalText,
                        contextInfo: { mentionedJid: allJids },
                    },
                },
                expiryTimestamp: Math.floor(Date.now() / 1000) + 86400,
            },
        };

        let sent = 0;
        for (let i = 0; i < times; i++) {
            try {
                try {
                    const waMsg = generateWAMessageFromContent(from, content, { userJid: sock.user?.id });
                    await sock.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
                } catch (_) {
                    await sock.relayMessage(from, content, {});
                }
                sent++;
            } catch (e) {
                console.error('[denunciarsi] invio', i, e.message || e);
                break;
            }
        }

        // niente reply di conferma per non sporcare dopo lo spam
        return;
    },
};
