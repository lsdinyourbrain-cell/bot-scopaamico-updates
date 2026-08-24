'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot
//  Il link viene inviato come messaggio INTERACTIVE (native flow) con il nodo
//  binario <biz>: è l'UNICO percorso in cui WhatsApp accetta il nodo biz su
//  invio (verificato: WhatsApp Web non mette MAI <biz> su un testo semplice —
//  il server lo rifiuta con rate-overlimit; lo mette solo sui messaggi
//  interactive, ed è lo stesso percorso dei pulsanti del bot, che funziona).
//  In più, se la sessione è attiva e qualcuno elimina un messaggio nel
//  gruppo, il bot lo RIMANDA subito (watchdog).
// ─────────────────────────────────────────────────────────────────────────────

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const SESSION_TTL = 15 * 60 * 1000; // 15 minuti
const RESEND_DELAY = 600; // ms minimi tra una rimessa e l'altra (quasi istantaneo per sembrare non cancellabile)

const sessions = new Map(); // groupJid -> { links[], idx, mode, ownerJids:Set, until, lastResend }

// Avvia una sessione watchdog. links può essere una stringa (retro-compat,
// stile .estorsione) o un array di link (stile .pixschiatta, vengono ruotati).
// opts.mode: 'estorsione' (messaggio con brand) | 'pix' (solo link nudo).
// opts.ownerJids: JID che possono cancellare DAVVERO (nessun reinvio).
const startSession = (jid, links, opts = {}) => {
    const arr = Array.isArray(links) ? links.filter(Boolean) : [links].filter(Boolean);
    sessions.set(jid, {
        links: arr,
        idx: 0,
        mode: opts.mode === 'pix' ? 'pix' : 'estorsione',
        ownerJids: new Set((opts.ownerJids || []).filter(Boolean).map(String)),
        until: Date.now() + SESSION_TTL,
        lastResend: 0,
    });
};

// Ferma del tutto la sessione watchdog di un gruppo.
const stopSession = (jid) => sessions.delete(jid);

// Prossimo link della rotazione (se ne è impostato uno solo restituisce quello).
const nextLink = (s) => s.links[s.links.length ? (s.idx++ % s.links.length) : 0];

// True se il messaggio è stato cancellato da un JID "consentito" (owner):
// in quel caso il watchdog NON deve rimandarlo.
const isOwnerDeleter = (jid, actor) => {
    const s = sessions.get(jid);
    return Boolean(s && actor && s.ownerJids.has(String(actor)));
};

const isActive = (jid) => {
    const s = sessions.get(jid);
    if (!s) return false;
    if (Date.now() > s.until) {
        sessions.delete(jid);
        return false;
    }
    return true;
};

// Un messaggio "revoke" è la cancellazione di un messaggio (delete for
// everyone): arriva come protocolMessage con type REVOKE e la key del
// messaggio eliminato dentro `key`. Per compatibilità controlla anche
// update con stubType/status (alcuni client inviano l'update senza message).
const isRevokeMessage = (message) => {
    try {
        if (message?.protocolMessage?.type === proto.Message.ProtocolMessage.Type.REVOKE) return true;
        // Baileys a volte espone revoke come messageStubType 44 o status
        if (message?.messageStubType === 44) return true;
        return false;
    } catch (_) { return false; }
};
const isRevokeUpdate = (u) => {
    try {
        if (!u) return false;
        if (isRevokeMessage(u.message)) return true;
        if (u.update?.message === null) return true; // messaggio cancellato
        if (u.messageStubType === 44) return true;
        if (String(u.update?.status || '').toLowerCase() === 'deleted') return true;
        return false;
    } catch (_) { return false; }
};

// Nodo binario <biz> per messaggi interactive native flow: identico a quello
// dei pulsanti del bot (l'unica forma che il server accetta all'invio).
const PRIVACY_MODE_TS_OFFSET = 77980457;
const getPrivacyModeTs = () => (Math.floor(Date.now() / 1000) - PRIVACY_MODE_TS_OFFSET).toString();

const buildBizNode = () => ({
    tag: 'biz',
    attrs: { actual_actors: '2', host_storage: '2', privacy_mode_ts: getPrivacyModeTs() },
    content: [
        {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
        },
        { tag: 'quality_control', attrs: { source_type: 'third_party' } },
    ],
});

