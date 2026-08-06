'use strict';

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// Registro degli ultimi pulsanti inviati per chat. WhatsApp a volte NON manda
// una interactiveResponseMessage: inoltra semplicemente l'etichetta del
// pulsante come messaggio di testo. Con questo registro riconosciamo quella
// etichetta e la mappiamo al comando da eseguire.
const buttonRegistry = new Map(); // key: `${chat}|${etichettaNormalizzata}` -> { id, ts }
const BTN_REGISTER_TTL = 120000;  // 120 secondi

// Rimuove emoji/spazi non visualizzati all'inizio e normalizza per il confronto.
const BTN_EMOJI_STRIP = /^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{00A0}\s]+/u;

const stripEmoji = (s) => String(s).replace(BTN_EMOJI_STRIP, '').trim();

// Normalizzazione UNICA per le chiavi del registro e le ricerche: toglie
// emoji/spazi iniziali, il punto del comando e mette tutto minuscolo.
// Così "⛏️ .scava", ".scava" e "scava" vengono tutte mappate a "scava".
const normalizeBtnText = (s) => stripEmoji(String(s)).toLowerCase().replace(/^\./, '').trim();

// I pulsanti interactive NON renderizzano se relayMessage non inietta i nodi
// binari che WhatsApp si aspetta: <biz> + <interactive type="native_flow">
// + <native_flow name="mixed">. WhiskeySockets da solo non li aggiunge,
// quindi li costruiamo qui e li passiamo come additionalNodes.
const PRIVACY_MODE_TS_OFFSET = 77980457;
const getPrivacyModeTs = () => (Math.floor(Date.now() / 1000) - PRIVACY_MODE_TS_OFFSET).toString();

const buildMixedNativeFlowBizNode = () => ({
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

// Invia un messaggio con pulsanti nativi (native flow). I pulsanti compaiono
// sotto il messaggio; premendoli WhatsApp manda una interactiveResponseMessage
// con l'id del pulsante: il bot lo tratta come se avesse scritto il comando.
// Max 3 pulsanti per messaggio (limite WhatsApp).
const sendButtons = async (sock, from, text, buttons, quoted) => {
    const list = (buttons || []).slice(0, 3);
    const cleanText = String(text || '').trim();

    // Il corpo di un messaggio interactive ha limite ~1024 BYTE (non char):
    // oltre va in testo semplice, altrimenti WhatsApp rifiuta/rende vuoto.
    const tooLong = cleanText.length > 1024 || Buffer.byteLength(cleanText, 'utf8') > 1024;

    if (!list.length || tooLong) {
        // Nessun pulsante o testo troppo lungo: semplice messaggio di testo
        return sock.sendMessage(from, { text: cleanText }, { quoted });
    }

    try {
        const content = {
            interactiveMessage: proto.Message.InteractiveMessage.create({
                header: proto.Message.InteractiveMessage.Header.create({
                    title: '🤖 ScopaAmico Bot',
                }),
                body: proto.Message.InteractiveMessage.Body.create({ text: cleanText }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: '⬇️ Premi un pulsante per eseguire',
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: list.map(b => proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: String(b.label).slice(0, 30),
                            id: String(b.id || b.label),
                        }),
                    })),
                    messageParamsJson: JSON.stringify({}),
                    messageVersion: 1,
                }),
            }),
        };

        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });

        // Nodi binari richiesti da WhatsApp per renderizzare i pulsanti.
        // Gruppi: solo biz. Chat private: anche il nodo bot.
        const botNode = { tag: 'bot', attrs: { biz_bot: '1' } };
        const bizNode = buildMixedNativeFlowBizNode();
        const additionalNodes = from.endsWith('@g.us') ? [bizNode] : [botNode, bizNode];

        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes,
        });

        // Registra le etichette dei pulsanti appena inviati: serviranno al
        // bot per riconoscere l'etichetta se WhatsApp la inoltra come testo.
        const now = Date.now();
        for (const b of list) {
            const key = `${from}|${normalizeBtnText(b.label || b.id || '')}`;
            buttonRegistry.set(key, { id: String(b.id || b.label), label: String(b.label || b.id || ''), ts: now });
        }
        return true;
    } catch (e) {
        console.error('[buttons] errore invio:', e.message);
        try {
            await sock.sendMessage(from, { text: cleanText }, { quoted });
        } catch (_) {}
        return false;
    }
};

module.exports = { sendButtons, buttonRegistry, stripEmoji, normalizeBtnText, BTN_EMOJI_STRIP, BTN_REGISTER_TTL };
