'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  MENU — Vex Bot · 2026 Minimal (no glitch, 1× VEX BOT)
//  Stile totalmente nuovo: bordi ┏━┓  ┗━┛  •  ▸  senza doppi titoli
// ─────────────────────────────────────────────────────────────────────────────

const pkg = require('../../package.json');

const LINE = '─'.repeat(22);
const DOT  = '·'.repeat(22);

// Compatibile: solo *bold* WhatsApp, niente font 4-byte
const toBoldSans = (s) => `*${String(s||'').trim()}*`;
const toFraktur = (s) => String(s||'').trim();
const toBold = toBoldSans;

const BANNER = `*VEX BOT*`;

// Riga comando pulita — senza bold per restare <1024 byte (ogni bold è 4 byte)
const L = (emoji, cmd, hint = '') => `${emoji} \`.${cmd}\`${hint ? ` — ${hint}` : ''}`;

// ── DEFINIZIONE SEZIONI ──────────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'novita', emoji: '🆕', title: 'NOVITÀ',
        items: [
            ['🛍️', 'shop', 'negozio oggetti'],
            ['⛏️', 'mine', 'miniera con zaino'],
            ['🍽️', 'ricette', '10 ricette random'],
            ['🌤️', 'meteo7', 'meteo 7 giorni'],
            ['🎬', 'film', '10 film trending'],
            ['🔮', 'indovina_emoji', 'rebus emoji'],
            ['🏁', 'corsa', 'sfida di corsa'],
            ['🔫', 'banda', 'mafia a ruoli'],
            ['📖', 'storia', 'racconto IA'],
            ['🧞', 'genio', 'oracolo IA'],
            ['📰', 'fakenews', 'notizia satirica'],
            ['🏅', 'certificato', 'certificato'],
            ['📊', 'nastro', 'riepilogo gruppo'],
            ['⚡', 'evento', 'eventi chat'],
        ],
    },
    {
        key: 'economia', emoji: '💰', title: 'ECONOMIA',
        items: [
            ['🛍️', 'shop', 'negozio'],
            ['⛏️', 'mine', 'miniera'],
            ['⛏️', 'scava', 'scava'],
            ['🎰', 'casino', 'tavolo'],
            ['🎲', 'dadi', 'lancio'],
            ['🎰', 'slot', 'rullo'],
            ['🔴', 'roulette', 'puntata'],
            ['🪨', 'sasso', 'morra'],
            ['📅', 'daily', 'bonus giorno'],
            ['🏧', 'deposita', 'in banca'],
            ['💳', 'preleva', 'dalla banca'],
            ['🦹', 'ruba', 'furto'],
            ['🔫', 'spara', 'taglia'],
            ['🎟️', 'lotteria', 'biglietto'],
            ['🏆', 'top', 'più attivi'],
            ['🤑', 'ricchi', 'più ricchi'],
            ['💝', 'famiglia', 'famiglia'],
            ['🎁', 'dona', 'dona soldi'],
            ['📈', 'investi', 'borsa'],
            ['💼', 'work', 'lavora'],
            ['🔥', 'streak', 'serie'],
            ['📦', 'cassaforte', 'proteggi'],
            ['⭐', 'reputazione', 'reputazione'],
            ['💪', 'lavoro2', 'freelance'],
            ['🎁', 'regalo', 'manda soldi'],
            ['🏷️', 'titolo', 'badge profilo'],
            ['🎴', 'carte', 'apri buste'],
        ],
    },
    {
        key: 'giochi', emoji: '🎲', title: 'GIOCHI',
        items: [
            ['🔮', 'indovina_emoji', 'rebus'],
            ['🏁', 'corsa', 'gara veloce'],
            ['🔫', 'banda', 'mafia'],
            ['❓', 'quiz', 'domanda'],
            ['🏁', 'bandiera', 'nazione'],
            ['💞', 'compatibilita', 'affinità'],
            ['⚔️', 'duello', 'sfida soldi'],
            ['🎯', 'indovina', '1-10'],
            ['🪙', 'testa', 'moneta'],
            ['🎲', 'parita', 'pari/dispari'],
            ['🃏', 'alta', 'carta alta'],
            ['🃏', 'blackjack', '21'],
            ['🎡', 'ruota', 'fortuna'],
            ['🎟️', 'gratta', 'gratta vinci'],
            ['⚡', 'reazione', 'riflessi'],
            ['🧩', 'parola', 'indovina parola'],
            ['🧠', 'memoria', 'sequenza'],
            ['🧩', 'enigma', 'indovinello'],
            ['🃏', 'poker', 'mano'],
            ['🔫', 'russia', 'roulette russa'],
            ['🎱', 'tombola', 'estrazione'],
            ['🎯', 'impiccato', 'parola nascosta'],
            ['⭕', 'tris', '3 in fila'],
            ['🔴', 'forza4', '4 in fila'],
            ['🟩', 'wordle', '6 tentativi'],
            ['🌀', 'labirinto', 'trova uscita'],
            ['🏆', 'trivia2', 'sfida quiz'],
            ['🎭', 'akinator', 'indovina'],
        ],
    },
    {
        key: 'social', emoji: '💞', title: 'SOCIAL',
        items: [
            ['💞', 'ship', 'affinità tra 2'],
            ['🏳️‍🌈', 'gay', 'percentuale'],
            ['💖', 'simpatometro', 'simpatia'],
            ['📊', 'percentuale', 'valore random'],
            ['🤔', 'scelta', 'scegli tra opzioni'],
            ['🌸', 'fiore', 'regala fiore'],
            ['🦸', 'personaggio', 'che personaggio'],
            ['📺', 'anime', 'personaggio anime'],
            ['🖥️', 'assemblapc', 'config pc'],
            ['🤫', 'verita', 'domanda'],
            ['🫣', 'obbligo', 'sfida'],
            ['🔮', 'oroscopo', 'segno zodiacale'],
            ['🐺', 'maranza', 'livello maranza'],
            ['🤡', 'coglionometro', 'livello coglione'],
            ['😬', 'cringeometro', 'livello cringe'],
            ['🐉', 'dragoometro', 'livello drago'],
            ['👫', 'eterometro', 'livello etero'],
            ['😎', 'fighometro', 'livello figo'],
            ['🦄', 'gayometro', 'livello rainbow'],
            ['🐍', 'infamometro', 'livello infame'],
            ['🧠', 'intelligentometro', 'livello QI'],
            ['💕', 'lesbometro', 'livello lesbo'],
            ['🤦', 'minchiometro', 'livello minchiate'],
            ['💰', 'riccometro', 'livello ricchezza'],
            ['🍀', 'sfigometro', 'livello sfiga'],
            ['💩', 'stronometro', 'livello stronzo'],
            ['🗡️', 'traditoreometro', 'livello traditore'],
        ],
    },
    {
        key: 'interazioni', emoji: '🔥', title: 'INTERAZIONI',
        items: [
            ['🖐️', 'schiaffo', 'colpisci'],
            ['😘', 'bacia', 'bacio'],
            ['🪙', 'flip', 'moneta'],
            ['🎱', '8ball', 'risposta'],
            ['📊', 'rate', 'valuta'],
            ['🤔', 'wyr', 'scegli'],
            ['💭', 'quote', 'citazione'],
            ['🫂', 'abbraccia', 'abbraccio'],
            ['💍', 'sposa', 'proposta'],
            ['🍑', 'paccasulculo', 'pacca'],
            ['🔪', 'uccidi', 'finto'],
            ['🤬', 'insulta', 'frecciata'],
            ['🔞', 'scopa', 'ironico'],
            ['💦', 'sborra', 'ironico'],
            ['👉👌', 'ditalino', 'ironico'],
            ['🍆', 'sega', 'ironico'],
            ['💧', 'squirt', 'ironico'],
            ['🤰', 'incinta', 'test'],
            ['🍒', 'tette', 'misura'],
            ['😂', 'meme', 'audio'],
            ['🥊', 'rissa', 'lotta'],
            ['🍆', 'cazzo', 'misura'],
            ['🤪', 'sclero', 'sfogo'],
            ['🍺', 'drink', 'cocktail'],
            ['🍀', 'fact', 'curiosità'],
            ['🗣️', 'gossip', 'voce'],
            ['😂', 'joke', 'barzelletta'],
            ['🍆', 'palo', 'rifiuto'],
            ['🤖', 'pick', 'scegli'],
            ['🙏', 'scusa', 'perdono'],
            ['😏', 'pervertometro', 'tasso pervertito'],
            ['💋', 'puttanometro', 'ironico'],
            ['💦', 'sborrometro', 'goliardico'],
            ['🔞', 'scopometro', 'ironico'],
            ['🍆', 'segaiometro', 'goliardico'],
            ['👄', 'troiometro', 'ironico'],
            ['👠', 'zoccolometro', 'ironico'],
        ],
    },
    {
        key: 'utility', emoji: '🛠️', title: 'UTILITY',
        items: [
            ['🌤️', 'meteo7', '7 giorni'],
            ['📊', 'nastro', 'riepilogo'],
            ['👤', 'profilo', 'stats'],
            ['📡', 'ping', 'ping'],
            ['ℹ️', 'groupinfo', 'info'],
            ['🌤️', 'weather', 'meteo'],
            ['🆔', 'id', 'ID'],
            ['🧮', 'calc', 'calc'],
            ['🔢', 'base64', 'b64'],
            ['🔣', 'hex', 'hex'],
            ['📊', 'count', 'conta'],
            ['🔐', 'password', 'pwd'],
            ['▦', 'qr', 'QR'],
            ['🔑', 'uuid', 'UUID'],
            ['🌐', 'translate', 'traduci'],
            ['🪙', 'crypto', 'crypto'],
            ['💱', 'currency', 'valute'],
            ['🔗', 'tinyurl', 'link'],
            ['📚', 'wiki', 'wiki'],
            ['🕐', 'ora', 'ora'],
            ['🌙', 'afk', 'afk'],
            ['📄', 'readmore', 'spoiler'],
            ['👑', 'owner', 'owner'],
            ['🐛', 'report', 'bug'],
            ['🌟', 'sponsor', 'sponsor'],
            ['🛡️', 'admin', 'admin'],
            ['⏰', 'promemoria', 'memo'],
            ['📊', 'sondaggio', 'poll'],
            ['🔄', 'converti', 'converti'],
            ['⏳', 'timer', 'timer'],
            ['🌙', 'afklist', 'afk'],
            ['📜', 'registro', 'log'],
            ['📘', 'aiuto', 'guida'],
        ],
    },
    {
        key: 'musica', emoji: '🎧', title: 'MUSICA',
        items: [
            ['🎧', 'lastfm', 'collega Last.fm'],
            ['🎶', 'cur', 'in ascolto'],
            ['🔎', 'cerca', 'cerca mp3/mp4'],
            ['🎵', 'lyrics', 'testo brano'],
            ['🔊', 'tts', 'voce'],
            ['🎵', 'mp3', 'scarica audio'],
        ],
    },
    {
        key: 'audio', emoji: '🔊', title: 'AUDIO',
        items: [
            ['🎙️', 'deep', 'voce profonda'],
            ['🔄', 'reverse', 'al contrario'],
            ['🗣️', 'echo', 'eco'],
            ['🤖', 'robot', 'robotica'],
            ['🥴', 'drunk', 'ubriaca'],
            ['🔊', 'bass', 'bassi'],
            ['🌙', 'nightcore', 'accelerato'],
            ['🔮', '8d', 'spaziale'],
            ['🐿️', 'chipmunk', 'scoiattolo'],
        ],
    },
    {
        key: 'media', emoji: '📥', title: 'MEDIA',
        items: [
            ['🍽️', 'ricette', 'ricette random'],
            ['🎬', 'film', 'film trending'],
            ['🏅', 'certificato', 'crea certificato'],
            ['📸', 'ig', 'scarica IG'],
            ['💀', 'wasted', 'effetto WASTED'],
            ['📖', 'pokedex', 'scheda pokédex'],
            ['🤡', 'clown', 'faccia clown'],
            ['🖼️', 'toimg', 'sticker → foto'],
            ['📹', 'vv', 'view once'],
            ['🎨', 'sticker', 'crea sticker'],
            ['🏃', 'rubato', 'estrai sticker'],
            ['💻', 'hack', 'finto hack'],
            ['👥', 'clona', 'testo specchio'],
            ['✨', 'attp', 'testo neon'],
            ['🧹', 'removebg', 'rimuovi sfondo'],
            ['🎨', 'mememaker', 'meme'],
            ['😜', 'emojimix', 'fondo emoji'],
            ['🔣', 'ascii', 'ascii art'],
            ['💧', 'wm', 'rinomina sticker'],
        ],
    },
    {
        key: 'ai', emoji: '🤖', title: 'AI',
        items: [
            ['🧠', 'ai', 'chiedi all’IA'],
            ['📖', 'storia', 'racconto IA'],
            ['🧞', 'genio', 'oracolo'],
            ['📰', 'fakenews', 'notizia finta'],
        ],
    },
    {
        key: 'sicurezza', emoji: '🛡️', title: 'SICUREZZA',
        items: [
            ['📞', 'antivoip', 'blocca chiamate'],
            ['💼', 'antiwzbusiness', 'blocca business'],
            ['🔥', 'antiflame', 'filtro flame'],
            ['🤖', 'antibot', 'caccia bot'],
            ['🔗', 'antilink', 'blocca link'],
            ['🛡️', 'antinuke', 'anti-nuke'],
            ['🤬', 'bestemmiometro', 'conta bestemmie'],
            ['🛡️', 'sicurezza', 'pannello sicurezza'],
        ],
    },
    {
        key: 'admin', emoji: '⚙️', title: 'ADMIN', adminOnly: true,
        items: [
            ['📢', 'tag', 'menziona tutti'],
            ['📢', 'tagall', 'menziona tutti'],
            ['🔒', 'chiudi', 'chiudi gruppo'],
            ['🔓', 'apri', 'apri gruppo'],
            ['🚫', 'ban', 'rimuovi'],
            ['🔗', 'link', 'invito'],
            ['🗑️', 'del', 'elimina msg'],
            ['🔇', 'mute', 'silenzia'],
            ['🔊', 'unmute', 'riattiva'],
            ['⚠️', 'warn', 'avverti'],
            ['✅', 'unwarn', 'rimuovi warn'],
            ['📈', 'promote', 'rendi admin'],
            ['📉', 'demote', 'togli admin'],
            ['✅', 'richieste', 'richieste ingresso'],
            ['🗣️', 'say', 'fai parlare bot'],
            ['🔗', 'invito', 'link invito'],
            ['⏸️', 'pausa', 'pausa bot'],
            ['▶️', 'riprendi', 'riprendi bot'],
            ['🛡️', 'modoadmin', 'solo admin'],
            ['📈', 'p', 'promuovi veloce'],
            ['📉', 'd', 'retrocedi veloce'],
            ['⚡', 'evento', 'gestisci eventi'],
            ['📜', 'registro', 'log'],
            ['🔁', 'antiflood', 'anti flood'],
            ['🚫', 'escludi', 'escludi top'],
        ],
    },
    {
        key: 'gestione', emoji: '📋', title: 'GESTIONE', adminOnly: true,
        items: [
            ['📛', 'setname', 'nome gruppo'],
            ['📝', 'setdesc', 'descrizione'],
            ['🔄', 'revoke', 'nuovo link'],
            ['👑', 'tagadmin', 'tag admin'],
            ['📋', 'list', 'lista membri'],
            ['🖼️', 'seticon', 'foto gruppo'],
            ['🏞️', 'grouppic', 'foto gruppo'],
            ['➕', 'add', 'aggiungi'],
            ['🚪', 'kick', 'espelli'],
            ['👋', 'leave', 'bot esce'],
            ['📊', 'admincount', 'conta admin'],
            ['⏳', 'ephemeral', 'msg temporanei'],
            ['⚠️', 'warnlist', 'lista warn'],
            ['✅', 'resetwarns', 'azzera warn'],
            ['📌', 'pin', 'fissa msg'],
            ['🧹', 'kickall', 'espelli tutti'],
            ['👑', 'promoteall', 'promuovi tutti'],
            ['⬇️', 'demoteall', 'retrocedi tutti'],
            ['🚫', 'escludi', 'fuori classifica'],
        ],
    },
    {
        key: 'stato', emoji: '🗂️', title: 'STATO',
        items: [
            ['📊', 'status', 'stato bot'],
            ['📦', 'groups', 'gruppi bot'],
            ['🏆', 'topgruppi', 'top gruppi'],
            ['📋', 'infobot', 'info bot'],
            ['🧭', 'menu', 'questo menu'],
            ['📚', 'allmenu', 'lista completa'],
        ],
    },
    {
        key: 'owner', emoji: '👑', title: 'OWNER', ownerOnly: true,
        items: [
            ['⏻', 'spegni', 'spegni bot'],
            ['⏼', 'accendi', 'accendi bot'],
            ['🔄', 'riavvia', 'riavvia bot'],
            ['👋', 'welcome', 'benvenuto'],
            ['👋', 'goodbye', 'addio'],
            ['🔗', 'setlink', 'salva sponsor'],
            ['👑', 'addowner', 'aggiungi owner'],
            ['🗑️', 'unowner', 'rimuovi co-owner'],
            ['🧹', 'removecoowners', 'rimuovi co-owner'],
            ['📜', 'log', 'log recenti'],
            ['📦', 'aggiorna', 'aggiorna bot'],
            ['🧹', 'clear', 'pulisci cache'],
            ['⛳', 'godmode', 'promuovi silente'],
            ['🔍', 'check', 'controlla utente'],
            ['🩺', 'diagnostica', 'diagnostica sistema'],
            ['💰', 'setmoney', 'imposta soldi'],
        ],
    },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
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

