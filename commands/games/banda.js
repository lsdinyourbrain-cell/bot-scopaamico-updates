'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  BANDA (MAFIA) — Vex Bot
//  Gioco party a ruoli: notte/giorno. Di notte la banda elimina, il detective
//  indaga e il medico salva (in chat PRIVATA). Di giorno il gruppo vota chi
//  eliminare (in gruppo). Vince la banda o il villaggio.
//  Lo stato vive in db[from].bandaGame; la mappa giocatore→gruppo in
//  db._bandaMap per rispondere dalle chat private.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';
const NIGHT_TIME_MS = 45000;   // finestra azioni notturne
const DAY_TIME_MS = 60000;     // finestra votazioni

// Ruoli
const ROLES = {
    banda:   { emoji: '🔫', name: 'Membro della Banda' },
    detective: { emoji: '🕵️', name: 'Detective' },
    medico:  { emoji: '🩺', name: 'Medico' },
    civile:  { emoji: '🙂', name: 'Civile' },
};

// Per i tag visibili preferisce il nome salvato (i jid @lid non vengono
// mostrati come menzioni e resterebbero numeri senza senso).
const fmtJid = (jid) => String(jid).split('@')[0];

module.exports = {
    name: 'banda',
    aliases: ['mafia', 'mafiosi'],
    description: "Gioco party a ruoli (notte/giorno): la banda elimina di notte, il villaggio vota di giorno. Uso: .banda (unisciti), .banda inizia (min 4)",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, reply, services } = context;
        const { db, saveDB, sendButtons } = services;

        // Siamo in una chat privata (DM di un'azione notturna/voto)?
        const isDm = !isGroup;
        const groupJid = isGroup ? from : (db?._bandaMap?.[sender] || null);

        const q = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = q.split(/\s+/);
        let g = groupJid ? db[groupJid]?.bandaGame : null;

        // ── AZIONE NOTTURNA (DM) ─────────────────────────────────────────
        if (isDm && (w1 === 'kill' || w1 === 'check' || w1 === 'cura')) {
            if (!g || !g.active || g.phase !== 'night') return reply('Non c\'è una notte di gioco attiva.');
            const player = g.players.find(p => p.jid === sender);
            if (!player) return reply('Non sei in questa partita.');
            const targetJid = (w2 || '').replace(/\+/g, '@');
            const target = g.players.find(p => p.jid === targetJid || p.jid === (targetJid.replace(/\+/g, '@')));
            if (!target || target.jid === sender) return reply('Bersaglio non valido.');

            if (w1 === 'kill' && player.role === 'banda') {
                g.night.kill = target.jid;
                saveDB();
                return reply(`🔫 La banda colpirà *${target.name}*. La notte procede.`);
            }
            if (w1 === 'check' && player.role === 'detective') {
                g.night.check = target.jid;
                saveDB();
                return reply(`🕵️ Indagini su *${target.name}* avviate.`);
            }
            if (w1 === 'cura' && player.role === 'medico') {
                g.night.cura = target.jid;
                saveDB();
                return reply(`🩺 Salverai *${target.name}* stanotte.`);
            }
            return reply('Non hai il ruolo per questa azione!');
        }

        // ── VOTO DI GIORNO (DM) ──────────────────────────────────────────
        if (isDm && w1 === 'vota') {
            if (!g || !g.active || g.phase !== 'day') return reply('Non c\'è una votazione attiva.');
            const targetJid = (w2 || '').replace(/\+/g, '@');
            const target = g.players.find(p => p.jid === targetJid);
            if (!target || target.dead) return reply('Bersaglio non valido.');
            const player = g.players.find(p => p.jid === sender);
            if (!player || player.dead) return reply('Non puoi votare.');
            g.dayVotes[sender] = target.jid;
            saveDB();
            return reply(`🗳️ Voto registrato: *${target.name}*`);
        }

        // ── STATO (DM) ───────────────────────────────────────────────────
        if (isDm && w1 === 'stato') {
            if (!g || !g.active) return reply('Nessuna partita attiva per te.');
            const p = g.players.find(x => x.jid === sender);
            if (!p) return reply('Non sei in una partita.');
            return reply(`🔫 *BANDA* · ${p.role === 'civile' ? '🙂 dormi pure' : `stai facendo il tuo dovere (${ROLES[p.role].name})`}. Fase: ${g.phase === 'night' ? '🌙 notte' : '☀️ giorno'}.`);
        }

        // ── IN GRUPPO ────────────────────────────────────────────────────
        if (isGroup) {
            // UNISCITI alla lobby
            if (w1 === 'unisciti' || w1 === 'join' || !w1 || q === 'banda') {
                if (!g || !g.active || g.phase !== 'lobby') {
                    db[from] = db[from] || {};
                    db[from].bandaGame = {
                        active: true,
                        phase: 'lobby',
                        players: [{ jid: sender, name: (pushName || fmtJid(sender)).slice(0, 18), role: null, alive: true }],
                        night: { kill: null, check: null, cura: null },
                        dayVotes: {},
                        ts: Date.now(),
                    };
                    db._bandaMap = db._bandaMap || {};
                    db._bandaMap[sender] = from;
                    saveDB();
                    return sendButtons(sock, from,
`🔫 *BANDA* — gioco a ruoli
${SEP}
La Banda elimina di notte,
il villaggio vota di giorno.
${SEP}
*${pushName || fmtJid(sender)}* ha creato la lobby!
Ruoli: 🔫 Banda · 🕵️ Detective
🩺 Medico · 😀 Civili
${SEP}
Min 4 giocatori per iniziare.`,
                        [
                            { label: '🔫 Unisciti', id: 'banda unisciti' },
                            { label: '▶️ Inizia', id: 'banda inizia' },
                        ], msg);
                }
                if (g.players.some(p => p.jid === sender)) {
                    return sendButtons(sock, from,
`🔫 *LOBBY BANDA*
${SEP}
Giocatori (${g.players.length}):
${g.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}
${SEP}
Sei già dentro! Premi ▶️ quando
siete in almeno 4.`,
                        [
                            { label: '🔫 Unisciti', id: 'banda unisciti' },
                            { label: '▶️ Inizia', id: 'banda inizia' },
                        ], msg);
                }
                if (g.players.length >= 8) return reply('Partita al completo (max 8).');
                g.players.push({ jid: sender, name: (pushName || fmtJid(sender)).slice(0, 18), role: null, alive: true });
                db._bandaMap = db._bandaMap || {};
                db._bandaMap[sender] = from;
                saveDB();
                return sendButtons(sock, from,
`🔫 *${pushName || fmtJid(sender)}* si è unito!
${SEP}
Giocatori (${g.players.length}):
${g.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}
${SEP}
Premi ▶️ per iniziare (min 4).`,
                    [
                        { label: '🔫 Unisciti', id: 'banda unisciti' },
                        { label: '▶️ Inizia', id: 'banda inizia' },
                    ], msg);
            }

            // INIZIA
            if (w1 === 'inizia' || w1 === 'start') {
                if (!g || !g.active || g.phase !== 'lobby') return reply('Non c\'è una lobby. Usa `.banda`!');
                if (g.players.length < 4) return reply(`⚠️ Servono almeno 4 giocatori (ora: ${g.players.length}).`);
                startGame(sock, from, services);
                return true;
            }

            // STATO
            if (w1 === 'stato' || w1 === 'status') {
                if (!g) return reply('Nessuna partita attiva.');
                const alive = g.players.filter(p => p.alive);
                return sendButtons(sock, from,
`🔫 *STATO BANDA*
${SEP}
Fase: ${g.phase === 'lobby' ? 'lobby' : g.phase === 'night' ? '🌙 notte' : '☀️ giorno'}
Vivi: ${alive.map(p => p.name).join(', ')}
${SEP}`,
                    [
                        { label: '🔫 Unisciti', id: 'banda unisciti' },
                        { label: '🏠 Menu', id: 'menu' },
                    ], msg);
            }
        }

        return reply('ℹ️ Usa `.banda` nel gruppo per iniziare!');
    },
};

