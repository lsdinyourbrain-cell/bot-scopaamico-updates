'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

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
        return '⚠️ _Utente Last.fm non trovato. Controlla il nome account._';
    if (msg === 'API_KEY_INVALIDA' || /403|invalid.*key|key.*invalid/i.test(msg))
        return '⚠️ _Chiave API Last.fm non valida. Contatta l\'amministratore._';
    if (msg === 'TROPPE_RICHIESTE' || /429|rate.?limit/i.test(msg))
        return '⚠️ _Troppe richieste a Last.fm. Riprova tra qualche secondo._';
    if (msg === 'API_KEY_MANCA')
        return '⚠️ _API key Last.fm non configurata._';
    if (msg === 'RETE' || /timeout|timed out|ECONN|ENOTFOUND|network/i.test(msg))
        return '⚠️ _Errore di rete raggiungendo Last.fm. Riprova._';
    if (msg === 'API_ERROR')
        return '⚠️ _Errore Last.fm: ' + msg + '_';
    return '⚠️ _Errore imprevisto: ' + (msg || String(err)) + '_';
}

async function fetchSongCover(axios, sharp, track) {
    let itunesDuration = 0;

    // 1) iTunes / Apple Music: artwork reale, niente segnaposto
    try {
        const term = ((track.name || '') + ' ' + (track.artist || '')).trim().slice(0, 120);
        const search = await axios.get('https://itunes.apple.com/search', {
            params: { term, entity: 'song', limit: 1 },
            timeout: 8000,
        });
        const result = search.data?.results?.[0];
        if (result?.trackTimeMillis) itunesDuration = Math.round(result.trackTimeMillis / 1000);
        const artwork = result?.artworkUrl100;
        if (artwork) {
            const hi = artwork.replace(/100x100(bb)?/i, '600x600bb');
            const resp = await axios.get(hi, { responseType: 'arraybuffer', timeout: 10000 });
            const img = await sharp(Buffer.from(resp.data)).resize(500, 500, { fit: 'cover' }).png().toBuffer();
            if (img && img.length > 1000) return { cover: img, duration: itunesDuration };
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
                if (img && img.length > 1000) return { cover: img, duration: itunesDuration };
            } catch (e) {
                console.error('[cur] lastfm cover:', e.message);
            }
        }
    }

    return { cover: null, duration: itunesDuration };
}

async function makePlaceholder(sharp, artist, title) {
    const bg = '#0f0f0f';
    const a = truncate(artist || '—', 22).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
    const t = truncate(title || '—', 24).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
    const svg = `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="500" height="500" fill="${bg}"/>
      <circle cx="250" cy="180" r="70" fill="none" stroke="#444" stroke-width="2"/>
      <polygon points="230,155 230,205 275,180" fill="#888"/>
      <text x="250" y="300" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle" font-weight="700">${t}</text>
      <text x="250" y="330" font-family="sans-serif" font-size="15" fill="#aaa" text-anchor="middle">${a}</text>
      <text x="250" y="470" font-family="sans-serif" font-size="11" fill="#555" text-anchor="middle">VEX BOT • Last.fm</text>
    </svg>`;
    try { return await sharp(Buffer.from(svg)).png().toBuffer(); } catch (_) { return null; }
}

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
        return '⚠️ _Utente Last.fm non trovato. Controlla il nome account._';
    if (msg === 'API_KEY_INVALIDA' || /403|invalid.*key|key.*invalid/i.test(msg))
        return '⚠️ _Chiave API Last.fm non valida. Contatta l\'amministratore._';
    if (msg === 'TROPPE_RICHIESTE' || /429|rate.?limit/i.test(msg))
        return '⚠️ _Troppe richieste a Last.fm. Riprova tra qualche secondo._';
    if (msg === 'API_KEY_MANCA')
        return '⚠️ _API key Last.fm non configurata._';
    if (msg === 'RETE' || /timeout|timed out|ECONN|ENOTFOUND|network/i.test(msg))
        return '⚠️ _Errore di rete raggiungendo Last.fm. Riprova._';
    if (msg === 'API_ERROR')
        return '⚠️ _Errore Last.fm: ' + msg + '_';
    return '⚠️ _Errore imprevisto: ' + (msg || String(err)) + '_';
}

