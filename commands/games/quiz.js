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
                return sock.sendMessage(from, { text: `${sec('❌ ERRORE QUIZ')}\n${boxOpen()}\n${line('💎 Quiz non disponibile — file corrotto ✨')}\n${boxEnd()}` }, { quoted: msg });
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
            const optionsText = pick.a.map((opt, i) => line(`${optLetters[i]} ⦁ ${opt} 💎`)).join('\n');

            await sock.sendMessage(from, {
                text: `${sec('🧠 QUIZ GLASS')}\n${boxOpen()}\n${line(`💎 Domanda vetro ✨🔮`)}\n${line(`❓ _${pick.q}_ 💫`)}\n${line('')}\n${optionsText}\n${line('')}\n${line('⚡ Rispondi _A/B/C/D_ ✨')}\n${line('⏳ _30 secondi_ • vetro diamantato 💎')}\n${boxEnd()}`,
            }, { quoted: msg });

            setTimeout(() => {
                if (db[from]?.quizGame?.active) {
                    db[from].quizGame.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `${sec('⏰ TEMPO SCADUTO')}\n${boxOpen()}\n${line(`💎 Risposta: _*${pick.a[pick.c]}*_ ✨`)}\n${line('🔮 _Vetro dissolto..._ 💫')}\n${boxEnd()}` }).catch(() => {});
                }
            }, 30000);
    },
};
