'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { downloadMediaBuffer } = require('../../lib/media-utils');
const { imageToAscii } = require('../../lib/ascii-art');

module.exports = {
    name: 'ascii',
    aliases: ['asciiart', 'ascii-art'],
    description: "Converte un'immagine in arte ASCII. Uso: rispondi a un'immagine con .ascii (o .ascii <larghezza, es. 60).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, downloadMediaMessage, showProgress } = services;

        const cols = parseInt(String(textArgs || '').trim(), 10);
        const width = Number.isFinite(cols) && cols >= 30 && cols <= 140 ? cols : 80;

        try {
            const media = await downloadMediaBuffer(sock, msg, from, contextInfo, sender, downloadMediaMessage);
            if (!media || media.kind === 'video') {
                return reply("⚠️ _[uso]: rispondi a un'immagine (o uno sticker) per convertirla in ASCII._\n\n▸ Uso: `.ascii` oppure `.ascii 60` — _per la larghezza_.");
            }

            const prog = await showProgress(sock, from, { label: 'ASCII ART', duration: 2500, quoted: msg });

            // Le immagini molto piccole danno risultati migliori: prepariamo
            // una versione a 1 canale (scala di grigi) mandata a imageToAscii.
            const ascii = await imageToAscii(sharp, media.buffer, width);

            if (ascii.length > 4000) {
                await prog.done('😅 *Immagine troppo grande*: prova con .ascii 40');
                return;
            }

            await sock.sendMessage(from, { text: `\`\`\`\n${ascii}\n\`\`\`` }, { quoted: msg });
            await prog.done('🖼️ *_ASCII ART_*\n\n▸ _ASCII Art pronta!_\n');
        } catch (e) {
            console.error('[ascii]', e.message);
            return reply("❌ Errore durante la conversione. Riprova con un'immagine più semplice.");
        }
    },
};