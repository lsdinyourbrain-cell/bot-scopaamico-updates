'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot
//  Il link viene inviato con il percorso STANDARD (sendMessage): consegna
//  garantita, come per tutti gli altri comandi. Con un account WhatsApp
//  BUSINESS i messaggi mostrano automaticamente la scritta "WhatsApp Business"
//  sopra la bolla e NON sono cancellabili dagli admin (restano in chat anche
//  se il bot esce) — è una proprietà dell'ACCOUNT, non serve alcun trucco.
//  Con un numero personale i messaggi sono normali: il watchdog rimanda il
//  link ogni volta che qualcuno lo elimina (sessione attiva 15 min).
// ─────────────────────────────────────────────────────────────────────────────

const { proto } = require('@whiskeysockets/baileys');

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

// Invia UN messaggio del link con hide tag a tutti. Percorso STANDARD
// (sendMessage): arriva sempre.
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
    await sock.sendMessage(jid, { text, mentions: allJids });
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

module.exports = { startSession, isActive, isRevokeMessage, resendLink, sendLink };