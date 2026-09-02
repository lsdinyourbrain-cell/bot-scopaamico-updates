'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { pickQuestions, formatQuestion, LETTERS } = require('../../lib/duel-quiz');

const TOTAL_QUESTIONS = 5;
const REWARD_PER_CORRECT = 30;
const BONUS_TOP = 60;
const GAME_TIMEOUT_MS = 300000;

module.exports = {
    name: 'trivia2',
    aliases: ['quiz2', 'triviasfida'],
    description: "Sfida di trivia a 5 domande: chi risponde prima (A/B/C/D) prende il punto. Uso: .trivia2",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}\n${boxOpen()}\n${line('La trivia si gioca solo nei gruppi.')}\n${boxEnd()}`);

        if (db[from]?.triviaGame?.active) {
            return reply(`${sec('TRIVIA')}\n${boxOpen()}\n${line("C'è già una trivia in corso! Rispondi con *A/B/C/D* per partecipare.")}\n${boxEnd()}`);
        }

        const questions = pickQuestions(TOTAL_QUESTIONS);
        if (questions.length < 2) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('❌ Nessuna domanda disponibile. Riprova più tardi.')}\n${boxEnd()}`);
        }

        db[from] = db[from] || {};
        db[from].triviaGame = {
            active: true,
            questions,
            qIndex: 0,
            score: {},
            timestamp: Date.now(),
        };
        saveDB();

        const q = questions[0];
        await sock.sendMessage(from, {
            text: `${sec('TRIVIA SFIDA')}\n${boxOpen()}\n${line(formatQuestion(q, 1))}\n${line('⚡ Rispondi con *A/B/C/D*!')}\n${boxEnd()}`,
        }, { quoted: msg });

        setTimeout(() => {
            const g = db[from]?.triviaGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                const cur = g.questions[g.qIndex];
                const answer = cur ? cur.options[cur.correct] : '';
                sock.sendMessage(from, { text: `${sec('TEMPO SCADUTO')}\n${boxOpen()}\n${line(`La risposta era *${answer}*.`)}\n${boxEnd()}` }).catch(() => {});
            }
        }, GAME_TIMEOUT_MS);
    },
};

module.exports.TOTAL_QUESTIONS = TOTAL_QUESTIONS;
module.exports.REWARD_PER_CORRECT = REWARD_PER_CORRECT;
module.exports.BONUS_TOP = BONUS_TOP;
module.exports.LETTERS = LETTERS;
