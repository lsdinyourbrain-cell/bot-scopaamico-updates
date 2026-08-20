'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ESTORSIONE — Vex Bot (watchdog anti-cancellazione)
//  Quando la sessione è attiva in un gruppo e un admin cancella un messaggio,
//  il bot RIMANDA subito il link con hide tag: in pratica il link non si riesce
//  a eliminare, ogni cancellazione viene annullata da un nuovo invio.
//  La sessione scade da sola (SESSION_TTL) e la rimessa ha un ritardo minimo
//  per non innescare loop impazziti.
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

// Rimanda il link nel gruppo con hide tag a tutti (key spoofata come il
// comando principale: il messaggio appare di un altro membro).
const resendLink = async (sock, jid) => {
    const s = sessions.get(jid);
    if (!s || !isActive(jid)) return false;
    const now = Date.now();
    if (now - s.lastResend < RESEND_DELAY) return false;
    s.lastResend = now;
    s.until = now + SESSION_TTL; // ogni rimessa prolunga la sessione
    try {
        const meta = await sock.groupMetadata(jid);
        const participants = Array.isArray(meta.participants) ? meta.participants : [];
        const allJids = participants.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
        const body =
`🚨 *_ESTORSIONE_*
━━━━━━━━━━━━━━━━━━
💥 Entrate adesso:
━━━━━━━━━━━━━━━━━━
${s.link}
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
        const spoofPool = allJids.length ? allJids : [null];
        const spoof = spoofPool[Math.floor(Math.random() * spoofPool.length)];
        if (spoof) {
            generated.key.participant = spoof;
            generated.key.fromMe = false;
        }
        await sock.relayMessage(jid, generated.message, { messageId: generated.key.id });
        console.log(`[estorsione] Link rimandato in ${jid}`);
        return true;
    } catch (e) {
        console.error('[estorsione] rimessa fallita:', e.message);
        return false;
    }
};

module.exports = { startSession, isActive, isRevokeMessage, resendLink };