'use strict';

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function truncate(str, maxLen) {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLen ? s.slice(0, maxLen - 1) + '\u2026' : s;
}

function fmt(n) {
    return Number(n || 0).toLocaleString('it-IT');
}

// ─── Cover ──────────────────────────────────────────────────────────────────

async function fetchCover(coverUrl, axios, sharpF) {
    if (!coverUrl) return null;
    try {
        const resp = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 8000 });
        return await sharpF(Buffer.from(resp.data))
            .resize(180, 180, { fit: 'cover', position: 'centre' })
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

// ─── Card builder ────────────────────────────────────────────────────────────

async function buildCard(data, axios, sharpF) {
    const { nowPlaying, track, username, userInfo, trackInfo } = data;

    // Cover SOLO quando in riproduzione
    const coverBuf = nowPlaying ? await fetchCover(track.cover, axios, sharpF) : null;

    const W = 800, H = 500;
    const COVER_X = 30, COVER_Y = 80, COVER_SIZE = 180;
    const TX = 240;

    const eName   = escapeXml(truncate(track.name, 30));
    const eArtist = escapeXml(truncate(track.artist, 36));
    const eAlbum  = escapeXml(truncate(track.album, 36));
    const eUrl    = escapeXml(truncate(track.url, 56));
    const eUser   = escapeXml(truncate(username, 40));

    const stateText = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
    const accent    = nowPlaying ? '#1DB954' : '#8b93a7';

    // Statistiche
    const statTotal = fmt(userInfo.playcount);
    const statFreq  = fmt(trackInfo.userplaycount);
    const statWorld = fmt(trackInfo.playcount);

    // Riquadro stat: x, y, w, h, label, valore
    const BX = 30, BY = 290, BH = 120, BGAP = 20;
    const BW = (W - 60 - BGAP * 2) / 3;
    const B1X = BX;
    const B2X = BX + BW + BGAP;
    const B3X = B2X + BW + BGAP;

    // Cover o placeholder
    const coverSvg = coverBuf
        ? `<rect x="${COVER_X}" y="${COVER_Y}" width="${COVER_SIZE}" height="${COVER_SIZE}" rx="14" ry="14" fill="#111520" stroke="#3a4055" stroke-width="2"/>`
        : `
        <rect x="${COVER_X}" y="${COVER_Y}" width="${COVER_SIZE}" height="${COVER_SIZE}" rx="14" ry="14" fill="#111520" stroke="#3a4055" stroke-width="1.5"/>
        <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}" r="55" fill="#1a1f30" stroke="#3a4055" stroke-width="1"/>
        <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}" r="40" fill="none" stroke="#2a3040" stroke-width="1"/>
        <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}" r="25" fill="none" stroke="#2a3040" stroke-width="1"/>
        <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}" r="15" fill="#0d101a"/>
        <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}" r="4" fill="#555"/>`;

    // Singolo riquadro stat
    const statBox = (bx, label, val) =>
        `<rect x="${bx}" y="${BY}" width="${BW}" height="${BH}" rx="12" ry="12" fill="#ffffff0d" stroke="#ffffff18" stroke-width="1"/>
         <text x="${bx + 16}" y="${BY + 28}" font-family="sans-serif" font-size="11" fill="#8b93a7">${label}</text>
         <text x="${bx + 16}" y="${BY + 82}" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff">${val}</text>`;

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f1a"/>
      <stop offset="50%" stop-color="#151a2e"/>
      <stop offset="100%" stop-color="#0e1422"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Blob decorativi -->
  <ellipse cx="60" cy="60" rx="180" ry="150" fill="#2a1a4a" opacity="0.30"/>
  <ellipse cx="740" cy="40" rx="150" ry="130" fill="#0a3a4a" opacity="0.25"/>
  <ellipse cx="720" cy="470" rx="170" ry="130" fill="#3a1a2a" opacity="0.22"/>

  <!-- Pill stato -->
  <rect x="${TX}" y="30" width="230" height="30" rx="15" ry="15" fill="#ffffff14" stroke="${accent}" stroke-width="1"/>
  <circle cx="${TX + 15}" cy="45" r="5" fill="${accent}"/>
  <text x="${TX + 32}" y="51" font-family="sans-serif" font-size="13" font-weight="bold" fill="${accent}">${stateText}</text>

  <!-- Cover o placeholder -->
  ${coverSvg}

  <!-- Titolo (prominente) -->
  <text x="${TX}" y="125" font-family="sans-serif" font-size="30" font-weight="bold" fill="#ffffff">${eName}</text>

  <!-- Artista -->
  <text x="${TX}" y="168" font-family="sans-serif" font-size="18" fill="#8ab4f8">${eArtist}</text>

  <!-- Album -->
  <text x="${TX}" y="205" font-family="sans-serif" font-size="15" fill="#b0b6c9">${eAlbum}</text>

  <!-- Link -->
  <text x="${TX}" y="242" font-family="sans-serif" font-size="12" fill="#6ea8fe">${eUrl}</text>

  <!-- Riquadri statistiche -->
  ${statBox(B1X, 'Ascolti totali', statTotal)}
  ${statBox(B2X, 'Frequenza', statFreq)}
  ${statBox(B3X, 'Ascolti mondiali', statWorld)}

  <!-- Footer -->
  <text x="${W / 2}" y="455" font-family="sans-serif" font-size="12" fill="#7a8194" text-anchor="middle">Account Last.fm: ${eUser}</text>
</svg>`;

    let card = await sharpF(Buffer.from(svg)).png().toBuffer();

    if (coverBuf) {
        card = await sharpF(card)
            .composite([{ input: coverBuf, left: COVER_X, top: COVER_Y }])
            .png()
            .toBuffer();
    }

    return card;
}

// ─── Errori ─────────────────────────────────────────────────────────────────

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

// ─── Comando ────────────────────────────────────────────────────────────────

module.exports = {
    name: 'cur',
    aliases: ['np', 'nowplaying', 'current'],
    description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm come card. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima con .lastfm <nome>',

    async run(sock, msg, args, context) {
        const { reply, from, sender, textArgs, mentioned } = context;
        const { db, lastfm, axios, sharp } = context.services;

        if (!lastfm.isConfigured()) {
            return reply('⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        let username = null;
        if (textArgs && textArgs.trim()) {
            username = textArgs.trim().split(/\s+/)[0];
        } else if (mentioned && mentioned.length > 0) {
            username = db._lastfm?.[mentioned[0]] ?? null;
            if (!username) return reply('❌ Questo utente non ha collegato un account Last.fm.\nDeve prima usare `.lastfm <nomeutente>`.');
        } else {
            username = db._lastfm?.[sender] ?? null;
        }

        if (!username) {
            return reply(
                '🎧 Nessun account Last.fm collegato.\n\n' +
                'Collegalo con: `.lastfm <nomeutente>`\n\n' +
                'Esempio: `.lastfm mia_musica`'
            );
        }

        // 1. Dati della traccia
        let npData;
        try {
            npData = await lastfm.getNowPlaying(username);
        } catch (err) {
            return reply('❌ ' + mapLastfmError(err));
        }

        const { nowPlaying, track } = npData;

        if (!track) {
            return reply('🎧 *' + username + '*\n\nNessuna traccia ascoltata di recente.');
        }

        // 2. Info utente e info traccia in parallelo
        let userInfo = { playcount: 0 };
        let trackInfo = { playcount: 0, listeners: 0, userplaycount: 0 };

        try {
            const [ui, ti] = await Promise.all([
                lastfm.getUserInfo(username),
                lastfm.getTrackInfo(track.artist, track.name, username),
            ]);
            if (ui) userInfo = ui;
            if (ti) trackInfo = ti;
        } catch (e) {
            console.error('[cur] Errore statistiche:', e.message);
        }

        // 3. Caption (testo con emoji, fallback)
        const statusEmoji = nowPlaying ? '🎶' : '🕓';
        const statusLabel = nowPlaying ? 'In riproduzione' : 'Ultimo ascolto';
        const caption =
            statusEmoji + ' *' + statusLabel + '*\n\n' +
            '🎵 *' + track.name + '*\n' +
            '🎤 ' + track.artist + '\n' +
            '💿 ' + track.album + '\n' +
            '🔗 ' + track.url + '\n\n' +
            '📊 Ascolti totali: ' + fmt(userInfo.playcount) + '\n' +
            '🔁 Frequenza: ' + fmt(trackInfo.userplaycount) + '\n' +
            '🌍 Ascolti mondiali: ' + fmt(trackInfo.playcount) + '\n\n' +
            '👤 Account: ' + username;

        // 4. Genera card; fallback testo
        try {
            const cardBuffer = await buildCard(
                { nowPlaying, track, username, userInfo, trackInfo },
                axios,
                sharp
            );
            await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
        } catch (imgErr) {
            console.error('[cur] Errore generazione card:', imgErr);
            await reply(caption);
        }
    },
};
