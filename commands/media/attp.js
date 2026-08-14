'use strict';

const { escapeXml, wrapLines } = require('../../lib/svg-utils');
const { makeSticker } = require('../../lib/sticker-webp');

// Testo neon → sticker webp. L'animazione affidabile richiede ffmpeg di
// sistema (presente in produzione su Termux); qui il fallback è un testo
// statico "glossato" con effetto neon che funziona ovunque.
const renderNeonSvg = (text) => {
    const lines = wrapLines(text, 20, 3);
    const fontSize = Math.max(44, Math.min(110, Math.floor(200 / lines.length)));
    const startY = 256 + (fontSize * (lines.length - 1)) / 2;

    const texts = lines.map((line, i) => {
        const y = startY - (lines.length - 1 - i) * fontSize * 1.08;
        return `<text x="256" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="url(#g)" filter="url(#glow)" text-anchor="middle" font-weight="900" font-style="italic">${escapeXml(line.trim())}</text>`;
    }).join('');

    return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#00f5ff"/>
                <stop offset="0.5" stop-color="#7b5cff"/>
                <stop offset="1" stop-color="#ff00ff"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
        <rect width="512" height="512" fill="#0d0d12"/>
        <circle cx="256" cy="256" r="230" fill="none" stroke="#1d1d2a" stroke-width="2"/>
        ${texts}
        <text x="256" y="486" font-family="Arial, sans-serif" font-size="18" fill="#4a4a66" text-anchor="middle">Vex Bot</text>
    </svg>`;
};

module.exports = {
    name: 'attp',
    aliases: ['attp2', 'testoneon'],
    description: "Crea uno sticker con il testo decorato in stile neon. Uso: .attp <testo>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, webpmux } = services;

        const text = String(textArgs || '').trim();
        if (!text || text.length > 80) {
            return reply("⚠️ _[uso]: scrivi il testo da trasformare in sticker neon._\n━━━━━━━━━━━━━━\n▸ `.attp <testo>` — _max 80 caratteri_\n━━━━━━━━━━━━━━\n▸ Esempio: `.attp CIAO BELLO`");
        }

        try {
            const svg = renderNeonSvg(text);
            const sticker = await makeSticker(sharp, webpmux, Buffer.from(svg));
            await sock.sendMessage(from, { sticker }, { quoted: msg });
        } catch (e) {
            console.error('[attp]', e.message);
            return reply("❌ Errore durante la creazione dello sticker.");
        }
    },
};