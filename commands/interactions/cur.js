'use strict';

// Mostra la canzone in riproduzione (o l'ultima ascoltata) dell'utente Last.fm
// come card immagine (cover + info). Fallback testuale se qualcosa fallisce.
// Per usarlo serve prima collegare il proprio account con: .lastfm <nomeutente>

// ─── Helpers ────────────────────────────────────────────────────────────────

// Escapa i caratteri XML per inserirli in modo sicuro nell'SVG.
function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Tronca una stringa a maxLen caratteri aggiungendo "…" se serve.
function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

// Scarica la cover, la ritaglia a quadrato 200x200 e la restituisce come
// Buffer JPEG. null se manca o se il download fallisce.
async function fetchCover(coverUrl, axios, sharp) {
    if (!coverUrl) return null;
    try {
        const resp = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 8000 });
        return await sharp(Buffer.from(resp.data))
            .resize(200, 200, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 90 })
            .toBuffer();
    } catch {
        return null;
    }
}

// Genera la card PNG 800x400 con sharp partendo da un SVG.
async function buildCard({ nowPlaying, track, username }, axios, sharp) {
    const coverBuf = await fetchCover(track.cover, axios, sharp);
    const coverB64 = coverBuf ? coverBuf.toString('base64') : null;

    const eName = escapeXml(truncate(track.name, 38));
    const eArtist = escapeXml(truncate(track.artist, 40));
    const eAlbum = escapeXml(truncate(track.album, 40));
    const eUrl = escapeXml(truncate(track.url, 55));
    const eUser = escapeXml(username);

    const headerText = nowPlaying ? '🎶  IN RIPRODUZIONE' : '🕓  ULTIMO ASCOLTO';
    const headerColor = nowPlaying ? '#1DB954' : '#888888';
    const headerGlow = nowPlaying ? 'filter:url(#glow)' : '';

    // Cover reale o segnaposto "disco".
    const coverSvg = coverB64
        ? `
      <image href="data:image/jpeg;base64,${coverB64}" x="40" y="100"
             width="200" height="200" clip-path="url(#coverClip)"
             preserveAspectRatio="xMidYMid slice"/>
      <rect x="40" y="100" width="200" height="200" rx="12" ry="12"
            fill="none" stroke="#ffffff22" stroke-width="1.5"/>`
        : `
      <rect x="40" y="100" width="200" height="200" rx="12" ry="12"
            fill="#1a1a2e" stroke="#333" stroke-width="1.5"/>
      <circle cx="140" cy="200" r="70" fill="#2a2a4a" stroke="#444" stroke-width="2"/>
      <circle cx="140" cy="200" r="22" fill="#111" stroke="#555" stroke-width="1"/>
      <text x="140" y="207" text-anchor="middle" font-size="28" fill="#888">🎵</text>`;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f0c29"/>
      <stop offset="50%"  stop-color="#302b63"/>
      <stop offset="100%" stop-color="#24243e"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="divider" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#ffffff00"/>
      <stop offset="50%"  stop-color="#ffffff44"/>
      <stop offset="100%" stop-color="#ffffff00"/>
    </linearGradient>
    ${coverB64 ? '<clipPath id="coverClip"><rect x="40" y="100" width="200" height="200" rx="12" ry="12"/></clipPath>' : ''}
  </defs>
  <rect width="800" height="400" fill="url(#bg)"/>
  <rect x="2" y="2" width="796" height="396" rx="16" ry="16" fill="none" stroke="#ffffff18" stroke-width="1.5"/>
  <rect x="0" y="0" width="800" height="68" fill="#00000033"/>
  <text x="400" y="42" font-family="Arial, DejaVu Sans, sans-serif" font-size="22"
        font-weight="bold" fill="${headerColor}" text-anchor="middle" ${headerGlow}>${headerText}</text>
  <rect x="268" y="80" width="1.5" height="300" fill="url(#divider)"/>
  ${coverSvg}
  <text x="300" y="150" font-family="Arial, DejaVu Sans, sans-serif" font-size="26"
        font-weight="bold" fill="#ffffff" dominant-baseline="middle">${eName}</text>
  <text x="300" y="195" font-family="Arial, DejaVu Sans, sans-serif" font-size="19"
        fill="#aaaaff" dominant-baseline="middle">🎤 ${eArtist}</text>
  <text x="300" y="235" font-family="Arial, DejaVu Sans, sans-serif" font-size="17"
        fill="#cccccc" dominant-baseline="middle">💿 ${eAlbum}</text>
  <text x="300" y="275" font-family="Arial, DejaVu Sans, sans-serif" font-size="14"
        fill="#5599ff" dominant-baseline="middle">🔗 ${eUrl}</text>
  <rect x="0" y="352" width="800" height="48" fill="#00000044"/>
  <text x="400" y="382" font-family="Arial, DejaVu Sans, sans-serif" font-size="15"
        fill="#888888" text-anchor="middle" dominant-baseline="middle">Account Last.fm: ${eUser}</text>
</svg>`.trim();

    return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── Comando ────────────────────────────────────────────────────────────────

module.exports = {
    name: 'cur',
    aliases: ['nowplaying', 'np'],
    description: "Mostra la canzone in riproduzione su Last.fm come card immagine. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima l'account con .lastfm <nome>",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, isReply, contextInfo, mentioned, reply, services } = context;
        const { db, lastfm, axios, sharp } = services;

        if (!lastfm.isConfigured()) {
            return reply('⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
        }

        // Scelta dell'utente: argomento diretto > utente menzionato > account salvato
        let username = String(textArgs || '').trim();
        if (!username && mentioned && mentioned.length > 0) {
            const jid = mentioned[0];
            username = String((db._lastfm && db._lastfm[jid]) || '').trim();
            if (!username) return reply('❌ Questo utente non ha collegato un account Last.fm.\nDeve prima usare `.lastfm <nomeutente>`.');
        }
        if (!username) {
            username = String((db._lastfm && db._lastfm[sender]) || '').trim();
            if (!username) return reply('🎧 Nessun account Last.fm collegato.\n\nCollegalo con: `.lastfm <nomeutente>`\n\nEsempio: `.lastfm mia_musica`');
        }

        let data;
        try {
            data = await lastfm.getNowPlaying(username);
        } catch (e) {
            const msgMap = {
                UTENTE_NON_TROVATO: '❌ Utente Last.fm non trovato. Controlla il nome.',
                API_KEY_INVALIDA: '❌ API key Last.fm non valida. Verifica config.js.',
                TROPPE_RICHIESTE: '⏳ Troppe richieste a Last.fm. Riprova tra poco.',
                API_ERROR: '❌ Errore di Last.fm. Riprova più tardi.',
                RETE: '❌ Non riesco a contattare Last.fm. Controlla la connessione.',
                API_KEY_MANCA: '⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).',
            };
            const raw = String(e.message || '');
            let fallback;
            if (/404|not found|non trovato/i.test(raw)) {
                fallback = '❌ Utente Last.fm non trovato. Controlla il nome.';
            } else if (/403|invalid.*key|key.*invalid/i.test(raw)) {
                fallback = '❌ API key Last.fm non valida. Verifica config.js.';
            } else if (/timeout|timed out|ECONN|ENOTFOUND|network/i.test(raw)) {
                fallback = '❌ Non riesco a contattare Last.fm. Controlla la connessione.';
            } else {
                fallback = '❌ Errore imprevisto. Riprova più tardi.';
            }
            console.error('[cur] Errore:', e.message, e.stack || '');
            return reply(msgMap[e.message] || fallback);
        }

        const { nowPlaying, track } = data;

        if (!track) {
            return reply(`🎧 *${username}*\n\nNessuna traccia ascoltata di recente.`);
        }

        const status = nowPlaying ? '🎶 *IN RIPRODUZIONE*' : '🕓 *ULTIMO ASCOLTO*';
        const captionLines = [
            `🎧 ${status}`,
            '',
            `🎵 *${track.name}*`,
            `👤 ${track.artist}`,
        ];
        if (track.album) captionLines.push(`💿 ${track.album}`);
        if (track.url) captionLines.push(`🔗 ${track.url}`);
        captionLines.push('', `_Account: ${username}_`);
        const caption = captionLines.join('\n');

        // Tenta la card immagine; se fallisce, rispondi col testo.
        try {
            const cardBuffer = await buildCard({ nowPlaying, track, username }, axios, sharp);
            await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
        } catch (imgErr) {
            console.error('[cur] Errore generazione card:', imgErr.message, imgErr.stack || '');
            await reply(caption);
        }
    },
};
