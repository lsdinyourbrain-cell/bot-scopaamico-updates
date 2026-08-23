'use strict';

const axios = require('axios');
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

// Resolver opzionale per le mentions: chi configura il modulo (index.js) può
// iniettare una funzione che risolve i jid @lid nel PN reale PRIMA dell'invio.
let mentionResolver = null;
const setMentionResolver = (fn) => { mentionResolver = fn; };

const resolveMentions = async (from, mentions) => {
    if (!Array.isArray(mentions) || !mentions.length) return mentions;
    if (typeof mentionResolver !== 'function') return mentions;
    return mentionResolver(from, mentions);
};

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rewriteTagText = (text, origMentions, resolvedMentions) => {
    if (!Array.isArray(origMentions) || !origMentions.length) return String(text ?? '');
    if (!Array.isArray(resolvedMentions) || resolvedMentions.length !== origMentions.length) return String(text ?? '');
    let out = String(text ?? '');
    for (let i = 0; i < origMentions.length; i++) {
        const orig = String(origMentions[i]).split('@')[0];
        const res = String(resolvedMentions[i]).split('@')[0];
        if (!orig || !res || orig === res) continue;
        out = out.replace(new RegExp('@' + escapeRegExp(orig) + '(?![0-9])', 'g'), '@' + res);
    }
    return out;
};

const buttonRegistry = new Map();
const BTN_REGISTER_TTL = 30 * 24 * 60 * 60 * 1000;
let registryPruneCounter = 0;
const pruneButtonRegistry = () => {
    const cutoff = Date.now() - BTN_REGISTER_TTL;
    for (const [key, entry] of buttonRegistry) {
        if (entry.ts < cutoff) buttonRegistry.delete(key);
    }
};

const BTN_EMOJI_STRIP = /^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{00A0}\s]+/u;
const stripEmoji = (s) => String(s).replace(BTN_EMOJI_STRIP, '').trim();
const normalizeBtnText = (s) => stripEmoji(String(s)).toLowerCase().replace(/^\./, '').trim();

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

