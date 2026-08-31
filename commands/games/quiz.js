'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'quiz',
    aliases: ['trivia'],
    description: "Rispondi alla domanda e vinci!",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            const quizFile = path.join(projectDir, 'data', 'quiz.json');
            let questions;
            try {
                questions = JSON.parse(fs.readFileSync(quizFile, 'utf-8'));
            } catch (e) {
                return reply("Errore nel caricamento del quiz. File non trovato o corrotto.");
            }

            const pick = questions[Math.floor(Math.random() * questions.length)];

            if (!db[from]) db[from] = {};
            db[from].quizGame = {
                active: true,
                correctIndex: pick.c,
                correctAnswer: pick.a[pick.c],
                timestamp: Date.now(),
            };
            saveDB();

            const optLetters = ['A', 'B', 'C', 'D'];
            const optionsText = pick.a.map((opt, i) => `${optLetters[i]}) ${opt}`).join('\n');

            await sock.sendMessage(from, {
                text: `❓ *_QUIZ TIME!_*\n\n❓ ${pick.q}\n\n${optionsText}\n\n⚡ Rispondi A/B/C/D\n⏳ Hai 30 secondi!\n`,
            }, { quoted: msg });

            setTimeout(() => {
                if (db[from]?.quizGame?.active) {
                    db[from].quizGame.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `⏰ *Tempo scaduto!*\nLa risposta giusta era:\n*${pick.a[pick.c]}*` }).catch(() => {});
                }
            }, 30000);
    },
};
