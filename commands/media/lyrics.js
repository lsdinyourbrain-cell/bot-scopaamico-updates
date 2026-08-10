'use strict';

// Cerca il testo di una canzone. Usa più provider in cascata così il
// fallback copre i casi mancanti: Popcat, Lyrist, Lyrics.ovh, SomeRandomAPI
// e Genius (scrape diretto) come ultima spiaggia.

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

module.exports = {
    name: 'lyrics',
    aliases: [],
    description: "Cerca il testo completo di una canzone. Uso: .lyrics <titolo> <artista>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, db, saveDB, sendButtons } = services;

        const query = (textArgs || '').trim();
        if (!query) {
            return sendButtons(sock, from,
                "🎤 *Manca la canzone!*\n\nEsempio: `.lyrics Blinding Lights The Weeknd`",
                [{ label: '.lyrics Blinding Lights', id: 'lyrics Blinding Lights The Weeknd' }],
                msg);
        }

        try {
            // Prima risolve artista/titolo con iTunes (affidabile e veloce).
            let artist = '';
            let title = query;
            try {
                const search = await axios.get('https://itunes.apple.com/search', {
                    params: { term: query, entity: 'song', limit: 1 },
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

            // L'artista può arrivare anche dall'argomento: se l'utente scrive
            // ".lyrics Blinding Lights The Weeknd" teniamo tutto come termine
            // di ricerca ma proviamo anche la coppia titolo-artista "manuale".
            let found = null;

            // 1) Popcat (cerca per titolo completo)
            found = await tryProvider(async () => {
                const r = await axios.get('https://api.popcat.xyz/lyrics', {
                    params: { song: query },
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
                        params: { title: query },
                        timeout: 12000,
                    });
                    return { lyrics: r.data?.lyrics, title: r.data?.title, artist: r.data?.author };
                }, 'somrandom');
            }

            // 5) Genius (scrape)
            if (!found) {
                found = await tryProvider(() => geniusScrape(axios, artist || query, title || query), 'genius');
            }

            if (!found || !found.lyrics) {
                return reply(`Ho trovato *${title || query}*${artist ? ' — _' + artist + '_' : ''}, ma il testo non è disponibile.`);
            }

            const lyrics = found.lyrics.slice(0, 6000) + (found.lyrics.length > 6000 ? '\n\n…testo tagliato qui.' : '');
            const head = `🎤 *${found.title || title}*${found.artist ? ' — _' + found.artist + '_' : ''}\n\n`;
            await sock.sendMessage(from, { text: head + lyrics }, { quoted: msg });
        } catch (e) {
            console.error('[lyrics]', e.message);
            await reply("Non riesco a recuperare il testo in questo momento. Riprova più tardi.");
        }
    },
};