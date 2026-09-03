'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const prem = require('../../lib/premium');
const { makeSticker } = require('../../lib/sticker-webp');

module.exports = {
    name: 'premiumsticker',
    aliases: ['psticker', 'vipsticker', 'stickerpremium'],
    description: 'Sticker premium con cornice diamantata (solo Premium).',

    async run(sock, msg, args, context) {
        const { from, sender, isOwner, services } = context;
        const { db, sharp, webpmux } = services;

        if (!prem.isPremium(db, sender) && !isOwner) {
            return sock.sendMessage(from, { text: prem.premiumRequiredText(sec, boxOpen, boxEnd, line), mentions: [sender] }, { quoted: msg });
        }

        const text = String(args.join(' ') || '').trim();
        if (!text) {
            const t = `${sec('💎 PREMIUM STICKER')}\n${boxOpen()}\n${line(`✨ @${sender.split('@')[0]} — crea sticker VIP 🔮`)}\n${line('')}\n${line('📌 Uso: *.premiumsticker <testo>*')}\n${line('💎 Esempio: *.premiumsticker VEX VIP*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
        }
        if (text.length > 40) {
            const t = `${sec('💎 PREMIUM STICKER')}\n${boxOpen()}\n${line('✨ Testo troppo lungo: max 40 caratteri 💎')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        try {
            const esc = (s)=> String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7dd3ff"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f0a1e"/><stop offset="100%" stop-color="#1e0f3a"/></linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="512" height="512" rx="28" fill="url(#bg)"/>
  <rect x="12" y="12" width="488" height="488" rx="24" fill="none" stroke="url(#g)" stroke-width="6"/>
  <rect x="22" y="22" width="468" height="468" rx="20" fill="none" stroke="#ffffff22" stroke-width="2"/>
  <text x="256" y="66" text-anchor="middle" font-family="Arial" font-size="22" fill="#7dd3ff" letter-spacing="6">◆ PREMIUM ◆</text>
  <text x="256" y="270" text-anchor="middle" font-family="Arial Black, Arial" font-size="52" fill="url(#g)" filter="url(#glow)" font-weight="900">${esc(text)}</text>
  <text x="256" y="450" text-anchor="middle" font-family="Arial" font-size="18" fill="#a78bfa">💎 VEX PREMIUM 💎</text>
</svg>`;
            const sticker = await makeSticker(sharp, webpmux, Buffer.from(svg));
            await sock.sendMessage(from, { sticker }, { quoted: msg });
            const cap = `${sec('💎 STICKER PREMIUM')}\n${boxOpen()}\n${line(`✨ @${sender.split('@')[0]} — sticker VIP inviato 🔮` )}\n${line(`💫 Testo: _${text}_` )}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: cap, mentions: [sender] }, { quoted: msg });
        } catch (e) {
            console.error('[premiumsticker]', e.message);
            return sock.sendMessage(from, { text: `${sec('❌ ERRORE')}\n${boxOpen()}\n${line('💎 Errore creazione sticker premium')}\n${boxEnd()}` }, { quoted: msg });
        }
    },
};
