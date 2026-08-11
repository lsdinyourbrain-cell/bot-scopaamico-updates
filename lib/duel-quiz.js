'use strict';

// Trivia serale (quiz multipla scelta): carica le domande da data/quiz.json,
// mescola le opzioni e restituisce quesiti pronti per la chat. Lo stato della
// partita vive in db[from].triviaGame e un handler in index.js processa le
// risposte con A/B/C/D.

const path = require('path');
const QUIZ_FILE = path.join(__dirname, '..', 'data', 'quiz.json');

let quizCache = null;
const loadQuiz = () => {
    if (quizCache) return quizCache;
    try {
        quizCache = require(QUIZ_FILE);
    } catch (_) {
        quizCache = [];
    }
    if (!Array.isArray(quizCache)) quizCache = [];
    return quizCache;
};

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Prende `count` domande casuali. Ogni domanda ritornata ha:
// { q, options: [4], correct: indice della risposta corretta, letter }
const pickQuestions = (count) => {
    const all = loadQuiz();
    const pool = shuffle(all).slice(0, count);
    return pool.map((item) => {
        const correctAnswer = item.a[item.c];
        const wrong = shuffle(item.a.filter((_, i) => i !== item.c));
        const options = shuffle([correctAnswer, wrong[0], wrong[1], wrong[2]].filter(Boolean));
        const correct = options.indexOf(correctAnswer);
        return {
            q: item.q,
            options,
            correct,
            letter: 'ABCD'[correct],
        };
    });
};

// Formatta la domanda per la chat (stile quiz esistente).
const formatQuestion = (q, number) => {
    const opts = q.options.map((opt, i) => `*${'ABCD'[i]})* ${opt}`).join('\n');
    return `📝 *DOMANDA ${number}*\n\n${q.q}\n\n${opts}`;
};

const OPTION_KEYS = { A: 0, B: 1, C: 2, D: 3 };
const LETTERS = ['A', 'B', 'C', 'D'];

module.exports = { loadQuiz, pickQuestions, formatQuestion, OPTION_KEYS, LETTERS };