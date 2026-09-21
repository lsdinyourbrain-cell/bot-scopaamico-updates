'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');
const { svgToPng } = require('../../lib/svg2png');

const pkg = require('../../package.json');
const config = require('../../config');

const toBold = (s) => `*${String(s||'').trim()}*`;

const SECTION_BORDER = '╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─';
const CMD_LINE = (emoji, cmd) => `│ ➤『${emoji}』 .${cmd}`;

const SECTIONS = [
    {
        key: 'novita', emoji: '🆕', title: 'NOVITÀ',
        items: [
            ['🛍️', 'shop'], ['⛏️', 'mine'], ['🍽️', 'ricette'], ['🌤️', 'meteo7'],
            ['🎬', 'film'], ['🔮', 'indovina_emoji'], ['🏁', 'corsa'], ['🔫', 'banda'],
            ['📖', 'storia'], ['🧞', 'genio'], ['📰', 'fakenews'], ['🏅', 'certificato'],
            ['📊', 'nastro'], ['⚡', 'evento'], ['🔥', 'orgia'], ['💃', 'striptease'],
        ],
    },
    {
        key: 'economia', emoji: '💰', title: 'ECONOMIA',
        items: [
            ['🛍️', 'shop'], ['⛏️', 'mine'], ['⛏️', 'scava'], ['🎰', 'casino'],
            ['🎲', 'dadi'], ['🎰', 'slot'], ['🔴', 'roulette'], ['🪨', 'sasso'],
            ['📅', 'daily'], ['🏧', 'deposita'], ['💳', 'preleva'], ['🦹', 'ruba'],
            ['🔫', 'spara'], ['🎟️', 'lotteria'], ['🏆', 'top'], ['🤑', 'ricchi'],
            ['💝', 'famiglia'], ['🎁', 'dona'], ['📈', 'investi'], ['💼', 'work'],
            ['🔥', 'streak'], ['📦', 'cassaforte'], ['⭐', 'reputazione'], ['💪', 'lavoro2'],
            ['🎁', 'regalo'], ['🏷️', 'titolo'], ['🎴', 'carte'],
        ],
    },
    {
        key: 'giochi', emoji: '🎮', title: 'GIOCHI',
        items: [
            ['🔮', 'indovina_emoji'], ['🏁', 'corsa'], ['🔫', 'banda'], ['❓', 'quiz'],
            ['🏁', 'bandiera'], ['💞', 'compatibilita'], ['⚔️', 'duello'], ['🎯', 'indovina'],
            ['🪙', 'testa'], ['🎲', 'parita'], ['🃏', 'alta'], ['🃏', 'blackjack'],
            ['🎡', 'ruota'], ['🎟️', 'gratta'], ['⚡', 'reazione'], ['🧩', 'parola'],
            ['🧠', 'memoria'], ['🧩', 'enigma'], ['🃏', 'poker'], ['🔫', 'russia'],
            ['🎱', 'tombola'], ['🎯', 'impiccato'], ['⭕', 'tris'], ['🔴', 'forza4'],
            ['🟩', 'wordle'], ['🌀', 'labirinto'], ['🏆', 'trivia2'], ['🎭', 'akinator'],
        ],
    },
    {
        key: 'social', emoji: '💞', title: 'SOCIAL',
        items: [
            ['💞', 'ship'], ['🏳️‍🌈', 'gay'], ['💖', 'simpatometro'], ['📊', 'percentuale'],
            ['🤔', 'scelta'], ['🌸', 'fiore'], ['🦸', 'personaggio'], ['📺', 'anime'],
            ['🖥️', 'assemblapc'], ['🤫', 'verita'], ['🫣', 'obbligo'], ['🔮', 'oroscopo'],
            ['🐺', 'maranza'], ['🤡', 'coglionometro'], ['😬', 'cringeometro'], ['🐉', 'dragoometro'],
            ['👫', 'eterometro'], ['😎', 'fighometro'], ['🦄', 'gayometro'], ['🐍', 'infamometro'],
            ['🧠', 'intelligentometro'], ['💕', 'lesbometro'], ['🤦', 'minchiometro'], ['💰', 'riccometro'],
            ['🍀', 'sfigometro'], ['💩', 'stronometro'], ['🗡️', 'traditoreometro'],
        ],
    },
    {
        key: 'interazioni', emoji: '🔥', title: 'INTERAZIONI',
        items: [
            ['🖐️', 'schiaffo'], ['😘', 'bacia'], ['🪙', 'flip'], ['🎱', '8ball'],
            ['📊', 'rate'], ['🤔', 'wyr'], ['💭', 'quote'], ['🫂', 'abbraccia'],
            ['💍', 'sposa'], ['🍑', 'paccasulculo'], ['🔪', 'uccidi'], ['🤬', 'insulta'],
            ['🔞', 'scopa'], ['💦', 'sborra'], ['👉👌', 'ditalino'], ['🍆', 'sega'],
            ['💧', 'squirt'], ['🤰', 'incinta'], ['🍒', 'tette'], ['😂', 'meme'],
            ['🥊', 'rissa'], ['🍆', 'cazzo'], ['🤪', 'sclero'], ['🍺', 'drink'],
            ['🍀', 'fact'], ['🗣️', 'gossip'], ['😂', 'joke'], ['🍆', 'palo'],
            ['🤖', 'pick'], ['🙏', 'scusa'], ['😏', 'pervertometro'], ['💋', 'puttanometro'],
            ['💦', 'sborrometro'], ['🔞', 'scopometro'], ['🍆', 'segaiometro'], ['👄', 'troiometro'],
            ['👠', 'zoccolometro'],
            ['👅', 'lecca'], ['🦷', 'mordi'], ['🤲', 'palpa'], ['😏', 'stuzzica'], ['👄', 'succhia'],
            ['🍑', 'monta'], ['🏇', 'cavalca'], ['💃', 'struscia'], ['👃', 'annusa'], ['😆', 'solletica'],
            ['🤏', 'pizzica'], ['🤗', 'accarezza'], ['🥰', 'coccola'], ['👑', 'vizia'], ['👄', 'pompin'],
            ['🐕', 'pecorina'], ['❤️', 'missionario'], ['🍑', 'anale'], ['💋', 'preliminare'], ['💆', 'massaggio'],
            ['💋', 'baciocoll'], ['😘', 'succhiotto'], ['👅', 'lingua'], ['😬', 'mordicchia'], ['💅', 'graffia'],
            ['🍑', 'sculaccia'], ['⛓️', 'lega'], ['🤐', 'bavaglio'], ['🔨', 'frustata'], ['👅', 'cunnilingus'],
            ['👄', 'fellatio'], ['6️⃣', 'sessantnove'], ['💥', 'orgasmo'], ['💦', 'eiacula'], ['✋', 'masturba'],
            ['☝️', 'dito'], ['🍆', 'penetra'], ['🔥', 'tromba'], ['🍑', 'inculata'], ['💦', 'sborrata2'],
            ['💦', 'squirting'], ['🥛', 'creampie'], ['👥', 'gangbang'], ['3️⃣', 'threesome'], ['👗', 'spoglia'],
            ['🤚', 'strangola'], ['👠', 'dominas'], ['🙇', 'sottomessa'], ['💦', 'venuta'], ['👉', 'ditalino2'],
            ['💦', 'pompa'],
        ],
    },
    {
        key: 'utility', emoji: '🛠️', title: 'UTILITY',
        items: [
            ['🌤️', 'meteo7'], ['📊', 'nastro'], ['👤', 'profilo'], ['📡', 'ping'],
            ['ℹ️', 'groupinfo'], ['🌤️', 'weather'], ['🆔', 'id'], ['🧮', 'calc'],
            ['🔢', 'base64'], ['🔣', 'hex'], ['📊', 'count'], ['🔐', 'password'],
            ['▦', 'qr'], ['🔑', 'uuid'], ['🌐', 'translate'], ['🪙', 'crypto'],
            ['💱', 'currency'], ['🔗', 'tinyurl'], ['📚', 'wiki'], ['🕐', 'ora'],
            ['🌙', 'afk'], ['📄', 'readmore'], ['👑', 'owner'], ['🐛', 'report'],
            ['🌟', 'sponsor'], ['🛡️', 'admin'], ['⏰', 'promemoria'], ['📊', 'sondaggio'],
            ['🔄', 'converti'], ['⏳', 'timer'], ['🌙', 'afklist'], ['📜', 'registro'],
            ['📘', 'aiuto'], ['📝', 'riassunto'],
        ],
    },
    {
        key: 'musica', emoji: '🎧', title: 'MUSICA',
        items: [
            ['🎧', 'lastfm'], ['🎶', 'cur'], ['🔎', 'cerca'], ['🎵', 'lyrics'],
            ['🔊', 'tts'], ['🎵', 'mp3'],
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
            ['🍽️', 'ricette'], ['🎬', 'film'], ['🏅', 'certificato'], ['📸', 'ig'],
            ['💀', 'wasted'], ['📖', 'pokedex'], ['🤡', 'clown'], ['🖼️', 'toimg'],
            ['📹', 'vv'], ['🎨', 'sticker'], ['🏃', 'rubato'], ['💻', 'hack'],
            ['👥', 'clona'], ['✨', 'attp'], ['🧹', 'removebg'], ['🎨', 'mememaker'],
            ['😜', 'emojimix'], ['🔣', 'ascii'], ['💧', 'wm'],
        ],
    },
    {
        key: 'ai', emoji: '🤖', title: 'AI',
        items: [
            ['🧠', 'ai'], ['📖', 'storia'], ['🧞', 'genio'], ['📰', 'fakenews'],
        ],
    },
    {
        key: 'sicurezza', emoji: '🛡️', title: 'SICUREZZA',
        items: [
            ['📞', 'antivoip'], ['💼', 'antiwzbusiness'], ['🔥', 'antiflame'], ['🤖', 'antibot'],
            ['🔗', 'antilink'], ['🛡️', 'antinuke'], ['🤬', 'bestemmiometro'], ['🛡️', 'sicurezza'],
        ],
    },
    {
        key: 'admin', emoji: '⚙️', title: 'ADMIN', adminOnly: true,
        items: [
            ['📢', 'tag'], ['📢', 'tagall'], ['🔒', 'chiudi'], ['🔓', 'apri'],
            ['🚫', 'ban'], ['🔗', 'link'], ['🗑️', 'del'], ['🔇', 'mute'],
            ['🔊', 'unmute'], ['⚠️', 'warn'], ['✅', 'unwarn'], ['📈', 'promote'],
            ['📉', 'demote'], ['✅', 'richieste'], ['🗣️', 'say'], ['🔗', 'invito'],
            ['⏸️', 'pausa'], ['▶️', 'riprendi'], ['🛡️', 'modoadmin'], ['📈', 'p'],
            ['📉', 'd'], ['⚡', 'evento'], ['📜', 'registro'], ['🔁', 'antiflood'],
            ['🚫', 'escludi'],
            ['🚫', 'antibadword'], ['🔄', 'antispam'], ['👁️', 'antiviewonce'], ['🎨', 'antisticker'], ['🖼️', 'antiimage'],
            ['🎥', 'antivideo'], ['📢', 'antimention'], ['🚪', 'antileave'], ['🗑️', 'antidelete'], ['🐢', 'slowmode'],
            ['👋', 'setwelcome'], ['👋', 'setgoodbye'], ['📜', 'setrules'], ['📋', 'rules'],
            ['🗳️', 'votekick'], ['⏰', 'tempban'],
            ['🔗', 'invitelink'], ['🤖', 'antifake'],
            ['📵', 'antistatus'], ['🖼️', 'mediaonly'], ['💾', 'gbackup'], ['📝', 'notes'], ['📊', 'polladmin'], ['📢', 'announce'],
            ['😀', 'autoreact'], ['🔍', 'chatfilter'], ['🕐', 'bizhours'], ['📜', 'grouplog'], ['📈', 'activity'],
            ['🏆', 'leaderboardadmin'], ['📊', 'chatrank'], ['🤫', 'confessadmin'], ['🔗', 'wordchain'], ['🤖', 'autoresponder'],
            ['👋', 'welcome2'], ['👋', 'goodbye2'], ['🔒', 'restrict'],
        ],
    },
    {
        key: 'gestione', emoji: '📋', title: 'GESTIONE', adminOnly: true,
        items: [
            ['📛', 'setname'], ['📝', 'setdesc'], ['🔄', 'revoke'], ['👑', 'tagadmin'],
            ['📋', 'list'], ['🖼️', 'seticon'], ['🏞️', 'grouppic'], ['➕', 'add'],
            ['🚪', 'kick'], ['👋', 'leave'], ['📊', 'admincount'], ['⏳', 'ephemeral'],
            ['⚠️', 'warnlist'], ['✅', 'resetwarns'], ['📌', 'pin'], ['🧹', 'kickall'],
            ['👑', 'promoteall'], ['⬇️', 'demoteall'], ['🚫', 'escludi'],
        ],
    },
    {
        key: 'stato', emoji: '🗂️', title: 'STATO',
        items: [
            ['📊', 'status'], ['📦', 'groups'], ['🏆', 'topgruppi'], ['📋', 'infobot'],
            ['🧭', 'menu'], ['📚', 'allmenu'],
        ],
    },
    {
        key: 'owner', emoji: '👑', title: 'OWNER', ownerOnly: true,
        items: [
            ['⏻', 'spegni'], ['⏼', 'accendi'], ['🔄', 'riavvia'], ['👋', 'welcome'],
            ['👋', 'goodbye'], ['🔗', 'setlink'], ['👑', 'addowner'], ['🗑️', 'unowner'],
            ['🧹', 'removecoowners'], ['📜', 'log'], ['📦', 'aggiorna'], ['🧹', 'clear'],
            ['⛳', 'godmode'], ['🔍', 'check'], ['🩺', 'diagnostica'], ['💰', 'setmoney'],
        ],
    },
];

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

