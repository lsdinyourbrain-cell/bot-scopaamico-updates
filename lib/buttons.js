'use strict';

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// Invia un messaggio con pulsanti nativi (native flow). Quando l'utente preme
// un pulsante, WhatsApp manda una interactiveResponseMessage con l'id del
// pulsante: il bot lo tratta come se avesse scritto il comando.
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
                    hasMediaAttachment: false,
                }),
                body: proto.Message.InteractiveMessage.Body.create({ text: cleanText }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: '⬇️ Premi un pulsante per eseguire',
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: list.map(b => ({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: String(b.label).slice(0, 30),
                            id: String(b.id || b.label),
                        }),
                    })),
                    messageParamsJson: JSON.stringify({}),
                }),
            }),
        };

        const generated = generateWAMessageFromContent(from, content, {
            userJid: sock.user?.id || sock.user?.lid,
            quoted,
        });
        await sock.relayMessage(from, generated.message, { messageId: generated.key.id });
        return true;
    } catch (e) {
        console.error('[buttons] errore invio:', e.message);
        try {
            await sock.sendMessage(from, { text: cleanText }, { quoted });
        } catch (_) {}
        return false;
    }
};

module.exports = { sendButtons };