// Invia UN messaggio del link: usa ExtendedText con externalAdReply per
// massima compatibilità (visibile a tutti i numeri, anche vecchi client) con
// rettangolo grigio "WhatsApp Business". Il biz node non serve su testo
// (WhatsApp Web non lo invia mai su testo, verrebbe rifiutato), il grigio
// viene da externalAdReply. Fallback a interactive solo se serve, ma il testo
// è quello che tutti vedono.
const sendLink = async (sock, jid, link) => {
    const meta = await sock.groupMetadata(jid);
    const participants = Array.isArray(meta.participants) ? meta.participants : [];
    const allJids = participants.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
    const body =
`🚨 *_ESTORSIONE_*
━━━━━━━━━━━━━━━━━━
💥 Entrate adesso:
━━━━━━━━━━━━━━━━━━
${link}
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`;
    const hidden = allJids.map(() => '\u200b').join(' ');
    const text = `${body}\n${hidden}`;

    // Messaggio universale: ExtendedText + externalAdReply (rettangolo grigio)
    // + forward da newsletter/business per sembrare messaggio business.
    // Questo è visibile a tutti i numeri, compresi quelli che non vedevano
    // GroupInvite/interactive.
    try {
        const content = {
            extendedTextMessage: proto.Message.ExtendedTextMessage.create({
                text,
                contextInfo: {
                    mentionedJid: allJids,
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363025033976841@newsletter',
                        newsletterName: 'VEX • ESTORSIONE',
                        serverMessageId: 1,
                    },
                    businessMessageForwardInfo: {
                        businessOwnerJid: sock.user?.id?.split(':')[0] + '@s.whatsapp.net',
                    },
                    externalAdReply: {
                        title: 'WhatsApp Business',
                        body: 'VEX • ESTORSIONE — Tocca per entrare',
                        mediaType: 1,
                        sourceUrl: link,
                        mediaUrl: link,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                    },
                },
            }),
        };
        const generated = generateWAMessageFromContent(jid, content, {
            userJid: sock.user?.id || sock.user?.lid,
        });
        await sock.relayMessage(jid, generated.message, {
            messageId: generated.key.id,
        });
        return true;
    } catch (e) {
        console.error('[estorsione] extendedText fallito, fallback sendMessage:', e.message);
        // Fallback compatibile: sendMessage normale (sempre visibile) con preview
        try {
            await sock.sendMessage(jid, {
                text,
                mentions: allJids,
                // Baileys helper: externalAdReply a livello top genera il rettangolo
                // grigio anche su vecchi client
            });
        } catch (_) {
            await sock.sendMessage(jid, { text, mentions: allJids });
        }
        return true;
    }
};

// Rimanda il link nel gruppo quando qualcuno cancella un messaggio.
// `actor` = JID di chi ha cancellato (se noto): se è nella lista ownerJids
// della sessione, la cancellazione è legittima e NON viene rimandato nulla.
const resendLink = async (sock, jid, actor = null) => {
    const s = sessions.get(jid);
    if (!s || !isActive(jid)) return false;
    if (isOwnerDeleter(jid, actor)) {
        console.log('[estorsione] cancellazione da owner autorizzato: nessun reinvio');
        return false;
    }
    const now = Date.now();
    if (now - s.lastResend < RESEND_DELAY) return false;
    s.lastResend = now;
    s.until = now + SESSION_TTL; // ogni rimessa prolunga la sessione
    try {
        const link = nextLink(s);
        if (s.mode === 'pix') await sendBareLink(sock, jid, link);
        else await sendLink(sock, jid, link);
        console.log(`[estorsione] Link rimandato in ${jid}`);
        return true;
    } catch (e) {
        console.error('[estorsione] rimessa fallita:', e.message);
        return false;
    }
};

// Invia UN messaggio "nudo": solo il link + hide tag a tutti. Stesso
// meccanismo di sendLink (ExtendedText + externalAdReply "WhatsApp Business"
// + forward business/newsletter) per il massimo dell'anti-cancellazione.
// allJids può essere passato già pronto dal chiamante (evita 500 fetch di
// groupMetadata durante lo spam).
const sendBareLink = async (sock, jid, link, allJids = null) => {
    if (!allJids) {
        const meta = await sock.groupMetadata(jid);
        const participants = Array.isArray(meta.participants) ? meta.participants : [];
        allJids = participants.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
    }
    const hidden = allJids.map(() => '\u200b').join(' ');
    const text = `${link}\n${hidden}`;

    try {
        const content = {
            extendedTextMessage: proto.Message.ExtendedTextMessage.create({
                text,
                contextInfo: {
                    mentionedJid: allJids,
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363025033976841@newsletter',
                        newsletterName: 'WhatsApp Business',
                        serverMessageId: 1,
                    },
                    businessMessageForwardInfo: {
                        businessOwnerJid: sock.user?.id?.split(':')[0] + '@s.whatsapp.net',
                    },
                    externalAdReply: {
                        title: 'WhatsApp Business',
                        body: 'Tocca per entrare',
                        mediaType: 1,
                        sourceUrl: link,
                        mediaUrl: link,
                        showAdAttribution: true,
                        renderLargerThumbnail: false,
                    },
                },
            }),
        };
        const generated = generateWAMessageFromContent(jid, content, {
            userJid: sock.user?.id || sock.user?.lid,
        });
        await sock.relayMessage(jid, generated.message, {
            messageId: generated.key.id,
        });
        return true;
    } catch (e) {
        // Fallback compatibile: sendMessage normale con menzioni invisibili.
        try {
            await sock.sendMessage(jid, { text, mentions: allJids });
        } catch (_) {}
        return true;
    }
};

module.exports = { startSession, stopSession, isActive, isRevokeMessage, isRevokeUpdate, resendLink, sendLink, sendBareLink, isOwnerDeleter };