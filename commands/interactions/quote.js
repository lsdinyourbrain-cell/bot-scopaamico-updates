'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const quotes = [
    "La vita è come una bicicletta: per mantenere l'equilibrio devi muoverti. — Einstein 🚲",
    "Non è che abbia fallito, ho solo trovato 10.000 modi che non funzionano. — Edison 💡",
    "Il modo migliore per predire il futuro è inventarlo. — Turing 🖥️",
    "Fatti non foste a viver come bruti, ma per seguir virtute e canoscenza. — Dante 📜",
    "Le cose più belle della vita non sono cose. Sono persone, luoghi, ricordi... 🌅",
    "Il riso è la distanza più breve tra due persone. — Victor Borge 😂",
    "Chi non ha mai commesso un errore non ha mai provato cose nuove. — Einstein 🎯",
    "Sii il cambiamento che vuoi vedere nel mondo. — Gandhi 🌍",
    "La vittoria è la somma di tanti piccoli sacrifici. 🏆",
    "Se puoi sognarlo, puoi farlo. — Disney ✨",
    "Non contare i giorni, rendi ogni giorno importante. 📆",
    "La strada per il successo è piena di curve, ma la vista dalla cima è spettacolare. 🏔️",
    "Le persone dimenticheranno ciò che hai detto, ma mai come le hai fatte sentire. ❤️",
    "L'unico modo per fare un grande lavoro è amare quello che fai. — Jobs 🍎",
    "Se cadi, rialzati. Se cadi ancora, rialzati ancora. Finchè non sarai in piedi. 💪",
    "L'ignoranza è la notte della mente, ma una notte senza luna e senza stelle. — Confucio 🌙",
    "La logica ti porta da A a B. L'immaginazione ti porta dappertutto. — Einstein 🚀",
    "Parla solo quando le tue parole sono migliori del silenzio. 🤫",
    "Il vero viaggio di scoperta non consiste nel cercare nuove terre, ma nell'avere nuovi occhi. — Proust 👁️",
    "Non piangere perché è finita, sorridi perché è successo. — Dr. Seuss 😊",
    "Siamo fatti della stessa sostanza dei sogni. — Shakespeare 💭",
    "Nella vita non si può avere tutto, ma si può avere tutto ciò che si è disposti a sacrificare. ⚖️",
    "Il fallimento è il condimento che dà sapore al successo. — Truman Capote 🧂",
    "Non c'è vento favorevole per il marinaio che non sa dove andare. — Seneca ⛵",
    "Se vuoi andare veloce, vai da solo. Se vuoi andare lontano, vai insieme. — Proverbio africano 🌍",
];

module.exports = {
    name: 'quote',
    aliases: ['citazione', 'filosofia'],
    description: "Mostra una citazione random.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        const q = quotes[Math.floor(Math.random() * quotes.length)];
        await reply(`💭 *_CITAZIONE_*\n\n▸ _${q}_\n\n`);
    },
};
