'use strict';

const { renderTrisBoard } = require('../../lib/tris');

module.exports = {
    name: 'tris',
    aliases: ['tic-tac-toe', 'trisgame', 'filet'],
    description: "Gioca una partita di Tris (file e pesi) contro un altro utente. Uso: .tris @avversario",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, db, saveDB, sameJid } = services;

        if (!isGroup) return reply("Il tris si gioca solo nei gruppi.");

        if (db[from]?.trisGame?.active) {
            return reply("C'è già una partita di tris in corso! Giocate o attendete che finisca.");
        }

        // Determina l'avversario: menzione, risposta, o tag nell'argomento
        let opponent = targetJid;
        if (!opponent && isReply) {
            opponent = contextInfo?.participant || null;
        }
        if (!opponent) {
            return reply("Tagga l'avversario con @ oppure rispondi a un suo messaggio. Esempio: `.tris @marco`");
        }
        if (sameJid(opponent, sender)) {
            return reply("Non puoi giocare contro te stesso!");
        }
        if (opponent.endsWith('@lid')) {
            // normalizza: per i bisogni del gioco va bene comunque
        }

        const board = Array(9).fill(null);
        const players = [sender, opponent]; // 0 = X (sfidante), 1 = O (sfidato)

        db[from] = db[from] || {};
        db[from].trisGame = {
            active: true,
            board,
            players,
            current: 0,             // indice del giocatore che deve muovere
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,       // key dell'ultimo messaggio board (per cancellarlo)
        };
        saveDB();

        let boardBuffer;
        try {
            boardBuffer = await renderTrisBoard(sharp, board);
        } catch (e) {
            console.error('[tris] render iniziale:', e.message);
            delete db[from].trisGame;
            saveDB();
            return reply("❌ Errore nella generazione della board.");
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `🎮 *TRIS* — Partita iniziata!\n\n❌ Sfidante: @${sender.split('@')[0]}\n⭕ Sfidato: @${opponent.split('@')[0]}\n\nTocca a ❌ (@${sender.split('@')[0]}). Scrivi un numero *1-9* per mettere la X.`,
            mentions: players,
        }, { quoted: msg });

        db[from].trisGame.lastMsgKey = sent?.key || null;
        saveDB();
    },
};
