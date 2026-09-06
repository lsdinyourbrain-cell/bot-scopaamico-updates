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
        const { sharp, db, saveDB, sameJid, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) {
            const t = `${sec('👥 SOLO GRUPPI')}\n${boxOpen()}\n${line('🎮 Il tris si gioca solo nei gruppi 💎✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const qLower = String(textArgs || '').trim().toLowerCase();
        const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia','annulla partita','termina partita'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
        if (isQuit) {
            if (!db[from]?.trisGame?.active) {
                const t = `${sec('🎮 TRIS')}\n${boxOpen()}\n${line('Nessuna partita di tris attiva ✨')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            const active = db[from].trisGame;
            if (active.lastMsgKey) { try { await sock.sendMessage(from, { delete: active.lastMsgKey }); } catch (_) {} }
            delete db[from].trisGame;
            saveDB();
            const t = `${sec('🛑 TRIS TERMINATO')}\n${boxOpen()}\n${line(`Partita terminata da @${dispOf(sender)} ✨`)}\n${line('Usa *.tris @utente* per una nuova sfida')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '🔄 Nuova partita', id: 'tris' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg, active.players || [sender]);
            }
            return sock.sendMessage(from, { text: t, mentions: active.players || [sender] }, { quoted: msg });
        }

        if (db[from]?.trisGame?.active) {
            const t = `${sec('🎮 TRIS ATTIVO')}\n${boxOpen()}\n${line('C\'è già una partita di tris in corso ✨')}\n${line('🔮 _Completala prima di crearne un\'altra_')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '❌ Termina', id: 'tris termina' },
                    { label: '🔄 Nuova partita', id: 'tris termina' },
                ], msg);
            }
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // Determina l'avversario: menzione, risposta, o tag nell'argomento
        let opponent = targetJid;
        if (!opponent && isReply) {
            opponent = contextInfo?.participant || null;
        }
        if (!opponent) {
            const t = `${sec('🎮 TRIS')}\n${boxOpen()}\n${line('Tagga l\'avversario ✨')}\n${line('📌 Esempio: *.tris @marco*')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }
        if (sameJid(opponent, sender)) {
            const t = `${sec('🎮 TRIS')}\n${boxOpen()}\n${line('✨ Non sfidare te stesso, leggenda!')}\n${boxEnd()}`;
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
            const t = `${sec('❌ ERRORE TRIS')}\n${boxOpen()}\n${line('Errore generazione board ✨')}\n${boxEnd()}`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `${sec('🎮 TRIS')}\n${boxOpen()}\n${line(`Sfida: @${dispOf(senderPn)} ❌ vs @${dispOf(opponentPn)} ⭕ ✨`)}\n${line(`🔮 Tocca a ❌ @${dispOf(senderPn)} — scrivi *1-9*`)}\n${boxEnd()}`,
            mentions: players,
        }, { quoted: msg });

        db[from].trisGame.lastMsgKey = sent?.key || null;
        saveDB();
        if (sendButtons) {
            try {
                await sendButtons(sock, from, `${sec('🎮 TRIS CONTROLLI')}\n${boxOpen()}\n${line('Partita in corso ✨')}\n${line('❌ Termina — annulla la sfida')}\n${line('🔄 Nuova — termina e rigioca')}\n${boxEnd()}`, [
                    { label: '❌ Termina', id: 'tris termina' },
                    { label: '🔄 Nuova partita', id: 'tris termina' },
                ], msg);
            } catch (_) {}
        }
    },
};
