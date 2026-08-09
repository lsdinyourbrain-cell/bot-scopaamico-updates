'use strict';

const fs = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
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
      .resize(180, 180, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ─── Card builder ────────────────────────────────────────────────────────────

async function buildCard({ nowPlaying, track, username }, axios, sharp, projectDir) {
  const coverBuf = await fetchCover(track.cover, axios, sharp);

  // Font Arial Bold incorporato (unico, per tutto)
  const fontB64 = fs.readFileSync(path.join(projectDir, 'assets', 'fonts', 'Arial-Bold.ttf')).toString('base64');

  const W = 800, H = 400;
  const COVER_X = 40, COVER_Y = 110, COVER_SIZE = 180;
  const PANEL_X = 250, PANEL_Y = 20, PANEL_W = 530, PANEL_H = 360;
  const TX = 280;

  const eName   = escapeXml(truncate(track.name,   36));
  const eArtist = escapeXml(truncate(track.artist, 40));
  const eAlbum  = escapeXml(truncate(track.album,  40));
  const eUrl    = escapeXml(truncate(track.url,    55));
  const eUser   = escapeXml(truncate(username,     38));

  const stateText = nowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO';
  const accent    = nowPlaying ? '#1DB954' : '#8b93a7';
  const accentS   = nowPlaying ? '#1DB95460' : '#8b93a760'; // usato come fill opaco

  const BG_DARK      = '#0b0f1a';
  const BG_MID       = '#151a2e';
  const BG_LIGHT     = '#0e1422';
  const PANEL_BG     = '#1a1f2e';
  const PANEL_BORDER = '#3a4055';
  const TEXT_WHITE   = '#ffffff';
  const TEXT_BLUE    = '#8ab4f8';
  const TEXT_GRAY    = '#b0b6c9';
  const TEXT_LINK    = '#6ea8fe';
  const TEXT_DIM     = '#7a8194';

  // SVG minimale con @font-face base64
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face {
        font-family: "BotFont";
        src: url(data:font/truetype;base64,${fontB64});
      }
    </style>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${BG_DARK}"/>
      <stop offset="50%"  stop-color="${BG_MID}"/>
      <stop offset="100%" stop-color="${BG_LIGHT}"/>
    </linearGradient>
    <linearGradient id="panelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${PANEL_BG}"/>
      <stop offset="100%" stop-color="${BG_DARK}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

  <!-- Blob glass: ellissi opache -->
  <ellipse cx="50"  cy="50"  rx="180" ry="160" fill="#2a1a4a" opacity="0.35"/>
  <ellipse cx="750" cy="30"  rx="160" ry="140" fill="#0a3a4a" opacity="0.30"/>
  <ellipse cx="730" cy="370" rx="190" ry="140" fill="#3a1a2a" opacity="0.28"/>

  <!-- Pannello -->
  <rect x="${PANEL_X}" y="${PANEL_Y}"
        width="${PANEL_W}" height="${PANEL_H}"
        rx="20" ry="20"
        fill="url(#panelGrad)"
        stroke="${PANEL_BORDER}"
        stroke-width="1.5"/>

  <!-- Cover zone -->
  ${coverBuf
    ? `<rect x="${COVER_X}" y="${COVER_Y}"
            width="${COVER_SIZE}" height="${COVER_SIZE}"
            rx="14" ry="14"
            fill="none"
            stroke="${PANEL_BORDER}"
            stroke-width="2"/>`
    : `<rect x="${COVER_X}" y="${COVER_Y}"
            width="${COVER_SIZE}" height="${COVER_SIZE}"
            rx="14" ry="14"
            fill="#111520"
            stroke="${PANEL_BORDER}"
            stroke-width="1.5"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="58" fill="#1a1f30" stroke="${PANEL_BORDER}" stroke-width="1"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="18" fill="#0d101a"/>
       <circle cx="${COVER_X + COVER_SIZE/2}" cy="${COVER_Y + COVER_SIZE/2}"
               r="5" fill="#444"/>`
  }

  <!-- Stato pill -->
  <rect x="${TX}" y="40"
        width="220" height="28"
        rx="14" ry="14"
        fill="${accentS}"
        stroke="${accent}"
        stroke-width="1"/>
  <circle cx="${TX + 14}" cy="54" r="4" fill="${accent}"/>
  <text x="${TX + 30}" y="60"
        font-family="BotFont"
        font-size="12" font-weight="bold"
        fill="${accent}">${stateText}</text>

  <!-- Titolo -->
  <text x="${TX}" y="125"
        font-family="BotFont"
        font-size="26" font-weight="bold"
        fill="${TEXT_WHITE}">${eName}</text>

  <!-- Artista -->
  <text x="${TX}" y="168"
        font-family="BotFont"
        font-size="17"
        fill="${TEXT_BLUE}">${eArtist}</text>

  <!-- Album -->
  <text x="${TX}" y="205"
        font-family="BotFont"
        font-size="15"
        fill="${TEXT_GRAY}">${eAlbum}</text>

  <!-- Link -->
  <text x="${TX}" y="240"
        font-family="BotFont"
        font-size="13"
        fill="${TEXT_LINK}">${eUrl}</text>

  <!-- Separatore -->
  <line x1="${PANEL_X + 20}" y1="330"
        x2="${PANEL_X + PANEL_W - 20}" y2="330"
        stroke="${PANEL_BORDER}" stroke-width="1"/>

  <!-- Footer -->
  <text x="${PANEL_X + PANEL_W/2}" y="352"
        font-family="BotFont"
        font-size="12"
        fill="${TEXT_DIM}"
        text-anchor="middle">Account Last.fm: ${eUser}</text>

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

// ─── Errori ────────────────────────────────────────────────────────────────

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
    return `Errore Last.fm: ${msg}`;
  return `Errore imprevisto: ${msg || String(err)}`;
}

// ─── Comando ────────────────────────────────────────────────────────────────

module.exports = {
  name: 'cur',
  aliases: ['np', 'nowplaying', 'current'],
  description: 'Mostra la canzone attuale o l\'ultimo ascolto su Last.fm come card immagine. Uso: .cur (tuo account) oppure .cur <nomeutente>. Collega prima l\'account con .lastfm <nome>',

  async run(sock, msg, args, context) {
    const { reply, from, sender, textArgs, mentioned } = context;
    const { db, lastfm, axios, sharp, projectDir } = context.services;

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
      return reply(`🎧 *${username}*\n\nNessuna traccia ascoltata di recente.`);
    }

    const { nowPlaying, track } = data;

    const statusEmoji = nowPlaying ? '🎶' : '🕓';
    const statusLabel = nowPlaying ? 'In riproduzione' : 'Ultimo ascolto';
    const caption =
      `${statusEmoji} *${statusLabel}*\n\n` +
      `🎵 *${track.name}*\n` +
      `🎤 ${track.artist}\n` +
      `💿 ${track.album}\n` +
      `🔗 ${track.url}\n\n` +
      `👤 Account: ${username}`;

    try {
      const cardBuffer = await buildCard({ nowPlaying, track, username }, axios, sharp, projectDir);
      await sock.sendMessage(from, { image: cardBuffer, caption }, { quoted: msg });
    } catch (imgErr) {
      console.error('[cur] Errore generazione card:', imgErr);
      await reply(caption);
    }
  },
};