const fmtUptime = (sec) => {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}g ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const homeScreen = (pushName, timeStr, dateStr, stats, tip, visible) => {
    const name = (pushName || 'Utente').slice(0, 15);
    const list = visible.map(s => `│ ➤『${s.emoji}』 ${s.title}`).join('\n');
    return (
`ㅤㅤ⋆｡˚『 ╭ \`VEX BOT\` ╯ 』˚｡⋆
╭
│ ⚜️ ${stats.cmds} comandi · v${stats.version}
│ ⏱️ uptime ${stats.uptime}
│ 👤 ${name}
│ 🕒 ${timeStr}  ${dateStr}
${SECTION_BORDER}
${list}
▸ *.menu <nome>* per aprire
💡 _${tip}_`);
};

const sectionScreen = (section) => {
    const rows = section.items.map(([e, cmd]) => CMD_LINE(e, cmd)).join('\n');
    return (
`ㅤㅤ⋆｡˚『 ╭ \`${section.title}\` ╯ 』˚｡⋆
╭
${rows}
${SECTION_BORDER}`);
};

// ── CAROSELLO: card essenziali (niente sezioni buttate lì), ognuna con
// UN solo pulsante che apre la lista nativa WhatsApp con i comandi scelti.
// Foto: profilo del gruppo; se manca, banner generato in locale.
const MACROS = [
    { key: 'sicurezza', emoji: '🛡️', title: 'SICUREZZA', desc: 'Blocca link, spam e attacchi.', c1: '#e11d48', c2: '#7f1d1d', cmds: [
        { label: '🛡️ Antilink', id: 'antilink', desc: 'Blocca i link' },
        { label: '🤖 Antibot', id: 'antibot', desc: 'Blocca i bot' },
        { label: '🛡️ Antinuke', id: 'antinuke', desc: 'Anti distruzione' },
        { label: '🔁 Antiflood', id: 'antiflood', desc: 'Anti spam' },
        { label: '📊 Stato', id: 'status', desc: 'Stato protezioni' },
    ] },
    { key: 'gruppo', emoji: '👥', title: 'GRUPPO', desc: 'Membri e moderazione.', c1: '#2563eb', c2: '#1e1b4b', cmds: [
        { label: '📢 Tagga tutti', id: 'tagall', desc: 'Menziona tutti' },
        { label: '🚪 Kick', id: 'kick', desc: 'Rimuovi uno' },
        { label: '🔇 Mute', id: 'mute', desc: 'Silenzia uno' },
        { label: '⚠️ Warn', id: 'warn', desc: 'Avverti uno' },
        { label: '👋 Welcome', id: 'welcome', desc: 'Benvenuto' },
        { label: '🔗 Link', id: 'link', desc: 'Link invito' },
    ] },
    { key: 'economia', emoji: '💰', title: 'ECONOMIA', desc: 'Soldi e classifiche.', c1: '#ca8a04', c2: '#422006', cmds: [
        { label: '📅 Daily', id: 'daily', desc: 'Bonus giorno' },
        { label: '💼 Work', id: 'work', desc: 'Lavora' },
        { label: '🛍️ Shop', id: 'shop', desc: 'Negozio' },
        { label: '🏆 Top', id: 'top', desc: 'Classifica' },
        { label: '⛏️ Mine', id: 'mine', desc: 'Miniera' },
    ] },
    { key: 'giochi', emoji: '🎮', title: 'GIOCHI', desc: 'Sfide e passatempi.', c1: '#7c3aed', c2: '#2e1065', cmds: [
        { label: '⭕ Tris', id: 'tris', desc: 'Filetto' },
        { label: '🎯 Impiccato', id: 'impiccato', desc: 'Indovina' },
        { label: '❓ Quiz', id: 'quiz', desc: 'Domande' },
        { label: '♟️ Scacchi', id: 'scacchi', desc: 'Sfida' },
    ] },
    { key: 'media', emoji: '🎨', title: 'MEDIA', desc: 'Sticker, musica, meteo.', c1: '#db2777', c2: '#500f28', cmds: [
        { label: '🎨 Sticker', id: 'sticker', desc: 'Da foto' },
        { label: '🔎 Cerca', id: 'cerca', desc: 'Musica e video' },
        { label: '🌤️ Meteo', id: 'meteo7', desc: 'Previsioni' },
        { label: '🎶 Testo', id: 'lyrics', desc: 'Testi canzoni' },
        { label: '🔊 TTS', id: 'tts', desc: 'Voce' },
    ] },
    { key: 'utility', emoji: '🛠️', title: 'UTILITY', desc: 'Strumenti veloci.', c1: '#0891b2', c2: '#164e63', cmds: [
        { label: '⚡ Ping', id: 'ping', desc: 'Velocità' },
        { label: '💞 Ship', id: 'ship', desc: 'Coppia' },
        { label: '📘 Aiuto', id: 'aiuto', desc: 'Guida' },
        { label: '🧮 Calc', id: 'calc', desc: 'Calcoli' },
        { label: 'ℹ️ Gruppo', id: 'groupinfo', desc: 'Info gruppo' },
    ] },
    { key: 'owner', emoji: '👑', title: 'OWNER', desc: 'Solo proprietario.', c1: '#b45309', c2: '#451a03', ownerOnly: true, cmds: [
        { label: '🔄 Riavvia', id: 'riavvia', desc: 'Riavvia bot' },
        { label: '📦 Aggiorna', id: 'aggiorna', desc: 'Aggiorna' },
        { label: '📜 Log', id: 'log', desc: 'Registro' },
    ] },
];

