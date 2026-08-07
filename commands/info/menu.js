'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  MENU NAVIGABILE — ScopaAmico Bot
//  .menu              → HOME: indice delle sezioni + pulsanti rapido accesso
//  .menu <sezione>    → apre la sezione (es. .menu economia, .menu 2)
//  I pulsanti sotto ogni schermata navigano: ⬅️ Prec | 🏠 Home | ➡️ Succ
// ─────────────────────────────────────────────────────────────────────────────

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    if (cc >= 48 && cc <= 57) return String.fromCodePoint(0x1D7E2 + cc - 48);
    return c;
}).join('');
const BF = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D56C + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D586 + cc - 97);
    return c;
}).join('');

// Riga comando: `│   {emoji} {COMANDO}  {hint}`
const L = (emoji, cmd, extra = '') => `│ ${emoji} ${SB('.' + cmd)}${extra ? ' ' + extra : ''}`;

// ── DEFINIZIONE SEZIONI ──────────────────────────────────────────────────────
// key = nome usato nei comandi (.menu <key>), title = nome visualizzato.
// Solo sezioni valide per tutti; quelle admin/owner sono segnate per filtro.
const SECTIONS = [
    {
        key: 'economia', emoji: '💰', title: 'ECONOMIA',
        items: [
            ['⛏️', 'scava'], ['🎰', 'casino'], ['🎲', 'dadi'], ['🎰', 'slot'],
            ['🔴', 'roulette'], ['🪨', 'sasso'], ['📅', 'daily'], ['🏧', 'deposita'],
            ['💳', 'preleva'], ['🦹', 'ruba'], ['⚔️', 'colpisci'], ['🎟️', 'lotteria'],
            ['🏆', 'top'], ['🤑', 'ricchi'], ['💝', 'famiglia'], ['🎁', 'dona'],
        ],
    },
    {
        key: 'giochi', emoji: '🎲', title: 'GIOCHI',
        items: [
            ['❓', 'quiz'], ['🏁', 'bandiera'], ['💞', 'compatibilita'], ['⚔️', 'duello'],
            ['🎯', 'indovina'], ['🪙', 'testa'], ['🎲', 'parita'], ['🃏', 'alta'],
            ['🃏', 'blackjack'], ['🎡', 'ruota'], ['🎟️', 'gratta'], ['⚡', 'reazione'],
            ['🧩', 'parola'], ['🧠', 'memoria'],
        ],
    },
    {
        key: 'social', emoji: '💞', title: 'SOCIAL',
        items: [
            ['💞', 'ship'], ['🏳️‍🌈', 'gay'], ['💖', 'simpatometro'], ['📊', 'percentuale'],
            ['🤔', 'scelta'], ['🌸', 'fiore'], ['🦸', 'personaggio'], ['📺', 'anime'],
            ['🖥️', 'assemblapc'], ['🤫', 'verita'], ['🫣', 'obbligo'], ['🔮', 'oroscopo'],
            ['🐺', 'maranza'],
        ],
    },
    {
        key: 'interazioni', emoji: '🔥', title: 'INTERAZIONI',
        items: [
            ['🖐️', 'schiaffo'], ['😘', 'bacia'], ['🪙', 'flip'], ['🎱', '8ball'],
            ['📊', 'rate'], ['🤔', 'wyr'], ['💭', 'quote'], ['🫂', 'abbraccia'],
            ['💍', 'sposa'], ['🍑', 'paccasulculo'], ['🔪', 'uccidi'], ['🤬', 'insulta'],
            ['🔞', 'scopa'], ['💦', 'sborra'], ['👉👌', 'ditalino'], ['🍆', 'sega'],
            ['🤰', 'incinta'], ['🍒', 'tette'], ['😂', 'meme'], ['🥊', 'rissa'],
            ['🍆', 'cazzo'], ['🤪', 'sclero'],
        ],
    },
    {
        key: 'utility', emoji: '🛠️', title: 'UTILITY',
        items: [
            ['👤', 'profilo'], ['📡', 'ping'], ['ℹ️', 'groupinfo'], ['🌤️', 'weather'],
            ['🆔', 'id'], ['🧮', 'calc'], ['🔢', 'base64'], ['🔣', 'hex'],
            ['📊', 'count'], ['🔐', 'password'], ['▦', 'qr'], ['🔑', 'uuid'],
            ['🌐', 'translate'], ['🪙', 'crypto'], ['💱', 'currency'], ['🔗', 'tinyurl'],
            ['📚', 'wiki'], ['🕐', 'ora'], ['🌙', 'afk'], ['📄', 'readmore'],
            ['👑', 'owner'], ['🐛', 'report'], ['🌟', 'sponsor'],
        ],
    },
    {
        key: 'musica', emoji: '🎧', title: 'MUSICA',
        items: [
            ['🎧', 'lastfm'], ['🎶', 'cur'], ['🎵', 'lyrics'], ['🔊', 'tts'],
        ],
    },
    {
        key: 'audio', emoji: '🔊', title: 'AUDIO',
        items: [
            ['🎙️', 'deep'], ['🔄', 'reverse'], ['🗣️', 'echo'], ['🤖', 'robot'],
            ['🥴', 'drunk'], ['🔊', 'bass'], ['🌙', 'nightcore'], ['🔮', '8d'],
            ['🐿️', 'chipmunk'],
        ],
    },
    {
        key: 'media', emoji: '📥', title: 'MEDIA',
        items: [
            ['📸', 'ig'], ['💀', 'wasted'], ['📖', 'pokedex'], ['🤡', 'clown'],
            ['🖼️', 'toimg'], ['📹', 'vv'], ['🎨', 'sticker'], ['🏃', 'rubato'],
            ['💻', 'hack'], ['👥', 'clona'],
        ],
    },
    {
        key: 'ai', emoji: '🤖', title: 'AI',
        items: [
            ['🧠', 'ai'],
        ],
    },
    {
        key: 'sicurezza', emoji: '🛡️', title: 'SICUREZZA',
        items: [
            ['📞', 'antivoip'], ['💼', 'antiwzbusiness'], ['🔥', 'antiflame'],
            ['🤖', 'antibot'], ['🔗', 'antilink'], ['🤬', 'bestemmiometro'],
        ],
    },
    {
        key: 'admin', emoji: '⚙️', title: 'ADMIN', adminOnly: true,
        items: [
            ['📢', 'tag'], ['📢', 'tagall'], ['🔒', 'chiudi'], ['🔓', 'apri'],
            ['🚫', 'ban'], ['🔗', 'link'], ['🗑️', 'del'], ['🔇', 'mute'],
            ['🔊', 'unmute'], ['⚠️', 'warn'], ['✅', 'unwarn'], ['📈', 'promote'],
            ['📉', 'demote'], ['✅', 'accettarichieste'], ['🗣️', 'say'], ['🔗', 'invito'],
            ['⏸️', 'pausa'], ['▶️', 'riprendi'], ['🛡️', 'modoadmin'],
        ],
    },
    {
        key: 'gestione', emoji: '📋', title: 'GESTIONE', adminOnly: true,
        items: [
            ['📛', 'setname'], ['📝', 'setdesc'], ['🔄', 'revoke'], ['👑', 'tagadmin'],
            ['📋', 'list'], ['🖼️', 'seticon'], ['🏞️', 'grouppic'], ['➕', 'add'],
            ['🚪', 'kick'], ['👋', 'leave'], ['📊', 'admincount'], ['⏳', 'ephemeral'],
            ['⚠️', 'warnlist'], ['✅', 'resetwarns'], ['📌', 'pin'],
        ],
    },
    {
        key: 'stato', emoji: '🗂️', title: 'STATO',
        items: [
            ['📊', 'status'], ['📦', 'groups'], ['📋', 'infobot'],
        ],
    },
    {
        key: 'owner', emoji: '👑', title: 'OWNER', ownerOnly: true,
        items: [
            ['⏻', 'spegni'], ['⏼', 'accendi'], ['🔄', 'riavvia'], ['👋', 'welcome'],
            ['👋', 'goodbye'], ['🔗', 'setlink'], ['👑', 'addowner'], ['🗑️', 'unowner'],
            ['📜', 'log'], ['📦', 'aggiorna'], ['🧹', 'clear'], ['⛳', 'godmode'],
        ],
    },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

// Trova una sezione per key o per numero (1-based). Ritorna { index, section }.
const findSection = (query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return null;
    if (/^\d+$/.test(q)) {
        const i = parseInt(q, 10) - 1;
        if (i >= 0 && i < SECTIONS.length) return { index: i, section: SECTIONS[i] };
        return null;
    }
    const i = SECTIONS.findIndex(s => s.key === q);
    if (i >= 0) return { index: i, section: SECTIONS[i] };
    return null;
};

const listFor = (section, isOwner, isGroup) => {
    if (section.ownerOnly && !isOwner) return null;
    if (section.adminOnly && !isGroup) return null;
    return section.items;
};

// Header HOME: elenca solo le sezioni accessibili all'utente
const homeHeader = (pushName, timeStr, dateStr, isOwner, isGroup) => {
    const visible = SECTIONS.map((s, i) => ({ s, i }))
        .filter(({ s }) => listFor(s, isOwner, isGroup) !== null);
    const lines = visible.map(({ s, i }) => `${String(i + 1).padStart(2, '0')} ${s.emoji} ${s.title}`);
    return (
`╭── ✦ ${SB('SCOPAMICO BOT')} ✦ ──╮
│ 👤 ${pushName.slice(0, 14).padEnd(14)} 🕐 ${timeStr} ${dateStr}
├── 🧭 ${BF('NAVIGA IL MENU')} ────┤
│ Usa i pulsanti per scorrere,
│ 🏠 per tornare qui, oppure
│ scrivi  .menu <sezione>
│
│ ${lines.join('\n│ ')}
├── ⭐ ${BF('RAPIDO ACCESSO')} ─────┤
│ Premi un pulsante qui sotto per
│ aprire subito una sezione.
╰──────────────────────────────────╯`
    );
};

// Schermata sezione: header + righe comandi
const sectionScreen = (section, index, pushName) => {
    const header =
`╭── ${section.emoji} ${SB(section.title)} (${index + 1}/${SECTIONS.length}) ──╮
│ 👤 ${pushName.slice(0, 14).padEnd(14)}
│`;
    const rows = section.items.map(([e, cmd]) => L(e, cmd)).join('\n');
    return `${header}
${rows}
╰──────────────────────────────────╯`;
};

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Mostra l'elenco dei comandi per sezioni, navigabile con i pulsanti.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { db, sendButtons, editButtons } = services;

        let pfpUrl;
        try { pfpUrl = await sock.profilePictureUrl(from, 'image'); } catch (_) { pfpUrl = null; }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
        const name = pushName || 'Utente';

        // Se il comando arriva da un pulsante premuto, possiamo MODIFICARE la
        // bolla del menu già inviata (niente spam) invece di mandarne una nuova.
        // contextInfo.stanzaId è l'id del messaggio originale col pulsante.
        const editKey = (isButton && contextInfo?.stanzaId)
            ? { remoteJid: from, id: contextInfo.stanzaId, participant: contextInfo.participant }
            : null;

        const show = async (txt, buttons) => {
            if (editKey) return editButtons(sock, from, txt, buttons, editKey, msg);
            return sendButtons(sock, from, txt, buttons, msg);
        };

        // ── SEZIONE RICHIESTA ─────────────────────────────────────────────
        const found = findSection(textArgs);
        if (textArgs && textArgs.trim().toLowerCase() !== 'home') {
            if (found) {
                const list = listFor(found.section, isOwner, isGroup);
                if (!list) {
                    return reply('🔒 Sezione riservata. Non hai i permessi per vederla.');
                }
                const n = SECTIONS.length;
                const prev = SECTIONS[(found.index - 1 + n) % n];
                const next = SECTIONS[(found.index + 1) % n];
                const txt = sectionScreen(found.section, found.index, name);
                return show(txt, [
                    { label: '⬅️ Prec', id: `menu ${prev.key}` },
                    { label: '🏠 Home', id: 'menu' },
                    { label: '➡️ Succ', id: `menu ${next.key}` },
                ]);
            }
            // Sezione inesistente → HOME con avviso
            const txt = homeHeader(name, timeStr, dateStr, isOwner, isGroup);
            return show(txt, [
                { label: '💰 Economia', id: 'menu economia' },
                { label: '🛠️ Utility', id: 'menu utility' },
                { label: '🎲 Giochi', id: 'menu giochi' },
            ]);
        }

        // ── HOME ──────────────────────────────────────────────────────────
        const txt = homeHeader(name, timeStr, dateStr, isOwner, isGroup);
        if (pfpUrl && !editKey) {
            await sock.sendMessage(from,
                { image: { url: pfpUrl }, caption: txt },
                { quoted: msg }
            );
        }
        return show(txt, [
            { label: '💰 Economia', id: 'menu economia' },
            { label: '🛠️ Utility', id: 'menu utility' },
            { label: '🎲 Giochi', id: 'menu giochi' },
        ]);
    },
};