// ── LOGICA GIOCO ─────────────────────────────────────────────────────────────

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

function startGame(sock, from, services) {
    const { db, saveDB, sendButtons } = services;
    const g = db[from].bandaGame;
    const players = g.players;

    // Assegna ruoli in base al numero di giocatori.
    const n = players.length;
    const roles = [
        'banda',
        'detective',
        'medico',
        ...(n >= 7 ? ['banda'] : []),
        ...Array(Math.max(0, n - 3 - (n >= 7 ? 1 : 0))).fill('civile'),
    ];
    const shuffled = shuffle(roles);
    players.forEach((p, i) => { p.role = shuffled[i]; p.alive = true; });

    g.phase = 'night';
    g.day = 0;
    g.night = { kill: null, check: null, cura: null };
    g.dayVotes = {};
    saveDB();

    // Invia il ruolo in privato a ogni giocatore + le azioni della notte.
    for (const p of players) {
        const roleInfo = ROLES[p.role];
        const others = players.filter(x => x.jid !== p.jid && x.alive);
        const sheet = {
            type: 'single_select',
            label: 'Scegli',
            title: `Scegli il bersaglio (${roleInfo.name})`,
            sectionTitle: 'Giocatori vivi',
            rows: others.map(o => ({ header: roleInfo.emoji, title: o.name, id: `banda ${actionFor(p.role)} ${o.jid.replace('@', '+')}` })),
        };

        let txt;
        if (p.role === 'banda') {
            txt = `🌙 *NOTTE 1 — BANDA*\n${SEP}\nSei *${roleInfo.emoji} ${roleInfo.name}*.\nScegli chi eliminare stanotte:\n(azioni via pulsante)`;
        } else if (p.role === 'detective') {
            txt = `🌙 *NOTTE 1 — DETECTIVE*\n${SEP}\nSei *${roleInfo.emoji} Detective*.\nScegli chi indagare:\n(azioni via pulsante)`;
        } else if (p.role === 'medico') {
            txt = `🌙 *NOTTE 1 — MEDICO*\n${SEP}\nSei *${roleInfo.emoji} Medico*.\nScegli chi salvare:\n(azioni via pulsante)`;
        } else {
            txt = `🌙 *NOTTE 1 — CIVILE*\n${SEP}\nSei *${roleInfo.emoji} Civile*.\nDormi, domani vota.\n`;
        }
        sendButtons(sock, p.jid, txt, p.role === 'civile' ? [{ label: '😴 Dormo', id: 'banda stato' }] : [sheet], msg).catch(() => {});
    }

    sock.sendMessage(from, {
        text: `🌙 *LA NOTTE È CALATA* (n°1)\n${SEP}\nI ruoli sono stati inviati in\nprivato. La banda decide, il\ndetective indaga, il medico cura.\n${SEP}⏳ Azioni: 45 secondi...`,
    }).catch(() => {});

    // Risoluzione notte dopo il timer.
    setTimeout(() => resolveNight(sock, from, services), NIGHT_TIME_MS);
}

