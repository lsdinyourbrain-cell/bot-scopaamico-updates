'use strict';

// Invia un messaggio con pulsanti (native flow) che, premuti, eseguono
// un comando del bot. Massimo 3 pulsanti per messaggio (limite WhatsApp).
const sendButtons = async (sock, from, text, buttons, quoted) => {
    const list = (buttons || []).slice(0, 3);
    if (!list.length) {
        return sock.sendMessage(from, { text }, { quoted });
    }

    try {
        await sock.sendMessage(from, {
            interactiveMessage: {
                body: { text: String(text).slice(0, 3000) },
                nativeFlowMessage: {
                    buttons: list.map(b => ({
                        name: 'quick_reply',
                        buttonParamsJson: JSON.stringify({
                            display_text: String(b.label).slice(0, 30),
                            id: String(b.id || b.label),
                        }),
                    })),
                },
            },
        }, { quoted });
        return true;
    } catch (e) {
        console.error('[buttons] errore invio:', e.message);
        // Fallback: semplice testo senza pulsanti
        return sock.sendMessage(from, { text }, { quoted });
    }
};

module.exports = { sendButtons };
