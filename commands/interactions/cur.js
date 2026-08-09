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

// ─── Cover ──────────────────────────────────────────────────────────────────

async function fetchCover(coverUrl, axios, sharp) {
  if (!coverUrl) return null;
  try {
    const resp = await axios.get(coverUrl, { responseType: 'arraybuffer', timeout: 8000 });
    return await sharp(Buffer.from(resp.data))
      .resize(200, 200, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ─── Card builder (NO TEXT - only background + cover, fonts fail on Termux) ──

async function buildCard({ nowPlaying, track, username }, axios, sharp) {
  const coverBuf = await fetchCover(track.cover, axios, sharp);

  const W = 800, H = 400;
  const COVER_X = 40, COVER_Y = 100, COVER_SIZE = 200;
  const PANEL_X = 260, PANEL_Y = 20, PANEL_W = 520, PANEL_H = 360;
  const TX = 290;

  const stateText = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
  const accent = nowPlaying ? '#1DB954' : '#8b93a7';

  // SVG solo con grafica (retto, cerchi, gradient) + testo senza font speciali
  // Usa solo primitive compatibili con librsvg di Termux
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f1a"/>
      <stop offset="50%" stop-color="#151a2e"/>
      <stop offset="100%" stop-color="#0e1422"/>
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1f2e"/>
      <stop offset="100%" stop-color="#0b0f1a"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Blob decorativi -->
  <ellipse cx="60" cy="60" rx="180" ry="150" fill="#2a1a4a" opacity="0.30"/>
  <ellipse cx="740" cy="40" rx="150" ry="130" fill="#0a3a4a" opacity="0.25"/>
  <ellipse cx="720" cy="380" rx="170" ry="130" fill="#3a1a2a" opacity="0.22"/>

  <!-- Pannello glass -->
  <rect x="${PANEL_X}" y="${PANEL_Y}"
        width="${PANEL_W}" height="${PANEL_H}"
        rx="20" ry="20"
        fill="url(#panel)"
        stroke="#3a4055"
        stroke-width="1.5"/>

  <!-- Cover zone (cornice o placeholder) -->
  ${coverBuf
    ? `<rect x="${COVER_X}" y="${COVER_Y}"
            width="${COVER_SIZE}" height="${COVER_SIZE}"
            rx="14" ry="14"
            fill="none"
            stroke="#3a4055"
            stroke-width="2"/>`
    : `<rect x="${COVER_X}" y="${COVER_Y}"
            width="${COVER_SIZE}" height="${COVER_SIZE}"
            rx="14" ry="14"
            fill="#111520"
            stroke="#3a4055"
            stroke-width="1.5"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="60" fill="#1a1f30" stroke="#3a4055" stroke-width="1"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="20" fill="#0d101a"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="6" fill="#444"/>`
  }

  <!-- Pill stato (rettangolo arrotondato + pallino + testo con font di sistema) -->
  <rect x="${TX}" y="42"
        width="230" height="30"
        rx="15" ry="15"
        fill="#ffffff14"
        stroke="${accent}"
        stroke-width="1"/>
  <circle cx="${TX + 15}" cy="57" r="5" fill="${accent}"/>
  <text x="${TX + 32}" y="63"
        font-family="sans-serif"
        font-size="13"
        font-weight="bold"
        fill="${accent}">${stateText}</text>

  <!-- Testi informativi (sans-serif è il più compatibile) -->
  <text x="${TX}" y="130"
        font-family="sans-serif"
        font-size="28"
        font-weight="bold"
        fill="#ffffff">${escapeXml(truncate(track.name, 34))}</text>

  <text x="${TX}" y="175"
        font-family="sans-serif"
        font-size="18"
        fill="#8ab4f8">${escapeXml(truncate(track.artist, 40))}</text>

  <text x="${TX}" y="215"
        font-family="sans-serif"
        font-size="16"
        fill="#b0b6c9">${escapeXml(truncate(track.album, 40))}</text>

  <text x="${TX}" y="255"
        font-family="sans-serif"
        font-size="13"
        fill="#6ea8fe">${escapeXml(truncate(track.url, 55))}</text>

  <!-- Separatore -->
  <line x1="${PANEL_X + 20}" y1="330"
        x2="${PANEL_X + PANEL_W - 20}" y2="330"
        stroke="#3a4055" stroke-width="1"/>

  <!-- Footer -->
  <text x="${PANEL_X + PANEL_W/2}" y="355"
        font-family="sans-serif"
        font-size="13"
        fill="#7a8194"
        text-anchor="middle">Account Last.fm: ${escapeXml(username)}</text>

</svg>`;

  let card = await sharp(Buffer.from(svg)).png().toBuffer();

  if (coverBuf) {
    card = await sharp(card)
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
  description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm come card immagine. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima l\'account con .lastfm <nome>',

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

    let data;
    try {
      data = await lastfm.getNowPlaying(username);
    } catch (err) {
      return reply('❌ ' + mapLastfmError(err));
    }

    if (!data.track) {
      return reply('🎧 *' + username + '*\n\nNessuna traccia ascoltata di recente.');
    }

    const { nowPlaying, track } = data;

    const statusEmoji = nowPlaying ? '🎶' : '🕓';
    const statusLabel = nowPlaying ? 'In riproduzione' : 'Ultimo ascolto';
    const caption =
      statusEmoji + ' *' + statusLabel + '*\n\n' +
      '🎵 *' + track.name + '*\n' +
      '🎤 ' + track.artist + '\n' +
      '💿 ' + track.album + '\n' +
      '🔗 ' + track.url + '\n\n' +
      '👤 Account: ' + username;

    try {
      const cardBuffer = await buildCard({ nowPlaying, track, username }, axios, sharp);
      await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
    } catch (imgErr) {
      console.error('[cur] Errore generazione card:', imgErr);
      await reply(caption);
    }
  },
};
