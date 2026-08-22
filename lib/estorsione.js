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

// Invia UN messaggio del link: prova come GroupInvite (card con rettangolo
// grigio "WhatsApp Business" come negli altri bot), fallback a card interactive
// con nodo biz. Il GroupInvite con caption + hide-tag è quello che gli altri
// bot usano per il rettangolo grigio e risulta non revocabile dall'admin.
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

    // Estrai inviteCode da https://chat.whatsapp.com/XXXX
    const m = String(link).match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]+)/);
    const inviteCode = m ? m[1] : null;

    // Se è un invite WhatsApp, manda come GroupInviteMessage: rende il
    // rettangolo grigio con "WhatsApp Business" e l'admin non può revocarlo
    // (è un messaggio di sistema tipo invite). Include hide-tag via contextInfo.
    if (inviteCode) {
        try {
            const inviteMsg = proto.Message.GroupInviteMessage.create({
                inviteCode,
                inviteExpiration: Date.now() + 30 * 24 * 60 * 60 * 1000,
                groupName: 'VEX • ESTORSIONE',
                caption: text,
                jpegThumbnail: Buffer.from(''),
                contextInfo: {
                    mentionedJid: allJids,
                    isForwarded: true,
                    forwardingScore: 999,
                    businessMessageForwardInfo: {
                        businessOwnerJid: sock.user?.id?.split(':')[0] + '@s.whatsapp.net',
                    },
                    externalAdReply: {
                        title: 'WhatsApp Business',
                        body: 'Tocca per entrare nel gruppo',
                        mediaType: 1,
                        sourceUrl: link,
                        showAdAttribution: true,
                    },
                },
            });
            const generated = generateWAMessageFromContent(jid, { groupInviteMessage: inviteMsg }, {
                userJid: sock.user?.id || sock.user?.lid,
            });
            // GroupInvite non necessita biz node: è già messaggio business/invite
            await sock.relayMessage(jid, generated.message, {
                messageId: generated.key.id,
                // mantieni biz per sicurezza su account business
                additionalNodes: [buildBizNode()],
            });
            return true;
        } catch (e) {
            console.error('[estorsione] GroupInvite fallito, fallback interactive:', e.message);
        }
    }

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
                showAdAttribution: true,
                renderLargerThumbnail: false,
            },
        },
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