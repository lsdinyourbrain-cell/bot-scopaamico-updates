'use strict';

const pkg = require('../../package.json');
const config = require('../../config');

const toBold = (s) => `*${String(s||'').trim()}*`;
const { toStyle } = require('../../lib/font');
const styledEntra = toStyle('ENTRA NEL NOSTRO GRUPPO', 'scriptBold'); // font carino per pill bianca

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu VEX con testo impostabile (owner) e 1 pill scura + 1 bianca (link owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isButton, contextInfo, reply, services } = context;
        const { sendButtons, db, saveDB } = services;

        const raw = String(textArgs||'').trim();
        const q = raw.toLowerCase();
        const sponsorLink = (db?._config?.sponsorLink) || config.SPONSOR_LINK || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

        // ── IMPOSTA TESTO MENU (owner) ─────────────────────────────────
        // Uso: .menu set <testo>  — il testo sta sopra, lo imposti tu e resta salvato
        if (q.startsWith('set ')) {
            if (!isOwner) return reply("⛔ Solo l'owner può impostare il testo del menu.");
            const newText = raw.slice(4).trim();
            if (!newText) return reply("⚠️ Uso: `.menu set <testo>`\nEs. `.menu set Benvenuti nel VEX — scegli qui sotto`");
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

        // ── HOME — testo sopra impostabile, 1 pill scura + 1 bianca ─────
        const customTop = (db?._config?.menuText) || null;
        // Testo sopra: se l'owner ha impostato un testo, usa quello, altrimenti default
        const topText = customTop ? customTop : `VEX  -  BOT  -  2K26`;
        const caption =
`${topText}

ㅤㅤ⋆｡˚『 ╭ \`VEX\` ╯ 』˚｡⋆
╭
│ ➤ Premi qui sotto
╰⭒─ׄ─ׅ─ׄ─⭒`;

        // 1 pill scura + 1 bianca con font carino
        const whiteLabel = `°${styledEntra}°`;
        const buttons = [
            { label: 'MENU', id: 'allmenu' },
            { label: whiteLabel, url: sponsorLink },
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
                        { buttonId: 'allmenu', buttonText: { displayText: 'MENU' }, type: 1 },
                        { buttonId: 'join_us', buttonText: { displayText: whiteLabel }, type: 1 },
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
