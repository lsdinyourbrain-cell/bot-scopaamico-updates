'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { renderTrisBoard } = require('../../lib/tris');

module.exports = {
    name: 'tris',
    aliases: ['tic-tac-toe', 'trisgame', 'filet'],
    description: "Gioca una partita di Tris (file e pesi) contro un altro utente. Uso: .tris @avversario",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, db, saveDB, sameJid, getCachedGroupMeta } = services;

        if (!isGroup) {
            const t = `${sec('👥 SOLO GRUPPI')}\n${boxOpen()}\n${line('🎮 Il tris si gioca solo nei gruppi 💎✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        if (db[from]?.trisGame?.active) {
            const t = `${sec('🎮 TRIS ATTIVO')}\n${boxOpen()}\n${line('💎 C\'è già una partita di tris in corso ✨')}\n${line('🔮 _Completala prima di crearne un\'altra_ 💫')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // Determina l'avversario: menzione, risposta, o tag nell'argomento
        let opponent = targetJid;
        if (!opponent && isReply) {
            opponent = contextInfo?.participant || null;
        }
        if (!opponent) {
            const t = `${sec('🎮 TRIS GLASS')}\n${boxOpen()}\n${line('💎 Tagga l\'avversario ✨')}\n${line('📌 Esempio: *.tris @marco* 🔮')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (sameJid(opponent, sender)) {
            const t = `${sec('🎮 TRIS')}\n${boxOpen()}\n${line('✨ Non sfidare te stesso, leggenda! 💫')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // Risolve eventuali @lid in numeri di telefono reali (per menzioni e testo)
        let meta = null;
        try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
        const resolve = (jid) => {
            const pn = (meta?.participants || []).find(p =>
                sameJid(p.id || p.jid, jid) || sameJid(p.phoneNumber, jid)
            )?.phoneNumber;
            return pn || jid;
        };
        const senderPn = resolve(sender);
        const opponentPn = resolve(opponent);

        const board = Array(9).fill(null);
        const players = [senderPn, opponentPn]; // 0 = X (sfidante), 1 = O (sfidato)

        db[from] = db[from] || {};
        db[from].trisGame = {
            active: true,
            board,
            players,
            current: 0,             // indice del giocatore che deve muovere
            sender: senderPn,
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
            const t = `${sec('❌ ERRORE TRIS')}\n${boxOpen()}\n${line('💎 Errore generazione board ✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `${sec('🎮 TRIS GLASS')}\n${boxOpen()}\n${line(`💎 Sfida vetro: @${dispOf(senderPn)} ❌ vs @${dispOf(opponentPn)} ⭕ ✨`)}\n${line(`🔮 Tocca a ❌ @${dispOf(senderPn)} — scrivi *1-9* 💫`)}\n${boxEnd()}`,
            mentions: players,
        }, { quoted: msg });

        db[from].trisGame.lastMsgKey = sent?.key || null;
        saveDB();
    },
};
