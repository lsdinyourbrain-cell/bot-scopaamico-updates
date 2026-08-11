'use strict';

// Utilità condivise per generare SVG via sharp (testo, wrap, escape).

const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[c]));

// Divide un testo in righe di massimo `maxChars` caratteri, al massimo
// `maxLines` righe (le righe in eccesso vengono troncate con "…").
const wrapLines = (text, maxChars, maxLines = 3) => {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const w of words) {
        let word = w;
        while (word.length > maxChars) {
            if (cur) { lines.push(cur); cur = ''; }
            lines.push(word.slice(0, maxChars));
            word = word.slice(maxChars);
        }
        const cand = (cur + ' ' + word).trim();
        if (cand.length <= maxChars) cur = cand;
        else { if (cur) lines.push(cur); cur = word; }
        if (lines.length >= maxLines) break;
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    const sliced = lines.slice(0, maxLines);
    return sliced.map((l, i) => (i === maxLines - 1 && lines.length > maxLines) ? l.slice(0, Math.max(1, maxChars - 1)) + '…' : l);
};

module.exports = { escapeXml, wrapLines };