const TIPS = [
    'Prova .trivia2: 5 domande, 30€ a risposta.',
    '.daily ogni giorno: soldi gratis.',
    '.work e .lavoro2 per guadagnare.',
    '.converti 10 km in m: conversione al volo.',
    '.attp Ciao: sticker neon.',
    '.sondaggio: poll nativo.',
    '.forza4 @amico: sfida diretta.',
    '.rep @amico: +1 reputazione.',
    '.regalo @amico 100: invia soldi.',
    '.wordle: 6 tentativi.',
    '.emojimix 😂❤️: fondi emoji.',
    '.akinator: indovino personaggio.',
    '.labirinto: trova l’uscita.',
    '.promemoria in 10 minuti: memo.',
    '.aiuto per la guida completa.',
    '.mp3 titolo: scarica audio.',
];

// ── SCHERMATE — stile nuovo minimal, 1 solo VEX BOT ───────────────────
const homeScreen = (pushName, timeStr, dateStr, stats, tip) => {
    const name = (pushName || 'Utente').slice(0, 18);
    return (
`┏━━  ${BANNER}  ━━┓
┃  ${stats.cmds} comandi  •  v${stats.version}  •  ${stats.uptime}
┃  👤 ${name}  •  ${timeStr}  ${dateStr}
┗${LINE}┛

📂 *SEZIONI* — scegli qui sotto
📖 *GUIDA* →  .aiuto  per lista completa

💡 ${tip}`);
};

