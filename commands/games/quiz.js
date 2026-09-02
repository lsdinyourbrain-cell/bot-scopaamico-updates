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
                return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Errore nel caricamento del quiz. File non trovato o corrotto.')}\n${boxEnd()}`);
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
            const optionsText = pick.a.map((opt, i) => line(`${optLetters[i]}) ${opt}`)).join('\n');

            await sock.sendMessage(from, {
                text: `${sec('QUIZ TIME')}\n${boxOpen()}\n${line(`❓ ${pick.q}`)}\n${line('')}\n${optionsText}\n${line('')}\n${line('⚡ Rispondi A/B/C/D')}\n${line('⏳ Hai 30 secondi!')}\n${boxEnd()}`,
            }, { quoted: msg });

            setTimeout(() => {
                if (db[from]?.quizGame?.active) {
                    db[from].quizGame.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `${sec('TEMPO SCADUTO')}\n${boxOpen()}\n${line(`La risposta giusta era:`)}\n${line(`*${pick.a[pick.c]}*`)}\n${boxEnd()}` }).catch(() => {});
                }
            }, 30000);
    },
};
