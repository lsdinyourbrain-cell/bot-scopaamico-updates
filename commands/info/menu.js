'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  MENU — Vex Bot
//  Stile pulito, senza cornici box-drawing (che si disallineano con emoji di
//  larghezza variabile). Ogni riga è corta (max ~40 colonne) per non andare
//  a capo male su WhatsApp.
//
//  .menu            → HOME (contatori, suggerimento, accesso rapido)
//  .menu sezioni    → elenco numerato di tutte le sezioni
//  .menu <key|num>  → apre una sezione (es. .menu giochi, .menu 2)
//  Pulsanti: navigazione ⬅️ 🏠 ➡️ tra sezioni; 📖 Guida invia il file .txt
//  con tutti i comandi spiegati (gestito dal comando .aiuto).
// ─────────────────────────────────────────────────────────────────────────────

const pkg = require('../../package.json');

// Riga decorativa: solo come separatore, mai per allineare (niente glitch).
const SEP = '━━━━━━━━━━━━━━━━━━';

// Riga comando: `{emoji} .{cmd} — {hint}`
const L = (emoji, cmd, hint = '') =>
    `${emoji} \`.${cmd}\`${hint ? ` — ${hint}` : ''}`;

// ── DEFINIZIONE SEZIONI ──────────────────────────────────────────────────────
// key = nome usato nei comandi (.menu <key>), title = nome visualizzato,
// items = [emoji, comando, breve hint]. Sezioni admin/owner segnate per filtro.
const SECTIONS = [
    {
        key: 'novita', emoji: '🆕', title: 'NOVITÀ',
        items: [
            ['🛍️', 'shop', 'negozio oggetti'],
            ['⛏️', 'mine', 'miniera con zaino'],
            ['🍽️', 'ricette', '10 ricette random'],
            ['🌤️', 'meteo7', 'meteo 7 giorni'],
            ['🎬', 'film', '10 film trending'],
            ['🔮', 'indovina_emoji', 'rebus a emoji'],
            ['🏁', 'corsa', 'sfida di corsa'],
            ['🔫', 'banda', 'mafia a ruoli'],
            ['📖', 'storia', 'storia con l\u2019IA'],
            ['🧞', 'genio', 'oracolo IA'],
            ['📰', 'fakenews', 'notizia falsa satirica'],
            ['🏅', 'certificato', 'certificato su misura'],
            ['📊', 'nastro', 'riepilogo del gruppo'],
        ],
    },
    {
        key: 'economia', emoji: '💰', title: 'ECONOMIA',
        items: [
            ['🛍️', 'shop', 'negozio oggetti'],
            ['⛏️', 'mine', 'miniera con zaino'],
            ['⛏️', 'scava', 'scava'],
            ['🎰', 'casino', 'giochi da casinò'],
            ['🎲', 'dadi', 'dadi con soldi'],
            ['🎰', 'slot', 'slot'],
            ['🔴', 'roulette', 'puntata'],
            ['🪨', 'sasso', 'sasso carta forbici'],
            ['📅', 'daily', 'bonus giornaliero'],
            ['🏧', 'deposita', 'in banca'],
            ['💳', 'preleva', 'dalla banca'],
            ['🦹', 'ruba', 'tenta un furto'],
            ['🔫', 'spara', 'incassa taglia'],
            ['🎟️', 'lotteria', 'biglietto 50€'],
            ['🏆', 'top', 'più attivi'],
            ['🤑', 'ricchi', 'lista ricchi'],
            ['💝', 'famiglia', 'famiglia'],
            ['🎁', 'dona', 'dona soldi'],
            ['📈', 'investi', 'borsa'],
            ['💼', 'work', 'lavora'],
            ['🔥', 'streak', 'serie di giorni'],
            ['📦', 'cassaforte', 'proteggi'],
            ['⭐', 'reputazione', '⭐'],
            ['💪', 'lavoro2', 'freelance'],
            ['🎁', 'regalo', 'manda soldi'],
            ['🏷️', 'titolo', 'titolo profilo'],
            ['🎴', 'carte', 'apri buste'],
        ],
    },
    {
        key: 'giochi', emoji: '🎲', title: 'GIOCHI',
        items: [
            ['🔮', 'indovina_emoji', 'rebus a emoji'],
            ['🏁', 'corsa', 'gara di gruppo'],
            ['🔫', 'banda', 'mafia a ruoli'],
            ['❓', 'quiz', 'rispondi e vinci'],
            ['🏁', 'bandiera', 'nazione'],
            ['💞', 'compatibilita', 'affinità'],
            ['⚔️', 'duello', 'sfida a soldi'],
            ['🎯', 'indovina', '1-10'],
            ['🪙', 'testa', 'testa o croce'],
            ['🎲', 'parita', 'pari o dispari'],
            ['🃏', 'alta', 'alta o bassa'],
            ['🃏', 'blackjack', 'batti il banco'],
            ['🎡', 'ruota', 'fortuna'],
            ['🎟️', 'gratta', 'gratta vinci'],
            ['⚡', 'reazione', 'riflessi'],
            ['🧩', 'parola', 'parola segreta'],
            ['🧠', 'memoria', 'colori'],
            ['🧩', 'enigma', 'indovinello'],
            ['🃏', 'poker', 'a poker'],
            ['🔫', 'russia', 'roulette russa'],
            ['🎱', 'tombola', 'estrazione'],
            ['🎯', 'impiccato', 'evita il boia'],
            ['⭕', 'tris', '3 in fila'],
            ['🔴', 'forza4', '4 in fila'],
            ['🟩', 'wordle', '6 tentativi'],
            ['🌀', 'labirinto', ''],
            ['🏆', 'trivia2', ''],
            ['🎭', 'akinator', ''],
        ],
    },
    {
        key: 'social', emoji: '💞', title: 'SOCIAL',
        items: [
            ['💞', 'ship', 'affinità tra 2'],
            ['🏳️‍🌈', 'gay', '% goliardica'],
            ['💖', 'simpatometro', 'quanto sei simpatico'],
            ['📊', 'percentuale', '% casuale'],
            ['🤔', 'scelta', 'scegli tra opzioni'],
            ['🌸', 'fiore', 'regala un fiore'],
            ['🦸', 'personaggio', 'che personaggio sei'],
            ['📺', 'anime', 'personaggio anime'],
            ['🖥️', 'assemblapc', 'assembla un pc'],
            ['🤫', 'verita', 'domanda verità'],
            ['🫣', 'obbligo', 'sfida obbligo'],
            ['🔮', 'oroscopo', 'il tuo oroscopo'],
            ['🐺', 'maranza', 'livello maranza'],
        ],
    },
    {
        key: 'interazioni', emoji: '🔥', title: 'INTERAZIONI',
        items: [
            ['🖐️', 'schiaffo', 'uno schiaffo'],
            ['😘', 'bacia', 'bacio'],
            ['🪙', 'flip', 'testa/croce'],
            ['🎱', '8ball', 'palla magica'],
            ['📊', 'rate', 'vota 1-10'],
            ['🤔', 'wyr', 'preferisci?'],
            ['💭', 'quote', 'citazione'],
            ['🫂', 'abbraccia', 'abbraccio'],
            ['💍', 'sposa', 'sposati'],
            ['🍑', 'paccasulculo', 'pacca'],
            ['🔪', 'uccidi', 'omicidio finto'],
            ['🤬', 'insulta', 'insulta'],
            ['🔞', 'scopa', 'ironico'],
            ['💦', 'sborra', 'ironico'],
            ['👉👌', 'ditalino', 'ironico'],
            ['🍆', 'sega', 'ironico'],
            ['💧', 'squirt', 'ironico'],
            ['🤰', 'incinta', 'gravidanza?'],
            ['🍒', 'tette', 'tette'],
            ['😂', 'meme', 'audio'],
            ['🥊', 'rissa', 'botte'],
            ['🍆', 'cazzo', 'cazzo'],
            ['🤪', 'sclero', 'sclero'],
            ['🍺', 'drink', 'offri drink'],
            ['🍀', 'fact', 'curiosità'],
            ['🗣️', 'gossip', 'gossip'],
            ['😂', 'joke', 'barzelletta'],
            ['🍆', 'palo', 'palo'],
            ['🤖', 'pick', 'scegli'],
            ['🙏', 'scusa', 'scusa'],
        ],
    },
    {
        key: 'utility', emoji: '🛠️', title: 'UTILITY',
        items: [
            ['🌤️', 'meteo7', 'meteo 7 giorni'],
            ['📊', 'nastro', 'riepilogo gruppo'],
            ['👤', 'profilo', 'statistiche'],
            ['📡', 'ping', 'stato bot'],
            ['ℹ️', 'groupinfo', 'info gruppo'],
            ['🌤️', 'weather', 'meteo'],
            ['🆔', 'id', 'il tuo ID'],
            ['🧮', 'calc', 'calcola'],
            ['🔢', 'base64', 'codifica'],
            ['🔣', 'hex', 'hex'],
            ['📊', 'count', 'conta'],
            ['🔐', 'password', 'password'],
            ['▦', 'qr', 'QR'],
            ['🔑', 'uuid', 'UUID'],
            ['🌐', 'translate', 'traduci'],
            ['🪙', 'crypto', 'crypto'],
            ['💱', 'currency', 'valute'],
            ['🔗', 'tinyurl', ''],
            ['📚', 'wiki', 'Wikipedia'],
            ['🕐', 'ora', 'ora'],
            ['🌙', 'afk', ''],
            ['📄', 'readmore', 'nascosto'],
            ['👑', 'owner', 'creatore'],
            ['🐛', 'report', 'segnala bug'],
            ['🌟', 'sponsor', 'sponsor'],
            ['🛡️', 'admin', 'admin'],
            ['⏰', 'promemoria', 'promemoria'],
            ['📊', 'sondaggio', 'sondaggio'],
            ['🔄', 'converti', 'unità'],
            ['⏳', 'timer', 'timer'],
            ['🌙', 'afklist', ''],
            ['📘', 'aiuto', 'guida'],
        ],
    },
    {
        key: 'musica', emoji: '🎧', title: 'MUSICA',
        items: [
            ['🎧', 'lastfm', 'collega Last.fm'],
            ['🎶', 'cur', 'canzone su Last.fm'],
            ['🔎', 'cerca', 'cerca e scarica video/audio mp3'],
            ['🎵', 'lyrics', 'testo canzone'],
            ['🔊', 'tts', 'testo in vocale'],
            ['🎵', 'mp3', 'scarica audio canzone'],
        ],
    },
    {
        key: 'audio', emoji: '🔊', title: 'AUDIO',
        items: [
            ['🎙️', 'deep', 'voce profonda'],
            ['🔄', 'reverse', 'vocale al contrario'],
            ['🗣️', 'echo', 'eco nel vocale'],
            ['🤖', 'robot', 'voce robotica'],
            ['🥴', 'drunk', 'voce ubriaca'],
            ['🔊', 'bass', 'bassi potenziati'],
            ['🌙', 'nightcore', 'velocizzato'],
            ['🔮', '8d', 'effetto spaziale'],
            ['🐿️', 'chipmunk', 'voce scoiattolo'],
        ],
    },
    {
        key: 'media', emoji: '📥', title: 'MEDIA',
        items: [
            ['🍽️', 'ricette', '10 ricette random'],
            ['🎬', 'film', '10 film trending'],
            ['🏅', 'certificato', 'certificato su misura'],
            ['📸', 'ig', 'scarica video Instagram'],
            ['💀', 'wasted', 'effetto WASTED'],
            ['📖', 'pokedex', 'scheda pokédex'],
            ['🤡', 'clown', 'effetto clown'],
            ['🖼️', 'toimg', 'sticker → immagine'],
            ['📹', 'vv', 'sblocca view once'],
            ['🎨', 'sticker', 'crea sticker'],
            ['🏃', 'rubato', 'sticker → immagine'],
            ['💻', 'hack', 'finto hack'],
            ['👥', 'clona', 'gira il testo'],
            ['✨', 'attp', 'testo neon in sticker'],
            ['🧹', 'removebg', 'togli lo sfondo'],
            ['🎨', 'mememaker', 'meme con testo'],
            ['😜', 'emojimix', 'fonde due emoji'],
            ['🔣', 'ascii', 'immagine in ASCII'],
            ['💧', 'wm', 'rinomina uno sticker'],
        ],
    },
    {
        key: 'ai', emoji: '🤖', title: 'AI',
        items: [
            ['🧠', 'ai', 'chiedi all\u2019IA'],
            ['📖', 'storia', 'mini-storia IA'],
            ['🧞', 'genio', 'oracolo IA'],
            ['📰', 'fakenews', 'notizia satirica'],
        ],
    },
    {
        key: 'sicurezza', emoji: '🛡️', title: 'SICUREZZA',
        items: [
            ['📞', 'antivoip', 'blocca chiamate'],
            ['💼', 'antiwzbusiness', 'blocca account business'],
            ['🔥', 'antiflame', 'blocca parolacce'],
            ['🤖', 'antibot', 'caccia altri bot'],
            ['🔗', 'antilink', 'blocca link'],
            ['🛡️', 'antinuke', 'protezione anti-nuke'],
            ['🤬', 'bestemmiometro', 'conta bestemmie'],
        ],
    },
    {
        key: 'admin', emoji: '⚙️', title: 'ADMIN', adminOnly: true,
        items: [
            ['📢', 'tag', 'tagga tutti'],
            ['📢', 'tagall', 'tagga tutti'],
            ['🔒', 'chiudi', 'chiudi il gruppo'],
            ['🔓', 'apri', 'apri il gruppo'],
            ['🚫', 'ban', 'bandisci'],
            ['🔗', 'link', 'link del gruppo'],
            ['🗑️', 'del', 'cancella messaggio'],
            ['🔇', 'mute', 'silenzia'],
            ['🔊', 'unmute', 'riattiva'],
            ['⚠️', 'warn', 'ammonizione'],
            ['✅', 'unwarn', 'togli ammonizione'],
            ['📈', 'promote', 'promuovi admin'],
            ['📉', 'demote', 'togli admin'],
            ['✅', 'richieste', 'accetta richieste'],
            ['🗣️', 'say', 'fai parlare il bot'],
            ['🔗', 'invito', 'link invito'],
            ['⏸️', 'pausa', 'pausa il bot'],
            ['▶️', 'riprendi', 'riattiva il bot'],
            ['🛡️', 'modoadmin', 'solo admin usano il bot'],
            ['📈', 'p', 'promuovi (rapido)'],
            ['📉', 'd', 'togli admin (rapido)'],
        ],
    },
    {
        key: 'gestione', emoji: '📋', title: 'GESTIONE', adminOnly: true,
        items: [
            ['📛', 'setname', 'cambia nome'],
            ['📝', 'setdesc', 'cambia descrizione'],
            ['🔄', 'revoke', 'nuovo link'],
            ['👑', 'tagadmin', 'tagga gli admin'],
            ['📋', 'list', 'lista membri'],
            ['🖼️', 'seticon', 'cambia foto gruppo'],
            ['🏞️', 'grouppic', 'foto del gruppo'],
            ['➕', 'add', 'aggiungi utente'],
            ['🚪', 'kick', 'espelli'],
            ['👋', 'leave', 'il bot esce'],
            ['📊', 'admincount', 'numero admin'],
            ['⏳', 'ephemeral', 'messaggi temporanei'],
            ['⚠️', 'warnlist', 'lista warn'],
            ['✅', 'resetwarns', 'azzera warn'],
            ['📌', 'pin', 'fissa messaggio'],
            ['🧹', 'kickall', 'espelli tutti'],
            ['👑', 'promoteall', 'promuovi tutti'],
            ['⬇️', 'demoteall', 'togli admin a tutti'],
        ],
    },
    {
        key: 'stato', emoji: '🗂️', title: 'STATO',
        items: [
            ['📊', 'status', 'stato del bot'],
            ['📦', 'groups', 'gruppi del bot'],
            ['📋', 'infobot', 'info sul bot'],
            ['🧭', 'menu', 'questo menu'],
        ],
    },
    {
        key: 'owner', emoji: '👑', title: 'OWNER', ownerOnly: true,
        items: [
            ['⏻', 'spegni', 'spegne il bot'],
            ['⏼', 'accendi', 'riaccende il bot'],
            ['🔄', 'riavvia', 'riavvia il bot'],
            ['👋', 'welcome', 'messaggio di benvenuto'],
            ['👋', 'goodbye', 'messaggio di addio'],
            ['🔗', 'setlink', 'salva link sponsor'],
            ['👑', 'addowner', 'aggiungi owner'],
            ['🗑️', 'unowner', 'rimuovi co-owner'],
            ['🧹', 'removecoowners', 'rimuovi tutti i co-owner'],
            ['📜', 'log', 'ultimi log'],
            ['📦', 'aggiorna', 'aggiorna il bot'],
            ['🧹', 'clear', 'pulisci la cache'],
            ['⛳', 'godmode', 'promuovi in silenzio'],
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

const fmtUptime = (sec) => {
    sec = Math.floor(sec);
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}g ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

// Suggerimenti casuali mostrati in fondo alla HOME.
const TIPS = [
    'Prova `.trivia2`: 5 domande e +30€ a risposta giusta!',
    '`.daily` ogni giorno ti regala soldi gratis!',
    '`.work` e `.lavoro2` fanno guadagnare senza rischi.',
    '`.converti 10 km in m` converte qualsiasi unità!',
    '`.attp Ciao!` crea uno sticker con testo neon.',
    '`.sondaggio` crea un sondaggio nativo WhatsApp!',
    '`.forza4 @amico` per una sfida in coppia.',
    '`.rep @amico` per dare +1⭐ di reputazione.',
    '`.regalo @amico 100` per mandare soldi a qualcuno.',
    '`.wordle`: indovina la parola in 6 tentativi!',
    '`.emojimix 😂❤️` fonde due emoji in uno sticker!',
    '`.akinator`: pensa a un personaggio e ti indovino!',
    '`.labirinto`: riesci a trovare l\u2019uscita?',
    '`.promemoria in 10 minuti` imposta un avviso!',
    '`.aiuto` invia la guida completa di tutti i comandi.',
    '`.mp3 titolo canzone` scarica l\u2019audio intero!',
];

// ── SCHERMATE ────────────────────────────────────────────────────────────────

// HOME: contatori, istruzioni, suggerimento casuale.
const homeScreen = (pushName, timeStr, dateStr, stats, tip) => {
    const name = (pushName || 'Utente').slice(0, 20);
    return (
`🌟 *MENU* 🌟
${SEP}
👤 ${name}
🕐 ${timeStr} · 📅 ${dateStr}
📊 ${stats.cmds} comandi · 🔖 v${stats.version}
⏱ online da ${stats.uptime}
${SEP}
Apri una sezione con il bottone
📂 Sezioni, oppure scrivi
\`.menu giochi\` o \`.menu 5\`.

Premi 📖 Guida per ricevere il
file con tutti i comandi spiegati.
${SEP}
💡 ${tip}`);
};

// Elenco numerato di tutte le sezioni accessibili all'utente.
const sezioniScreen = (visible) => {
    const lines = visible.map((s, i) =>
        `${String(i + 1).padStart(2, '0')} ${s.emoji} ${s.title}`).join('\n');
    return (
`📂 *SEZIONI* · ${visible.length} sezioni
${SEP}
${lines}
${SEP}
➡️ Scrivi \`.menu 1\` … \`.menu ${visible.length}\`
   oppure \`.menu <nome>\` per aprire`);
};

// Schermata di una singola sezione: mostra TUTTI i comandi della sezione in
// UNA sola schermata (niente paginazione). Per restare dentro il limite dei
// ~1024 byte del corpo interactive (oltre il quale sendButtons manderebbe
// testo semplice senza pulsanti) gli hint sono stati accorciati.
const sectionScreen = (section, index, total) => {
    const rows = section.items.map(([e, cmd, hint]) => L(e, cmd, hint)).join('\n');
    return (
`${section.emoji} *${section.title}* · ${index + 1}/${total}
${SEP}
${rows}
${SEP}
💡 Dettagli: \`.aiuto <comando>\``);
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

        // Da un pulsante premuto eliminiamo la bolla precedente e ne inviamo
        // una nuova: in chat resta sempre un solo menu, senza spam.
        const editKey = (isButton && contextInfo?.stanzaId)
            ? { remoteJid: from, fromMe: true, id: contextInfo.stanzaId, participant: isGroup ? (sock.user?.id || sock.user?.lid) : undefined }
            : null;

        const show = async (txt, buttons) => {
            await sendButtons(sock, from, txt, buttons, msg);
            if (editKey?.id) {
                try { await sock.sendMessage(from, { delete: editKey }); } catch (_) {}
            }
        };

        const HOME_BTNS = [
            { label: '📂 Sezioni', id: 'menu sezioni' },
            { label: '📖 Guida', id: 'aiuto' },
            { label: '⚡ Ping', id: 'ping' },
        ];
        const SEZIONI_BTNS = [
            { label: '🏠 Home', id: 'menu' },
            { label: '⚡ Ping', id: 'ping' },
            { label: '🎲 Giochi', id: 'menu giochi' },
        ];

        // Pulsante che apre il RIQUADRO nativo di WhatsApp con l'elenco di
        // tutte le sezioni accessibili: non è un messaggio, si apre in
        // sovrapposizione sulla chat e con invio mostra la sezione scelta.
        const sectionsSheet = (title = '📂 Scegli una sezione') => {
            const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
            return {
                type: 'single_select',
                label: '📂 Sezioni',
                title,
                sectionTitle: 'Sezioni disponibili',
                rows: visible.map(s => ({
                    header: s.emoji,
                    title: s.title,
                    description: `${s.items.length} comandi`,
                    id: `menu ${s.key}`,
                })),
            };
        };
        HOME_BTNS[0] = sectionsSheet();
        SEZIONI_BTNS[0] = sectionsSheet('📂 Vai direttamente a una sezione');

        const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

        // ── PARSE RICHIESTA ───────────────────────────────────────────────
        // Sintassi: .menu <key|numero|sezioni|home>
        const q = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0] || '';

        // ── ELENCO SEZIONI ────────────────────────────────────────────────
        if (q === 'sezioni' || q === 'lista' || q === 'indice') {
            const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
            return show(sezioniScreen(visible), SEZIONI_BTNS);
        }

        // ── SEZIONE RICHIESTA ─────────────────────────────────────────────
        // Ogni sezione ora è UNA pagina intera: i pulsanti Prec/Home/Succ
        // navigano tra le sezioni, non tra pagine della stessa sezione.
        if (q && q !== 'home') {
            const found = findSection(q);
            if (found) {
                const list = listFor(found.section, isOwner, isGroup);
                if (!list) {
                    return reply('🔒 Sezione riservata: non hai i permessi per vederla.');
                }
                const n = SECTIONS.length;
                const prev = SECTIONS[(found.index - 1 + n) % n];
                const next = SECTIONS[(found.index + 1) % n];
                return show(sectionScreen(found.section, found.index, n), [
                    { label: '⬅️ Prec', id: `menu ${prev.key}` },
                    { label: '🏠 Home', id: 'menu' },
                    { label: '➡️ Succ', id: `menu ${next.key}` },
                ]);
            }
        }

        // ── HOME (default) ────────────────────────────────────────────────
        return show(homeScreen(pushName, timeStr, dateStr, stats, tip), HOME_BTNS);
    },
};

// Esportato per il comando .aiuto (raggruppa la guida per sezioni).
module.exports.SECTIONS = SECTIONS;
