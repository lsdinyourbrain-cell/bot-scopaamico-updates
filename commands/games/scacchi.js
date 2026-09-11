'use strict';

const { dispOf } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const { Chess } = require('chess.js');

// ── CONFIG ─────────────────────────────────────────────────────────────────
const QUIT_WORDS = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia','annulla partita','termina partita','resa','resign','arrendo','mi arrendo'];
const TIMEOUT_MS = 10 * 60 * 1000; // 10 min
const CELL = 68;
const PAD = 22;

// ── RENDER ─────────────────────────────────────────────────────────────────
// FEN → PNG board via sharp+SVG. Gestisce highlight ultima mossa + scacco.
const renderChessBoard = async (sharp, fen, lastMove = null, kingInCheck = null) => {
    const chess = new Chess(fen);
    const board = chess.board(); // [8][8] r0=a8
    const SIZE = PAD * 2 + CELL * 8;
    const LIGHT = '#f0d9b5';
    const DARK = '#b58863';
    const LAST_LIGHT = '#f6f669';
    const LAST_DARK = '#e8d84a';
    const CHECK_COL = '#ff4757';

    // helper square -> coords
    const sqToCoords = (sq) => {
        if (!sq || sq.length !== 2) return null;
        const f = sq.charCodeAt(0) - 97; // a->0
        const r = 8 - parseInt(sq[1], 10); // 1->7, 8->0
        if (f < 0 || f > 7 || r < 0 || r > 7) return null;
        return { f, r };
    };
    const lmFrom = lastMove ? sqToCoords(lastMove.from) : null;
    const lmTo = lastMove ? sqToCoords(lastMove.to) : null;
    const checkPos = kingInCheck ? sqToCoords(kingInCheck) : null;

    let squares = '';
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const isLight = (r + f) % 2 === 0;
            let fill = isLight ? LIGHT : DARK;
            // highlight last move
            if ((lmFrom && lmFrom.r === r && lmFrom.f === f) || (lmTo && lmTo.r === r && lmTo.f === f)) {
                fill = isLight ? LAST_LIGHT : LAST_DARK;
            }
            const x = PAD + f * CELL;
            const y = PAD + r * CELL;
            squares += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}"/>`;
            // check highlight overlay (king square) after, with border
            if (checkPos && checkPos.r === r && checkPos.f === f) {
                squares += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${CHECK_COL}" opacity="0.72"/>`;
                squares += `<rect x="${x+2}" y="${y+2}" width="${CELL-4}" height="${CELL-4}" fill="none" stroke="#ffffff" stroke-width="3" rx="6"/>`;
            }
        }
    }

    // coordinate labels — file a-h (bottom), rank 1-8 (left)
    let labels = '';
    for (let f = 0; f < 8; f++) {
        const file = String.fromCharCode(97 + f);
        const x = PAD + f * CELL + CELL - 5;
        const y = PAD + 8 * CELL - 4;
        const isDarkSquare = (7 + f) % 2 === 1;
        const col = isDarkSquare ? LIGHT : DARK;
        // contrast reversal for readability
        labels += `<text x="${x}" y="${y}" font-family="Verdana, Arial, sans-serif" font-size="13" font-weight="bold" fill="${col}" text-anchor="end" opacity="0.92">${file}</text>`;
    }
    for (let r = 0; r < 8; r++) {
        const rank = 8 - r;
        const x = PAD + 4;
        const y = PAD + r * CELL + 15;
        const isDarkSquare = (r % 2 === 0);
        const col = isDarkSquare ? DARK : LIGHT;
        labels += `<text x="${x}" y="${y}" font-family="Verdana, Arial, sans-serif" font-size="13" font-weight="bold" fill="${col}" opacity="0.92">${rank}</text>`;
    }

    // unicode pieces
    const uniMap = {
        p: { w: '♙', b: '♟' },
        n: { w: '♘', b: '♞' },
        b: { w: '♗', b: '♝' },
        r: { w: '♖', b: '♜' },
        q: { w: '♕', b: '♛' },
        k: { w: '♔', b: '♚' }
    };
    let pieces = '';
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const p = board[r][f];
            if (!p) continue;
            const uni = (uniMap[p.type] && uniMap[p.type][p.color]) ? uniMap[p.type][p.color] : '';
            const x = PAD + f * CELL + CELL / 2;
            const y = PAD + r * CELL + CELL / 2 + 17;
            const isWhite = p.color === 'w';
            // shadow for definition — usa font universale per Termux
            pieces += `<text x="${x+1}" y="${y+1}" font-family="DejaVu Sans, Noto Sans, Arial, sans-serif" font-size="46" fill="#000000" opacity="0.30" text-anchor="middle" font-weight="900">${uni}</text>`;
            pieces += `<text x="${x}" y="${y}" font-family="DejaVu Sans, Noto Sans, Arial, sans-serif" font-size="46" fill="${isWhite ? '#ffffff' : '#0a0a0a'}" stroke="${isWhite ? '#1a1a1a' : '#ffffff'}" stroke-width="0.7" text-anchor="middle" font-weight="900">${uni}</text>`;
        }
    }

    const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0f0c29"/>
                <stop offset="55%" stop-color="#302b63"/>
                <stop offset="100%" stop-color="#24243e"/>
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.35"/>
            </filter>
        </defs>
        <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" rx="16"/>
        <rect x="${PAD-6}" y="${PAD-6}" width="${CELL*8+12}" height="${CELL*8+12}" fill="none" stroke="#ffd166" stroke-width="2.5" rx="10" opacity="0.95"/>
        ${squares}
        ${labels}
        ${pieces}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

