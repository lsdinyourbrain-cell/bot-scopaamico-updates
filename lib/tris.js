'use strict';

// Logica del Tris (file e pesi): rendering della board come immagine PNG
// e controllo del vincitore. Le funzioni ricevono `sharp` come parametro
// per non doverlo importare due volte nel ciclo di vita del bot.

// Ritorna 0 (giocatore X), 1 (giocatore O), oppure null (ancora in gioco).
const checkTrisWinner = (board) => {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // righe
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonne
        [0, 4, 8], [2, 4, 6],             // diagonali
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a] === 'X' ? 0 : 1;
        }
    }
    return null;
};

// Ritorna true se la board è piena (pareggio).
const isTrisBoardFull = (board) => board.every((c) => c !== null);

// Disegna la board di tris come SVG e la converte in PNG tramite sharp.
// `board` è un array di 9 elementi: null | 'X' | 'O'.
const renderTrisBoard = async (sharp, board) => {
    const CELL = 110;
    const PAD = 30;
    const SIZE = CELL * 3 + PAD * 2;

    const cx = (i) => PAD + (i % 3) * CELL + CELL / 2;
    const cy = (i) => PAD + Math.floor(i / 3) * CELL + CELL / 2;

    const defs = `
        <defs>
            <filter id="glowX" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowO" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowGrid" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glowNum" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0f0c29"/>
                <stop offset="50%" stop-color="#302b63"/>
                <stop offset="100%" stop-color="#24243e"/>
            </linearGradient>
        </defs>`;

    let marks = '';
    board.forEach((v, i) => {
        const x = cx(i), y = cy(i);
        if (v === 'X') {
            const s = 34;
            marks += `<g filter="url(#glowX)">`;
            marks += `<line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}" stroke="#ff2d78" stroke-width="10" stroke-linecap="round"/>`;
            marks += `<line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}" stroke="#ff2d78" stroke-width="10" stroke-linecap="round"/>`;
            marks += `</g>`;
        } else if (v === 'O') {
            marks += `<g filter="url(#glowO)">`;
            marks += `<circle cx="${x}" cy="${y}" r="36" fill="none" stroke="#00e5ff" stroke-width="10"/>`;
            marks += `</g>`;
        } else {
            marks += `<g filter="url(#glowNum)">`;
            marks += `<text x="${x}" y="${y + 9}" font-family="Verdana, Arial, sans-serif" font-size="30" font-weight="bold" fill="#7df9ff" text-anchor="middle">${i + 1}</text>`;
            marks += `</g>`;
        }
    });

    const gridLines = `
        <g filter="url(#glowGrid)" stroke="#8a5cff" stroke-width="5">
            <line x1="${PAD + CELL}" y1="${PAD}" x2="${PAD + CELL}" y2="${SIZE - PAD}"/>
            <line x1="${PAD + CELL * 2}" y1="${PAD}" x2="${PAD + CELL * 2}" y2="${SIZE - PAD}"/>
            <line x1="${PAD}" y1="${PAD + CELL}" x2="${SIZE - PAD}" y2="${PAD + CELL}"/>
            <line x1="${PAD}" y1="${PAD + CELL * 2}" x2="${SIZE - PAD}" y2="${PAD + CELL * 2}"/>
        </g>`;

    const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
        ${defs}
        <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" rx="16"/>
        ${gridLines}
        ${marks}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = { checkTrisWinner, isTrisBoardFull, renderTrisBoard };
