'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  LEADERBOARD — Vex Bot (v2)
//  Renderizza le classifiche come VERA TABELLA PNG (sharp + SVG).
//  Supporta sia layout legacy (name/value) sia layout multi-colonna:
//    renderLeaderboardImage({
//      title, subtitle, accent, accent2,
//      columns: [{ key, label, width, align }], // opzionale
//      rows: [{ name, value, ... } | { rank, name, msg, level ... }]
//    })
//
//  - Se `columns` è fornito: usa colonne custom.
//  - Se `rows[0]` contiene chiavi msg/level/money/bank/members: auto-layout.
//  - Altrimenti fallback a POS | GIOCATORE | VALORE (legacy).
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

// Medaglie top 3
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

const renderLeaderboardImage = async ({ title, subtitle, accent = '#22d3ee', accent2 = '#6366f1', rows, columns }) => {
    let list = (rows || []).slice(0, 20);
    if (!list.length) list = [{ name: 'Nessun dato', value: '-', msg: '-', level: '-', money: '-', bank: '-', members: '-' }];
    const W = 720;
    const HEADER_H = 96;
    const COL_H = 44;
    const ROW_H = 56;
    const FOOTER_H = 42;
    const H = HEADER_H + COL_H + ROW_H * list.length + FOOTER_H;

    // Determina layout colonne
    let cols = null;
    if (Array.isArray(columns) && columns.length) {
        cols = columns;
    } else if (list.length && list[0]) {
        const sample = list[0];
        const hasMsgLevel = ('msg' in sample || 'messages' in sample) && ('level' in sample || 'lvl' in sample);
        const hasMoneyBank = ('money' in sample || 'cash' in sample) && ('bank' in sample || 'banca' in sample);
        const hasMembers = 'members' in sample || 'utenti' in sample;
        if (hasMsgLevel) {
            cols = [
                { key: 'rank', label: 'POS', x: 38, anchor: 'middle', width: 56, color: '#94a3b8' },
                { key: 'name', label: 'UTENTE', x: 76, anchor: 'start', width: 280, color: '#94a3b8' },
                { key: 'msg', label: 'MESSAGGI', x: 500, anchor: 'end', width: 110, color: '#94a3b8' },
                { key: 'level', label: 'LIVELLO', x: 680, anchor: 'end', width: 70, color: '#94a3b8' },
            ];
        } else if (hasMoneyBank) {
            cols = [
                { key: 'rank', label: 'POS', x: 38, anchor: 'middle', width: 56, color: '#94a3b8' },
                { key: 'name', label: 'UTENTE', x: 76, anchor: 'start', width: 260, color: '#94a3b8' },
                { key: 'money', label: 'CONTANTI', x: 520, anchor: 'end', width: 110, color: '#94a3b8' },
                { key: 'bank', label: 'BANCA', x: 680, anchor: 'end', width: 110, color: '#94a3b8' },
            ];
        } else if (hasMembers) {
            cols = [
                { key: 'rank', label: 'POS', x: 38, anchor: 'middle', width: 56, color: '#94a3b8' },
                { key: 'name', label: 'GRUPPO', x: 76, anchor: 'start', width: 300, color: '#94a3b8' },
                { key: 'msg', label: 'MESSAGGI', x: 520, anchor: 'end', width: 110, color: '#94a3b8' },
                { key: 'members', label: 'MEMBRI', x: 680, anchor: 'end', width: 80, color: '#94a3b8' },
            ];
        }
    }
    // Fallback legacy: POS | NOME | VALORE
    if (!cols) {
        cols = [
            { key: 'rank', label: 'POS', x: 34, anchor: 'middle', width: 60, color: '#94a3b8' },
            { key: 'name', label: 'GIOCATORE', x: 84, anchor: 'start', width: 380, color: '#94a3b8' },
            { key: 'value', label: 'VALORE', x: 680, anchor: 'end', width: 200, color: '#94a3b8' },
        ];
    }

    const rankCell = (i) => {
        const y = HEADER_H + COL_H + i * ROW_H;
        const cx = cols.find(c => c.key === 'rank')?.x || 34;
        const cy = y + ROW_H / 2;
        if (i < 3) {
            const fill = ['url(#medalG)', 'url(#medalS)', 'url(#medalB)'][i];
            return `<circle cx="${cx}" cy="${cy}" r="15" fill="${fill}"/><text x="${cx}" y="${cy + 4.5}" text-anchor="middle" ${FONT_FAMILY} font-size="12" font-weight="800" fill="#ffffff">${i + 1}</text>`;
        }
        return `<text x="${cx}" y="${cy + 6}" text-anchor="middle" ${FONT_FAMILY} font-size="15" font-weight="700" fill="#64748b">${i + 1}</text>`;
    };

    const getRowField = (r, colKey, idx) => {
        if (colKey === 'rank') return '';
        if (colKey === 'name') return r.name ?? r.title ?? r.group ?? '';
        if (colKey === 'value') return r.value ?? r.val ?? '';
        if (colKey === 'msg' || colKey === 'messages') return r.msg ?? r.messages ?? r.value ?? '';
        if (colKey === 'level' || colKey === 'lvl') return r.level ?? r.lvl ?? r.lv ?? '';
        if (colKey === 'money' || colKey === 'cash') return r.money ?? r.cash ?? r.value ?? '';
        if (colKey === 'bank' || colKey === 'banca') return r.bank ?? r.banca ?? '';
        if (colKey === 'members' || colKey === 'utenti') return r.members ?? r.utenti ?? '';
        return r[colKey] ?? '';
    };

    const rowSvg = list.map((r, i) => {
        const y = HEADER_H + COL_H + i * ROW_H;
        const bg = i % 2 ? '#0b1220' : '#0f172a';
        let cells = rankCell(i);
        for (const col of cols) {
            if (col.key === 'rank') continue;
            const raw = getRowField(r, col.key, i);
            const val = esc(trunc(String(raw), col.key === 'name' ? 28 : 18));
            const isValueCol = ['value','money','bank','msg','messages','level','members'].includes(col.key);
            const fontWeight = col.key === 'name' ? '600' : '700';
            const fontSize = col.key === 'name' ? '15' : '14';
            const fill = isValueCol ? accent : '#f1f5f9';
            const anchor = col.anchor === 'middle' ? 'middle' : col.anchor === 'end' ? 'end' : 'start';
            cells += `<text x="${col.x}" y="${y + ROW_H / 2 + 6}" text-anchor="${anchor}" ${FONT_FAMILY} font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${val}</text>`;
        }
        return `<rect x="0" y="${y}" width="${W}" height="${ROW_H}" fill="${bg}"/><line x1="0" y1="${y + ROW_H}" x2="${W}" y2="${y + ROW_H}" stroke="#1e293b" stroke-width="1"/>${cells}`;
    }).join('\n');

    const colHeaders = cols.map(c => {
        if (c.key === 'rank') {
            return `<text x="${c.x}" y="${HEADER_H + 28}" text-anchor="middle" ${FONT_FAMILY} font-size="11" font-weight="800" fill="${c.color}" letter-spacing="1.5">${esc(c.label)}</text>`;
        }
        const anchor = c.anchor === 'middle' ? 'middle' : c.anchor === 'end' ? 'end' : 'start';
        return `<text x="${c.x}" y="${HEADER_H + 28}" text-anchor="${anchor}" ${FONT_FAMILY} font-size="11" font-weight="800" fill="${c.color}" letter-spacing="1.5">${esc(c.label)}</text>`;
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
<text x="32" y="44" ${FONT_FAMILY} font-size="26" font-weight="900" fill="#ffffff" letter-spacing="0.5">${esc(trunc(title, 34))}</text>
<text x="32" y="70" ${FONT_FAMILY} font-size="13" font-weight="500" fill="rgba(255,255,255,0.88)">${esc(trunc(subtitle, 70))}</text>
<rect x="0" y="${HEADER_H}" width="${W}" height="${COL_H}" fill="#111c2e"/>
${colHeaders}
${rowSvg}
<rect x="0" y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#111c2e"/>
<text x="${W / 2}" y="${H - FOOTER_H / 2 + 5}" text-anchor="middle" ${FONT_FAMILY} font-size="11" font-weight="800" fill="#64748b" letter-spacing="4">VEX BOT</text>
</g>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

const pad = (s, w, align='left') => {
    s = String(s ?? '').replace(/\s+/g,' ').trim();
    if (s.length > w) s = s.slice(0, w-1) + '…';
    if (align === 'right') return s.padStart(w, ' ');
    if (align === 'center') {
        const left = Math.floor((w - s.length)/2);
        const right = w - s.length - left;
        return ' '.repeat(left) + s + ' '.repeat(right);
    }
    return s.padEnd(w, ' ');
};

const buildTextTable = (rows, opts={}) => {
    const title = opts.title || 'CLASSIFICA';
    const subtitle = opts.subtitle || '';
    const cols = opts.columns || [
        { key:'rank', label:'POS', width:4, align:'center' },
        { key:'name', label:'UTENTE', width:22, align:'left' },
        { key:'msg', label:'MESSAGGI', width:10, align:'right' },
        { key:'level', label:'LIVELLO', width:8, align:'right' },
    ];
    const get = (r,k) => {
        if(k==='rank') return String(r.rank||'');
        if(k==='name') return r.name||'';
        if(k==='msg') return r.msg||r.messages||'';
        if(k==='level') return r.level||'';
        if(k==='money') return r.money||'';
        if(k==='bank') return r.bank||'';
        if(k==='members') return r.members||'';
        return r[k]||'';
    };
    const sep = '┼';
    const top = '┌' + cols.map(c=>'─'.repeat(c.width+2)).join('┬') + '┐';
    const mid = '├' + cols.map(c=>'─'.repeat(c.width+2)).join(sep) + '┤';
    const bot = '└' + cols.map(c=>'─'.repeat(c.width+2)).join('┴') + '┘';
    const header = '│ ' + cols.map(c=>pad(c.label, c.width, 'center')).join(' │ ') + ' │';
    const lines = rows.slice(0,10).map((r,i)=>{
        const cells = cols.map(c=>{
            let v = c.key==='rank' ? String(i+1) : get(r,c.key);
            return pad(v, c.width, c.align);
        });
        return '│ ' + cells.join(' │ ') + ' │';
    });
    const emptyNote = !rows.length ? '│ ' + pad('Nessun dato', cols.reduce((a,c)=>a+c.width+3, -1), 'center') + ' │' : null;
    const body = emptyNote ? [header, mid, emptyNote] : [header, mid, ...lines];
    return [
        `*${title}*`,
        subtitle ? `_${subtitle}_` : null,
        '```',
        top,
        ...body,
        bot,
        '```',
    ].filter(Boolean).join('\n');
};

module.exports = { renderLeaderboardImage, buildTextTable };