// trova re sotto scacco (se presente)
const findKingInCheck = (chess) => {
    if (!chess.isCheck()) return null;
    const turn = chess.turn(); // chi deve muovere è sotto scacco
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const p = board[r][f];
            if (p && p.type === 'k' && p.color === turn) {
                const file = String.fromCharCode(97 + f);
                const rank = 8 - r;
                return `${file}${rank}`;
            }
        }
    }
    return null;
};

// prova mossa in tutti i formati accettati
const tryChessMove = (chess, moveStrRaw) => {
    const raw = String(moveStrRaw || '').trim();
    if (!raw) return null;
    let s = raw.toLowerCase().replace(/\s+/g, '').replace(/–/g, '-').replace(/—/g, '-').replace(/×/g, 'x');

    // castling textual
    if (['o-o','0-0','o-o-o','0-0-0','arrocco','arroccocorto','arroccolungo'].includes(s)) {
        const san = s.includes('o-o-o') || s.includes('0-0-0') || s.includes('lungo') ? 'O-O-O' : 'O-O';
        try { const r = chess.move(san); if (r) return r; } catch (_) {}
        // fallback per e1g1/e1c1 etc in base al turno
        const turn = chess.turn();
        const targets = san === 'O-O' ? (turn === 'w' ? [{from:'e1',to:'g1'}] : [{from:'e8',to:'g8'}]) : (turn === 'w' ? [{from:'e1',to:'c1'}] : [{from:'e8',to:'c8'}]);
        for (const t of targets) { try { const r = chess.move(t); if (r) return r; } catch (_) {} }
        return null;
    }

    // LAN: e2e4, e7e8q, e7e8=q, e2-e4, g1f3
    const lanClean = s.replace('=','').replace('-','').replace('x','');
    const m = lanClean.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
    if (m) {
        const from = m[1];
        const to = m[2];
        let promo = m[3] || null;
        if (!promo) {
            const piece = chess.get(from);
            if (piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1')) promo = 'q';
        }
        try {
            const r = chess.move({ from, to, promotion: promo || undefined });
            if (r) return r;
        } catch (_) {}
        // retry with queen if promo was missing but still failed
        if (!m[3]) {
            const piece = chess.get(from);
            if (piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1')) {
                try { const r2 = chess.move({ from, to, promotion: 'q' }); if (r2) return r2; } catch (_) {}
            }
        }
    }

    // SAN diretto (Nf3, exd5, e4, O-O etc) — prova più varianti
    const candidates = [raw.trim(), s, s.toUpperCase(), raw.toUpperCase()];
    for (const cand of candidates) {
        try { const r = chess.move(cand); if (r) return r; } catch (_) {}
    }
    // prova con san senza spazi ma originale
    try { const r = chess.move(raw); if (r) return r; } catch (_) {}
    return null;
};

const isQuitArg = (text) => {
    const t = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!t) return false;
    if (QUIT_WORDS.includes(t)) return true;
    return QUIT_WORDS.some(w => t === w || t.startsWith(w + ' ') || t.startsWith(w));
};

