'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

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

// Un upload verso i server media di WhatsApp può fallire in modo transitorio
// (host occupati, connessione appena riconnessa, limiti temporanei). Questi
// errori si riprovano con piccole attese, mentre gli altri vanno in errore.
const UPLOAD_RETRYABLE = /media upload|upload failed|upload\.\*host|cannot process empty|null response|ECONNRESET|ETIMEDOUT|EPIPE|429|413|EMPTY_FILE/i;
const UPLOAD_ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendUploadWithRetry(send) {
    let lastErr;
    for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
        try {
            return await send();
        } catch (e) {
            lastErr = e;
            const msg = String(e?.message || '');
            if (!UPLOAD_RETRYABLE.test(msg)) throw e;
            if (attempt === UPLOAD_ATTEMPTS) break;
            console.warn(`[cerca] upload media fallito (${attempt}/${UPLOAD_ATTEMPTS}):`, msg.slice(0, 120));
            await wait(1500 * attempt);
        }
    }
    throw lastErr;
}

const describeUploadError = (error) => {
    const msg = String(error?.message || '');
    if (/media upload|upload failed|upload.*host|429|413|EMPTY_FILE/i.test(msg)) {
        return '⚠️ WhatsApp non ha accettato il file\n(server media occupati o file troppo\ngrande). Riprova tra un minuto, oppure\nscegli una qualità più bassa per i video.';
    }
    if (/cannot process empty|null response/i.test(msg)) {
        return '⚠️ WhatsApp ha ricevuto un file vuoto.\nRiprova: a volte basta un nuovo tentativo.';
    }
    return null;
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

// ── UI PRINCIPALE: CAROSELLO (card orizzontali scorrevoli) 
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
            { label: '🔗 Apri su YT', url: v.url },
        ],
    };
});

