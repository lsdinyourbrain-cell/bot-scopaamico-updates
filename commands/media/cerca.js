'use strict';

const fs = require('fs/promises');
const { searchVideos, downloadAudio, downloadVideo, getDownloadErrorMessage } = require('../../lib/mediaDownloader');
const { sendCarousel } = require('../../lib/buttons');

const MIME_BY_EXT = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    opus: 'audio/webm',
    ogg: 'audio/ogg',
};

// Stato per chat: risultati della ricerca + pagina corrente (solo per il
// fallback testuale). Manteniamo qui i dati tra una pressione di pulsante e
// l'altra (la quale arriva come comando).
const state = new Map(); // key: chatJid → { results, query, page, ts }
const STATE_TTL = 10 * 60 * 1000; // 10 minuti
const RESULTS_COUNT = 10; // max card del carosello (WhatsApp: 10)

const getState = (from) => {
    const st = state.get(from);
    if (st && Date.now() - st.ts > STATE_TTL) { state.delete(from); return null; }
    return st;
};

const fmtDur = (s) => {
    s = Math.floor(s || 0);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
};

const fmtViews = (n) => {
    n = Number(n) || 0;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
};

const totalPages = (results) => Math.max(1, Math.ceil(results.length / 2));

// ── UI PRINCIPALE: CAROSELLO (card orizzontali scorrevoli) ────────────────
// Una card per video con thumbnail, titolo, canale e 3 pulsanti:
// MP3 (download diretto), MP4 (download diretto), Info (dettagli).
const buildCards = (results) => results.map((v, i) => {
    const n = i + 1;
    const dur = v.duration ? `⏱ ${fmtDur(v.duration)}` : '';
    const views = v.views ? `👁 ${fmtViews(v.views)}` : '';
    return {
        title: (v.title || 'Video').slice(0, 80),
        subtitle: (v.channel || 'YouTube').slice(0, 40),
        body: `${dur}${dur && views ? ' · ' : ''}${views}`.trim() || ' ',
        footer: `#${n}/${results.length}`,
        imageUrl: v.thumbnail || '',
        buttons: [
            { label: '🎵 MP3', id: `cerca download ${n} audio` },
            { label: '🎥 MP4', id: `cerca download ${n} video` },
            { label: 'ⓘ Info', id: `cerca pick ${n}` },
        ],
    };
});