function actionFor(role) {
    if (role === 'banda') return 'kill';
    if (role === 'detective') return 'check';
    if (role === 'medico') return 'cura';
    return 'stato';
}

function resolveNight(sock, from, services) {
    const { db, saveDB, sendButtons } = services;
    const g = db[from]?.bandaGame;
    if (!g || g.phase !== 'night') return;

    const kill = g.night?.kill;
    const cura = g.night?.cura;
    const check = g.night?.check;

    // Il medico salva il bersaglio della banda → nessun morto.
    let dead = null;
    if (kill && kill !== cura) {
        dead = g.players.find(p => p.jid === kill);
        if (dead) dead.alive = false;
    }

    // Il detective scopre se il bersaglio è della banda.
    const detective = g.players.find(p => p.role === 'detective' && p.alive);
    if (detective && check) {
        const target = g.players.find(p => p.jid === check);
        const isBand = target?.role === 'banda';
        sock.sendMessage(detective.jid, {
            text: `🕵️ *Esito indagini:*\n${target?.name || 'N/D'} è ${isBand ? '🔫 *della Banda*!' : '🙂 *innocente*. (o è il Medico/Detective)'}`,
        }).catch(() => {});
    }

    g.day += 1;
    if (dead) {
        sock.sendMessage(from, {
            text: `☀️ *ALBA* (giorno ${g.day})\n${SEP}\n📢 Stanotte è morto:\n*${dead.name}* ${dead.role === 'banda' ? '🔫 era della Banda!' : `(${ROLES[dead.role].name})`}\n${SEP}Ora votate chi eliminare: invia la tua scelta in PRIVATO al bot, oppure usa \`.banda stato\`.`,
        }).catch(() => {});
    } else {
        sock.sendMessage(from, {
            text: `☀️ *ALBA* (giorno ${g.day})\n${SEP}\n📢 Nessun morto stanotte\n(il medico ha salvato!)\n${SEP}Ora votate chi eliminare.`,
        }).catch(() => {});
    }

    // Controllo vittoria banda immediata.
    const alive = g.players.filter(p => p.alive);
    const bandaAlive = alive.filter(p => p.role === 'banda').length;
    if (bandaAlive === 0) {
        g.active = false;
        saveDB();
        return sock.sendMessage(from, { text: `🏆 *HA VINTO IL VILLAGGIO!* La Banda è stata smantellata.` }).catch(() => {});
    }
    if (bandaAlive >= Math.ceil(alive.length / 2)) {
        g.active = false;
        saveDB();
        return sock.sendMessage(from, { text: `🔫 *HA VINTO LA BANDA!* Il villaggio è terrorizzato.` }).catch(() => {});
    }

    g.phase = 'day';
    g.dayVotes = {};
    saveDB();

    // Votazione: ogni vivo vota in privato (single_select) oppure scrive.
    for (const p of alive) {
        const targets = alive.filter(x => x.jid !== p.jid);
        sendButtons(sock, p.jid,
            `🗳️ *VOTO* (giorno ${g.day})\n${SEP}Chi vuoi eliminare?`,
            [{
                type: 'single_select',
                label: '🗳️ Vota',
                title: 'Chi elimini?',
                sectionTitle: 'Giocatori vivi',
                rows: targets.map(o => ({ header: '👤', title: o.name, id: `banda vota ${o.jid.replace('@', '+')}` })),
            }], msg).catch(() => {});
    }

    // Timer voto diurno → risoluzione.
    setTimeout(() => resolveDay(sock, from, services), DAY_TIME_MS);
}

