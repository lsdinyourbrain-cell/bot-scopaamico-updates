'use strict';

// Forza 4 (Connect Four): logica di gioco + rendering PNG.
// Board: array di 6 righe, ciascuna di 7 celle (null | 'R' | 'Y').
// La riga 0 è quella in alto.

const ROWS = 6;
const COLS = 7;

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Inserisce un pedino nella colonna (0-based). Ritorna la riga oppure -1 se piena.
const dropPiece = (board, col) => {
    if (col < 0 || col >= COLS) return -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === null) return r;
    }
    return -1; // colonna piena
};

const checkConnect4Winner = (board) => {
    const dirs = [
        [0, 1],  // orizzontale
        [1, 0],  // verticale
        [1, 1],  // diagonale giù-destra
        [1, -1], // diagonale giù-sinistra
    ];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const v = board[r][c];
            if (v === null) continue;
            for (const [dr, dc] of dirs) {
                let count = 1;
                for (let k = 1; k < 4; k++) {
                    const nr = r + dr * k, nc = c + dc * k;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== v) break;
                    count++;
                }
                if (count >= 4) return v;
            }
        }
    }
    return null;
};

const isConnect4Full = (board) => board.every(row => row.every(cell => cell !== null));

// Dispone le gocce per i numeri di colonna (1-7)
const isValidMove = (board, colNum) => dropPiece(board, colNum) !== -1;

const renderConnect4Board = async (sharp, board, lastMove = null) => {
    const CELL = 96;
    const PAD = 24;
    const W = PAD * 2 + COLS * CELL;
    const H = PAD * 2 + ROWS * CELL;

    let circles = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = PAD + c * CELL + CELL / 2;
            const y = PAD + r * CELL + CELL / 2;
            const v = board[r][c];
            let fill = '#22233a';
            if (v === 'R') fill = '#ff4757';
            if (v === 'Y') fill = '#feca57';
            const lastMark = lastMove && lastMove.r === r && lastMove.c === c;
            const stroke = lastMark
                ? 'stroke="#ffffff" stroke-width="6"'
                : '';
            circles += `<circle cx="${x}" cy="${y}" r="${CELL * 0.38}" fill="${fill}" ${stroke}/>`;
        }
    }

    const headers = Array.from({ length: COLS }, (_, i) =>
        `<text x="${PAD + i * CELL + CELL / 2}" y="${PAD * 0.55}" font-family="Arial, sans-serif" font-size="26" fill="#ffd166" text-anchor="middle" font-weight="bold">${i + 1}</text>`
    ).join('');

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#0f3460" rx="18"/>
        <rect x="16" y="${PAD}" width="${W - 32}" height="${H - PAD - 8}" fill="#16213e" rx="14"/>
        ${circles}
        ${headers}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = {
    ROWS, COLS,
    createBoard,
    dropPiece,
    checkConnect4Winner,
    isConnect4Full,
    isValidMove,
    renderConnect4Board,
};