const helpCaption = () => {
    return `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('♟️ Sfida un amico a scacchi ✨')}\n${line('')}\n${line('📌 *.scacchi @utente* — sfida')}\n${line('♞ *.scacchi e2e4* — muovi')}\n${line('   • formato: e2e4, g1f3, e7e8q')}\n${line('   • castling: e1g1 / e1c1 / O-O')}\n${line('   • promuovi: e7e8q (q/r/b/n)')}\n${line('🏳️ *.scacchi stop* — arrenditi')}\n${line('👁️ *.scacchi* — mostra board')}\n${boxEnd()}`;
};

module.exports = {
    name: 'scacchi',
    aliases: ['chess','scacco','scacchiere'],
    description: 'Scacchi 1vs1 con board live, scacco, matto e patta. Usa .scacchi @utente per sfidare e .scacchi e2e4 per muovere.',
    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, saveDB, sameJid, getCachedGroupMeta, sharp } = services;

        if (!isGroup) {
            const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('♟️ Gli scacchi si giocano solo nei gruppi ✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const senderAlt = context.senderAlt || null;
        const qLower = String(textArgs || '').trim().toLowerCase();

        // ── QUIT / RESA ──────────────────────────────────────────────────
        if (isQuitArg(textArgs)) {
            const g = db[from]?.chessGame;
            if (!g?.active) {
                const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('Nessuna partita attiva ✨')}\n${line('Usa *.scacchi @utente* per sfidare')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            const isParticipant = g.players.some(p => sameJid(p, sender) || (senderAlt && sameJid(p, senderAlt)));
            if (!isParticipant) {
                const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line(`Solo i giocatori possono arrendersi ✨`)}\n${line(`Bianco: @${dispOf(g.white)}  Nero: @${dispOf(g.black)}`)}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: g.players }, { quoted: msg });
            }
            const quitter = senderAlt && g.players.some(p => sameJid(p, senderAlt)) ? senderAlt : sender;
            const winner = sameJid(g.white, quitter) || (senderAlt && sameJid(g.white, senderAlt)) ? g.black : g.white;
            if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
            delete db[from].chessGame;
            saveDB();
            const t = `${sec('🏳️ RESA')}\n${boxOpen()}\n${line(`@${dispOf(quitter)} si è arreso ✨`)}\n${line(`🏆 Vince @${dispOf(winner)} per abbandono!` )}\n${line(`Usa *.scacchi @utente* per rivincita`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [quitter, winner] }, { quoted: msg });
        }

        const curGame = db[from]?.chessGame;

        // ── NESSUNA PARTITA ATTIVA → CREA SFIDA ─────────────────────────
        if (!curGame?.active) {
            // se text sembra una mossa ma non c'è partita, mostra help
            if (textArgs && /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(String(textArgs).trim().replace(/[\s\-=]/g,''))) {
                const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('Nessuna partita attiva ✨')}\n${line('Prima sfida: *.scacchi @utente*')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            // help se nessun arg
            if (!String(textArgs || '').trim()) {
                return sock.sendMessage(from, { text: helpCaption() }, { quoted: msg });
            }

            let opponent = targetJid;
            if (!opponent && isReply) opponent = contextInfo?.participant || null;
            // second try: extract from mentioned array via textArgs @num ??
            if (!opponent && mentioned && mentioned.length) opponent = mentioned[0];

            if (!opponent) {
                const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('Tagga l\'avversario ✨')}\n${line('📌 Esempio: *.scacchi @marco*')}\n${line('Poi muovi con *.scacchi e2e4*')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (sameJid(opponent, sender) || (senderAlt && sameJid(opponent, senderAlt))) {
                const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line('✨ Non sfidare te stesso, leggenda!')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            // resolve LID → PN per menzioni corrette
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const resolve = (jid) => {
                if (!meta?.participants) return jid;
                const pn = meta.participants.find(p => sameJid(p.id || p.jid, jid) || sameJid(p.phoneNumber, jid))?.phoneNumber;
                return pn || jid;
            };
            const senderPn = resolve(sender);
            const opponentPn = resolve(opponent);

            const fen = new Chess().fen();
            const chessTmp = new Chess(fen);
            const boardCheck = findKingInCheck(chessTmp);

            let boardBuffer;
            try {
                boardBuffer = await renderChessBoard(sharp, fen, null, boardCheck);
            } catch (e) {
                console.error('[scacchi] render iniziale:', e.message);
                const t = `${sec('❌ ERRORE SCACCHI')}\n${boxOpen()}\n${line('Errore generazione board ✨')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            db[from] = db[from] || {};
            db[from].chessGame = {
                active: true,
                fen,
                white: senderPn,
                black: opponentPn,
                players: [senderPn, opponentPn],
                turn: 'w',
                lastMove: null,
                history: [],
                timestamp: Date.now(),
                lastMsgKey: null
            };
            saveDB();

            const cap = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line(`⚪ Bianco: @${dispOf(senderPn)} ✨`)}\n${line(`⚫ Nero: @${dispOf(opponentPn)} ✨`)}\n${line(`Tocca a ⚪ @${dispOf(senderPn)} — muovi!`)}\n${line(`📌 *.scacchi e2e4*  (e2→e4)`)}\n${line(`🏰 Arrocco: e1g1 / e1c1 / O-O`)}\n${line(`⬆️ Promozione: e7e8q (q/r/b/n)`)}\n${boxEnd()}`;

            const sent = await sock.sendMessage(from, { image: boardBuffer, caption: cap, mentions: [senderPn, opponentPn] }, { quoted: msg });
            db[from].chessGame.lastMsgKey = sent?.key || null;
            saveDB();
            return;
        }

        // ── PARTITA ATTIVA ───────────────────────────────────────────────
        const g = curGame;

        // timeout check
        if (Date.now() - (g.timestamp || 0) > TIMEOUT_MS) {
            if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
            delete db[from].chessGame;
            saveDB();
            const t = `${sec('⏰ SCACCHI')}\n${boxOpen()}\n${line('Partita scaduta per inattività (10 min) ✨')}\n${line('Usa *.scacchi @utente* per rigiocare')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: g.players }, { quoted: msg });
        }

        // nessun arg → mostra board corrente
        if (!String(textArgs || '').trim()) {
            let boardBuffer;
            try {
                const cTmp = new Chess(g.fen);
                const ck = findKingInCheck(cTmp);
                boardBuffer = await renderChessBoard(sharp, g.fen, g.lastMove, ck);
            } catch (e) {
                console.error('[scacchi] render show:', e.message);
                const t = `${sec('❌ ERRORE')}\n${boxOpen()}\n${line('Errore board')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            const curTurn = g.turn === 'w' ? g.white : g.black;
            const turnEmoji = g.turn === 'w' ? '⚪' : '⚫';
            const isCheck = (() => { try { return new Chess(g.fen).isCheck(); } catch { return false; } })();
            const cap = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line(`⚪ @${dispOf(g.white)} vs ⚫ @${dispOf(g.black)} ✨`)}\n${line(`${turnEmoji} Tocca a @${dispOf(curTurn)}${isCheck ? '  ♚ SCACCO!' : ''}`)}\n${line(`Mosse: ${g.history.length} • FEN: \`${g.fen.split(' ')[0].slice(0,28)}\`…`)}\n${line(`📌 *.scacchi e2e4* per muovere`)}\n${boxEnd()}`;
            const sent = await sock.sendMessage(from, { image: boardBuffer, caption: cap, mentions: g.players }, { quoted: msg });
            if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
            g.lastMsgKey = sent?.key || null;
            g.timestamp = Date.now();
            saveDB();
            return;
        }

        // se text contiene @ ma è già in partita, ignora sfida
        if (String(textArgs).includes('@') && targetJid) {
            const t = `${sec('♔ SCACCHI ATTIVO')}\n${boxOpen()}\n${line('C\'è già una partita in corso ✨')}\n${line(`Tocca a @${dispOf(g.turn==='w'?g.white:g.black)}`)}\n${line('Fai la tua mossa: *.scacchi e2e4*')}\n${line('Oppure *.scacchi stop* per arrenderti')}\n${boxEnd()}`;
            const curTurn = g.turn === 'w' ? g.white : g.black;
            return sock.sendMessage(from, { text: t, mentions: [curTurn] }, { quoted: msg });
        }

        // ── TENTATIVO MOSSA ──────────────────────────────────────────────
        const turnJid = g.turn === 'w' ? g.white : g.black;
        const isTurn = sameJid(sender, turnJid) || (senderAlt && sameJid(senderAlt, turnJid));
        if (!isTurn) {
            const t = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line(`⛔ Non è il tuo turno ✨`)}\n${line(`Tocca a ${g.turn==='w'?'⚪':'⚫'} @${dispOf(turnJid)}`)}\n${line(`Attendi la sua mossa...`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t, mentions: [turnJid] }, { quoted: msg });
        }

        let chess;
        try { chess = new Chess(g.fen); } catch (e) {
            console.error('[scacchi] fen load:', e.message);
            delete db[from].chessGame;
            saveDB();
            const t = `${sec('❌ SCACCHI')}\n${boxOpen()}\n${line('Partita corrotta, resettata ✨')}\n${line('Usa *.scacchi @utente*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const rawMove = String(textArgs).trim().split(/\s+/)[0] + (String(textArgs).trim().split(/\s+/)[1] && /^[a-h][1-8]$/i.test(String(textArgs).trim().split(/\s+/)[1]) ? String(textArgs).trim().split(/\s+/)[1] : '');
        // Normalize: if user wrote "e2 e4" textArgs="e2 e4" -> raw = e2e4 ; if "e2e4" -> e2e4
        let moveInput = String(textArgs).trim();
        // if contains two squares separated, join them
        const parts = moveInput.trim().split(/\s+/);
        if (parts.length >= 2 && /^[a-h][1-8]$/i.test(parts[0]) && /^[a-h][1-8][qrbn]?$/i.test(parts[1])) {
            moveInput = parts[0] + parts[1] + (parts[2] || '');
        } else {
            moveInput = parts[0];
            // keep promotion suffix if present as second token like "e7 e8q"
            if (parts[1] && /^[qrbn]$/i.test(parts[1]) && moveInput.length===4) moveInput += parts[1];
        }

        let move;
        try { move = tryChessMove(chess, moveInput); } catch (e) { move = null; }

        if (!move) {
            const legal = chess.moves().slice(0, 12).join(', ');
            const t = `${sec('♔ MOSSA NON VALIDA')}\n${boxOpen()}\n${line(`❌ "${String(textArgs).slice(0,20)}" non è legale ✨`)}\n${line(`📌 Formato: e2e4, g1f3, e7e8q, O-O`)}\n${line(`Esempio: *.scacchi e2e4*`)}\n${line(`Mosse legali: ${legal}…`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // aggiorna stato
        const newFen = chess.fen();
        const isCheck = chess.isCheck();
        const isMate = chess.isCheckmate();
        const isDraw = chess.isDraw();
        const isStale = chess.isStalemate();
        const isInsuff = chess.isInsufficientMaterial();
        const isOver = chess.isGameOver();

        const lastMoveObj = { from: move.from, to: move.to };
        g.fen = newFen;
        g.lastMove = lastMoveObj;
        g.history.push(move.san);
        g.timestamp = Date.now();
        g.turn = chess.turn();

        // check highlight
        const kingSq = isCheck || isMate ? findKingInCheck(chess) : null;

        let boardBuffer;
        try {
            boardBuffer = await renderChessBoard(sharp, newFen, lastMoveObj, kingSq);
        } catch (e) {
            console.error('[scacchi] render mossa:', e.message);
            const t = `${sec('❌ ERRORE')}\n${boxOpen()}\n${line('Errore rendering board')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── FINE PARTITA? ────────────────────────────────────────────────
        if (isMate) {
            const winner = turnJid; // chi ha appena mosso
            const loser = winner === g.white ? g.black : g.white;
            if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
            delete db[from].chessGame;
            saveDB();
            const cap = `${sec('♔ SCACCO MATTO')}\n${boxOpen()}\n${line(`🏆 @${dispOf(winner)} vince! ✨`)}\n${line(`💀 @${dispOf(loser)} è stato mattato`)}\n${line(`♟️ Ultima: *${move.san}* (${move.from}→${move.to})`)}\n${line(`Mosse totali: ${g.history.length}`)}\n${line(`Rivincita: *.scacchi @utente*`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { image: boardBuffer, caption: cap, mentions: [winner, loser] }, { quoted: msg });
        }
        if (isDraw || isStale || isInsuff || isOver) {
            let reason = 'Patta';
            if (isStale) reason = 'Stallo';
            else if (isInsuff) reason = 'Materiale insufficiente';
            else if (chess.isThreefoldRepetition()) reason = 'Ripetizione 3x';
            else if (chess.isDrawByFiftyMoves()) reason = 'Regola 50 mosse';
            else if (isDraw) reason = 'Patta';
            if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
            delete db[from].chessGame;
            saveDB();
            const cap = `${sec('🤝 PATTA')}\n${boxOpen()}\n${line(`🤝 Pareggio! ${reason} ✨`)}\n${line(`♟️ Ultima: *${move.san}*`)}\n${line(`Mosse: ${g.history.length} — gg a entrambi!`)}\n${line(`Rivincita: *.scacchi @utente*`)}\n${boxEnd()}`;
            return sock.sendMessage(from, { image: boardBuffer, caption: cap, mentions: g.players }, { quoted: msg });
        }

        // ── CONTINUA ─────────────────────────────────────────────────────
        const nextTurn = chess.turn() === 'w' ? g.white : g.black;
        const nextEmoji = chess.turn() === 'w' ? '⚪' : '⚫';
        const checkLine = isCheck ? `♚ SCACCO a @${dispOf(nextTurn)}!` : '';
        const histPreview = g.history.slice(-4).join(' ');

        const cap = `${sec('♔ SCACCHI')}\n${boxOpen()}\n${line(`⚪ @${dispOf(g.white)} vs ⚫ @${dispOf(g.black)} ✨`)}\n${line(`♟️ *${move.san}* (${move.from}→${move.to})${move.promotion?`=${move.promotion.toUpperCase()}`:''} — ${histPreview}`)}\n${isCheck ? line(`⚠️ ${checkLine}`) : line(`Mossa ${g.history.length} • ${nextEmoji} tocca a @${dispOf(nextTurn)}`)}\n${line(`📌 *.scacchi e2e4* per muovere`)}` + `\n${boxEnd()}`;

        const sent = await sock.sendMessage(from, { image: boardBuffer, caption: cap, mentions: g.players }, { quoted: msg });
        if (g.lastMsgKey) { try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {} }
        g.lastMsgKey = sent?.key || null;
        g.fen = newFen;
        saveDB();
    }
};
