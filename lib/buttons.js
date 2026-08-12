'use strict';

const axios = require('axios');
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

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

// Costruisce il contenuto interactive (native flow) da un testo e una lista
// di pulsanti. Condiviso tra invio nuovo ed edit del messaggio.
const buildInteractiveContent = (text, list) => {
    const cleanText = String(text || '').trim();
    return {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
                title: '🤖 ScopaAmico Bot',
            }),
            body: proto.Message.InteractiveMessage.Body.create({ text: cleanText }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: '⬇️ Premi un pulsante per eseguire',
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: list.map(b => {
                    // Pulsante di tipo "selezione" (single_select): apre un
                    // Riquadro nativo di WhatsApp (non un messaggio) con una
                    // lista di voci; toccando una voce la scelta torna al bot.
                    // Parametri: { title, sectionTitle, rows: [{header,title,
                    // description,id}] } (max 20 righe, max 1 per messaggio).
                    if (b.type === 'single_select') {
                        const rows = (b.rows || []).slice(0, 20);
                        const params = {
                            title: String(b.title || b.label || 'Scegli').slice(0, 50),
                            sections: [{
                                title: String(b.sectionTitle || '').slice(0, 50),
                                rows: rows.map(r => ({
                                    header: String(r.header || '').slice(0, 30),
                                    title: String(r.title || '').slice(0, 60),
                                    description: String(r.description || '').slice(0, 120),
                                    id: String(r.id || r.title || ''),
                                })),
                            }],
                        };
                        return proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify(params),
                        });
                    }
                    // Pulsante di tipo "copia" (cta_copy): su pressione copia
                    // il testo (es. il link del gruppo) negli appunti.
                    if (b.type === 'copy') {
                        return proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: String(b.label).slice(0, 30),
                                copy_code: String(b.copy || b.id || ''),
                            }),
                        });
                    }
                    return proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: String(b.label).slice(0, 30),
                            id: String(b.id || b.label),
                        }),
                    });
                }),
                messageParamsJson: JSON.stringify({}),
                messageVersion: 1,
            }),
        }),
    };
};

// Nodi binari richiesti da WhatsApp per renderizzare i pulsanti.
// Gruppi: solo biz. Chat private: anche il nodo bot.
const buildAdditionalNodes = (from) => {
    const botNode = { tag: 'bot', attrs: { biz_bot: '1' } };
    const bizNode = buildMixedNativeFlowBizNode();
    return from.endsWith('@g.us') ? [bizNode] : [botNode, bizNode];
};

// Registra etichette E id dei pulsanti appena inviati: serviranno al bot
// per riconoscere la pressione quando WhatsApp inoltra come testo il label
// (es. ".dadi") oppure l'id (es. "dadi 100"). I pulsanti di tipo "copia"
// non eseguono comandi, quindi non vengono registrati. I pulsanti
// single_select registrano le loro righe (titolo e id di ogni voce).
const registerButtons = (from, list) => {
    const now = Date.now();
    for (const b of list) {
        if (b.type === 'copy') continue;
        if (b.type === 'single_select') {
            for (const r of (b.rows || [])) {
                const id = String(r.id || r.title || '');
                const entry = { id, label: String(r.title || r.header || id), ts: now };
                buttonRegistry.set(`${from}|${normalizeBtnText(r.title || r.header || '')}`, entry);
                if (id.trim()) buttonRegistry.set(`${from}|${normalizeBtnText(id)}`, entry);
            }
            continue;
        }
        const entry = { id: String(b.id || b.label), label: String(b.label || b.id || ''), ts: now };
        buttonRegistry.set(`${from}|${normalizeBtnText(b.label || b.id || '')}`, entry);
        if (b.id && String(b.id).trim()) {
            buttonRegistry.set(`${from}|${normalizeBtnText(String(b.id))}`, entry);
        }
    }
};

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
        const content = buildInteractiveContent(cleanText, list);

        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });

        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildAdditionalNodes(from),
        });

        registerButtons(from, list);
        return true;
    } catch (e) {
        console.error('[buttons] errore invio:', e.message);
        try {
            await sock.sendMessage(from, { text: cleanText }, { quoted });
        } catch (_) {}
        return false;
    }
};

