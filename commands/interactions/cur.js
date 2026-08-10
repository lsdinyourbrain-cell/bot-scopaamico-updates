'use strict';

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

function fmtDuration(sec) {
    const s = Number(sec) || 0;
    if (s <= 0) return '—';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
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

function buildCardSvg(data) {
    const { nowPlaying, track, username, userInfo, trackInfo, coverBase64 } = data;

    const W = 800, H = 520;
    const TX = 255;

    const eName   = escapeXml(truncate(track.name, 30));
    const eArtist = escapeXml(truncate(track.artist, 34));
    const eAlbum  = escapeXml(truncate(track.album, 34));
    const eUrl    = escapeXml(truncate(track.url, 50));
    const eUser   = escapeXml(truncate(username, 36));

    const stateText = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
    const accent    = nowPlaying ? '#1DB954' : '#8b93a7';

    const statTotal = fmt(userInfo.playcount);
    const statFreq  = fmt(trackInfo.userplaycount);
    const statWorld = fmt(trackInfo.playcount);
    const durText   = fmtDuration(trackInfo.duration);

    const BX = 30, BY = 300, BH = 110, BGAP = 20;
    const BW = (W - 60 - BGAP * 2) / 3;
    const B1X = BX, B2X = BX + BW + BGAP, B3X = B2X + BW + BGAP;

    const coverSvg = coverBase64
        ? `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="2"/>
           <image href="data:image/png;base64,${coverBase64}" x="30" y="80" width="180" height="180" clip-path="inset(0% 0% 0% 0% round 14px)"/>`
        : (nowPlaying
            ? `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="1.5"/>
               <circle cx="120" cy="170" r="55" fill="#1a1f30" stroke="#2a3040" stroke-width="1"/>
               <circle cx="120" cy="170" r="15" fill="#0d101a"/>`
            : `<rect x="30" y="80" width="180" height="180" rx="14" fill="#111520" stroke="#3a4055" stroke-width="1.5"/>
               <circle cx="120" cy="170" r="45" fill="#1a1f2e" stroke="#2a3040" stroke-width="1"/>
               <circle cx="120" cy="170" r="30" fill="none" stroke="#2a3040" stroke-width="1"/>
               <circle cx="120" cy="170" r="14" fill="#0d101a"/>
               <text x="120" y="178" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">ULTIMO</text>
               <text x="120" y="192" font-family="Arial, sans-serif" font-size="10" fill="#666" text-anchor="middle">ASCOLTO</text>`);

    const statBox = (bx, label, val) =>
        `<rect x="${bx}" y="${BY}" width="${BW}" height="${BH}" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
         <text x="${bx + 14}" y="${BY + 26}" font-family="Arial, sans-serif" font-size="11" fill="#8b93a7">${label}</text>
         <text x="${bx + 14}" y="${BY + 78}" font-family="Arial, sans-serif" font-size="27" font-weight="bold" fill="#fff">${val}</text>`;

    return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0b0f1a"/>
            <stop offset="50%" stop-color="#151a2e"/>
            <stop offset="100%" stop-color="#0e1422"/>
        </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <ellipse cx="60" cy="60" rx="180" ry="150" fill="#2a1a4a" opacity="0.30"/>
    <ellipse cx="740" cy="40" rx="150" ry="130" fill="#0a3a4a" opacity="0.25"/>
    <ellipse cx="720" cy="470" rx="170" ry="130" fill="#3a1a2a" opacity="0.22"/>

    <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="rgba(0,0,0,0.25)" rx="16"/>

    <rect x="${TX}" y="40" width="235" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="${accent}" stroke-width="1"/>
    <circle cx="${TX + 16}" cy="56" r="5" fill="${accent}"/>
    <text x="${TX + 34}" y="61" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="${accent}">${stateText}</text>

    ${coverSvg}

    <text x="${TX}" y="140" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="#ffffff">${eName}</text>
    <text x="${TX}" y="182" font-family="Arial, sans-serif" font-size="18" fill="#8ab4f8">${eArtist}</text>
    <text x="${TX}" y="218" font-family="Arial, sans-serif" font-size="15" fill="#b0b6c9">${eAlbum}</text>
    <text x="${TX}" y="246" font-family="Arial, sans-serif" font-size="13" fill="#8a90a3">⏱️ ${durText}</text>
    <text x="${TX}" y="274" font-family="Arial, sans-serif" font-size="12" fill="#6ea8fe">${eUrl}</text>

    ${statBox(B1X, 'ASCOLTI TOTALI', statTotal)}
    ${statBox(B2X, 'FREQUENZA', statFreq)}
    ${statBox(B3X, 'ASCOLTI MONDIALI', statWorld)}

    <text x="${W / 2}" y="${H - 18}" font-family="Arial, sans-serif" font-size="12" fill="#7a8194" text-anchor="middle">Account Last.fm: ${eUser}</text>
</svg>`;
}

module.exports = {
    name: 'cur',
    aliases: ['np', 'nowplaying', 'current'],
    description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm come card. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima con .lastfm <nome>',

    async run(sock, msg, args, context) {
        const { reply, from, sender, textArgs, mentioned } = context;
        const { db, lastfm, axios, sharp } = context.services;

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

        let coverBase64 = '';
        if (track.cover) {
            try {
                const resp = await axios.get(track.cover, { responseType: 'arraybuffer', timeout: 8000 });
                const buf = await sharp(Buffer.from(resp.data)).resize(180, 180, { fit: 'cover' }).png().toBuffer();
                coverBase64 = buf.toString('base64');
            } catch (e) {
                console.error('[cur] cover:', e.message);
            }
        }

        const se = nowPlaying ? '🎧 *IN RIPRODUZIONE*' : '📼 *ULTIMO ASCOLTO*';
        const durText = fmtDuration(trackInfo.duration);
        const caption =
            `${se}\n\n` +
            `🎵 *${track.name}*\n` +
            `👤 ${track.artist}\n` +
            (track.album ? `💿 ${track.album}\n` : '') +
            (durText !== '—' ? `⏱️ Durata: ${durText}\n` : '') +
            `🔗 ${track.url}\n\n` +
            `📊 Ascolti totali: ${fmt(userInfo.playcount)}\n` +
            `🔁 Frequenza: ${fmt(trackInfo.userplaycount)}\n` +
            `🌍 Ascolti mondiali: ${fmt(trackInfo.playcount)}\n` +
            `👥 Ascoltatori: ${fmt(trackInfo.listeners)}\n\n` +
            `_Account: ${username}_`;

        const svg = buildCardSvg({ nowPlaying, track, username, userInfo, trackInfo, coverBase64 });

        try {
            const cardBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
            await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
        } catch (imgErr) {
            console.error('[cur] card:', imgErr.message);
            await reply(caption);
        }
    },
};