module.exports = {
    name: 'cerca',
    aliases: ['yt', 'search', 'trova'],
    description: "Cerca video su YouTube: scorri le card e scarica subito l'audio in .mp3 o il video. Uso: .cerca <testo>",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { sendButtons } = services;

        const textArgs = (args || []).join(' ').trim();

        // ── AGISCI SUI PULSANTI / SOTTOCOMANDI ────────────────────────────
        const fn = String(textArgs).toLowerCase();
        const st = getState(from);

        if (fn === 'indietro' || fn === 'back') {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            return renderCarousel(sock, from, st, msg, reply);
        }

        const pickMatch = fn.match(/^pick (\d+)$/);
        if (pickMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const idx = parseInt(pickMatch[1], 10) - 1;
            const video = st.results[idx];
            if (!video) return reply('❌ Video non trovato. Riprova.');
            return renderPick(sock, from, st, video, msg, sendButtons);
        }

        // Fallback testuale (solo se il carosello non è riuscito a partire)
        const pageMatch = fn.match(/^pag ?(\d+)$/);
        if (pageMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const p = parseInt(pageMatch[1], 10);
            const pages = totalPages(st.results);
            st.page = ((p - 1 + pages) % pages) + 1;
            st.ts = Date.now();
            return renderResultsFallback(sock, from, st, msg, sendButtons);
        }

        const dlMatch = fn.match(/^download (\d+) (audio|video)$/);
        if (dlMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const idx = parseInt(dlMatch[1], 10) - 1;
            const video = st.results[idx];
            if (!video) return reply('❌ Video non trovato. Riprova.');
            const kind = dlMatch[2];
            // Per il video si sceglie prima la qualità.
            if (kind === 'video') {
                return renderQualityMenu(sock, from, st, video, msg, sendButtons);
            }
            return runDownload(sock, from, video, 'audio', msg, reply);
        }

        // download video con qualità scelta: vq <N> <qualità (360|480|720|1080)>
        const vqMatch = fn.match(/^vq (\d+) (\d+)$/);
        if (vqMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const idx = parseInt(vqMatch[1], 10) - 1;
            const video = st.results[idx];
            if (!video) return reply('❌ Video non trovato. Riprova.');
            const height = parseInt(vqMatch[2], 10);
            if (![360, 480, 720, 1080].includes(height)) return reply('❌ Qualità non valida.');
            return runDownload(sock, from, video, 'video', msg, reply, height);
        }

        // ── NUOVA RICERCA ─────────────────────────────────────────────────
        const query = textArgs;
        if (!query) {
            return sendButtons(sock, from,
                "🔎 *Ricerca su YouTube*\n\nScrivi cosa cerchi. Esempio:\n`.cerca Blinding Lights The Weeknd`\n\nScorri le card, premi *MP3* (audio in .mp3) o *MP4* (video).",
                [{ label: '.cerca Blinding Lights', id: 'cerca Blinding Lights The Weeknd' }],
                msg);
        }

        await reply(`🔍 Cerco "*${query}*" su YouTube...`);
        try {
            const results = await searchVideos(query, RESULTS_COUNT);
            const newState = { results, query, page: 1, ts: Date.now() };
            state.set(from, newState);

            const sent = await renderCarousel(sock, from, newState, msg, reply);
            // Se il carosello non parte (vecchio client/problemi), si ripiega
            // sulla UI testuale a pagine (NUOVO messaggio a ogni pressione,
            // niente edit: sempre visibile).
            if (!sent) {
                return renderResultsFallback(sock, from, newState, msg, sendButtons);
            }
        } catch (e) {
            console.error('[cerca]', e.message);
            return reply('❌ ' + getDownloadErrorMessage(e));
        }
    },
};

// ── RENDER CAROSELLO ──────────────────────────────────────────────────────
async function renderCarousel(sock, from, st, msg, reply) {
    try {
        const sent = await sendCarousel(sock, from, {
            text: `🔎 *Risultati per "${st.query}"* — scorri ➡️`,
            cards: buildCards(st.results),
        }, msg);
        return sent;
    } catch (e) {
        console.error('[cerca] carosello:', e.message);
        return false;
    }
}

// ── FALLBACK TESTUALE (pagine, 2 video per pagina) ─────────────────────────
// Usa solo sendButtons con NUOVO messaggio: niente edit, quindi risponde
// SEMPRE con qualcosa di visibile su ogni pulsante premuto.
const resultsText = (st) => {
    const start = (st.page - 1) * 2;
    const items = st.results.slice(start, start + 2);
    const tot = st.results.length;
    const pages = totalPages(st.results);
    return (
`🔎 *Risultati per "${st.query}"*
${'─'.repeat(20)}
${items.map((v, i) => {
    const n = start + i + 1;
    const dur = v.duration ? ` · ⏱ ${fmtDur(v.duration)}` : '';
    const ch = v.channel ? `\n   📺 ${v.channel}` : '';
    return `${n}. ${v.title}${dur}${ch}`;
}).join('\n')}
${'─'.repeat(20)}
Pagina ${st.page}/${pages} · ${tot} video
👇 Premi *1* o *2* per scegliere,
oppure naviga con i pulsanti.`);
};

async function renderResultsFallback(sock, from, st, msg, sendButtons) {
    const pages = totalPages(st.results);
    const start = (st.page - 1) * 2;
    const onFirst = st.page === 1;
    const onLast = st.page === pages;

    const selButtons = [];
    for (let i = 0; i < 2; i++) {
        const v = st.results[start + i];
        if (v) {
            selButtons.push({
                label: `${start + i + 1}️⃣ ${v.title.slice(0, 20)}`,
                id: `cerca pick ${start + i + 1}`,
            });
        }
    }

    let nav;
    if (pages <= 1) {
        nav = null;
    } else if (onFirst) {
        nav = { label: `➡️ Pag ${st.page + 1}`, id: `cerca pag ${st.page + 1}` };
    } else if (onLast) {
        nav = { label: `⬅️ Pag ${st.page - 1}`, id: `cerca pag ${st.page - 1}` };
    } else {
        nav = { label: `⬅️⬆️ ${st.page - 1}-${st.page + 1}`, id: `cerca pag ${st.page + 1}` };
    }

    return sendButtons(sock, from, resultsText(st), nav ? [...selButtons, nav] : selButtons, msg);
}

