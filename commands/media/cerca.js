'use strict';

const fs = require('fs/promises');
const { searchVideos, downloadAudio, downloadVideo, getDownloadErrorMessage } = require('../../lib/mediaDownloader');

const MIME_BY_EXT = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    webm: 'audio/webm',
    opus: 'audio/webm',
    ogg: 'audio/ogg',
};

// Stato per chat: risultati della ricerca + pagina corrente. Manteniamo qui i
// dati tra una pressione di pulsante e l'altra (la quale arriva come comando).
const state = new Map(); // key: chatJid → { results, query, page, ts }
const STATE_TTL = 10 * 60 * 1000; // 10 minuti

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

const totalPages = (results) => Math.max(1, Math.ceil(results.length / 2));

// Schermata dei risultati (2 video per pagina).
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

// Conferma del video scelto.
const pickText = (video) => (
`🎬 *${video.title}*
${video.duration ? `⏱ ${fmtDur(video.duration)}` : ''}${video.channel ? ` · 📺 ${video.channel}` : ''}
${video.views ? `\n👁 ${Number(video.views).toLocaleString('it-IT')} visualizzazioni` : ''}

Cosa vuoi scaricare?`);

module.exports = {
    name: 'cerca',
    aliases: ['yt', 'search', 'trova'],
    description: "Cerca video su YouTube, naviga tra i risultati coi pulsanti e scarica quello che vuoi (audio o video). Uso: .cerca <testo>",

    async run(sock, msg, args, context) {
        const { from, isButton, contextInfo, reply, services } = context;
        const { sendButtons, editButtons } = services;

        const textArgs = (args || []).join(' ').trim();

        // ── AGISCI SUI PULSANTI / SOTTOCOMANDI ────────────────────────────
        const fn = String(textArgs).toLowerCase();
        const st = getState(from);

        if (fn === 'indietro' || fn === 'back') {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            return renderResults(sock, from, st, msg, isButton, contextInfo, editButtons, sendButtons);
        }

        const pickMatch = fn.match(/^pick (\d+)$/);
        if (pickMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const idx = parseInt(pickMatch[1], 10) - 1;
            const video = st.results[idx];
            if (!video) return reply('❌ Video non trovato. Riprova.');
            return renderPick(sock, from, st, video, msg, isButton, contextInfo, editButtons, sendButtons);
        }

        const pageMatch = fn.match(/^pag ?(\d+)$/);
        if (pageMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const p = parseInt(pageMatch[1], 10);
            const pages = totalPages(st.results);
            st.page = ((p - 1 + pages) % pages) + 1;
            st.ts = Date.now();
            return renderResults(sock, from, st, msg, isButton, contextInfo, editButtons, sendButtons);
        }

        // download <N> audio|video
        const dlMatch = fn.match(/^download (\d+) (audio|video)$/);
        if (dlMatch) {
            if (!st) return reply('❌ La ricerca è scaduta. Riprova con `.cerca <testo>`');
            const idx = parseInt(dlMatch[1], 10) - 1;
            const video = st.results[idx];
            if (!video) return reply('❌ Video non trovato. Riprova.');
            const kind = dlMatch[2];
            return runDownload(sock, from, video, kind, msg, reply);
        }

        // ── NUOVA RICERCA ─────────────────────────────────────────────────
        const query = textArgs;
        if (!query) {
            return sendButtons(sock, from,
                "🔎 *Ricerca su YouTube*\n\nScrivi cosa cerchi. Esempio:\n`.cerca Blinding Lights The Weeknd`\n\nPoi scegli il video coi pulsanti e scaricalo come *audio* o *video*.",
                [{ label: '.cerca Blinding Lights', id: 'cerca Blinding Lights The Weeknd' }],
                msg);
        }

        await reply(`🔎 Cerco "*${query}*" su YouTube...`);
        try {
            const results = await searchVideos(query, 6);
            const newState = { results, query, page: 1, ts: Date.now() };
            state.set(from, newState);
            return renderResults(sock, from, newState, msg, false, null, editButtons, sendButtons);
        } catch (e) {
            console.error('[cerca]', e.message);
            return reply('❌ ' + getDownloadErrorMessage(e));
        }
    },
};

// ── RENDER RISULTATI (con navigazione) ─────────────────────────────────────
async function renderResults(sock, from, st, msg, isButton, contextInfo, editButtons, sendButtons) {
    const pages = totalPages(st.results);
    const start = (st.page - 1) * 2;
    const onFirst = st.page === 1;
    const onLast = st.page === pages;

    // 2 pulsanti di selezione + 1 di navigazione (max 3 per WhatsApp)
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

    const buttons = nav ? [...selButtons, nav] : selButtons;
    const editKey = isButton && contextInfo?.stanzaId
        ? { remoteJid: from, fromMe: true, id: contextInfo.stanzaId, participant: from.endsWith('@g.us') ? (sock.user?.id || sock.user?.lid) : undefined }
        : null;

    if (editKey?.id && buttons.length <= 3) {
        return editButtons(sock, from, resultsText(st), buttons, editKey, msg);
    }
    return sendButtons(sock, from, resultsText(st), buttons, msg);
}

// ── RENDER CONFERMA VIDEO ──────────────────────────────────────────────────
async function renderPick(sock, from, st, video, msg, isButton, contextInfo, editButtons, sendButtons) {
    const idx = st.results.indexOf(video) + 1;
    const buttons = [
        { label: '🎵 Audio (mp3)', id: `cerca download ${idx} audio` },
        { label: '🎥 Video (mp4)', id: `cerca download ${idx} video` },
        { label: '⬅️ Indietro', id: 'cerca indietro' },
    ];
    const editKey = isButton && contextInfo?.stanzaId
        ? { remoteJid: from, fromMe: true, id: contextInfo.stanzaId, participant: from.endsWith('@g.us') ? (sock.user?.id || sock.user?.lid) : undefined }
        : null;

    if (editKey?.id) {
        return editButtons(sock, from, pickText(video), buttons, editKey, msg);
    }
    return sendButtons(sock, from, pickText(video), buttons, msg);
}

// ── DOWNLOAD ED INVIO ──────────────────────────────────────────────────────
async function runDownload(sock, from, video, kind, msg, reply) {
    await reply(kind === 'audio' ? '🎵 Scarico l’audio...' : '🎥 Scarico il video... (ci vuole un po\')');
    let download = null;
    try {
        download = kind === 'audio'
            ? await downloadAudio(video.url)
            : await downloadVideo(video.url);
        const file = await fs.readFile(download.filePath);
        if (!file.length) throw new Error('file scaricato vuoto');

        const cleanName = (video.title || 'video').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 60) || 'video';

        if (kind === 'audio') {
            const ext = download.ext || 'mp3';
            await sock.sendMessage(from, {
                document: file,
                mimetype: MIME_BY_EXT[ext] || 'audio/mpeg',
                fileName: `${cleanName}.${ext}`,
            }, { quoted: msg });
            await reply(`🎵 *Audio pronto!*\n${video.title}`);
        } else {
            await sock.sendMessage(from, {
                video: file,
                caption: `🎥 ${video.title}`,
            }, { quoted: msg });
            await reply('✅ *Video inviato!*');
        }
    } catch (e) {
        console.error('[cerca]', e.message);
        await reply('❌ ' + getDownloadErrorMessage(e));
    } finally {
        await download?.cleanup();
    }
}