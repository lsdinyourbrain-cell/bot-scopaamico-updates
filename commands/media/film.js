'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  FILM — Vex Bot
//  10 film casuali/trending da TMDB: locandina, anno, voto + pulsante
//  🎬 Trailer che lancia la ricerca su YouTube (yt-dlp).
//  Serve una chiave TMDB gratuita (https://www.themoviedb.org/settings/api):
//    .film set "la-tua-chiave"   (o variabile TMDB_API_KEY)
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

module.exports = {
    name: 'film',
    aliases: ['movies', 'cinema', 'movie'],
    description: "10 film casuali/trending con locandina, anno, voto e pulsante Trailer (TMDB). Serve la chiave: .film set \"chiave\". Uso: .film",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { db, saveDB, axios, sendButtons, sendCarousel } = services;

        const t = String(textArgs || '').trim();
        const [w1, w2] = t.split(/\s+/);

        // ── SALVA CHIAVE TMDB ────────────────────────────────────────────
        if (w1 === 'set') {
            const rawKey = (w2 || '').trim().replace(/^["']|["']$/g, '');
            if (!rawKey || rawKey.length < 10) {
                return reply('❌ Chiave non valida. Usa: `.film set "tmdb-key"`');
            }
            if (!db._tmdb) db._tmdb = {};
            db._tmdb.apiKey = rawKey;
            saveDB();
            return reply('✅ Chiave TMDB salvata! Ora usa `.film` per i film casuali.');
        }

        const apiKey = (db?._tmdb?.apiKey) || process.env.TMDB_API_KEY || '';
        if (!apiKey) {
            return sendButtons(sock, from,
`🎬 *FILM* · serve la chiave TMDB
${SEP}
TMDB è gratuito: registrati su
themoviedb.org/settings/api e
ottieni una chiave, poi salvala:

\`.film set "la-tua-chiave"\`
${SEP}`,
                [{ label: 'ℹ️ Guida TMDB', id: 'film guida' }], msg);
        }

        // ── GUIDA CHIAVE ─────────────────────────────────────────────────
        if (w1 === 'guida') {
            return reply(`🎬 *CHIAVE TMDB (gratuita)*\n${SEP}\n1. Vai su themoviedb.org\n2. Registrati (gratis)\n3. Impostazioni → API\n4. Crea una chiave\n5. Salvala qui:\n\n\`.film set "la-tua-chiave\"\`\n${SEP}\nPoi \`.film\` per i film!`);
        }

        // ── TRAILER SU YOUTUBE ──────────────────────────────────────────
        if (w1 === 'trailer') {
            const title = (w2 || '').replace(/\+/g, ' ').trim();
            if (!title) return reply('ℹ️ Uso: `.film trailer <titolo>`');
            try {
                const { searchVideos } = require('../../lib/mediaDownloader');
                const results = await searchVideos(`${title} trailer`, 3);
                const first = results[0];
                if (!first) return reply('❌ Nessun trailer trovato su YouTube.');
                return sendButtons(sock, from,
`🎬 *TRAILER — ${title}*
${SEP}
🏷️ ${first.title?.slice(0, 80)}
📺 ${first.channel || ''}
${SEP}
👉 ${first.url}`,
                    [{ label: '🔁 Altri film', id: 'film' }, { label: '🎬 Cerca altro', id: `film trailer ${title}` }], msg);
            } catch (e) {
                console.error('[film trailer]', e.message);
                return reply('❌ Non riesco a cercare il trailer. Riprova tra poco.');
            }
        }

        // ── CAROSELLO 10 FILM ────────────────────────────────────────────
        try {
            const page = Math.floor(Math.random() * 5) + 1;
            const { data } = await axios.get(`${BASE}/trending/movie/week`, {
                params: { api_key: apiKey, language: 'it-IT', page },
                timeout: 15000,
            });
            const movies = (data?.results || []).slice(0, 10);
            if (!movies.length) throw new Error('VUOTO');

            const cards = movies.map(movie => ({
                title: `🎬 ${movie.title || 'Senza titolo'}`,
                subtitle: `${movie.release_date?.slice(0, 4) || '?'} · ⭐ ${Number(movie.vote_average || 0).toFixed(1)}`,
                body: `${(movie.overview || 'Nessuna trama.').slice(0, 140)}…`,
                imageUrl: movie.poster_path ? `${IMG}${movie.poster_path}` : '',
                footer: 'TMDB · trending della settimana',
                buttons: [
                    { label: '🎬 Trailer', id: `film trailer ${encodeURIComponent(movie.title)}` },
                ],
            }));

            const sent = await sendCarousel(sock, from, {
                text: `🎬 *FILM DEL MOMENTO*
${SEP}
10 film trending da TMDB.
Premi *🎬 Trailer* per la
ricerca su YouTube.
${SEP}`,
                cards,
            }, msg);
            if (!sent) {
                const lines = movies.map((m, i) =>
                    `${i + 1}. ${m.title} (${m.release_date?.slice(0, 4) || '?'}) ⭐${Number(m.vote_average || 0).toFixed(1)}`
                ).join('\n');
                await sendButtons(sock, from,
`🎬 *FILM DEL MOMENTO*
${SEP}
${lines}
${SEP}
Trailer: \`.film trailer <titolo>\``,
                    [{ label: '🔁 Altri film', id: 'film' }], msg);
            }
        } catch (e) {
            console.error('[film]', e.message);
            const errMsg = e.response?.data?.status_message || '';
            if (String(errMsg).toLowerCase().includes('invalid api key')) {
                return reply('❌ Chiave TMDB non valida. Aggiornala con `.film set "chiave"`.');
            }
            await reply('❌ Non riesco a recuperare i film. Riprova tra poco.');
        }
    },
};