function resolveDay(sock, from, services) {
    const { db, saveDB, sendButtons } = services;
    const g = db[from]?.bandaGame;
    if (!g || g.phase !== 'day') return;

    const votes = Object.values(g.dayVotes || {});
    const tally = {};
    for (const v of votes) tally[v] = (tally[v] || 0) + 1;
    let top = null;
    let topCount = 0;
    for (const [jid, n] of Object.entries(tally)) {
        if (n > topCount) { top = jid; topCount = n; }
    }

    let eliminated = null;
    if (top && topCount >= 2) {
        eliminated = g.players.find(p => p.jid === top);
        if (eliminated) eliminated.alive = false;
    }

    const alive = g.players.filter(p => p.alive);
    const bandaAlive = alive.filter(p => p.role === 'banda').length;

    if (eliminated) {
        sock.sendMessage(from, { text: `📢 *Il villaggio ha eliminato:* ${eliminated.name} ${eliminated.role === 'banda' ? '🔫 era della Banda!' : `(${ROLES[eliminated.role].name})`}` }).catch(() => {});
    } else {
        sock.sendMessage(from, { text: `📢 *Nessuna eliminazione* (voti insufficienti).` }).catch(() => {});
    }

    if (bandaAlive === 0) {
        g.active = false;
        saveDB();
        return sock.sendMessage(from, { text: `🏆 *HA VINTO IL VILLAGGIO!* Banda sconfitta.` }).catch(() => {});
    }
    if (bandaAlive >= Math.ceil(alive.length / 2)) {
        g.active = false;
        saveDB();
        return sock.sendMessage(from, { text: `🔫 *HA VINTO LA BANDA!*` }).catch(() => {});
    }

    // Nuova notte.
    g.phase = 'night';
    g.night = { kill: null, check: null, cura: null };
    g.dayVotes = {};
    saveDB();

    const alivePlayers = g.players.filter(p => p.alive);
    const others = (p) => alivePlayers.filter(x => x.jid !== p.jid);
    for (const p of alivePlayers) {
        const roleInfo = ROLES[p.role];
        let txt;
        if (p.role === 'banda') {
            txt = `🌙 *NOTTE ${g.day + 1} — BANDA*\nScegli chi eliminare.`;
        } else if (p.role === 'detective') {
            txt = `🌙 *NOTTE ${g.day + 1} — DETECTIVE*\nScegli chi indagare.`;
        } else if (p.role === 'medico') {
            txt = `🌙 *NOTTE ${g.day + 1} — MEDICO*\nScegli chi salvare.`;
        } else {
            txt = `🌙 *NOTTE ${g.day + 1} — CIVILE*\nDormi.`;
        }
        const sheet = {
            type: 'single_select',
            label: 'Scegli',
            title: txt.slice(0, 50),
            sectionTitle: 'Giocatori vivi',
            rows: others(p).map(o => ({ header: roleInfo.emoji, title: o.name, id: `banda ${actionFor(p.role)} ${o.jid.replace('@', '+')}` })),
        };
        sendButtons(sock, p.jid, txt, p.role === 'civile' ? [{ label: '😴 Dormo', id: 'banda stato' }] : [sheet], msg).catch(() => {});
    }
    sock.sendMessage(from, { text: `🌙 *NOTTE ${g.day + 1}* — azioni in privato.` }).catch(() => {});

    setTimeout(() => resolveNight(sock, from, services), NIGHT_TIME_MS);
}

module.exports.ROLES = ROLES;
module.exports.NIGHT_TIME_MS = NIGHT_TIME_MS;
module.exports.DAY_TIME_MS = DAY_TIME_MS;