const buildInteractiveContent = (text, list, mentions, opts = {}) => {
    const cleanText = String(text || '').trim();
    const headerTitle = String(opts.headerTitle || opts.header || '◈ VEX BOT').slice(0, 60);
    const footerText = String(opts.footerText || opts.footer || '⬇️ Tocca un pulsante').slice(0, 60);
    const interactiveMessage = proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create({
                title: headerTitle,
            }),
            body: proto.Message.InteractiveMessage.Body.create({ text: cleanText }),
            footer: proto.Message.InteractiveMessage.Footer.create({
                text: footerText,
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: list.map(b => {
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
        });
        if (Array.isArray(mentions) && mentions.length) {
            interactiveMessage.contextInfo = { mentionedJid: mentions };
        }
        return { interactiveMessage };
};

const buildAdditionalNodes = (from) => {
    const botNode = { tag: 'bot', attrs: { biz_bot: '1' } };
    const bizNode = buildMixedNativeFlowBizNode();
    return from.endsWith('@g.us') ? [bizNode] : [botNode, bizNode];
};

const registerButtons = (from, list) => {
    const now = Date.now();
    if (++registryPruneCounter % 500 === 0) pruneButtonRegistry();
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

// Helper to detect opts vs mentions overload
const normalizeSendArgs = (mentions, opts) => {
    // sendButtons(sock, from, text, btns, quoted, mentions, opts)
    // legacy: mentions is array, opts may be object with headerTitle/footerText
    // new: mentions can be undefined, opts is 6th param if object
    if (mentions && !Array.isArray(mentions) && typeof mentions === 'object' && !opts) {
        // 6th param was opts object
        return { mentionsArr: null, optsObj: mentions };
    }
    return { mentionsArr: Array.isArray(mentions) ? mentions : null, optsObj: (opts && typeof opts === 'object') ? opts : {} };
};

const sendButtons = async (sock, from, text, buttons, quoted, mentions, opts) => {
    const { mentionsArr, optsObj } = normalizeSendArgs(mentions, opts);
    // WhatsApp allows 3 quick_reply + 1 list, we permit 4 total to support "3 pulsanti + single_select"
    const list = (buttons || []).slice(0, 4);
    const cleanText = String(text || '').trim();
    const tooLong = cleanText.length > 1024 || Buffer.byteLength(cleanText, 'utf8') > 1024;
    const resolved = mentionsArr ? await resolveMentions(from, mentionsArr) : null;
    const finalText = mentionsArr ? rewriteTagText(cleanText, mentionsArr, resolved) : cleanText;
    if (!list.length || tooLong) {
        const plain = { text: finalText };
        if (resolved?.length) plain.mentions = resolved;
        return sock.sendMessage(from, plain, { quoted });
    }
    try {
        const content = buildInteractiveContent(finalText, list, resolved, optsObj);
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
            const plain = { text: finalText };
            if (resolved?.length) plain.mentions = resolved;
            await sock.sendMessage(from, plain, { quoted });
        } catch (_) {}
        return false;
    }
};

const editButtons = async (sock, from, text, buttons, editKey, quoted, mentions, opts) => {
    const { mentionsArr, optsObj } = normalizeSendArgs(mentions, opts);
    const list = (buttons || []).slice(0, 4);
    const cleanText = String(text || '').trim();
    const tooLong = cleanText.length > 1024 || Buffer.byteLength(cleanText, 'utf8') > 1024;
    if (!editKey?.id || !list.length || tooLong) {
        return sendButtons(sock, from, text, buttons, quoted, mentionsArr, optsObj);
    }
    try {
        const resolved = mentionsArr ? await resolveMentions(from, mentionsArr) : null;
        const finalText = mentionsArr ? rewriteTagText(cleanText, mentionsArr, resolved) : cleanText;
        const content = {
            ...buildInteractiveContent(finalText, list, resolved, optsObj),
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
        return sendButtons(sock, from, text, buttons, quoted, mentionsArr, optsObj);
    }
};

const sendButtonsWithKey = async (sock, from, text, buttons, quoted, mentions, opts) => {
    const { mentionsArr, optsObj } = normalizeSendArgs(mentions, opts);
    const list = (buttons || []).slice(0, 4);
    const cleanText = String(text || '').trim();
    const tooLong = cleanText.length > 1024 || Buffer.byteLength(cleanText, 'utf8') > 1024;
    const resolved = mentionsArr ? await resolveMentions(from, mentionsArr) : null;
    const finalText = mentionsArr ? rewriteTagText(cleanText, mentionsArr, resolved) : cleanText;
    if (!list.length || tooLong) {
        const plain = { text: finalText };
        if (resolved?.length) plain.mentions = resolved;
        const sent = await sock.sendMessage(from, plain, { quoted });
        return sent?.key || null;
    }
    try {
        const content = buildInteractiveContent(finalText, list, resolved, optsObj);
        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });
        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildAdditionalNodes(from),
        });
        registerButtons(from, list);
        return generated.key;
    } catch (e) {
        console.error('[buttons] errore invio (con key):', e.message);
        try {
            const plain = { text: finalText };
            if (resolved?.length) plain.mentions = resolved;
            const sent = await sock.sendMessage(from, plain, { quoted });
            return sent?.key || null;
        } catch (_) {
            return null;
        }
    }
};

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

const sendCarousel = async (sock, from, opts, quoted) => {
    const list = (opts?.cards || []).slice(0, MAX_CAROUSEL_CARDS);
    if (!list.length) return false;
    if (typeof sock.waUploadToServer === 'function') {
        for (const card of list) {
            if (card.imageMessage) continue;
            let buffer = null;
            if (card.imageBuffer) {
                buffer = card.imageBuffer;
            } else if (card.imageUrl) {
                try {
                    buffer = await fetchThumbnail(card.imageUrl);
                } catch (e) {
                    console.error('[carousel] thumbnail non scaricata:', e.message);
                    continue;
                }
            }
            if (!buffer) continue;
            try {
                const prepared = await prepareWAMessageMedia(
                    { image: buffer },
                    { upload: sock.waUploadToServer }
                );
                if (prepared?.imageMessage) card.imageMessage = prepared.imageMessage;
            } catch (e) {
                console.error('[carousel] media non preparato:', e.message);
            }
        }
    }
    const withMedia = list.filter(c => c.imageMessage);
    if (!withMedia.length) return false;
    try {
        const content = buildCarouselContent(opts?.text, withMedia);
        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });
        await sock.relayMessage(from, generated.message, {
            messageId: generated.key.id,
            additionalNodes: buildAdditionalNodes(from),
        });
        for (const card of withMedia) {
            registerButtons(from, card.buttons || []);
        }
        return true;
    } catch (e) {
        console.error('[carousel] errore invio:', e.message);
        return false;
    }
};

module.exports = { sendButtons, editButtons, sendButtonsWithKey, sendCarousel, buttonRegistry, stripEmoji, normalizeBtnText, BTN_EMOJI_STRIP, BTN_REGISTER_TTL, setMentionResolver, rewriteTagText, buildInteractiveContent };
