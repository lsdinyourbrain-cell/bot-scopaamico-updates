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
            .resize(180, 180, { fit: 'cover' })
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

// ─── Card builder (stesso pattern di pokedex.js: NIENTE @font-face) ────────

async function buildCard(data, axios, sharpF) {
    const { nowPlaying, track, username, userInfo, trackInfo } = data;

    // Cover SOLO quando in riproduzione
    const coverBuf = nowPlaying ? await fetchCover(track.cover, axios, sharpF) : null;
    let coverBase64 = '';
    if (coverBuf) coverBase64 = coverBuf.toString('base64');

    const W = 800, H = 520;
    const TX = 255;

    const eName   = escapeXml(truncate(track.name,   30));
    const eArtist = escapeXml(truncate(track.artist, 34));
    const eAlbum  = escapeXml(truncate(track.album,  34));
    const eUrl    = escapeXml(truncate(track.url,    50));
    const eUser   = escapeXml(truncate(username,     36));

    const stateText = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
    const accent    = nowPlaying ? '#1DB954' : '#8b93a7';

    // Statistiche
    const statTotal = fmt(userInfo.playcount);
    const statFreq  = fmt(trackInfo.userplaycount);
    const statWorld = fmt(trackInfo.playcount);

    // Riquadri
    const BX = 30, BY = 300, BH = 110, BGAP = 20;
    const BW = (W - 60 - BGAP * 2) / 3;
    const B1X = BX, B2X = BX + BW + BGAP, B3X = B2X + BW + BGAP;

    // Cover o segnaposto (solo se NON è ultimo ascolto: niente cover)
    const coverSvg = nowPlaying
        ? (coverBuf
            ? `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="2"/>
               <image href="data:image/png;base64,${coverBase64}" x="30" y="80" width="180" height="180" clip-path="inset(0% 0% 0% 0% round 14px)"/>`
            : `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="1.5"/>
               <circle cx="120" cy="170" r="55" fill="#1a1f30" stroke="#2a3040" stroke-width="1"/>
               <circle cx="120" cy="170" r="15" fill="#0d101a"/>`)
        : `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="1.5"/>
           <circle cx="120" cy="170" r="45" fill="#1a1f2e" stroke="#2a3040" stroke-width="1"/>
           <circle cx="120" cy="170" r="30" fill="none" stroke="#2a3040" stroke-width="1"/>
           <circle cx="120" cy="170" r="14" fill="#0d101a"/>
           <text x="120" y="178" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">ULTIMO</text>
           <text x="120" y="192" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">ASCOLTO</text>`;

    // Riquadro statistica
    const statBox = (bx, label, val, icon) =>
        `<rect x="${bx}" y="${BY}" width="${BW}" height="${BH}" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
         <text x="${bx + 14}" y="${BY + 26}" font-family="Arial, sans-serif" font-size="11" fill="#8b93a7">${icon} ${label}</text>
         <text x="${bx + 14}" y="${BY + 78}" font-family="Arial, sans-serif" font-size="27" font-weight="bold" fill="#fff">${val}</text>`;

    const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0b0f1a"/>
            <stop offset="50%" stop-color="#151a2e"/>
            <stop offset="100%" stop-color="#0e1422"/>
        </linearGradient>
        <linearGradient id="panel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1a1f2e"/>
            <stop offset="100%" stop-color="#0f1420"/>
        </linearGradient>
    </defs>

    <!-- Sfondo -->
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Blob -->
    <ellipse cx="60" cy="60" rx="180" ry="150" fill="#2a1a4a" opacity="0.30"/>
    <ellipse cx="740" cy="40" rx="150" ry="130" fill="#0a3a4a" opacity="0.25"/>
    <ellipse cx="720" cy="470" rx="170" ry="130" fill="#3a1a2a" opacity="0.22"/>

    <!-- Pannello testo -->
    <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="rgba(0,0,0,0.25)" rx="16"/>

    <!-- Pill stato -->
    <rect x="${TX}" y="40" width="235" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="${accent}" stroke-width="1"/>
    <circle cx="${TX + 16}" cy="56" r="5" fill="${accent}"/>
    <text x="${TX + 34}" y="61" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="${accent}">✈ ${stateText}</text>

    <!-- Cover / segnaposto -->
    ${coverSvg}

    <!-- Titolo canzone (prominente) -->
    <text x="${TX}" y="140" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff">${eName}</text>

    <!-- Artista -->
    <text x="${TX}" y="182" font-family="Arial, sans-serif" font-size="18" fill="#8ab4f8">🎵 ${eArtist}</text>

    <!-- Album -->
    <text x="${TX}" y="218" font-family="Arial, sans-serif" font-size="15" fill="#b0b6c9">💿 ${eAlbum}</text>

    <!-- Link -->
    <text x="${TX}" y="254" font-family="Arial, sans-serif" font-size="12" fill="#6ea8fe">🔗 ${eUrl}</text>

    <!-- Riquadri statistiche -->
    ${statBox(B1X, 'ASCOLTI TOTALI', statTotal, '📊')}
    ${statBox(B2X, 'FREQUENZA', statFreq, '🔁')}
    ${statBox(B3X, 'ASCOLTI MONDIALI', statWorld, '🌍')}

    <!-- Footer -->
    <text x="${W / 2}" y="${H - 18}" font-family="Arial, sans-serif" font-size="12" fill="#7a8194" text-anchor="middle">👤 Account Last.fm: ${eUser}</text>
</svg>`;

    const card = await sharpF(Buffer.from(svg)).png().toBuffer();
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
            return reply('🎧 Nessun account Last.fm collegato.\n\nCollegalo con: `.lastfm <nomeutente>`\n\nEsempio: `.lastfm mia_musica`');
        }

        // 1. Traccia in riproduzione
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

        // 2. Statistiche in parallelo
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
            console.error('[cur] Errore stats:', e.message);
        }

        // Caption fallback
        const se = nowPlaying ? '🎶' : '🕓';
        const sl = nowPlaying ? 'In riproduzione' : 'Ultimo ascolto';
        const caption =
            se + ' *' + sl + '*\n\n' +
            '🎵 *' + track.name + '*\n' +
            '🎤 ' + track.artist + '\n' +
            '💿 ' + track.album + '\n' +
            '🔗 ' + track.url + '\n\n' +
            '📊 Ascolti totali: ' + fmt(userInfo.playcount) + '\n' +
            '🔁 Frequenza: ' + fmt(trackInfo.userplaycount) + '\n' +
            '🌍 Ascolti mondiali: ' + fmt(trackInfo.playcount) + '\n\n' +
            '👤 Account: ' + username;

        // 3. Genera card; fallback testo
        try {
            const cardBuffer = await buildCard({ nowPlaying, track, username, userInfo, trackInfo }, axios, sharp);
            await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
        } catch (imgErr) {
            console.error('[cur] Errore card:', imgErr);
            await reply(caption);
        }
    },
};