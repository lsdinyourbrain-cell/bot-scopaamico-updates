'use strict';

const { sendButtonsWithKey } = require('./buttons');

// Labirinto: generazione (backtracking ricorsivo) + risoluzione BFS +
// rendering PNG. Le celle sono oggetti { n, e, s, w } dove il valore indica
// la presenza della parete su quel lato. La partita vive in db[from].mazeGame.

const generateMaze = (rows, cols) => {
    const grid = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => ({ r, c, n: true, e: true, s: true, w: true, visited: false }))
    );

    const randNeighbors = (cell) => {
        const out = [];
        if (cell.r > 0) out.push(grid[cell.r - 1][cell.c]);
        if (cell.c < cols - 1) out.push(grid[cell.r][cell.c + 1]);
        if (cell.r < rows - 1) out.push(grid[cell.r + 1][cell.c]);
        if (cell.c > 0) out.push(grid[cell.r][cell.c - 1]);
        return out.filter(n => !n.visited).sort(() => Math.random() - 0.5);
    };

    const carve = (cell) => {
        cell.visited = true;
        for (const next of randNeighbors(cell)) {
            if (next.visited) continue;
            if (next.r < cell.r) { cell.n = false; next.s = false; }
            if (next.r > cell.r) { cell.s = false; next.n = false; }
            if (next.c < cell.c) { cell.w = false; next.e = false; }
            if (next.c > cell.c) { cell.e = false; next.w = false; }
            carve(next);
        }
    };
    carve(grid[0][0]);

    const exitR = rows - 1, exitC = cols - 1;
    const exitCell = grid[exitR][exitC];
    exitCell.s = false; // apertura verso l'uscita

    return { rows, cols, grid, exit: { r: exitR, c: exitC } };
};

// Ritorna true se il giocatore può muoversi nella direzione indicata.
const canMove = (maze, r, c, dir) => {
    if (r < 0 || c < 0 || r >= maze.rows || c >= maze.cols) return false;
    const cell = maze.grid[r][c];
    if (dir === 'u') return !cell.n && r > 0;
    if (dir === 'd') return !cell.s && r < maze.rows - 1;
    if (dir === 'l') return !cell.w && c > 0;
    if (dir === 'r') return !cell.e && c < maze.cols - 1;
    return false;
};

const movePlayer = (maze, r, c, dir) => {
    if (!canMove(maze, r, c, dir)) return null;
    if (dir === 'u') return { r: r - 1, c };
    if (dir === 'd') return { r: r + 1, c };
    if (dir === 'l') return { r, c: c - 1 };
    if (dir === 'r') return { r, c: c + 1 };
    return null;
};

// Path dal punto di partenza all'uscita tramite BFS.
const solveMaze = (maze) => {
    const { rows, cols, grid, exit } = maze;
    const start = { r: 0, c: 0 };
    const prev = Array.from({ length: rows }, () => Array(cols).fill(null));
    const queue = [start];
    prev[0][0] = { r: -1, c: -1 };

    while (queue.length) {
        const cur = queue.shift();
        if (cur.r === exit.r && cur.c === exit.c) {
            const path = [];
            let node = cur;
            while (node && node.r !== -1) {
                path.push(node);
                node = prev[node.r][node.c];
            }
            return path.reverse();
        }
        for (const dir of ['u', 'd', 'l', 'r']) {
            const next = movePlayer(maze, cur.r, cur.c, dir);
            if (next && !prev[next.r][next.c]) {
                prev[next.r][next.c] = cur;
                queue.push(next);
            }
        }
    }
    return [];
};

