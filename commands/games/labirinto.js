'use strict';

const { generateMaze, renderMaze } = require('../../lib/maze');

const GAME_TIMEOUT_MS = 240000;

module.exports = {
    name: 'labirinto',
    aliases: ['maze', 'labyrinth'],
    description: "Esci dal labirinto muovendoti con u/d/l/r (su/giù/sinistra/destra). Uso: .labirinto, poi invia le direzioni per muoverti.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sharp } = services;

        if (!isGroup) return reply("Il labirinto si gioca solo nei gruppi.");

        if (db[from]?.mazeGame?.active) {
            return reply("C'è già un labirinto in corso! Scrivi *u/d/l/r* per muoverti.");
        }

        const maze = generateMaze(7, 11);

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
            caption: `🌀 *LABIRINTO*\n\n🔴 sei il pallino rosso, il verde è l'uscita.\n\nMuoviti con:\n• *u* = su     *d* = giù\n• *l* = sinistra   *r* = destra\n\n_Non puoi attraversare i muri! Raggiungi la V verde._`,
        }, { quoted: msg });

        db[from].mazeGame.lastMsgKey = sent?.key || null;
        saveDB();

        setTimeout(() => {
            const g = db[from]?.mazeGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!* Non sei riuscito a uscire dal labirinto.`, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!* Non sei riuscito a uscire dal labirinto.` }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};