'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot
//  Il link viene inviato via relay con i nodi <biz> + <quality_control> (stesso
//  pattern dei pulsanti nativi): WhatsApp lo tratta come messaggio BUSINESS
//  (scritta sopra la bolla) e NON è cancellabile dagli admin — resta in chat
//  anche se il bot esce dal gruppo. L'invio è lento e con retry automatico sul
//  rate-overlimit (il server strozza i burst rapidi). In più, se la sessione è
//  attiva e qualcuno elimina un messaggio nel gruppo, il bot lo RIMANDA subito.
// ─────────────────────────────────────────────────────────────────────────────

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const SESSION_TTL = 15 * 60 * 1000; // 15 minuti
const RESEND_DELAY = 2000; // ms minimi tra una rimessa e l'altra
const RATE_LIMIT_WAIT = 10000; // attesa dopo rate-overlimit
const RATE_LIMIT_MAX_RETRY = 3;

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

// Nodi binari "business": il messaggio viene trattato come messaggio di
// BUSINESS → scritta "WhatsApp Business" sopra la bolla e NON cancellabile
// dagli admin (resta in chat anche se il bot esce dal gruppo).
const PRIVACY_MODE_TS_OFFSET = 77980457;
const getPrivacyModeTs = () => (Math.floor(Date.now() / 1000) - PRIVACY_MODE_TS_OFFSET).toString();

const buildBizNodes = () => [
    {
        tag: 'biz',
        attrs: { actual_actors: '2', host_storage: '2', privacy_mode_ts: getPrivacyModeTs() },
    },
    { tag: 'quality_control', attrs: { source_type: 'third_party' } },
];

const isRateLimit = (e) => /rate.?overlimit|429|rate.?limit/i.test(String(e?.message || ''));

// Invia UN messaggio del link (hide tag a tutti) come messaggio business.
// Se il server risponde rate-overlimit, aspetta e riprova (stessa messageId:
// WhatsApp deduplica, quindi un eventuale primo invio riuscito non raddoppia).
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

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            await sock.relayMessage(jid, generated.message, {
                messageId: generated.key.id,
                additionalNodes: buildBizNodes(),
            });
            return true;
        } catch (e) {
            if (isRateLimit(e) && attempt < RATE_LIMIT_MAX_RETRY) {
                attempt++;
                console.warn(`[estorsione] rate-overlimit, riprovo tra ${RATE_LIMIT_WAIT / 1000}s (${attempt}/${RATE_LIMIT_MAX_RETRY})`);
                await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT));
                continue;
            }
            throw e;
        }
    }
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

module.exports = { startSession, isActive, isRevokeMessage, resendLink, sendLink };