module.exports = {
    name: 'cerca',
    aliases: ['yt', 'search', 'trova', 'play', 'ytplay', 'ytsearch'],
    description: "Cerca video su YouTube: scorri le card e scarica subito l'audio in .mp3 o il video. Uso: .cerca <testo>",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { sendButtons } = services;

        const textArgs = (args || []).join(' ').trim();

        // ── AGISCI SUI PULSANTI / SOTTOCOMANDI 
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

        // ── NUOVA RICERCA 
        const query = textArgs;
        if (!query) {
            return sendButtons(sock, from,
                "🔎 *_RICERCA SU YOUTUBE_*\n\n▸ Scrivi cosa cerchi. Esempio:\n▸ `.cerca Blinding Lights The Weeknd`\n\n▸ Scorri le card, premi *MP3* (_audio_) o *MP4* (_video_).\n",
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

// ── RENDER CAROSELLO 
async function renderCarousel(sock, from, st, msg, reply) {
    try {
        const sent = await sendCarousel(sock, from, {
            text: `🔎 *_Risultati_* per _"${st.query}"_ — _scorri ➡️_`,
            cards: buildCards(st.results),
        }, msg);
        return sent;
    } catch (e) {
        console.error('[cerca] carosello:', e.message);
        return false;
    }
}

// ── FALLBACK TESTUALE (pagine, 2 video per pagina) 
// Usa solo sendButtons con NUOVO messaggio: niente edit, quindi risponde
// SEMPRE con qualcosa di visibile su ogni pulsante premuto.
const resultsText = (st) => {
    const start = (st.page - 1) * 2;
    const items = st.results.slice(start, start + 2);
    const tot = st.results.length;
    const pages = totalPages(st.results);
    return (
`🔎 *_Risultati_* per _"${st.query}"_
${items.map((v, i) => {
    const n = start + i + 1;
    const dur = v.duration ? ` · ⏱ _${fmtDur(v.duration)}_` : '';
    const ch = v.channel ? `\n▸ 📺 _${v.channel}_` : '';
    return `${n}. ${v.title}${dur}${ch}`;
}).join('\n')}
▸ _Pagina_ ${st.page}/${pages} · _${tot} video_
▸ 👇 Premi *1* o *2* per _scegliere_,
  oppure naviga con _i pulsanti_.
`);
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

// ── RENDER INFO VIDEO 
async function renderPick(sock, from, st, video, msg, sendButtons) {
    const idx = st.results.indexOf(video) + 1;
    const buttons = [
        { label: '🎵 Audio (mp3)', id: `cerca download ${idx} audio` },
        { label: '🎥 Video (mp4)', id: `cerca download ${idx} video` },
        { label: '⬅️ Indietro', id: 'cerca indietro' },
    ];
    return sendButtons(sock, from, pickText(video), buttons, msg);
}

// ── RENDER MENU QUALITÀ VIDEO 
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
        `🎥 *_${video.title}_*\n\n▸ 📥 _Scegli la qualità del video:_\n`,
        QUALITY_OPTIONS.map((o) => ({ label: o.label, id: o.id(idx) })),
        msg
    );
}

const pickText = (video) => (
`🎬 *_${video.title}_*
${video.duration ? `▸ ⏱ _${fmtDur(video.duration)}_` : ''}${video.channel ? ` ▸ 📺 _${video.channel}_` : ''}
${video.views ? `▸ 👁 _${fmtViews(video.views)} visualizzazioni_` : ''}
▸ _Cosa vuoi scaricare?_
`
);

// ── DOWNLOAD ED INVIO 
async function runDownload(sock, from, video, kind, msg, reply, height) {
    // Il video viene inviato SENZA messaggi di contorno: solo il video.
    if (kind === 'audio') {
        await reply('🎵 Scarico l’audio...');
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
            await sendUploadWithRetry(() => sock.sendMessage(from, {
                document: file,
                mimetype: MIME_BY_EXT[ext] || 'audio/mpeg',
                fileName: `${cleanName}.${ext}`,
            }, {
                quoted: msg,
                mediaUploadTimeoutMs: 120000,
            }));
            await reply(`🎵 *_AUDIO PRONTO_*\n\n▸ _${video.title}_\n`);
        } else {
            // Il video è garantito in .mp4 (mediaDownloader converte
            // .webm/.mkv e i codec non h264): mimetype corretto.
            const quality = height ? ` (_${height}p_)` : '';
            const caption = `🎥 *_${video.title}_*${quality}\n`;
            // WhatsApp rifiuta l'upload ("Media upload failed") se il video
            // è troppo grande per un messaggio video: sopra i 50MB viene
            // inviato come FILE .mp4 (limite file = 2GB).
            const tooBig = file.length > 50 * 1024 * 1024;
            let sent = false;

            if (!tooBig) {
                try {
                    await sendUploadWithRetry(() => sock.sendMessage(from, {
                        video: file,
                        mimetype: 'video/mp4',
                        caption,
                    }, {
                        quoted: msg,
                        mediaUploadTimeoutMs: 120000,
                    }));
                    sent = true;
                } catch (e) {
                    const uploadError = /upload failed|media upload|upload.*host|429|413|EMPTY_FILE|cannot process empty/i.test(String(e.message || ''));
                    if (!uploadError) throw e;
                    console.warn('[cerca] upload video fallito, invio come file:', e.message);
                }
            }

            if (!sent) {
                await sendUploadWithRetry(() => sock.sendMessage(from, {
                    document: file,
                    mimetype: 'video/mp4',
                    fileName: `${cleanName}.mp4`,
                }, {
                    quoted: msg,
                    mediaUploadTimeoutMs: 120000,
                }));
            }
        }
    } catch (e) {
        console.error('[cerca]', e.message);
        const uploadErr = describeUploadError(e);
        if (uploadErr) {
            await reply(uploadErr);
        } else {
            await reply('❌ ' + getDownloadErrorMessage(e));
        }
    } finally {
        await download?.cleanup();
    }
}