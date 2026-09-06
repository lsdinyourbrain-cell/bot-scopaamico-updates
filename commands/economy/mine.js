'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  MINE — Vex Bot
//  Versione strategica di .scava: campo 3x3 con 2 bombe nascoste. Paghi un
//  biglietto (20€), scavi le celle con i pulsanti: ogni cella sicura aggiunge
//  al montepremi, ogni bomba azzera tutto. Puoi incassare quando vuoi.
//  Lo stato vive in db[from].mineGame (una partita alla volta per gruppo).
//  Pulsanti "Scava <riga><colonna>" (es. 12 = riga 1 colonna 2).
// 
const TICKET = 20;      // costo biglietto
const CELL_REWARD = 15; // premio per cella sicura (EV casa ~ -6%: il bot incassa nel lungo periodo)
const BOMBS = 2;        // bombe nel campo
const ROWS = 3;
const COLS = 3;

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const allCells = () => {
    const out = [];
    for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) out.push(`${r}${c}`);
    }
    return out;
};

const buildBoard = (bombs = BOMBS) => {
    const cells = allCells();
    const bombSet = new Set(shuffle(cells).slice(0, bombs));
    return { bombs: bombSet, dug: new Set() };
};

// Celle rimaste non scavate e non bomba (in ordine).
const remainingSafeCells = (g) => allCells().filter(cell => !g.dug.has(cell) && !g.bombs.has(cell));

const renderBoard = (g, revealBombs = false) => {
    const lines = [];
    for (let r = 1; r <= ROWS; r++) {
        let row = '';
        for (let c = 1; c <= COLS; c++) {
            const key = `${r}${c}`;
            if (g.dug.has(key)) row += '✅';
            else if (revealBombs && g.bombs.has(key)) row += '💥';
            else row += '⬛';
        }
        lines.push(`${r} ${row}`);
    }
    return `  1 2 3\n${lines.join('\n')}`;
};

module.exports = {
    name: 'mine',
    aliases: ['bombe', 'campominato', 'campo_minato'],
    description: "Campo minato strategico: paga 20€, scava le celle con i pulsanti evitando le bombe. Più rischi, più vinci. Uso: .mine",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, reply, services } = context;
        const { db, saveDB, getUser, getCachedGroupMeta } = services;
        const { dispOf, resolveJid } = require('../../lib/jid');

        if (!isGroup) return reply('Si gioca solo nei gruppi!');

        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

        const q = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = q.split(/\s+/);
        const g = db[from]?.mineGame;

        // ── INCASSA / FINE 
        if (w1 === 'incassa' || w1 === 'stop' || w1 === 'fine') {
            if (!g || !g.active) return reply('Nessuna partita attiva. Usa `.mine` per iniziare!');
            if (g.sender !== sender) return reply('Non è la tua partita!');

            const winnings = g.pot;
            const u = getUser(sender, from);
            u.money = (u.money || 0) + winnings;
            db[from].mineGame = null;
            saveDB();
            return sock.sendMessage(from, { text: `✅ *MONTE CASSATO!*\n\n🎌 Hai incassato *${winnings}€*!\n\n💰 Nuovo saldo: *${u.money}€*\n\nScrivi \`.mine\` per una nuova partita.` }, { quoted: msg });
        }

        // ── SCAVO (da pulsante, es. "mine scava 12") 
        const cellMatch = q.match(/(?:scava|dig|cella)\s*(\d)(\d)$/);
        if (w1 === 'scava' || w1 === 'dig' || w1 === 'cella' || cellMatch) {
            if (!g || !g.active) return reply('Nessuna partita attiva. Usa `.mine` per iniziare!');
            if (g.sender !== sender) return reply('Non è la tua partita!');

            const rc = cellMatch ? cellMatch.slice(1) : q.split(/\s+/).pop().split('');
            const r = parseInt(rc[0], 10);
            const c = parseInt(rc[1], 10);
            if (!r || !c || r < 1 || r > ROWS || c < 1 || c > COLS) return reply('❌ Cella non valida (es. "12" = riga 1, col 2).');
            const key = `${r}${c}`;
            if (g.dug.has(key)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('⛔ Cella già scavata!')}
${boxEnd()}`);

            g.dug.add(key);
            if (g.bombs.has(key)) {
                db[from].mineGame = null;
                saveDB();
                return sock.sendMessage(from, { text: `💥 *BOOM!* Hai trovato una bomba!\n\n${renderBoard(g, true)}\n\nMontepremi azzerato. 💸\nLa bomba era in ${key}...\n\nScrivi \`.mine\` per riprovare.` }, { quoted: msg });
            }

            g.pot += CELL_REWARD;
            saveDB();

            const safeLeft = remainingSafeCells(g);
            return sock.sendMessage(from, { text: `✅ *CELLA SICURA!* +${CELL_REWARD}€\n\n${renderBoard(g)}\n\n🎌 Montepremi: *${g.pot}€*\n🕳️ Celle sicure rimaste: ${safeLeft.length}\n\nUsa \`.mine scava <cella>\` es. \`.mine scava ${safeLeft[0] || '11'}\` o \`.mine incassa\` per incassare.` }, { quoted: msg });
        }

        // ── PARTITA GIÀ ATTIVA
        if (g?.active) {
            return sock.sendMessage(from, { text: `⛏️ C'è già una partita attiva\ndi *${disp(g.sender)}*!\n\n${renderBoard(g)}\n\n🎌 Montepremi: *${g.pot}€*\n\nUsa \`.mine scava <cella>\` es. \`.mine scava ${remainingSafeCells(g)[0] || '11'}\` o \`.mine incassa\`` }, { quoted: msg });
        }

        // ── AVVIO NUOVA PARTITA 
        const u = getUser(sender, from);
        if (u.money < TICKET) {
            return reply(`❌ Servono *${TICKET}€* (biglietto). Hai ${u.money}€.\nUsa \`.daily\` o \`.work\`!`);
        }
        u.money -= TICKET;
        db[from].mineGame = {
            ...buildBoard(BOMBS),
            active: true,
            sender,
            pot: 0,
            timestamp: Date.now(),
        };
        saveDB();

        const first = remainingSafeCells(db[from].mineGame).slice(0, 3);
        return sock.sendMessage(from, { text: `💣 *CAMPO MINATO*\n\n${renderBoard(db[from].mineGame)}\n\n${BOMBS} bombe nascoste 💥 in 9 celle.\nScava le celle sicure per\naccumulare il montepremi\n(+${CELL_REWARD}€ a cella), ma se\ntrovi una bomba perdi tutto!\n\n🎟️ Biglietto: ${TICKET}€ (pagato)\n🎌 Montepremi: 0€\n\nUsa \`.mine scava <cella>\` es. \`.mine scava ${first[0] || '11'}\` • \`.mine incassa\` per incassare` }, { quoted: msg });
    },
};