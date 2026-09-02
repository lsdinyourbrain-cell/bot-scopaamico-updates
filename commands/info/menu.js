'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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
            ['🎁', 'regalo'], ['🏷️', 'titolo'], ['🎴', 'carte'], ['💣', 'rapina'], ['💊', 'spacci'],
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
            ['🟩', 'wordle'], ['🌀', 'labirinto'], ['🏆', 'trivia2'], ['🎭', 'akinator'], ['🎰', 'slot2'], ['🎲', 'dado2'],
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
            ['📘', 'aiuto'], ['🔮', 'oracolo'], ['🍀', 'sorte'], ['🌟', 'destino'],
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
            ['😜', 'emojimix'], ['🔣', 'ascii'], ['💧', 'wm'], ['🤡', 'trigger'], ['🔍', 'wanted'], ['💖', 'beautiful'],
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

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Menu VEX con sezioni navigabili e pulsanti visibili.",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, pushName, isGroup, isOwner, isButton, contextInfo, reply, services } = context;
        const { sendButtons, commands } = services;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });

        const stats = {
            cmds: commands ? new Set([...commands.values()].filter(m => !m.hidden)).size : SECTIONS.reduce((n, s) => n + s.items.length, 0),
            version: pkg.version,
            uptime: fmtUptime(process.uptime()),
        };

        const q = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0] || '';

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

        // ── HOME — sempre pulsanti (niente foto gruppo, altrimenti 0 pulsanti)
        const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));

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
        const btns = [
            sheet,
            { label: '📖 Guida', id: 'aiuto' },
            { label: '⚡ Ping', id: 'ping' },
            { label: '👤 Profilo', id: 'profilo' },
        ];
        return sendButtons(sock, from, homeScreen(pushName, timeStr, dateStr, stats,
            'Prova .menu giochi o .menu economia', visible), btns, msg, null, {
            headerTitle: 'VEX BOT',
            footerText: `${visible.length} sezioni · ${stats.cmds} comandi`,
        });
    },
};

module.exports.SECTIONS = SECTIONS;