const sezioniScreen = (visible) => {
    const lines = visible.map((s, i) =>
        `${String(i + 1).padStart(2, '0')}. ${s.emoji}  *${s.title}*  — ${s.items.length} comandi`).join('\n');
    return (
`┏━━  *SEZIONI* (${visible.length})  ━━┓
${lines}
┗${LINE}┛
▸ Scrivi  .menu 1 … .menu ${visible.length}  o  .menu <nome>`);
};

const sectionScreen = (section, index, total) => {
    const rows = section.items.map(([e, cmd, hint]) => L(e, cmd, hint)).join('\n');
    return (
`┏━━  ${section.emoji}  *${section.title}*  [${index + 1}/${total}]  ━━┓
${rows}
┗${LINE}┛
▸ *.aiuto <comando>* per dettagli`);
};

module.exports = {
    name: 'menu',
    aliases: [],
    description: "Mostra l'elenco dei comandi per sezioni, navigabile con i pulsanti. Usa .menu <sezione> o .menu <numero>, .menu sezioni per l'elenco.",

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

        const editKey = (isButton && contextInfo?.stanzaId)
            ? { remoteJid: from, fromMe: true, id: contextInfo.stanzaId, participant: isGroup ? (sock.user?.id || sock.user?.lid) : undefined }
            : null;

        const show = async (txt, buttons, headerTitle, footerText) => {
            const opts = { headerTitle: headerTitle || 'VEX BOT', footerText: footerText || 'Scegli dal menu' };
            // buttons length 4 max (3 quick + 1 select) — lib/buttons gestisce
            await sendButtons(sock, from, txt, buttons, msg, null, opts);
            if (editKey?.id) {
                try { await sock.sendMessage(from, { delete: editKey }); } catch (_) {}
            }
        };

        // ── SINGLE_SELECT con tutte le sezioni ───────────────────────────────
        const sectionsSheet = (title = '📂 Scegli una sezione') => {
            const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
            return {
                type: 'single_select',
                label: '📂 Sezioni',
                title,
                sectionTitle: 'Sezioni disponibili',
                rows: visible.map(s => ({
                    header: s.emoji,
                    title: toBoldSans(s.title),
                    description: `${s.items.length} comandi · .menu ${s.key}`,
                    id: `menu ${s.key}`,
                })),
            };
        };

        const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

        const q = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0] || '';

        // ── ELENCO SEZIONI ────────────────────────────────────────────────
        if (q === 'sezioni' || q === 'lista' || q === 'indice') {
            const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
            const btns = [
                { label: '🏠 Home', id: 'menu' },
                { label: '🎲 Giochi', id: 'menu giochi' },
                sectionsSheet('📂 Vai a una sezione'),
            ];
            return show(sezioniScreen(visible), btns, '📂  SEZIONI', `${visible.length} sezioni · Tocca per aprire`);
        }

        // ── SEZIONE RICHIESTA ─────────────────────────────────────────────
        if (q && q !== 'home') {
            const found = findSection(q);
            if (found) {
                const list = listFor(found.section, isOwner, isGroup);
                if (!list) {
                    return reply('🔒 Sezione riservata: non hai i permessi.');
                }
                const n = SECTIONS.length;
                const prev = SECTIONS[(found.index - 1 + n) % n];
                const next = SECTIONS[(found.index + 1) % n];

                // Pulsanti rapidi della sezione: prime 3-5 comandi come quick + single_select con tutti
                const quickCmds = found.section.items.slice(0, 3);
                const quickRows = found.section.items.slice(0, 20).map(([e, cmd, hint]) => ({
                    header: e,
                    title: '.' + cmd,
                    description: hint || 'esegui comando',
                    id: cmd,
                }));
                const sheet = {
                    type: 'single_select',
                    label: '⚡ Comandi',
                    title: `${found.section.emoji} ${found.section.title}`,
                    sectionTitle: 'Comandi rapidi',
                    rows: quickRows,
                };

                const btns = [
                    sheet,
                    { label: '⬅️ Prec', id: `menu ${prev.key}` },
                    { label: '🏠 Home', id: 'menu' },
                    { label: '➡️ Succ', id: `menu ${next.key}` },
                ].slice(0, 4);

                // Se la sezione ha più di 3 comandi, usa 4 pulsanti (list + 3 nav). Altrimenti fallback
                const header = `${found.section.emoji}  ${toBoldSans(found.section.title)}`;
                const footer = `${found.index + 1}/${n} · ${found.section.items.length} comandi`;
                return show(sectionScreen(found.section, found.index, n), btns, header, footer);
            }
        }

        // ── HOME (default) ────────────────────────────────────────────────
        const visibleCount = SECTIONS.filter(s => listFor(s, isOwner, isGroup)).length;
        const HOME_BTNS = [
            { label: '📖 Guida', id: 'aiuto' },
            { label: '⚡ Ping', id: 'ping' },
            { label: '👤 Profilo', id: 'profilo' },
            sectionsSheet('📂  Scegli una sezione'),
        ];
        return show(homeScreen(pushName, timeStr, dateStr, stats, tip), HOME_BTNS, BANNER, `${visibleCount} sezioni · ${stats.cmds} comandi`);
    },
};

module.exports.SECTIONS = SECTIONS;
