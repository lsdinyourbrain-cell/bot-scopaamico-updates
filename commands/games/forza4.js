'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { createBoard, renderConnect4Board } = require('../../lib/four-in-row');

module.exports = {
    name: 'forza4',
    aliases: ['connect4', 'forza-4'],
    description: "Gioca a Forza 4 contro un altro utente. Uso: .forza4 @avversario, poi scrivi un numero 1-7 per lanciare il pedino.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sameJid, sharp, getCachedGroupMeta, sendButtons } = services;

        if (!isGroup) return reply("Il Forza 4 si gioca solo nei gruppi.");

        const qLower = String(textArgs || '').trim().toLowerCase();
        const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
        if (isQuit) {
            if (!db[from]?.forza4Game?.active) return reply("Nessuna partita di Forza 4 attiva.");
            const active = db[from].forza4Game;
            if (active.lastMsgKey) { try { await sock.sendMessage(from, { delete: active.lastMsgKey }); } catch (_) {} }
            delete db[from].forza4Game;
            saveDB();
            const t = `${sec('🛑 FORZA 4 TERMINATO')}\n${boxOpen()}\n${line(`Partita terminata da @${dispOf(sender)} ✨`)}\n${line('Usa *.forza4 @utente* per rigiocare')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '🔄 Nuova partita', id: 'forza4' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg, active.players || [sender]);
            }
            return sock.sendMessage(from, { text: t, mentions: active.players || [sender] }, { quoted: msg });
        }

        if (db[from]?.forza4Game?.active) {
            const t = `${sec('🔴 FORZA 4 ATTIVO')}\n${boxOpen()}\n${line('C\'è già una partita in corso ✨')}\n${line('Scrivi *1-7* per giocare oppure termina')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '❌ Termina', id: 'forza4 termina' },
                    { label: '🔄 Nuova partita', id: 'forza4 termina' },
                ], msg);
            }
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

        const players = [senderPn, opponentPn]; // 0 = 🔴 sfidante, 1 = 🟡 sfidato

        db[from] = db[from] || {};
        db[from].forza4Game = {
            active: true,
            board: createBoard(),
            players,
            current: 0,
            sender: senderPn,
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
            caption: `🎮 *FORZA 4*\n\n🎉 Dai, si parte!\nChe figata 🔥\n🔴 Sfidante: @${dispOf(senderPn)}\n🟡 Sfidato: @${dispOf(opponentPn)}\n\nTocca a 🔴 (@${dispOf(senderPn)}).\nScrivi un numero *1-7*\nper lanciare il pedino.\n`,
            mentions: players,
        }, { quoted: msg });

        db[from].forza4Game.lastMsgKey = sent?.key || null;
        saveDB();
        if (sendButtons) {
            try {
                await sendButtons(sock, from, `${sec('🔴 FORZA 4 CONTROLLI')}\n${boxOpen()}\n${line('Partita in corso ✨')}\n${line('❌ Termina — annulla la sfida')}\n${line('🔄 Nuova — termina e rigioca')}\n${boxEnd()}`, [
                    { label: '❌ Termina', id: 'forza4 termina' },
                    { label: '🔄 Nuova partita', id: 'forza4 termina' },
                ], msg);
            } catch (_) {}
        }
    },
};