'use strict';

const pkg = require('../../package.json');
const config = require('../../config');

const toBold = (s) => `*${String(s||'').trim()}*`;

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu VEX UNIVERSE con pill scure + bianca (link owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isButton, contextInfo, services } = context;
        const { sendButtons, db } = services;

        const q = String(textArgs||'').trim().toLowerCase();
        const sponsorLink = (db?._config?.sponsorLink) || config.SPONSOR_LINK || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

        // ── Sottomenu TOOL ───────────────────────────────────────────────
        if (q === 'tool' || q === 'menu-tool' || q === 'menutool') {
            const txt = 
`ㅤㅤ⋆｡˚『 ╭ \`MENU-TOOL\` ╯ 』˚｡⋆
╭
│ ➤『🛠️』 Utility
│ ➤『🎧』 Musica
│ ➤『🔊』 Audio
│ ➤『📥』 Media
│ ➤『🤖』 AI
│ ➤『🛡️』 Sicurezza
╰⭒─ׄ─ׅ─ׄ─⭒
*VEX BOT* · ${pkg.version} · digita .aiuto <comando>`;
            return sendButtons(sock, from, txt, [
                { label: '⬅️ INDIETRO', id: 'menu' },
                { label: 'JOIN US — ENTRA QUI', url: sponsorLink },
            ], msg, null, { headerTitle: 'VEX — TOOL', footerText: 'VEX BOT 2K26' });
        }

        // ── Sottomenu FUN ────────────────────────────────────────────────
        if (q === 'fun' || q === 'menu-fun' || q === 'menufun') {
            const txt = 
`ㅤㅤ⋆｡˚『 ╭ \`MENU-FUN\` ╯ 』˚｡⋆
╭
│ ➤『🎲』 Giochi
│ ➤『💞』 Social
│ ➤『🔥』 Interazioni
│ ➤『💰』 Economia
│ ➤『🆕』 Novità
╰⭒─ׄ─ׅ─ׄ─⭒
*VEX BOT* · ${pkg.version} · .shop .mine .corsa`;
            return sendButtons(sock, from, txt, [
                { label: '⬅️ INDIETRO', id: 'menu' },
                { label: 'JOIN US — ENTRA QUI', url: sponsorLink },
            ], msg, null, { headerTitle: 'VEX — FUN', footerText: 'VEX BOT 2K26' });
        }

        // ── HOME PRINCIPALE — stile foto UNIVERSE ──────────────────────
        // Header come foto: UNIVERSE - BOT - 2K26, immagine, 2 pill scure + 1 bianca
        const caption = 
`UNIVERSE  -  BOT  -  2K26

ㅤㅤ⋆｡˚『 ╭ \`VEX BOT\` ╯ 』˚｡⋆
╭
│ ➤ Scegli un menu qui sotto
╰⭒─ׄ─ׅ─ׄ─⭒`;

        // Usa sendButtons con 2 scure + 1 bianca (cta_url)
        // Le due scure sono quick_reply, la bianca è cta_url con link owner
        const buttons = [
            { label: 'MENU-TOOL', id: 'menu tool' },
            { label: 'MENU-FUN', id: 'menu fun' },
            { label: 'JOIN US  —  ENTRA QUI...', url: sponsorLink },
        ];

        // Prova a inviare con immagine se disponibile, altrimenti solo pulsanti
        try {
            // Cerca un'immagine locale per il menu (se c'è), altrimenti solo testo + pulsanti
            const fs = require('fs');
            const path = require('path');
            const possibleImages = [
                path.join(__dirname, '../../assets/universe.jpg'),
                path.join(__dirname, '../../assets/menu.jpg'),
                path.join(__dirname, '../../assets/vex.jpg'),
            ];
            let imgPath = null;
            for (const p of possibleImages) if (fs.existsSync(p)) { imgPath = p; break; }

            if (imgPath) {
                const img = fs.readFileSync(imgPath);
                await sock.sendMessage(from, {
                    image: img,
                    caption: caption,
                    footer: 'VEX BOT 2K26',
                    buttons: [
                        { buttonId: 'menu tool', buttonText: { displayText: 'MENU-TOOL' }, type: 1 },
                        { buttonId: 'menu fun', buttonText: { displayText: 'MENU-FUN' }, type: 1 },
                        { buttonId: 'join_us', buttonText: { displayText: 'JOIN US — ENTRA QUI...' }, type: 1 },
                    ],
                    headerType: 4,
                }, { quoted: msg });
                // Fallback anche con sendButtons per compatibilità
                return;
            }
        } catch (_) {}

        // Fallback senza immagine: usa sendButtons classico con 3 pill
        return sendButtons(sock, from, caption, buttons, msg, null, {
            headerTitle: 'VEX  -  BOT  -  2K26',
            footerText: 'VEX BOT',
        });
    },
};
