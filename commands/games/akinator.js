'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { applyAnswer, isQuestion, isGuess } = require('../../lib/akinator');

const GAME_TIMEOUT_MS = 180000;
const REWARD = 100;

module.exports = {
    name: 'akinator',
    aliases: ['indovino', 'akina'],
    description: "Pensa a un personaggio: ti farò domande SÌ/NO e cercherò di indovinarlo. Uso: .akinator, poi rispondi si/no.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply("Akinator si gioca solo nei gruppi.");

        const qLower = String(textArgs || '').trim().toLowerCase();
        const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
        if (isQuit) {
            if (!db[from]?.akinatorGame?.active) return reply("Nessuna partita di Akinator attiva.");
            const active = db[from].akinatorGame;
            if (active.lastMsgKey) { try { await sock.sendMessage(from, { delete: active.lastMsgKey }); } catch (_) {} }
            active.active = false;
            delete db[from].akinatorGame;
            saveDB();
            const t = `${sec('🛑 AKINATOR TERMINATO')}\n${boxOpen()}\n${line(`Partita terminata da @${sender.split('@')[0]} ✨`)}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '🔄 Nuova partita', id: 'akinator' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg, [sender]);
            }
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        if (db[from]?.akinatorGame?.active) {
            const t = `${sec('🎭 AKINATOR ATTIVO')}\n${boxOpen()}\n${line('C\'è già una partita in corso ✨')}\n${line('Rispondi *si* o *no* oppure termina')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '❌ Termina', id: 'akinator termina' },
                    { label: '🔄 Nuova partita', id: 'akinator termina' },
                ], msg);
            }
            return reply("C'è già una partita in corso! Rispondi *si* o *no* alla domanda.");
        }

        db[from] = db[from] || {};
        db[from].akinatorGame = {
            active: true,
            node: require('../../lib/akinator').NODE_TREE,
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
        saveDB();

        let sent;
        try {
            sent = await sock.sendMessage(from, {
                text: `🎭 *AKINATOR*\n\nPensa a un personaggio\n(animale, cibo, persona…).\nTi farò delle domande:\nrispondi con *si* o *no*.\n\n👉 *${db[from].akinatorGame.node.q}*\n`,
            }, { quoted: msg });
        } catch (_) {
            return reply("❌ Non riesco a iniziare la partita.");
        }

        db[from].akinatorGame.lastMsgKey = sent?.key || null;
        saveDB();
        if (sendButtons) {
            try {
                await sendButtons(sock, from, `${sec('🎭 AKINATOR CONTROLLI')}\n${boxOpen()}\n${line('Partita in corso ✨')}\n${line('❌ Termina — annulla la sfida')}\n${line('🔄 Nuova — termina e rigioca')}\n${boxEnd()}`, [
                    { label: '❌ Termina', id: 'akinator termina' },
                    { label: '🔄 Nuova partita', id: 'akinator termina' },
                ], msg);
            } catch (_) {}
        }

        setTimeout(() => {
            const g = db[from]?.akinatorGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                sock.sendMessage(from, { text: `⏰ *Tempo scaduto!* Riprova con .akinator.` }).catch(() => {});
            }
        }, GAME_TIMEOUT_MS);
    },
};

module.exports.GAME_TIMEOUT_MS = GAME_TIMEOUT_MS;
module.exports.REWARD = REWARD;
module.exports.isQuestion = isQuestion;
module.exports.isGuess = isGuess;
module.exports.applyAnswer = applyAnswer;