'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TABELLE — Vex Bot
//  renderTable(cols, rows): genera una tabella monospace (``` ```) con
//  intestazioni e colonne allineate. Niente cornici box-drawing (si
//  disallineano su WhatsApp): solo intestazione + righe + separatore.
//
//  cols = [{ header: 'NOME', align: 'l' | 'r', max: 20 }]
//  rows = [ [cella, cella, ...], ... ]
// ─────────────────────────────────────────────────────────────────────────────

const renderTable = (cols, rows) => {
    const list = Array.isArray(cols) ? cols : [];
    const data = Array.isArray(rows) ? rows : [];
    if (!list.length) return '';

    const widths = list.map(c => String(c.header || '').length);
    for (const r of data) {
        for (let i = 0; i < list.length; i++) {
            const cell = String(r[i] ?? '').slice(0, list[i].max || 30);
            widths[i] = Math.max(widths[i], cell.length);
        }
    }

    const pad = (v, i) => {
        const s = String(v ?? '').slice(0, list[i].max || 30);
        return list[i].align === 'r' ? s.padStart(widths[i]) : s.padEnd(widths[i]);
    };

    const line = (vals) => '│ ' + vals.map((v, i) => pad(v, i)).join(' │ ') + ' │';
    const totalW = widths.reduce((a, b) => a + b, 0) + (list.length + 1) * 3;
    const rule = '─'.repeat(totalW);

    const out = ['```'];
    out.push(rule);
    out.push(line(list.map(c => c.header)));
    out.push(rule);
    for (const r of data) out.push(line(r));
    out.push(rule);
    out.push('```');
    return out.join('\n');
};

module.exports = { renderTable };