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
        const { db, saveDB } = services;

        if (!isGroup) return reply("Akinator si gioca solo nei gruppi.");

        if (db[from]?.akinatorGame?.active) {
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