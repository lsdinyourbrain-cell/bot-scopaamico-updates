'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  MENU — ScopaAmico Bot
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
        key: 'economia', emoji: '💰', title: 'ECONOMIA',
        items: [
            ['⛏️', 'scava', 'scava e guadagna'],
            ['🎰', 'casino', 'giochi da casinò'],
            ['🎲', 'dadi', 'lancia i dadi con soldi'],
            ['🎰', 'slot', 'macchinetta slot'],
            ['🔴', 'roulette', 'puntate alla roulette'],
            ['🪨', 'sasso', 'sasso carta forbici'],
            ['📅', 'daily', 'bonus giornaliero'],
            ['🏧', 'deposita', 'metti soldi in banca'],
            ['💳', 'preleva', 'preleva dalla banca'],
            ['🦹', 'ruba', 'tenta un furto'],
            ['🔫', 'spara', 'incassa la taglia'],
            ['🎟️', 'lotteria', 'biglietto da 50€'],
            ['🏆', 'top', 'classifica più ricchi'],
            ['🤑', 'ricchi', 'lista più ricchi'],
            ['💝', 'famiglia', 'gestisci la famiglia'],
            ['🎁', 'dona', 'dona soldi a un amico'],
            ['📈', 'investi', 'azioni in borsa'],
            ['💼', 'work', 'lavora un turno'],
            ['🔥', 'streak', 'serie di giorni'],
            ['📦', 'cassaforte', 'proteggi i soldi'],
            ['⭐', 'reputazione', '⭐ reputazione nel gruppo'],
            ['💪', 'lavoro2', 'lavoretto freelance'],
            ['🎁', 'regalo', 'manda soldi (max 3/g)'],
            ['🏷️', 'titolo', 'titolo sul profilo'],
        ],
    },
    {
        key: 'giochi', emoji: '🎲', title: 'GIOCHI',
        items: [
            ['❓', 'quiz', 'rispondi e vinci'],
            ['🏁', 'bandiera', 'indovina la nazione'],
            ['💞', 'compatibilita', 'affinità di coppia'],
            ['⚔️', 'duello', 'sfida con puntata'],
            ['🎯', 'indovina', 'numero segreto 1-10'],
            ['🪙', 'testa', 'testa o croce'],
            ['🎲', 'parita', 'pari o dispari'],
            ['🃏', 'alta', 'carta alta o bassa'],
            ['🃏', 'blackjack', '21 contro il bot'],
            ['🎡', 'ruota', 'ruota della fortuna'],
            ['🎟️', 'gratta', 'gratta e vinci'],
            ['⚡', 'reazione', 'test di riflessi'],
            ['🧩', 'parola', 'indovina la parola'],
            ['🧠', 'memoria', 'ricorda i colori'],
            ['🧩', 'enigma', 'indovinello a premi'],
            ['🃏', 'poker', 'sfida a poker'],
            ['🔫', 'russia', 'roulette russa'],
            ['🎱', 'tombola', 'estrazione tombola'],
            ['🎯', 'impiccato', 'indovina o il boia'],
            ['⭕', 'tris', '3 in fila a 2'],
            ['🔴', 'forza4', '4 in fila a 2'],
            ['🟩', 'wordle', 'parola in 6 tentativi'],
            ['🌀', 'labirinto', 'trova l\u2019uscita'],
            ['🏆', 'trivia2', 'sfida 5 domande'],
            ['🎭', 'akinator', 'indovino si/no'],
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
            ['🖐️', 'schiaffo', 'dai uno schiaffo'],
            ['😘', 'bacia', 'un bacio'],
            ['🪙', 'flip', 'testa o croce'],
            ['🎱', '8ball', 'la palla magica'],
            ['📊', 'rate', 'vota da 1 a 10'],
            ['🤔', 'wyr', 'preferiresti?'],
            ['💭', 'quote', 'citazione random'],
            ['🫂', 'abbraccia', 'un abbraccio'],
            ['💍', 'sposa', 'sposati'],
            ['🍑', 'paccasulculo', 'una pacca'],
            ['🔪', 'uccidi', 'finto omicidio'],
            ['🤬', 'insulta', 'insulta'],
            ['🔞', 'scopa', 'ironico'],
            ['💦', 'sborra', 'ironico'],
            ['👉👌', 'ditalino', 'ironico'],
            ['🍆', 'sega', 'ironico'],
            ['💧', 'squirt', 'ironico'],
            ['🤰', 'incinta', 'test gravidanza'],
            ['🍒', 'tette', 'misura tette'],
            ['😂', 'meme', 'audio random'],
            ['🥊', 'rissa', 'fai a botte'],
            ['🍆', 'cazzo', 'misura cazzo'],
            ['🤪', 'sclero', 'sclero random'],
            ['🍺', 'drink', 'offri un drink'],
            ['🍀', 'fact', 'curiosità random'],
            ['🗣️', 'gossip', 'gossip random'],
            ['😂', 'joke', 'barzelletta'],
            ['🍆', 'palo', 'chi ti ha dato palo'],
            ['🤖', 'pick', 'scegli una opzione'],
            ['🙏', 'scusa', 'chiedi scusa'],
        ],
    },
    {
        key: 'utility', emoji: '🛠️', title: 'UTILITY',
        items: [
            ['👤', 'profilo', 'le tue statistiche'],
            ['📡', 'ping', 'stato del bot'],
            ['ℹ️', 'groupinfo', 'info sul gruppo'],
            ['🌤️', 'weather', 'meteo di una città'],
            ['🆔', 'id', 'il tuo ID'],
            ['🧮', 'calc', 'calcola espressioni'],
            ['🔢', 'base64', 'codifica/decodifica'],
            ['🔣', 'hex', 'testo ↔ hex'],
            ['📊', 'count', 'conta caratteri'],
            ['🔐', 'password', 'genera password'],
            ['▦', 'qr', 'genera QR code'],
            ['🔑', 'uuid', 'genera UUID'],
            ['🌐', 'translate', 'traduci testo'],
            ['🪙', 'crypto', 'prezzo criptovalute'],
            ['💱', 'currency', 'converte valute'],
            ['🔗', 'tinyurl', 'accorcia URL'],
            ['📚', 'wiki', 'riassunto Wikipedia'],
            ['🕐', 'ora', 'ora di una città'],
            ['🌙', 'afk', 'sei lontano?'],
            ['📄', 'readmore', 'testo leggi di più'],
            ['👑', 'owner', 'info sul creatore'],
            ['🐛', 'report', 'segnala un bug'],
            ['🌟', 'sponsor', 'sponsor del bot'],
            ['🛡️', 'admin', 'info admin'],
            ['⏰', 'promemoria', 'imposta un avviso'],
            ['📊', 'sondaggio', 'sondaggio WhatsApp'],
            ['🔄', 'converti', 'converte unità'],
            ['⏳', 'timer', 'conto alla rovescia'],
            ['🌙', 'afklist', 'utenti AFK'],
            ['📘', 'aiuto', 'guida dei comandi'],
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

// Limiti per le schermate con pulsanti: il corpo interactive di WhatsApp
// accetta ~1024 BYTE (non caratteri). Oltre, sendButtons invia testo semplice
// senza pulsanti → quindi le sezioni lunghe vengono spezzate in pagine.
const MAX_PAGE_BYTES = 800;
const MAX_PAGE_ITEMS = 12;

// Divide gli item di una sezione in pagine che stanno dentro il limite.
const pageItems = (items) => {
    const pages = [];
    let cur = [];
    let curBytes = 0;
    for (const it of items) {
        const lineBytes = Buffer.byteLength(L(...it), 'utf8') + 1;
        if (cur.length && (curBytes + lineBytes > MAX_PAGE_BYTES || cur.length >= MAX_PAGE_ITEMS)) {
            pages.push(cur);
            cur = [];
            curBytes = 0;
        }
        cur.push(it);
        curBytes += lineBytes;
    }
    if (cur.length) pages.push(cur);
    return pages;
};

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
`🌟 *SCOPAMICO BOT* 🌟
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

// Schermata di una singola sezione: elenco comandi con hint brevi.
// Se la sezione ha più pagine, mostra solo quella richiesta.
const sectionScreen = (section, index, total, page = 1) => {
    const pages = pageItems(section.items);
    const pageNo = Math.min(Math.max(1, page), pages.length);
    const pg = pages[pageNo - 1];
    const rows = pg.map(([e, cmd, hint]) => L(e, cmd, hint)).join('\n');
    const pageInfo = pages.length > 1 ? ` · pag ${pageNo}/${pages.length}` : '';
    return (
`${section.emoji} *${section.title}* · ${index + 1}/${total}${pageInfo}
${SEP}
${rows}
${SEP}
💡 Dettagli di un comando: \`.aiuto <comando>\``);
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
            { label: '💰 Economia', id: 'menu economia' },
        ];
        const SEZIONI_BTNS = [
            { label: '🏠 Home', id: 'menu' },
            { label: '💰 Economia', id: 'menu economia' },
            { label: '🎲 Giochi', id: 'menu giochi' },
        ];

        const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

        // ── PARSE RICHIESTA ───────────────────────────────────────────────
        // Sintassi: .menu <key|numero|sezioni|home> [p<numero>]  (p = pagina).
        const qm = String(textArgs || '').trim().toLowerCase().match(/^(\S+?)(?:\s+(?:p|pag)\s*(\d+))?$/);
        const q = qm ? qm[1] : '';
        const wantPage = qm && qm[2] ? parseInt(qm[2], 10) : 1;

        // ── ELENCO SEZIONI ────────────────────────────────────────────────
        if (q === 'sezioni' || q === 'lista' || q === 'indice') {
            const visible = SECTIONS.filter(s => listFor(s, isOwner, isGroup));
            return show(sezioniScreen(visible), SEZIONI_BTNS);
        }

        // ── SEZIONE RICHIESTA ─────────────────────────────────────────────
        if (q && q !== 'home') {
            const found = findSection(q);
            if (found) {
                const list = listFor(found.section, isOwner, isGroup);
                if (!list) {
                    return reply('🔒 Sezione riservata: non hai i permessi per vederla.');
                }
                const n = SECTIONS.length;
                const pageCount = pageItems(found.section.items).length;

                // Sezione con più pagine → navigazione tra pagine.
                // Sezione singola → navigazione tra sezioni (Prec/Succ).
                if (pageCount > 1) {
                    const btns = [];
                    if (wantPage > 1) btns.push({ label: '⬅️ Pag', id: `menu ${found.section.key} p${wantPage - 1}` });
                    btns.push({ label: '🏠 Home', id: 'menu' });
                    if (wantPage < pageCount) btns.push({ label: '➡️ Pag', id: `menu ${found.section.key} p${wantPage + 1}` });
                    return show(sectionScreen(found.section, found.index, n, wantPage), btns);
                }

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
