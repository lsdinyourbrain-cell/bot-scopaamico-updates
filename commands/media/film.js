'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  FILM — Vex Bot
//  10 film casuali/trending da TMDB: locandina, anno, voto + pulsante
//  🎬 Trailer che lancia la ricerca su YouTube (yt-dlp).
//  Serve una chiave TMDB gratuita (https://www.themoviedb.org/settings/api):
//    .film set "la-tua-chiave"   (o variabile TMDB_API_KEY)
// 
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

        // ── SALVA CHIAVE TMDB 
        if (w1 === 'set') {
            const rawKey = (w2 || '').trim().replace(/^["']|["']$/g, '');
            if (!rawKey || rawKey.length < 10) {
                return reply('❌ Chiave non valida. Usa: `.film set "tmdb-key"`');
            }
            if (!db._tmdb) db._tmdb = {};
            db._tmdb.apiKey = rawKey;
            saveDB();
            return reply('✅ *_CHIAVE TMDB SALVATA_*\n\n▸ Ora usa `.film` per _i film casuali_.\n');
        }

        const apiKey = (db?._tmdb?.apiKey) || process.env.TMDB_API_KEY || '';
        if (!apiKey) {
            return sendButtons(sock, from,
`🎬 *_FILM_* · _serve la chiave TMDB_

▸ TMDB è _gratuito_: registrati su
  themoviedb.org/settings/api e
  ottieni una _chiave_, poi salvala:

▸ \`.film set "la-tua-chiave"\`

`,
                [{ label: 'ℹ️ Guida TMDB', id: 'film guida' }], msg);
        }

        // ── GUIDA CHIAVE 
        if (w1 === 'guida') {
            return reply(`🎬 *_CHIAVE TMDB (GRATUITA)_*\n\n▸ 1. _Vai su themoviedb.org_\n▸ 2. _Registrati (gratis)_\n▸ 3. _Impostazioni → API_\n▸ 4. _Crea una chiave_\n▸ 5. _Salvala qui:_\n\n▸ \`.film set "la-tua-chiave"\`\n\n▸ Poi \`.film\` per _i film!_\n`);
        }

        // ── TRAILER SU YOUTUBE 
        if (w1 === 'trailer') {
            const title = (w2 || '').replace(/\+/g, ' ').trim();
            if (!title) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: *.film trailer <titolo>')}
${boxEnd()}`);
            try {
                const { searchVideos } = require('../../lib/mediaDownloader');
                const results = await searchVideos(`${title} trailer`, 3);
                const first = results[0];
                if (!first) return reply('❌ Nessun trailer trovato su YouTube.');
                return sendButtons(sock, from,
`🎬 *_TRAILER_* — _${title}_

▸ 🏷️ _${first.title?.slice(0, 80)}_
▸ 📺 _${first.channel || ''}_

▸ 👉 ${first.url}
`,
                    [{ label: '🔁 Altri film', id: 'film' }, { label: '🎬 Cerca altro', id: `film trailer ${title}` }], msg);
            } catch (e) {
                console.error('[film trailer]', e.message);
                return reply('❌ Non riesco a cercare il trailer. Riprova tra poco.');
            }
        }

        // ── CAROSELLO 10 FILM 
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
                text: `🎬 *_FILM DEL MOMENTO_*

▸ _10 film trending da TMDB._
▸ Premi *🎬 Trailer* per la
  _ricerca su YouTube._

`,
                cards,
            }, msg);
            if (!sent) {
                const lines = movies.map((m, i) =>
                    `${i + 1}. ${m.title} (${m.release_date?.slice(0, 4) || '?'}) ⭐${Number(m.vote_average || 0).toFixed(1)}`
                ).join('\n');
                await sendButtons(sock, from,
`🎬 *_FILM DEL MOMENTO_*

${lines}

▸ Trailer: \`.film trailer <titolo>\`
`,
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
