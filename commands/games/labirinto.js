'use strict';

const { generateMaze, renderMaze } = require('../../lib/maze');

const GAME_TIMEOUT_MS = 240000;

// Parole che chiudono la partita in corso (scritte a mano o via pulsante).
const QUIT_WORDS = ['fine', 'stop', 'esci', 'termina', 'basta', 'chiudi'];

module.exports = {
    name: 'labirinto',
    aliases: ['maze', 'labyrinth'],
    description: "Esci dal labirinto muovendoti con u/d/l/r (su/giù/sinistra/destra). Uso: .labirinto, poi invia le direzioni per muoverti o premi il pulsante Termina partita.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons, sharp } = services;

        if (!isGroup) return reply("Il labirinto si gioca solo nei gruppi.");

        const g = db[from]?.mazeGame;
        const wantQuit = QUIT_WORDS.includes(String(textArgs || '').trim().toLowerCase());

        // Già in corso → se l'utente chiede di smettere (pulsante o testo),
        // chiudi il gioco; altrimenti invita a muoversi.
        if (g?.active) {
            if (wantQuit) {
                g.active = false;
                delete db[from].mazeGame;
                saveDB();
                if (g.lastMsgKey) {
                    try { await sock.sendMessage(from, { delete: g.lastMsgKey }); } catch (_) {}
                }
                return reply('🏁 *Labirinto terminato!*\nTorna quando vuoi con `.labirinto`. 🌀');
            }
            return reply("C'è già un labirinto in corso!\nScrivi *u/d/l/r* per muoverti\npremi *Termina partita* per\nchiuderlo.");
        }

        // Pulsante premuto quando NON c'è partita → rispondi gentilmente.
        if (wantQuit) {
            return reply('Non c\u2019è nessun labirinto in corso.\nAvviane uno con `.labirinto`! 🌀');
        }

        // Griglia più piccola = partita più facile da risolvere.
        const maze = generateMaze(5, 7);

        db[from] = db[from] || {};
        db[from].mazeGame = {
            active: true,
            maze,
            pos: { r: 0, c: 0 },
            moves: 0,
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
        saveDB();

        let boardBuffer;
        try {
            boardBuffer = await renderMaze(sharp, maze, { r: 0, c: 0 });
        } catch (e) {
            console.error('[labirinto] render iniziale:', e.message);
            delete db[from].mazeGame;
            saveDB();
            return reply("❌ Errore nella generazione del labirinto.");
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `🌀 *LABIRINTO*\n━━━━━━━━━━━━━━━━━━\n🔴 Sei il pallino rosso,\n🟢 il verde è l'uscita.\n\nMuoviti con:\n• *u* = su    *d* = giù\n• *l* = sinistra  *r* = destra\n\n_Non puoi attraversare i muri!_\n_Raggiungi la V verde._\n━━━━━━━━━━━━━━━━━━`,
        }, { quoted: msg });

        db[from].mazeGame.lastMsgKey = sent?.key || null;
        saveDB();

        // Pulsante per chiudere la partita senza scrivere nulla.
        sendButtons(sock, from,
            '🌀 *LABIRINTO*\nScrivi *u/d/l/r* per muoverti.\nPremi sotto quando vuoi smettere.',
            [{ label: '🏁 Termina partita', id: 'labirinto fine' }],
            msg).catch(() => {});

        setTimeout(() => {
            const g = db[from]?.mazeGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                delete db[from].mazeGame;
                saveDB();
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!*\nNon sei riuscito a uscire\ndal labirinto.`, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!*\nNon sei riuscito a uscire\ndal labirinto.` }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};