// MODIFICA un messaggio con pulsanti già inviato: invece di mandare un nuovo
// messaggio a ogni pressione (spam), aggiorna la stessa bolla. L'edit avviene
// via protocolMessage con editKey = key del messaggio originale (si ricava da
// contextInfo.stanzaId della pressione). Se l'edit fallisce torna a inviare
// un messaggio nuovo, quindi il menu resta sempre navigabile.
const editButtons = async (sock, from, text, buttons, editKey, quoted) => {
    const list = (buttons || []).slice(0, 3);
    const cleanText = String(text || '').trim();

    const tooLong = cleanText.length > 1024 || Buffer.byteLength(cleanText, 'utf8') > 1024;
    if (!editKey?.id || !list.length || tooLong) {
        return sendButtons(sock, from, text, buttons, quoted);
    }

    try {
        // content = { interactiveMessage, edit } → Baileys lo impacchetta in un
        // protocolMessage con editedMessage = nuovo messaggio con pulsanti.
        const content = {
            ...buildInteractiveContent(cleanText, list),
            edit: {
                remoteJid: editKey.remoteJid || from,
                fromMe: true,
                id: editKey.id,
                participant: editKey.participant,
            },
        };

        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });

        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildAdditionalNodes(from),
            additionalAttributes: { edit: '1' },
        });

        registerButtons(from, list);
        return true;
    } catch (e) {
        console.error('[buttons] edit fallito, invio nuovo:', e.message);
        return sendButtons(sock, from, text, buttons, quoted);
    }
};

// ── CAROSELLO (card orizzontali scorrevoli) ────────────────────────────────
// Messaggio "carousel" nativo di WhatsApp: una fila orizzontale di card che
// l'utente scorre con il dito. Ogni card è un InteractiveMessage con titolo,
// canale, testo, immagine e fino a 3 pulsanti. WhatsApp accetta max 10 card.
// Usa lo stesso relay dei pulsanti (nodi biz + native flow "mixed").
const MAX_CAROUSEL_CARDS = 10;

const fetchThumbnail = async (url, maxBytes = 600 * 1024) => {
    const { data } = await axios.get(String(url), {
        timeout: 15000,
        responseType: 'arraybuffer',
        maxContentLength: maxBytes,
        validateStatus: (s) => s >= 200 && s < 300,
    });
    return data && data.length ? data : null;
};

// Costruisce il contenuto del carosello: interactiveMessage + carouselMessage.
const buildCarouselContent = (text, cards) => {
    const protoCards = cards.map((card) => {
        const im = {
            body: proto.Message.InteractiveMessage.Body.create({
                text: String(card.body || ' ').trim().slice(0, 1024),
            }),
        };
        if (card.footer) {
            im.footer = proto.Message.InteractiveMessage.Footer.create({ text: String(card.footer).slice(0, 128) });
        }
        const header = {};
        if (card.title) header.title = String(card.title).slice(0, 256);
        if (card.subtitle) header.subtitle = String(card.subtitle).slice(0, 128);
        if (card.imageMessage) {
            header.imageMessage = card.imageMessage;
            header.hasMediaAttachment = true;
        }
        if (Object.keys(header).length) {
            im.header = proto.Message.InteractiveMessage.Header.create(header);
        }
        if (card.buttons && card.buttons.length) {
            im.nativeFlowMessage = proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: card.buttons.slice(0, 3).map((b) =>
                    proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton.create({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: String(b.label).slice(0, 30),
                            id: String(b.id || b.label),
                        }),
                    })),
                messageParamsJson: JSON.stringify({}),
            });
        }
        return proto.Message.InteractiveMessage.create(im);
    });

    return {
        interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
                text: String(text || '').trim().slice(0, 1024),
            }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                cards: protoCards,
            }),
        }),
    };
};

// Invia un messaggio carosello. Ogni card: { title, subtitle, body, footer,
// imageUrl, imageMessage, buttons: [{label, id}] }.
// Ritorna true se inviato, false in caso di errore (il chiamante può
// fallbackare su un'altra UI).
const sendCarousel = async (sock, from, opts, quoted) => {
    const list = (opts?.cards || []).slice(0, MAX_CAROUSEL_CARDS);
    if (!list.length) return false;

    // Scarica le thumbnail e le carica sui server WhatsApp (solo se l'upload
    // è disponibile): senza media le card restano comunque leggibili.
    if (typeof sock.waUploadToServer === 'function') {
        for (const card of list) {
            if (card.imageMessage || !card.imageUrl) continue;
            try {
                const buffer = await fetchThumbnail(card.imageUrl);
                if (!buffer) continue;
                const prepared = await prepareWAMessageMedia(
                    { image: buffer },
                    { upload: sock.waUploadToServer }
                );
                if (prepared?.imageMessage) card.imageMessage = prepared.imageMessage;
            } catch (e) {
                console.error('[carousel] thumbnail non scaricata:', e.message);
            }
        }
    }

    try {
        const content = buildCarouselContent(opts?.text, list);
        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });

        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildAdditionalNodes(from),
        });

        for (const card of list) {
            registerButtons(from, card.buttons || []);
        }
        return true;
    } catch (e) {
        console.error('[carousel] errore invio:', e.message);
        return false;
    }
};

module.exports = { sendButtons, editButtons, sendCarousel, buttonRegistry, stripEmoji, normalizeBtnText, BTN_EMOJI_STRIP, BTN_REGISTER_TTL };
