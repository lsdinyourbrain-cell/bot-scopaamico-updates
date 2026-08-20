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

// Invia UN messaggio del link: card interactive (native flow) con nodo biz e
// pulsante "COPIA LINK". Il testo del corpo ha limite ~1024 byte: se il hide
// tag a tutti lo sfora, ripiega su un testo semplice con hide tag (consegna
// comunque garantita).
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

    const tooLong = text.length > 1024 || Buffer.byteLength(text, 'utf8') > 1024;
    if (tooLong) {
        await sock.sendMessage(jid, { text, mentions: allJids });
        return true;
    }

    const interactiveMessage = proto.Message.InteractiveMessage.create({
        header: proto.Message.InteractiveMessage.Header.create({
            title: '🚨 *_ESTORSIONE_*',
        }),
        body: proto.Message.InteractiveMessage.Body.create({ text }),
        footer: proto.Message.InteractiveMessage.Footer.create({
            text: '⬇️ Tocca per copiare il link',
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: [
                proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '💣 COPIA LINK',
                        copy_code: link,
                    }),
                }),
            ],
            messageParamsJson: JSON.stringify({}),
            messageVersion: 1,
        }),
        contextInfo: { mentionedJid: allJids },
    });

    const generated = generateWAMessageFromContent(jid, { interactiveMessage }, {
        userJid: sock.user?.id || sock.user?.lid,
    });

    await sock.relayMessage(jid, generated.message, {
        messageId: generated.key.id,
        additionalNodes: [buildBizNode()],
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

module.exports = { startSession, isActive, isRevokeMessage, resendLink, sendLink };