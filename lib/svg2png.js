'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  SVG2PNG — Vex Bot
//  Converte SVG → PNG senza dipendere dai font di sistema.
//  1) @resvg/resvg-js con font bundled (assets/fonts) — funziona anche su
//     Termux/Android dove sharp/librsvg non trova i font (board vuote).
//  2) Fallback a sharp se passato e disponibile (PC).
//  3) Altrimenti throw pulito (il chiamante manda fallback testo).
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');

const FONT_FILES = [
    path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansSymbols2-Regular.ttf'),
];

let _Resvg = null;
try { ({ Resvg: _Resvg } = require('@resvg/resvg-js')); } catch (_) { _Resvg = null; }

const svgToPng = async (svg, sharp = null) => {
    const buf = Buffer.isBuffer(svg) ? svg : Buffer.from(String(svg));
    if (_Resvg) {
        try {
            const r = new _Resvg(buf, {
                font: { fontFiles: FONT_FILES, loadSystemFonts: true },
            });
            return Buffer.from(r.render().asPng());
        } catch (e) {
            console.error('[svg2png] resvg fail, fallback sharp:', e.message);
        }
    }
    if (sharp) {
        return sharp(buf).png().toBuffer();
    }
    throw new Error('SVG2PNG_MISSING: né resvg né sharp disponibili');
};

module.exports = { svgToPng, FONT_FILES };