module.exports = {
    name: 'cur',
    aliases: ['np', 'nowplaying', 'current'],
    description: 'Mostra la riproduzione Last.fm con foto sempre, anti-glitch e fuochi.',

    async run(sock, msg, args, context) {
        const { reply, from, sender, textArgs, mentioned, isGroup } = context;
        const { db, lastfm, axios, sharp, sendButtons, saveDB } = context.services;

        if (!lastfm.isConfigured()) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Last.fm non configurato.')}\n${boxEnd()}`);
        }

        // ── FUOCO: .cur fuoco / .cur fire / .cur 🔥
        const sub = String(textArgs||'').trim().toLowerCase();
        if (sub === 'fuoco' || sub === 'fire' || sub === '🔥' || sub === 'fuochi') {
            let key = null, artist=null, title=null;
            if (db._lastCur && db._lastCur[sender]?.key) {
                key = db._lastCur[sender].key;
                artist = db._lastCur[sender].artist;
                title = db._lastCur[sender].title;
            } else {
                let uname = db._lastfm?.[sender] || null;
                if (!uname) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Collega Last.fm con .lastfm <nome>')}\n${boxEnd()}`);
                let d;
                try { d = await lastfm.getNowPlaying(uname); } catch(e){ return reply(mapLastfmError(e)); }
                if (!d.track) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Nessun brano.')}\n${boxEnd()}`);
                key = `${d.track.artist} — ${d.track.name}`.toLowerCase().slice(0,120);
                artist = d.track.artist;
                title = d.track.name;
            }
            if (!db._curFires) db._curFires = {};
            if (!db._curFires[key]) db._curFires[key] = { count: 0, users: {} };
            const rec = db._curFires[key];
            const already = rec.users[sender];
            if (already) {
                return reply(`${sec('FUOCO')}\n${boxOpen()}\n${line('Hai già messo fuoco a ' + truncate(title,18))}\n${line('🔥 Fuochi: ' + rec.count)}\n${boxEnd()}`);
            }
            rec.count += 1;
            rec.users[sender] = 1;
            rec.last = Date.now();
            rec.artist = artist;
            rec.title = title;
            saveDB();
            return reply(`${sec('FUOCO')}\n${boxOpen()}\n${line('🔥 +1 a ' + truncate(title,18) + ' — ' + truncate(artist,18))}\n${line('🔥 Totale fuochi: ' + rec.count)}\n${boxEnd()}`);
        }

        let username = null;
        let targetJid = null;
        const raw = String(textArgs||'').trim();
        const lower = raw.toLowerCase();

        if (raw && !['fuoco','fire','🔥','fuochi'].includes(raw.split(/\s+/)[0])) {
            const maybe = raw.trim().split(/\s+/)[0];
            if (context.mentioned && context.mentioned.length>0 && textArgs.includes('@')) {
                username = context.db._lastfm?.[context.mentioned[0]] ?? null;
                if (!username) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Utente non collegato a Last.fm.')}\n${boxEnd()}`);
                targetJid = context.mentioned[0];
            } else {
                username = raw.trim().split(/\s+/)[0];
                targetJid = null;
            }
        } else if (context.mentioned && context.mentioned.length > 0) {
            username = context.db._lastfm?.[context.mentioned[0]] ?? null;
            if (!username) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Questo utente non ha collegato un account Last.fm.')}\n${boxEnd()}`);
            targetJid = context.mentioned[0];
        } else {
            username = context.db._lastfm?.[context.sender] ?? null;
        }

        if (!username) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Nessun account Last.fm collegato. Collegalo con: .lastfm <nomeutente>')}\n${boxEnd()}`);
        }

        let npData;
        try {
            npData = await lastfm.getNowPlaying(username);
        } catch (err) {
            return reply(mapLastfmError(err));
        }

        const { nowPlaying, track } = npData;
        if (!track) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(username + ' non ha ancora ascoltato nulla.')}\n${boxEnd()}`);
        }

        let trackInfo = { playcount: 0, listeners: 0, userplaycount: 0, duration: 0 };
        try {
            trackInfo = await lastfm.getTrackInfo(track.artist, track.name, username);
        } catch (e) { console.error('[cur] trackInfo:', e.message); }

        let coverBuffer = null;
        let durationSec = trackInfo.duration || 0;
        try {
            const found = await fetchSongCover(axios, sharp, track);
            coverBuffer = found.cover;
            if (found.duration > 0) durationSec = found.duration;
        } catch (e) { console.error('[cur] cover:', e.message); }
        if (!coverBuffer) {
            try { coverBuffer = await makePlaceholder(sharp, track.artist, track.name); } catch (_) {}
        }
        if (!coverBuffer) coverBuffer = null;

        const durText = fmtDuration(durationSec);
        const tName = truncate(track.name, 30);
        const tArtist = truncate(track.artist, 30);
        const tAlbum = track.album ? truncate(track.album, 28) : '';
        const firesKey = `${track.artist} — ${track.name}`.toLowerCase().slice(0,120);
        const fires = (db._curFires && db._curFires[firesKey]?.count) || 0;
        if (!db._lastCur) db._lastCur = {};
        db._lastCur[context.sender] = { key: firesKey, artist: track.artist, title: track.name };
        try { saveDB(); } catch(_){}

        // ── RENDER CARD TRASLUCIDA ──
        const searchTerm = `${track.name} ${track.artist}`.trim().slice(0,80);
        let userInfoForCard = { playcount: 0 };
        try { const u = await lastfm.getUserInfo(username); userInfoForCard = u; } catch(_){}
        const cardOpts = {
            coverBuffer,
            trackName: track.name,
            trackArtist: track.artist,
            trackAlbum: track.album,
            username,
            isNowPlaying: !!nowPlaying,
            userPlaycount: trackInfo.userplaycount || 0,
            globalPlaycount: trackInfo.playcount || 0,
            listeners: trackInfo.listeners || 0,
            durationText: fmtDuration(durationSec)
        };
        let cardBuffer = null;
        try {
            const { renderCurCard } = require('../../lib/lastfmCard');
            cardBuffer = await renderCurCard(sharp, cardOpts);
        } catch(e){ console.error('[cur] card render', e.message); }

        // Fallback caption testuale se card fallisce
        const fallbackCaption =
            sec('IN RIPRODUZIONE') + '\n' +
            boxOpen() + '\n' +
            line('🎵 ' + tName) + '\n' +
            line('👤 ' + tArtist) + '\n' +
            (tAlbum ? line('💿 ' + tAlbum) + '\n' : '') +
            (durText !== '—' ? line('⏱️ ' + durText) + '\n' : '') +
            line('🔥 Fuochi: ' + fires) + '\n' +
            line('👤 @' + truncate(username,18) + ' ') +
            boxEnd();

        try {
            let sent = false;
            if (cardBuffer) {
                await sock.sendMessage(context.from, { image: cardBuffer, caption: `🔥 ${fires} fuochi • ${durText} • @${username}` }, { quoted: msg });
                sent = true;
            } else if (coverBuffer) {
                await sock.sendMessage(context.from, { image: coverBuffer, caption: fallbackCaption }, { quoted: msg });
                sent = true;
            }
            if (!sent) {
                await reply(fallbackCaption);
            }
        } catch (imgErr) {
            console.error('[cur] image:', imgErr.message);
            try { await reply(fallbackCaption); } catch(_){}
        }

        // Sotto: chiede download e lyrics + fuoco
        const fireLabel = fires>0 ? `🔥 Fuoco (${fires})` : '🔥 Fuoco';
        try {
            await sendButtons(sock, context.from,
                `Cosa vuoi fare?`,
                [
                    { label: '📝 Testo', id: `lyrics ${searchTerm}` },
                    { label: '🎵 MP3', id: `mp3 ${searchTerm}` },
                    { label: fireLabel, id: `cur fuoco` },
                ],
                msg);
        } catch (btnErr) { console.error('[cur] buttons:', btnErr.message); }
    },
};