const bannerSvg = (c1, c2) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><circle cx="680" cy="70" r="150" fill="#ffffff" opacity="0.12"/><circle cx="110" cy="340" r="110" fill="#000000" opacity="0.18"/><circle cx="400" cy="200" r="230" fill="#ffffff" opacity="0.06"/><rect x="60" y="300" width="220" height="26" rx="13" fill="#ffffff" opacity="0.25"/></svg>`;

const bannerCache = new Map();
const bannerPng = async (macro, sharp) => {
    if (bannerCache.has(macro.key)) return bannerCache.get(macro.key);
    try {
        const buf = await svgToPng(bannerSvg(macro.c1, macro.c2), sharp || null);
        bannerCache.set(macro.key, buf);
        return buf;
    } catch (_) {
        return null;
    }
};

const macroList = (macro) => ({
    type: 'single_select',
    label: '📂 Scegli',
    title: macro.title,
    sectionTitle: 'Scegli un comando',
    rows: macro.cmds.map(c => ({
        title: c.label,
        description: c.desc,
        id: c.id,
    })),
});

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu VEX: carosello sezioni con pulsanti, dettaglio per sezione.",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, pushName, isGroup, isOwner, isButton, contextInfo, reply, services } = context;
        const { sendButtons, sendCarousel, commands } = services;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

        const stats = {
            cmds: commands ? new Set([...commands.values()].filter(m => !m.hidden)).size : SECTIONS.reduce((n, s) => n + s.items.length, 0),
            version: pkg.version,
            uptime: fmtUptime(process.uptime()),
        };

        const q = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0] || '';
        const q2 = String(textArgs || '').trim().toLowerCase().split(/\s+/)[1] || '';

        // ── LISTA NATIVA di una macro (dal pulsante della card o .menu <macro>)
        const macroKey = q === 'apri' ? q2 : q;
        const macro = MACROS.find(m => m.key === macroKey);
        if (macro) {
            if (macro.ownerOnly && !isOwner) return reply('🔒 Sezione riservata.');
            return sendButtons(sock, from, `${macro.emoji} *${macro.title}*\n${macro.desc}`, [
                macroList(macro),
                { label: '🏠 Home', id: 'menu' },
            ], msg, null, {
                headerTitle: `${macro.emoji} ${macro.title}`,
                footerText: `${macro.cmds.length} comandi`,
            });
        }

        // ── SEZIONE RICHIESTA 
        if (q && q !== 'home') {
            const found = findSection(q);
            if (found) {
                const list = listFor(found.section, isOwner, isGroup);
                if (!list) return reply('🔒 Sezione riservata.');
                const n = SECTIONS.length;
                const prev = SECTIONS[(found.index - 1 + n) % n];
                const next = SECTIONS[(found.index + 1) % n];
                const btns = [
                    { label: '⬅️ Prec', id: `menu ${prev.key}` },
                    { label: '🏠 Home', id: 'menu' },
                    { label: '➡️ Succ', id: `menu ${next.key}` },
                ];
                return sendButtons(sock, from, sectionScreen(found.section), btns, msg, null, {
                    headerTitle: `${found.section.emoji} ${found.section.title}`,
                    footerText: `${found.index + 1}/${n} · ${found.section.items.length} comandi`,
                });
            }
        }

        // ── HOME: solo carosello, niente altro messaggio.
        // Foto profilo del gruppo; se manca, banner generato in locale.
        const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
        const visibleMacros = MACROS.filter(m => !m.ownerOnly || isOwner);

        if (!q || q === 'home') {
            if (typeof sendCarousel === 'function') {
                try {
                    let picUrl = null;
                    try {
                        picUrl = await sock.profilePictureUrl(from, 'image');
                    } catch (_) {}
                    const cards = [];
                    for (const m of visibleMacros) {
                        const card = {
                            title: `${m.emoji} ${m.title}`,
                            body: m.desc,
                            footer: 'VEX',
                            buttons: [
                                { label: '📂 Scegli', id: `menu apri ${m.key}` },
                            ],
                        };
                        if (picUrl) {
                            card.imageUrl = picUrl;
                        } else {
                            const img = await bannerPng(m, services?.sharp);
                            if (!img) continue;
                            card.imageBuffer = img;
                        }
                        cards.push(card);
                    }
                    if (cards.length) {
                        const sent = await sendCarousel(sock, from, {
                            text: 'VEX',
                            cards,
                        }, msg);
                        if (sent) return true;
                    }
                } catch (e) {
                    console.error('[menu] carosello:', e.message);
                }
            }
        }

        // Home con pulsanti: single_select sezioni + 3 quick
        const sheet = {
            type: 'single_select',
            label: '📂 Sezioni',
            title: 'Scegli una sezione',
            sectionTitle: 'Sezioni disponibili',
            rows: visible.map(s => ({
                header: s.emoji,
                title: toBold(s.title),
                description: `${s.items.length} comandi`,
                id: `menu ${s.key}`,
            })),
        };
        const sponsorLink = (context.db?._config?.sponsorLink) || (services.db?._config?.sponsorLink) || 'https://chat.whatsapp.com/FYvFuxdBSDiFbZBedloPgo';
        const btns = [
            sheet,
            { label: '📖 Guida', id: 'aiuto' },
            { label: '⚡ Ping', id: 'ping' },
            { label: '💎 Sponsor', url: sponsorLink },
        ];
        return sendButtons(sock, from, homeScreen(pushName, timeStr, dateStr, stats,
            'Prova .menu giochi o .menu economia', visible), btns, msg, null, {
            headerTitle: 'VEX BOT',
            footerText: `${visible.length} sezioni · ${stats.cmds} comandi`,
        });
    },
};

module.exports.SECTIONS = SECTIONS;
