'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot (watchdog anti-cancellazione + messaggio "business")
//  Il messaggio viene inoltrato via relay con i nodi <biz> + <quality_control>
//  (gli stessi dei pulsanti nativi): WhatsApp lo tratta come messaggio di
//  BUSINESS e mostra la scritta "WhatsApp Business" sopra la bolla. Quei
//  messaggi NON si possono cancellare dagli admin.
//  In più, se la sessione è attiva e qualcuno elimina un messaggio nel gruppo,
//  il bot RIMANDA subito il link: doppia difesa. La sessione scade da sola
//  (SESSION_TTL) e la rimessa ha un ritardo minimo per non innescare loop.
// ─────────────────────────────────────────────────────────────────────────────

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const SESSION_TTL = 15 * 60 * 1000; // 15 minuti
const RESEND_DELAY = 2000; // ms minimi tra una rimessa e l'altra

const sessions = new Map(); // groupJid -> { link, until, lastResend }

const startSession = (jid, link) => {
    sessions.set(jid, { link, until: Date.now() + SESSION_TTL, lastResend: 0 });
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
// messaggio eliminato dentro `key`.
const isRevokeMessage = (message) => {
    try {
        return message?.protocolMessage?.type === proto.Message.ProtocolMessage.Type.REVOKE;
    } catch (_) { return false; }
};

// Nodi binari "business" richiesti da WhatsApp per rendere il messaggio un
// messaggio di BUSINESS (scritta "WhatsApp Business" sopra la bolla). Stesso
// pattern dei pulsanti nativi, senza il contenuto interactive: applicato a un
// semplice testo dà il label e il messaggio non è cancellabile dagli admin.
const PRIVACY_MODE_TS_OFFSET = 77980457;
const getPrivacyModeTs = () => (Math.floor(Date.now() / 1000) - PRIVACY_MODE_TS_OFFSET).toString();

const buildBizNodes = () => [
    {
        tag: 'biz',
        attrs: { actual_actors: '2', host_storage: '2', privacy_mode_ts: getPrivacyModeTs() },
    },
    { tag: 'quality_control', attrs: { source_type: 'third_party' } },
];

// Costruisce e invia il messaggio del link (hide tag a tutti) con i nodi biz.
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
    const content = {
        extendedTextMessage: proto.Message.ExtendedTextMessage.create({
            text,
            contextInfo: { mentionedJid: allJids },
        }),
    };
    const generated = generateWAMessageFromContent(jid, content, {
        userJid: sock.user?.id || sock.user?.lid,
    });
    await sock.relayMessage(jid, generated.message, {
        messageId: generated.key.id,
        additionalNodes: buildBizNodes(),
    });
    return true;
};

// Rimanda il link nel gruppo quando qualcuno cancella un messaggio.
const resendLink = async (sock, jid) => {
    const s = sessions.get(jid);
    if (!s || !isActive(jid)) return false;
    const now = Date.now();
    if (now - s.lastResend < RESEND_DELAY) return false;
    s.lastResend = now;
    s.until = now + SESSION_TTL; // ogni rimessa prolunga la sessione
    try {
        await sendLink(sock, jid, s.link);
        console.log(`[estorsione] Link rimandato in ${jid}`);
        return true;
    } catch (e) {
        console.error('[estorsione] rimessa fallita:', e.message);
        return false;
    }
};

module.exports = { startSession, isActive, isRevokeMessage, resendLink, sendLink, buildBizNodes };