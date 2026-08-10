'use strict';

function truncate(str, maxLen) {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLen ? s.slice(0, maxLen - 1) + '\u2026' : s;
}

function fmt(n) {
    return Number(n || 0).toLocaleString('it-IT');
}

function fmtDuration(sec) {
    const s = Number(sec) || 0;
    if (s <= 0) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = Math.floor(s % 60);
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    return m + ':' + String(r).padStart(2, '0');
}

function mapLastfmError(err) {
    const msg = String(err?.message || '');
    if (msg === 'UTENTE_NON_TROVATO' || /404|not found|non trovato/i.test(msg))
        return 'Utente Last.fm non trovato. Controlla il nome account.';
    if (msg === 'API_KEY_INVALIDA' || /403|invalid.*key|key.*invalid/i.test(msg))
        return 'Chiave API Last.fm non valida. Contatta l\'amministratore.';
    if (msg === 'TROPPE_RICHIESTE' || /429|rate.?limit/i.test(msg))
        return 'Troppe richieste a Last.fm. Riprova tra qualche secondo.';
    if (msg === 'API_KEY_MANCA')
        return 'API key Last.fm non configurata.';
    if (msg === 'RETE' || /timeout|timed out|ECONN|ENOTFOUND|network/i.test(msg))
        return 'Errore di rete raggiungendo Last.fm. Riprova.';
    if (msg === 'API_ERROR')
        return 'Errore Last.fm: ' + msg;
    return 'Errore imprevisto: ' + (msg || String(err));
}

// Recupera la vera copertina della canzone. La copertina di Last.fm a volte
// è il segnaposto "stella bianca": in quel caso (o quando manca) proviamo a
// prendere l'artwork reale da iTunes (Apple Music), più affidabile.
async function fetchSongCover(axios, sharp, track) {
    // 1) iTunes / Apple Music: artwork reale, niente segnaposto
    try {
        const term = ((track.name || '') + ' ' + (track.artist || '')).trim().slice(0, 120);
        const search = await axios.get('https://itunes.apple.com/search', {
            params: { term, entity: 'song', limit: 1 },
            timeout: 8000,
        });
        const artwork = search.data?.results?.[0]?.artworkUrl100;
        if (artwork) {
            const hi = artwork.replace(/100x100(bb)?/i, '600x600bb');
            const resp = await axios.get(hi, { responseType: 'arraybuffer', timeout: 10000 });
            const img = await sharp(Buffer.from(resp.data)).resize(500, 500, { fit: 'cover' }).png().toBuffer();
            if (img && img.length > 1000) return img;
        }
    } catch (e) {
        console.error('[cur] itunes cover:', e.message);
    }

    // 2) Copertina Last.fm, scartando il segnaposto (hash della stella bianca)
    if (track.cover) {
        const placeholder = /2a96cbd8b46e442fc41c2b86b821562f|blank|ar2|u\/ar\//i.test(track.cover);
        if (!placeholder) {
            try {
                const resp = await axios.get(track.cover, { responseType: 'arraybuffer', timeout: 8000 });
                const img = await sharp(Buffer.from(resp.data)).resize(500, 500, { fit: 'cover' }).png().toBuffer();
                if (img && img.length > 1000) return img;
            } catch (e) {
                console.error('[cur] lastfm cover:', e.message);
            }
        }
    }

    return null;
}

module.exports = {
    name: 'cur',
    aliases: ['np', 'nowplaying', 'current'],
    description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm con la foto della copertina. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima con .lastfm <nome>',

    async run(sock, msg, args, context) {
        const { reply, from, sender, textArgs, mentioned } = context;
        const { db, lastfm, axios, sharp, sendButtons } = context.services;

        if (!lastfm.isConfigured()) {
            return reply('Last.fm non configurato. L\'owner deve impostare una API key in config.js.');
        }

        let username = null;
        if (textArgs && textArgs.trim()) {
            username = textArgs.trim().split(/\s+/)[0];
        } else if (mentioned && mentioned.length > 0) {
            username = db._lastfm?.[mentioned[0]] ?? null;
            if (!username) return reply('Questo utente non ha collegato un account Last.fm.');
        } else {
            username = db._lastfm?.[sender] ?? null;
        }

        if (!username) {
            return reply('Nessun account Last.fm collegato. Collegalo con: .lastfm <nomeutente>');
        }

        let npData;
        try {
            npData = await lastfm.getNowPlaying(username);
        } catch (err) {
            return reply(mapLastfmError(err));
        }

        const { nowPlaying, track } = npData;
        if (!track) {
            return reply(username + ' non ha ancora ascoltato nulla.');
        }

        let userInfo = { playcount: 0 };
        let trackInfo = { playcount: 0, listeners: 0, userplaycount: 0, duration: 0 };
        try {
            userInfo = await lastfm.getUserInfo(username);
        } catch (e) {
            console.error('[cur] userInfo:', e.message);
        }
        try {
            trackInfo = await lastfm.getTrackInfo(track.artist, track.name, username);
        } catch (e) {
            console.error('[cur] trackInfo:', e.message);
        }

        let coverBuffer = null;
        try {
            coverBuffer = await fetchSongCover(axios, sharp, track);
        } catch (e) {
            console.error('[cur] cover:', e.message);
        }

        const se = nowPlaying ? '🎧 *IN RIPRODUZIONE*' : '📼 *ULTIMO ASCOLTO*';
        const durText = fmtDuration(trackInfo.duration);
        const caption =
            `${se}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🎵 *${track.name}*\n` +
            `👤 ${track.artist}\n` +
            (track.album ? `💿 ${track.album}\n` : '') +
            (durText !== '—' ? `⏱️ Durata: ${durText}\n` : '') +
            `🔗 ${track.url}\n\n` +
            `📊 Ascolti totali: ${fmt(userInfo.playcount)}\n` +
            `🔁 Frequenza: ${fmt(trackInfo.userplaycount)}\n` +
            `🌍 Ascolti mondiali: ${fmt(trackInfo.playcount)}\n` +
            `👥 Ascoltatori: ${fmt(trackInfo.listeners)}\n\n` +
            `_Account Last.fm: ${username}_`;

        const searchTerm = (track.name + ' ' + track.artist).trim();

        try {
            if (coverBuffer) {
                await sock.sendMessage(from, { image: coverBuffer, caption }, { quoted: msg });
            } else {
                await reply(caption);
            }
        } catch (imgErr) {
            console.error('[cur] image:', imgErr.message);
            await reply(caption);
        }

        try {
            await sendButtons(sock, from,
                `Cosa vuoi per *${truncate(track.name, 30)}*?`,
                [
                    { label: '📝 Testo canzone', id: `lyrics ${searchTerm}` },
                    { label: '🎵 MP3 intero', id: `mp3 ${searchTerm}` },
                ],
                msg);
        } catch (btnErr) {
            console.error('[cur] buttons:', btnErr.message);
        }
    },
};