// ── RENDER INFO VIDEO ─────────────────────────────────────────────────────
async function renderPick(sock, from, st, video, msg, sendButtons) {
    const idx = st.results.indexOf(video) + 1;
    const buttons = [
        { label: '🎵 Audio (mp3)', id: `cerca download ${idx} audio` },
        { label: '🎥 Video (mp4)', id: `cerca download ${idx} video` },
        { label: '⬅️ Indietro', id: 'cerca indietro' },
    ];
    return sendButtons(sock, from, pickText(video), buttons, msg);
}

// ── RENDER MENU QUALITÀ VIDEO ──────────────────────────────────────────────
// Max 3 pulsanti per messaggio: 360p, 720p, 1080p (480p resta selezionabile
// scrivendo ".cerca vq <n> 480").
const QUALITY_OPTIONS = [
    { label: '📺 360p', id: (n) => `cerca vq ${n} 360` },
    { label: '📺 720p', id: (n) => `cerca vq ${n} 720` },
    { label: '📺 1080p', id: (n) => `cerca vq ${n} 1080` },
];

async function renderQualityMenu(sock, from, st, video, msg, sendButtons) {
    const idx = st.results.indexOf(video) + 1;
    return sendButtons(
        sock,
        from,
        `🎥 *${video.title}*\n\n📥 Scegli la qualità del video:`,
        QUALITY_OPTIONS.map((o) => ({ label: o.label, id: o.id(idx) })),
        msg
    );
}

const pickText = (video) => (
`🎬 *${video.title}*
${video.duration ? `⏱ ${fmtDur(video.duration)}` : ''}${video.channel ? ` · 📺 ${video.channel}` : ''}
${video.views ? `\n👁 ${fmtViews(video.views)} visualizzazioni` : ''}

Cosa vuoi scaricare?`
);

// ── DOWNLOAD ED INVIO ─────────────────────────────────────────────────────
async function runDownload(sock, from, video, kind, msg, reply, height) {
    if (kind === 'video' && height) {
        await reply(`🎥 Scarico il video in ${height}p... (ci vuole un po')`);
    } else {
        await reply(kind === 'audio' ? '🎵 Scarico l’audio...' : '🎥 Scarico il video... (ci vuole un po\')');
    }
    let download = null;
    try {
        download = kind === 'audio'
            ? await downloadAudio(video.url)
            : await downloadVideo(video.url, { height });
        const file = await fs.readFile(download.filePath);
        if (!file.length) throw new Error('file scaricato vuoto');

        const cleanName = (video.title || 'video').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 60) || 'video';

        if (kind === 'audio') {
            // L'audio viene sempre convertito/consegnato come .mp3. Se la
            // conversione mp3 è fallita, l'estensione reale è in download.ext.
            const ext = download.ext || 'mp3';
            await sock.sendMessage(from, {
                document: file,
                mimetype: MIME_BY_EXT[ext] || 'audio/mpeg',
                fileName: `${cleanName}.${ext}`,
            }, { quoted: msg });
            await reply(`🎵 *Audio pronto!*\n${video.title}`);
        } else {
            // Il video è garantito in .mp4 (mediaDownloader converte
            // .webm/.mkv): mimetype corretto = WhatsApp lo apre.
            const quality = height ? ` (${height}p)` : '';
            await sock.sendMessage(from, {
                video: file,
                mimetype: 'video/mp4',
                caption: `🎥 ${video.title}${quality}`,
            }, { quoted: msg });
            await reply(`✅ *Video inviato!*${quality}`);
        }
    } catch (e) {
        console.error('[cerca]', e.message);
        await reply('❌ ' + getDownloadErrorMessage(e));
    } finally {
        await download?.cleanup();
    }
}