const renderMaze = async (sharp, maze, player = { r: 0, c: 0 }, revealPath = false) => {
    const CELL = 40;
    const PAD = 24;
    const W = PAD * 2 + maze.cols * CELL;
    const H = PAD * 2 + maze.rows * CELL;
    const { grid, rows, cols, exit } = maze;

    let lines = '';
    const wall = (x1, y1, x2, y2) => {
        lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3a3a5c" stroke-width="5"/>`;
    };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            const x = PAD + c * CELL;
            const y = PAD + r * CELL;
            if (cell.n) wall(x, y, x + CELL, y);
            if (cell.w) wall(x, y, x, y + CELL);
            if (cell.e) wall(x + CELL, y, x + CELL, y + CELL);
            if (cell.s) wall(x, y + CELL, x + CELL, y + CELL);
        }
    }
    lines += `<rect x="${PAD}" y="${PAD}" width="${cols * CELL}" height="${rows * CELL}" fill="none" stroke="#3a3a5c" stroke-width="5"/>`;

    // Uscita: quadrato verde (lato south già aperto)
    const exX = PAD + exit.c * CELL + CELL / 2;
    const exY = PAD + exit.r * CELL + CELL / 2;
    lines += `<circle cx="${exX}" cy="${exY}" r="${CELL * 0.3}" fill="#2ecc71"/>`;
    lines += `<text x="${exX}" y="${exY + 7}" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle" font-weight="bold">V</text>`;

    // Soluzione (opzionale) e giocatore
    if (revealPath) {
        const path = solveMaze(maze);
        const pts = path.map(p => `${PAD + p.c * CELL + CELL / 2},${PAD + p.r * CELL + CELL / 2}`).join(' ');
        lines += `<polyline points="${pts}" fill="none" stroke="#feca57" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
    }

    const px = PAD + player.c * CELL + CELL / 2;
    const py = PAD + player.r * CELL + CELL / 2;
    lines += `<circle cx="${px}" cy="${py}" r="${CELL * 0.28}" fill="#ff4757" stroke="#ffffff" stroke-width="4"/>`;

    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${W}" height="${H}" fill="#121216" rx="14"/>
        ${lines}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

// ── GIOCO: movimento condiviso (testo u/d/l/r E pulsanti) ──────────────────

const MAZE_TIMEOUT_MS = 240000;
const MAZE_QUIT_WORDS = ['fine', 'stop', 'esci', 'termina', 'basta', 'chiudi'];

// Sinonimi testuali delle direzioni accettati dal gioco.
const DIR_ALIASES = {
    u: 'u', su: 'u', sù: 'u', sopra: 'u', alto: 'u',
    d: 'd', giu: 'd', giù: 'd', sotto: 'd', basso: 'd',
    l: 'l', sinistra: 'l', sx: 'l',
    r: 'r', destra: 'r', dx: 'r',
};

// Pulsante "single_select": apre il riquadro nativo di WhatsApp con le mosse.
// Così si gioca senza scrivere nulla in chat (massimo 20 righe, noi ne usa 5).
const moveNavButton = () => ({
    type: 'single_select',
    label: '🎮 Muovi · 🏁 Fine',
    title: 'Muoviti o fermati',
    sectionTitle: 'Labirinto',
    rows: [
        { header: '⬆️', title: 'Su', id: 'labirinto muovi u' },
        { header: '⬇️', title: 'Giù', id: 'labirinto muovi d' },
        { header: '⬅️', title: 'Sinistra', id: 'labirinto muovi l' },
        { header: '➡️', title: 'Destra', id: 'labirinto muovi r' },
        { header: '🏁', title: 'Termina', id: 'labirinto fine' },
    ],
});

// Testo del messaggio con i pulsanti di movimento.
const MOVES_TEXT = '🌀 *LABIRINTO*\nMuoviti o fermati 👇';

// Un passo di gioco. Centralizza qui la logica usata sia dall'handler di testo
// (index.js, quando scrivi u/d/l/r) sia dai pulsanti (comando .labirinto muovi):
// scadenza, uscita, muro, mossa, vincita, render, invio board + pulsanti.
// NB: getUser serve solo per accreditare i soldi in caso di vittoria.
const stepMaze = async ({ sock, from, sender, raw, db, saveDB, getUser, sharp, quoted }) => {
    const g = db[from]?.mazeGame;
    if (!g?.active) return false;

    const clean = String(raw ?? '').trim().toLowerCase();

    // Parte 1 — scadenza
    if (Date.now() - g.timestamp > MAZE_TIMEOUT_MS) {
        delete db[from].mazeGame;
        saveDB();
        if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
        if (g.btnKey) { try { await sock.sendMessage(from, { delete: g.btnKey }); } catch (_) {} }
        await sock.sendMessage(from, { text: '⏰ *Tempo scaduto!*\nRilancia con `.labirinto`.' }).catch(() => {});
        return true;
    }

    // Parte 2 — parole di uscita scritte a mano
    if (MAZE_QUIT_WORDS.includes(clean)) {
        delete db[from].mazeGame;
        saveDB();
        if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
        if (g.btnKey) { try { await sock.sendMessage(from, { delete: g.btnKey }); } catch (_) {} }
        await sock.sendMessage(from, { text: '🏁 *Labirinto terminato!*\nTorna quando vuoi con\n`.labirinto`. 🌀' }).catch(() => {});
        return true;
    }

    // Parte 3 — direzione
    const key = DIR_ALIASES[clean];
    if (!key) return false; // testo non di movimento: ignorato

    const next = movePlayer(g.maze, g.pos.r, g.pos.c, key);
    if (!next) {
        await sock.sendMessage(from, { text: '🧱 *C\u2019è un muro lì!*\nProva *u/d/l/r* o apri il\nmenu *Muovi* qui sotto.' }).catch(() => {});
        return true;
    }

    g.pos = next;
    g.moves++;
    g.timestamp = Date.now();
    const reached = next.r === g.maze.exit.r && next.c === g.maze.exit.c;
    if (reached) g.active = false;

    let boardBuffer;
    try {
        boardBuffer = await renderMaze(sharp, g.maze, g.pos);
    } catch (e) {
        console.error('[labirinto] render:', e.message);
        return true;
    }

    // Parte 4 — vittoria: accredita, chiude e pulisce
    if (reached) {
        const uDB = getUser(sender, from);
        uDB.money = (uDB.money || 0) + 80;
        delete db[from].mazeGame;
        saveDB();
        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `🏁 *USCITO!*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha aggirato\nil labirinto in ${g.moves} mosse!\n💰 +80€\n━━━━━━━━━━━━━━━━━━`,
            mentions: [sender],
        }, { quoted });
        if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
        if (g.btnKey) { try { await sock.sendMessage(from, { delete: g.btnKey }); } catch (_) {} }
        return true;
    }

    // Parte 5 — mossa normale: nuova board + pulsanti aggiornati
    const sent = await sock.sendMessage(from, {
        image: boardBuffer,
        caption: `🌀 *LABIRINTO* · Mossa ${g.moves}\n━━━━━━━━━━━━━━━━━━\n🔴 Tu · 🟢 Uscita\n\n🎮 Usa i pulsanti qui sotto\noppure scrivi *u/d/l/r*`,
        mentions: [sender],
    }, { quoted });

    const btnKey = await sendButtonsWithKey(sock, from, MOVES_TEXT, [moveNavButton()], quoted);
    if (g.btnKey) { try { await sock.sendMessage(from, { delete: g.btnKey }); } catch (_) {} }

    g.lastMsgKey = sent?.key || null;
    g.btnKey = btnKey;
    saveDB();
    return true;
};

module.exports = {
    generateMaze,
    canMove,
    movePlayer,
    solveMaze,
    renderMaze,
    stepMaze,
    DIR_ALIASES,
    moveNavButton,
    MOVES_TEXT,
    MAZE_TIMEOUT_MS,
};