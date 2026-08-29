'use strict';

const config = require('../../config');
const pkg = require('../../package.json');
const { toStyle } = require('../../lib/font');
const styledEntra = toStyle('ENTRA NEL NOSTRO GRUPPO', 'scriptBold');

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu VEX con pill scure + bianca (link owner) e testo impostabile.",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isButton, contextInfo, reply, services } = context;
        const { sendButtons, db, saveDB } = services;

        const raw = String(textArgs||'').trim();
        const q = raw.toLowerCase();
        const sponsorLink = (db?._config?.sponsorLink) || config.SPONSOR_LINK || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

        // ── IMPOSTA TESTO MENU (owner) ─────────────────────────────────
        if (q.startsWith('set ')) {
            if (!isOwner) return reply("⛔ Solo l'owner può impostare il testo del menu.");
            const newText = raw.slice(4).trim();
            if (!newText) return reply("⚠️ Uso: `.menu set <testo>`\nEs. `.menu set Benvenuti nel VEX`");
            if (newText.length > 500) return reply("❌ Testo troppo lungo (max 500).");
            if (!db._config) db._config = {};
            db._config.menuText = newText;
            saveDB();
            return reply(`✅ *TESTO MENU IMPOSTATO*\n━━━━━━━━━━━━━━\n▸ ${newText.slice(0,80)}${newText.length>80?'…':''}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }
        if (q === 'set') {
            const cur = db?._config?.menuText || '(default: VEX BOT)';
            return reply(`📝 *TESTO MENU*\n━━━━━━━━━━━━━━\n▸ Attuale: _${cur}_\n▸ Imposta: \`.menu set <testo>\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }

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
                { label: `°${styledEntra}°`, url: sponsorLink },
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
                { label: `°${styledEntra}°`, url: sponsorLink },
            ], msg, null, { headerTitle: 'VEX — FUN', footerText: 'VEX BOT 2K26' });
        }

        // ── HOME PRINCIPALE ─────────────────────────────────────────────
        const topText = (db?._config?.menuText) || 'UNIVERSE  -  BOT  -  2K26';
        const caption =
`${topText}

ㅤㅤ⋆｡˚『 ╭ \`VEX BOT\` ╯ 』˚｡⋆
╭
│ ➤ Scegli un menu qui sotto
╰⭒─ׄ─ׅ─ׄ─⭒`;

        const buttons = [
            { label: 'MENU-TOOL', id: 'menu tool' },
            { label: 'MENU-FUN', id: 'menu fun' },
            { label: `°${styledEntra}°`, url: sponsorLink },
        ];

        // Prova a inviare con immagine se disponibile
        try {
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
                        { buttonId: 'join_us', buttonText: { displayText: `°${styledEntra}°` }, type: 1 },
                    ],
                    headerType: 4,
                }, { quoted: msg });
                return;
            }
        } catch (_) {}

        // Fallback senza immagine
        return sendButtons(sock, from, caption, buttons, msg, null, {
            headerTitle: 'VEX  -  BOT  -  2K26',
            footerText: 'VEX BOT',
        });
    },
};
