'use strict';

// Ricerca del testo di una canzone, condivisa tra .lyrics e .play.
// Usa più provider in cascata così il fallback copre i casi mancanti:
// Popcat, Lyrist, Lyrics.ovh, SomeRandomAPI e Genius (scrape diretto).

async function tryProvider(fn, name) {
    try {
        const res = await fn();
        if (res && res.lyrics && String(res.lyrics).trim()) {
            return { ...res, lyrics: String(res.lyrics).trim() };
        }
    } catch (e) {
        console.error(`[lyrics] ${name}:`, e.message);
    }
    return null;
}

// Genius: scrape della pagina. query = "artista - titolo" senza slash.
async function geniusScrape(axios, artist, title) {
    const slug = `${(artist || '')}-${(title || '')}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    if (!slug) return null;

    const resp = await axios.get(`https://genius.com/${slug}-lyrics`, {
        timeout: 12000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        validateStatus: () => true,
    });
    if (resp.status !== 200) return null;

    const html = String(resp.data || '');
    const m = html.match(/<div[^>]*data-lyrics-container="true"[^>]*>[\s\S]*?<\/div>/g);
    if (!m || !m.length) return null;

    const text = m
        .map(block => block
            .replace(/<div[^>]*data-lyrics-container="true"[^>]*>/i, '')
            .replace(/<\/div>/i, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .trim())
        .filter(Boolean)
        .join('\n\n');

    if (!text) return null;
    return { lyrics: text, title, artist };
}

// Risolve il testo di una canzone a partire da una query libera.
// Ritorna { lyrics, title, artist } oppure null se non trovato.
const searchLyrics = async (axios, query) => {
    const q = String(query || '').trim();
    if (!q) return null;

    // Prima risolve artista/titolo con iTunes (affidabile e veloce).
    let artist = '';
    let title = q;
    try {
        const search = await axios.get('https://itunes.apple.com/search', {
            params: { term: q, entity: 'song', limit: 1 },
            timeout: 8000,
        });
        const song = search.data?.results?.[0];
        if (song) {
            title = song.trackName || title;
            artist = song.artistName || '';
        }
    } catch (e) {
        console.error('[lyrics] itunes:', e.message);
    }

    let found = null;

    // 1) Popcat (cerca per titolo completo)
    found = await tryProvider(async () => {
        const r = await axios.get('https://api.popcat.xyz/lyrics', {
            params: { song: q },
            timeout: 12000,
        });
        return { lyrics: r.data?.lyrics, title: r.data?.title, artist: r.data?.author };
    }, 'popcat');

    // 2) Lyrist (titolo / artista risolti da iTunes)
    if (!found && title) {
        found = await tryProvider(async () => {
            const r = await axios.get(
                `https://lyrist.vercel.app/api/${encodeURIComponent(title)}${artist ? '/' + encodeURIComponent(artist) : ''}`,
                { timeout: 12000 }
            );
            return { lyrics: r.data?.lyrics, title: r.data?.title || title, artist: r.data?.artist || artist };
        }, 'lyrist');
    }

    // 3) Lyrics.ovh (artista/titolo)
    if (!found && artist && title) {
        found = await tryProvider(async () => {
            const r = await axios.get(
                `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
                { timeout: 12000 }
            );
            return { lyrics: r.data?.lyrics, title, artist };
        }, 'lyricsovh');
    }

    // 4) SomeRandomAPI
    if (!found) {
        found = await tryProvider(async () => {
            const r = await axios.get('https://some-random-api.com/lyrics', {
                params: { title: q },
                timeout: 12000,
            });
            return { lyrics: r.data?.lyrics, title: r.data?.title, artist: r.data?.author };
        }, 'somrandom');
    }

    // 5) Genius (scrape)
    if (!found) {
        found = await tryProvider(() => geniusScrape(axios, artist || q, title || q), 'genius');
    }

    return found || null;
};

module.exports = { searchLyrics };
