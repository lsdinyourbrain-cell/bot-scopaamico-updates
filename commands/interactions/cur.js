'use strict';

const fs = require('fs');
const path = require('path');

// Mostra la canzone in riproduzione (o l'ultima ascoltata) dell'utente Last.fm
// come card immagine "liquid glass". Fallback testuale se qualcosa fallisce.
// Per usarlo serve prima collegare il proprio account con: .lastfm <nomeutente>

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

/**
 * Scarica la cover, la ridimensiona a 160x160 quadrata e la restituisce
 * come Buffer PNG. Restituisce null su qualsiasi errore.
 */
async function fetchRoundedCover(coverUrl, axios, sharp) {
  if (!coverUrl) return null;
  try {
    const resp = await axios.get(coverUrl, {
      responseType: 'arraybuffer',
      timeout: 8000,
    });
    const buf = Buffer.from(resp.data);
    return await sharp(buf)
      .resize(160, 160, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ─── Card builder ────────────────────────────────────────────────────────────

/**
 * Genera la card 800x400 "liquid glass".
 *
 * Vincoli rispettati (compatibilità librsvg su Termux):
 *  - Niente emoji nel SVG
 *  - Niente <filter>, <clipPath>, <image href="data:...">
 *  - Font incorporato in base64 con @font-face
 *  - Cover composita con sharp.composite() DOPO il render SVG
 *  - Solo primitive sicure: rect, circle, ellipse, linearGradient,
 *    radialGradient, text
 */
async function buildCard({ nowPlaying, track, username }, axios, sharp, projectDir) {
  // a) Leggi font da disco
  const fontsDir = path.join(projectDir, 'assets', 'fonts');
  const fontRegB64 = fs.readFileSync(path.join(fontsDir, 'Arial.ttf')).toString('base64');
  const fontBoldB64 = fs.readFileSync(path.join(fontsDir, 'Arial-Bold.ttf')).toString('base64');

  // b) Cover
  const coverBuf = await fetchRoundedCover(track.cover, axios, sharp);

  // Layout costanti
  const W = 800, H = 400;
  const COVER_X = 55;
  const COVER_Y = 120; // (400 - 160) / 2 = 120
  const COVER_SIZE = 160;
  const PANEL_X = 270, PANEL_Y = 24, PANEL_W = 506, PANEL_H = 352;
  const TX = 295;

  // Valori escapati + troncati
  const eName   = escapeXml(truncate(track.name,   34));
  const eArtist = escapeXml(truncate(track.artist, 38));
  const eAlbum  = escapeXml(truncate(track.album,  38));
  const eUrl    = escapeXml(truncate(track.url,    52));
  const eUser   = escapeXml(truncate(username,     38));

  // Stato: testo senza emoji (le emoji vanno solo nella caption)
  const stateText  = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
  const stateColor = nowPlaying ? '#1DB954' : '#8b93a7';
  const dotColor   = nowPlaying ? '#1DB954' : '#8b93a7';

  // c) SVG — niente emoji, niente filter/clipPath, cover NON dentro l'SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">

  <defs>
    <!-- Font incorporati -->
    <style>
      @font-face {
        font-family: "BotFont";
        src: url(data:font/truetype;base64,${fontRegB64});
      }
      @font-face {
        font-family: "BotFontBold";
        src: url(data:font/truetype;base64,${fontBoldB64});
      }
    </style>

    <!-- Sfondo scuro profondo -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0b0f1a"/>
      <stop offset="55%"  stop-color="#1a1f33"/>
      <stop offset="100%" stop-color="#0e1624"/>
    </linearGradient>

    <!-- Blob 1: viola in alto a sinistra -->
    <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#7c5cff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#7c5cff" stop-opacity="0"/>
    </radialGradient>

    <!-- Blob 2: cyan in alto a destra -->
    <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#00d4ff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
    </radialGradient>

    <!-- Blob 3: rosa in basso a destra -->
    <radialGradient id="blob3" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ff6ec7" stop-opacity="0.40"/>
      <stop offset="100%" stop-color="#ff6ec7" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Sfondo -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <!-- Blob luminosi (radialGradient con alpha decrescente = sfuocato safe) -->
  <ellipse cx="80"  cy="80"  rx="200" ry="180" fill="url(#blob1)"/>
  <ellipse cx="720" cy="60"  rx="180" ry="160" fill="url(#blob2)"/>
  <ellipse cx="700" cy="360" rx="200" ry="160" fill="url(#blob3)"/>

  <!-- Pannello glass -->
  <rect x="${PANEL_X}" y="${PANEL_Y}"
        width="${PANEL_W}" height="${PANEL_H}"
        rx="24" ry="24"
        fill="rgba(255,255,255,0.07)"
        stroke="rgba(255,255,255,0.25)"
        stroke-width="1.5"/>

  <!-- Area sinistra (cover zone): bordo/cornice placeholder sempre visibile -->
  ${coverBuf
    ? `<!-- cornice attorno alla cover (composita dopo) -->
       <rect x="${COVER_X}" y="${COVER_Y}"
             width="${COVER_SIZE}" height="${COVER_SIZE}"
             rx="16" ry="16"
             fill="none"
             stroke="rgba(255,255,255,0.20)"
             stroke-width="1.5"/>`
    : `<!-- Placeholder disco quando cover assente -->
       <rect x="${COVER_X}" y="${COVER_Y}"
             width="${COVER_SIZE}" height="${COVER_SIZE}"
             rx="16" ry="16"
             fill="rgba(255,255,255,0.05)"
             stroke="rgba(255,255,255,0.15)"
             stroke-width="1.5"/>
       <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}"
               r="52" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
       <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}"
               r="16" fill="rgba(255,255,255,0.12)"/>
       <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}"
               r="5"  fill="rgba(255,255,255,0.5)"/>
       <!-- linee solchi disco -->
       <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}"
               r="36" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
       <circle cx="${COVER_X + COVER_SIZE / 2}" cy="${COVER_Y + COVER_SIZE / 2}"
               r="46" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`
  }

  <!-- ── Testo nel pannello ─────────────────────────── -->

  <!-- Pill stato -->
  <rect x="${TX}" y="48"
        width="210" height="30"
        rx="999" ry="999"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.15)"
        stroke-width="1"/>
  <!-- Pallino stato -->
  <circle cx="${TX + 16}" cy="63" r="5" fill="${dotColor}"/>
  <!-- Testo stato (niente emoji) -->
  <text x="${TX + 30}" y="68"
        font-family="BotFontBold"
        font-size="13"
        fill="${stateColor}">${stateText}</text>

  <!-- Titolo canzone -->
  <text x="${TX}" y="130"
        font-family="BotFontBold"
        font-size="26"
        fill="#ffffff">${eName}</text>

  <!-- Artista -->
  <text x="${TX}" y="172"
        font-family="BotFont"
        font-size="18"
        fill="#a3b8ff">${eArtist}</text>

  <!-- Album -->
  <text x="${TX}" y="210"
        font-family="BotFont"
        font-size="16"
        fill="#c6ccdd">${eAlbum}</text>

  <!-- Link -->
  <text x="${TX}" y="248"
        font-family="BotFont"
        font-size="13"
        fill="#6ea8fe">${eUrl}</text>

  <!-- Separatore footer -->
  <line x1="${PANEL_X + 16}" y1="340"
        x2="${PANEL_X + PANEL_W - 16}" y2="340"
        stroke="rgba(255,255,255,0.10)"
        stroke-width="1"/>

  <!-- Footer account -->
  <text x="${PANEL_X + PANEL_W / 2}" y="363"
        font-family="BotFont"
        font-size="13"
        fill="#7a8194"
        text-anchor="middle">Account Last.fm: ${eUser}</text>

</svg>`;

  // d) Render SVG → PNG
  let card = await sharp(Buffer.from(svg)).png().toBuffer();

  // e) Composita la cover (160x160 già quadrata) se disponibile
  if (coverBuf) {
    card = await sharp(card)
      .composite([{ input: coverBuf, left: COVER_X, top: COVER_Y }])
      .png()
      .toBuffer();
  }

  return card;
}

// ─── Gestione errori Last.fm ─────────────────────────────────────────────────

// Il bot lancia new Error('CODICE') dove il codice sta in err.message.
function mapLastfmError(err) {
  const msg = String(err?.message || '');
  const code = msg;
  if (code === 'UTENTE_NON_TROVATO' || /404|not found|non trovato/i.test(msg))
    return 'Utente Last.fm non trovato. Controlla il nome account.';
  if (code === 'API_KEY_INVALIDA' || /403|invalid.*key|key.*invalid/i.test(msg))
    return 'Chiave API Last.fm non valida. Contatta l\'amministratore.';
  if (code === 'TROPPE_RICHIESTE' || /429|rate.?limit/i.test(msg))
    return 'Troppe richieste a Last.fm. Riprova tra qualche secondo.';
  if (code === 'API_KEY_MANCA')
    return 'API key Last.fm non configurata.';
  if (code === 'RETE' || /timeout|timed out|ECONN|ENOTFOUND|network/i.test(msg))
    return 'Errore di rete raggiungendo Last.fm. Riprova.';
  if (code === 'API_ERROR')
    return `Errore Last.fm: ${msg}`;
  return `Errore imprevisto: ${msg || String(err)}`;
}

// ─── Comando ─────────────────────────────────────────────────────────────────

module.exports = {
  name: 'cur',
  aliases: ['np', 'nowplaying', 'current'],
  description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm come card immagine. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima l\'account con .lastfm <nome>',

  async run(sock, msg, args, context) {
    const { reply, from, sender, textArgs, mentioned } = context;
    const { db, lastfm, axios, sharp, projectDir } = context.services;

    // 1. Last.fm configurato?
    if (!lastfm.isConfigured()) {
      return reply('⚠️ *Last.fm non configurato.*\n\nL\'owner deve impostare una API key in `config.js` (LASTFM_API_KEY).');
    }

    // 2. Risolvi username
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

    // 3. Dati Last.fm
    let data;
    try {
      data = await lastfm.getNowPlaying(username);
    } catch (err) {
      return reply('❌ ' + mapLastfmError(err));
    }

    // 4. Nessuna traccia
    if (!data.track) {
      return reply(`🎧 *${username}*\n\nNessuna traccia ascoltata di recente.`);
    }

    const { nowPlaying, track } = data;

    // 5. Caption testuale (emoji OK qui, solo nel testo)
    const statusEmoji = nowPlaying ? '🎶' : '🕓';
    const statusLabel = nowPlaying ? 'In riproduzione' : 'Ultimo ascolto';
    const caption =
      `${statusEmoji} *${statusLabel}*\n\n` +
      `🎵 *${track.name}*\n` +
      `🎤 ${track.artist}\n` +
      `💿 ${track.album}\n` +
      `🔗 ${track.url}\n\n` +
      `👤 Account: ${username}`;

    // 6. Genera card; fallback testo obbligatorio
    try {
      const cardBuffer = await buildCard(
        { nowPlaying, track, username },
        axios,
        sharp,
        projectDir
      );
      await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
    } catch (imgErr) {
      console.error('[cur] Errore generazione card:', imgErr);
      await reply(caption);
    }
  },
};
