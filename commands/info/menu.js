'use strict';

const config = require('../../config');
const { toStyle } = require('../../lib/font');

const styledEntra = toStyle('ENTRA NEL NOSTRO GRUPPO', 'scriptBold');

const SECTIONS = [
    { key: 'tool', label: 'Tool', emoji: '🛠️', desc: 'Utility, meteo, AI, sicurezza', cmds: ['meteo7','nastro','profilo','ping','ai','storia','genio','antilink','antinuke'] },
    { key: 'fun', label: 'Fun', emoji: '🎲', desc: 'Giochi, social, interazioni', cmds: ['dado','tris','wordle','ship','gay','meme','scopa','sega'] },
    { key: 'economia', label: 'Economia', emoji: '💰', desc: 'Shop, mine, casino', cmds: ['shop','mine','scava','daily','work','top'] },
    { key: 'media', label: 'Media', emoji: '📥', desc: 'Sticker, audio, film', cmds: ['sticker','toimg','mp3','film','certificato'] },
    { key: 'gruppo', label: 'Gruppo', emoji: '👥', desc: 'Tag, link, warn, admin', cmds: ['tag','link','warn','promote','kick','chiudi'] },
    { key: 'sicurezza', label: 'Sicurezza', emoji: '🛡️', desc: 'Antilink, antinuke, antiflood', cmds: ['antilink','antinuke','antiflood','sicurezza'] },
];

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu rifatto da 0: 1 pill per sezioni (single_select) + 1 bianca.",

    async run(sock, msg, args, context) {
        const { textArgs, isOwner, reply, services } = context;
        const { sendButtons, db, saveDB, commands } = services;

        const raw = String(textArgs||'').trim();
        const q = raw.toLowerCase();
        const sponsorLink = (db?._config?.sponsorLink) || config.SPONSOR_LINK || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';

        // ── SET TESTO ───────────────────────────────────────────────────
        if (q.startsWith('set ')) {
            if (!isOwner) return reply("⛔ Solo owner.");
            const t = raw.slice(4).trim();
            if (!t) return reply("Uso: .menu set <testo>");
            if (t.length > 500) return reply("Max 500.");
            if (!db._config) db._config = {};
            db._config.menuText = t;
            saveDB();
            return reply(`✅ Testo impostato:\n${t.slice(0,80)}`);
        }
        if (q === 'set') {
            const cur = db?._config?.menuText || '(default)';
            return reply(`Testo attuale: ${cur}\nUsa .menu set <testo>`);
        }

        // ── LISTA SEZIONI (pulsanti normali) ──────────────────────────────
        if (q === 'sezioni') {
            const txt =
`ㅤㅤ⋆｡˚『 ╭ \`SEZIONI\` ╯ 』˚｡⋆
╭
${SECTIONS.map(s => `│ ➤『${s.emoji}』 ${s.label} — ${s.desc}`).join('\n')}
╰⭒─ׄ─ׅ─ׄ─⭒
Tocca un pulsante qui sotto`;
            return sendButtons(sock, msg.from, txt, [
                { label: '🛠️ Tool', id: 'menu tool' },
                { label: '🎲 Fun', id: 'menu fun' },
                { label: '💰 Economia', id: 'menu economia' },
                { label: `°${styledEntra}°`, url: sponsorLink },
            ], msg, null, { headerTitle: 'VEX — SEZIONI', footerText: '6 sezioni' });
        }

        // ── SE HAI SCELTO UNA SEZIONE (arriva come "tool", "fun", ecc.) ──
        const found = SECTIONS.find(s => s.key === q);
        if (found) {
            // Costruisci lista comandi della sezione
            const allCmds = commands ? [...commands.values()] : [];
            const available = new Set(allCmds.filter(c=>!c.hidden).map(c=>c.name));
            const list = found.cmds.filter(c => available.has(c)).map(c => `│ ➤『${found.emoji}』 .${c}`).join('\n');
            const txt =
`ㅤㅤ⋆｡˚『 ╭ \`${found.label.toUpperCase()}\` ╯ 』˚｡⋆
╭
${list || '│ (nessun comando)'}
╰⭒─ׄ─ׅ─ׄ─⭒
*VEX BOT* · ${found.desc}`;
            return sendButtons(sock, msg.from, txt, [
                { label: '⬅️ MENU', id: 'menu' },
                { label: `°${styledEntra}°`, url: sponsorLink },
            ], msg, null, { headerTitle: `VEX — ${found.label.toUpperCase()}`, footerText: 'Tocca per aprire' });
        }

        // ── HOME ────────────────────────────────────────────────────────
        const topText = (db?._config?.menuText) || 'VEX  -  BOT  -  2K26';
        const caption =
`${topText}

ㅤㅤ⋆｡˚『 ╭ \`VEX\` ╯ 』˚｡⋆
╭
│ ➤ Premi il pulsante qui sotto
│   per vedere le sezioni
╰⭒─ׄ─ׅ─ׄ─⭒`;

        const whiteLabel = `°${styledEntra}°`;

        return sendButtons(sock, msg.from, caption, [
            { label: '📂 SEZIONI', id: 'menu sezioni' },
            { label: whiteLabel, url: sponsorLink },
        ], msg, null, {
            headerTitle: 'VEX  -  BOT  -  2K26',
            footerText: 'Tocca per aprire',
        });
    },
};
