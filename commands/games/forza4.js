'use strict';

const { createBoard, renderConnect4Board } = require('../../lib/four-in-row');

module.exports = {
    name: 'forza4',
    aliases: ['connect4', 'forza-4'],
    description: "Gioca a Forza 4 contro un altro utente. Uso: .forza4 @avversario, poi scrivi un numero 1-7 per lanciare il pedino.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sameJid, sharp } = services;

        if (!isGroup) return reply("Il Forza 4 si gioca solo nei gruppi.");

        if (db[from]?.forza4Game?.active) {
            return reply("C'è già una partita di Forza 4 in corso! Scrivi un numero *1-7* per giocare.");
        }

        let opponent = targetJid;
        if (!opponent && isReply) {
            opponent = contextInfo?.participant || null;
        }
        if (!opponent) {
            return reply("Tagga l'avversario con @ oppure rispondi a un suo messaggio. Esempio: `.forza4 @marco`");
        }
        if (sameJid(opponent, sender)) {
            return reply("Non puoi giocare contro te stesso!");
        }

        const players = [sender, opponent]; // 0 = 🔴 sfidante, 1 = 🟡 sfidato

        db[from] = db[from] || {};
        db[from].forza4Game = {
            active: true,
            board: createBoard(),
            players,
            current: 0,
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
        saveDB();

        let boardBuffer;
        try {
            boardBuffer = await renderConnect4Board(sharp, db[from].forza4Game.board);
        } catch (e) {
            console.error('[forza4] render iniziale:', e.message);
            delete db[from].forza4Game;
            saveDB();
            return reply("❌ Errore nella generazione della board.");
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `🎮 *FORZA 4*\n━━━━━━━━━━━━━━━━━━\n🎉 Partita iniziata!\n🔴 Sfidante: @${sender.split('@')[0]}\n🟡 Sfidato: @${opponent.split('@')[0]}\n\nTocca a 🔴 (@${sender.split('@')[0]}).\nScrivi un numero *1-7*\nper lanciare il pedino.\n━━━━━━━━━━━━━━━━━━`,
            mentions: players,
        }, { quoted: msg });

        db[from].forza4Game.lastMsgKey = sent?.key || null;
        saveDB();
    },
};