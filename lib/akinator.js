'use strict';

// Akinator "indovina chi": albero binario di domande SÌ/NO che porta a un
// personaggio. Lo stato vive in db[from].akinatorGame e un handler in index.js
// processa le risposte ("si"/"no"). Ogni nodo: { q } domanda, oppure
// { guess } personaggio finale.

// Albero: animali + cibo (8 personaggi).
const TREE = {
    q: 'Pensi a un essere vivente?',
    yes: {
        q: 'Vive normalmente in una casa?',
        yes: {
            q: 'È felino?',
            yes: { guess: 'GATTO 🐱' },
            no: { guess: 'CANE 🐶' },
        },
        no: {
            q: 'Ha la criniera?',
            yes: { guess: 'LEONE 🦁' },
            no: { guess: 'CAVALLO 🐴' },
        },
    },
    no: {
        q: 'È servito caldo?',
        yes: {
            q: 'È di forma rotonda?',
            yes: { guess: 'PIZZA 🍕' },
            no: { guess: 'PASTA 🍝' },
        },
        no: {
            q: 'Contiene il salume?',
            yes: { guess: 'PANINO 🥪' },
            no: { guess: 'GELATO 🍦' },
        },
    },
};

const NODE_TREE = TREE;

// Applica una risposta ('si'|'no') al nodo corrente.
const applyAnswer = (node, answer) => {
    if (!node || node.guess) return node;
    return answer === 'si' ? node.yes : node.no;
};

const isQuestion = (node) => Boolean(node && node.q && !node.guess);
const isGuess = (node) => Boolean(node && node.guess);

module.exports = { NODE_TREE, applyAnswer, isQuestion, isGuess };