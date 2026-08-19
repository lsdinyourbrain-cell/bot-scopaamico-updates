'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  LEADERBOARD — Vex Bot
//  Renderizza le classifiche come VERA TABELLA in un'immagine PNG (sharp +
//  SVG): niente testo ASCII che si sfasa e niente pannelli nativi che l'utente
//  percepisce come "sezioni". Card scura con header, colonne, medaglie e
//  righe alternate. Nessuna dipendenza nuova: sharp è già nel progetto.
// ─────────────────────────────────────────────────────────────────────────────

const sharp = require('sharp');

const FONT_FAMILY = `font-family="Segoe UI, DejaVu Sans, Arial, sans-serif"`;

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const trunc = (s, max) => {
    const t = String(s ?? '').replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, Math.max(1, max - 1)) + '…' : t;
};

// Medaglie per le prime 3 posizioni (gradienti oro/argento/bronzo).
const MEDAL_DEFS = `
    <radialGradient id="medalG" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#fde68a"/>
        <stop offset="55%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
    </radialGradient>
    <radialGradient id="medalS" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#e2e8f0"/>
        <stop offset="55%" stop-color="#94a3b8"/>
        <stop offset="100%" stop-color="#475569"/>
    </radialGradient>
    <radialGradient id="medalB" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#fcd9b8"/>
        <stop offset="55%" stop-color="#cd7f32"/>
        <stop offset="100%" stop-color="#92400e"/>
    </radialGradient>`;

// rows: [{ name, value }] — la posizione è l'indice + 1 (max 20).
const renderLeaderboardImage = async ({ title, subtitle, accent = '#22d3ee', accent2 = '#6366f1', rows }) => {
    const list = (rows || []).slice(0, 20);
    const W = 640;
    const HEADER_H = 92;
    const COL_H = 42;
    const ROW_H = 54;
    const FOOTER_H = 40;
    const H = HEADER_H + COL_H + ROW_H * list.length + FOOTER_H;

    const rankCell = (i) => {
        const y = HEADER_H + COL_H + i * ROW_H;
        const cx = 34;
        const cy = y + ROW_H / 2;
        if (i < 3) {
            const fill = ['url(#medalG)', 'url(#medalS)', 'url(#medalB)'][i];
            return `<circle cx="${cx}" cy="${cy}" r="15" fill="${fill}"/>
<text x="${cx}" y="${cy + 4}" text-anchor="middle" ${FONT_FAMILY} font-size="12" font-weight="700" fill="#ffffff">${i + 1}</text>`;
        }
        return `<text x="${cx}" y="${cy + 6}" text-anchor="middle" ${FONT_FAMILY} font-size="15" font-weight="600" fill="#64748b">${i + 1}</text>`;
    };

    const rowSvg = list.map((r, i) => {
        const y = HEADER_H + COL_H + i * ROW_H;
        const bg = i % 2 ? '#0b1220' : '#0f172a';
        return `<rect x="0" y="${y}" width="${W}" height="${ROW_H}" fill="${bg}"/>
<line x1="0" y1="${y + ROW_H}" x2="${W}" y2="${y + ROW_H}" stroke="#1e293b" stroke-width="1"/>
${rankCell(i)}
<text x="84" y="${y + ROW_H / 2 + 6}" ${FONT_FAMILY} font-size="16" font-weight="600" fill="#f1f5f9">${esc(trunc(r.name, 26))}</text>
<text x="${W - 40}" y="${y + ROW_H / 2 + 6}" text-anchor="end" ${FONT_FAMILY} font-size="16" font-weight="700" fill="${accent}">${esc(trunc(r.value, 20))}</text>`;
    }).join('\n');

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    ${MEDAL_DEFS}
    <clipPath id="cardClip"><rect x="0" y="0" width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#cardClip)">
<rect x="0" y="0" width="${W}" height="${H}" fill="#0f172a"/>
<rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="url(#headerGrad)"/>
<text x="32" y="42" ${FONT_FAMILY} font-size="26" font-weight="800" fill="#ffffff">${esc(trunc(title, 34))}</text>
<text x="32" y="68" ${FONT_FAMILY} font-size="13" fill="rgba(255,255,255,0.82)">${esc(trunc(subtitle, 70))}</text>
<rect x="0" y="${HEADER_H}" width="${W}" height="${COL_H}" fill="#111c2e"/>
<text x="34" y="${HEADER_H + 27}" text-anchor="middle" ${FONT_FAMILY} font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="2">POS</text>
<text x="84" y="${HEADER_H + 27}" ${FONT_FAMILY} font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="2">GIOCATORE</text>
<text x="${W - 40}" y="${HEADER_H + 27}" text-anchor="end" ${FONT_FAMILY} font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="2">VALORE</text>
${rowSvg}
<rect x="0" y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#111c2e"/>
<text x="${W / 2}" y="${H - FOOTER_H / 2 + 4}" text-anchor="middle" ${FONT_FAMILY} font-size="12" font-weight="700" fill="#94a3b8" letter-spacing="4">VEX BOT</text>
</g>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = { renderLeaderboardImage };