'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const fs = require('fs');
const path = require('path');

// Difficoltà: facile 10s low reward, media 7s, difficile 5s high reward
const DIFFICULTIES = {
    facile:    { key: 'facile',    label: 'FACILE',    emoji: '🟢', timeout: 10000, reward: 40 },
    media:     { key: 'media',     label: 'MEDIA',     emoji: '🟡', timeout: 7000,  reward: 80 },
    difficile: { key: 'difficile', label: 'DIFFICILE', emoji: '🔴', timeout: 5000,  reward: 130 },
};

module.exports = {
    name: 'quiz',
    aliases: ['trivia'],
    description: "Rispondi alla domanda e vinci! Difficoltà: facile/media/difficile (10s/7s/5s).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;

            const qLower = String(textArgs || '').trim().toLowerCase();
            const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
            if (isQuit) {
                if (!db[from]?.quizGame?.active) return reply("Nessun quiz attivo.");
                db[from].quizGame.active = false;
                saveDB();
                const t = `${sec('🛑 QUIZ TERMINATO')}\n${boxOpen()}\n${line(`Quiz terminato da @${sender.split('@')[0]} ✨`)}\n${boxEnd()}`;
                if (sendButtons) {
                    return sendButtons(sock, from, t, [
                        { label: '🔄 Nuova domanda', id: 'quiz' },
                        { label: '🏠 Menu', id: 'menu' },
                    ], msg, [sender]);
                }
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }

            if (db[from]?.quizGame?.active) {
                const t = `${sec('🧠 QUIZ ATTIVO')}\n${boxOpen()}\n${line('C\'è già un quiz in corso ✨')}\n${line('Rispondi *A/B/C/D* oppure termina')}\n${boxEnd()}`;
                if (sendButtons) {
                    return sendButtons(sock, from, t, [
                        { label: '❌ Termina', id: 'quiz termina' },
                        { label: '🔄 Nuova domanda', id: 'quiz termina' },
                    ], msg);
                }
            }

            const quizFile = path.join(projectDir, 'data', 'quiz.json');
            let questions;
            try {
                questions = JSON.parse(fs.readFileSync(quizFile, 'utf-8'));
            } catch (e) {
                return sock.sendMessage(from, { text: `${sec('❌ ERRORE QUIZ')}\n${boxOpen()}\n${line('Quiz non disponibile — file corrotto ✨')}\n${boxEnd()}` }, { quoted: msg });
            }

            const rawDiffQuiz = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0];
            const diffQuizKey = DIFFICULTIES[rawDiffQuiz] ? rawDiffQuiz : 'facile';
            const diffQuiz = DIFFICULTIES[diffQuizKey];

            const pick = questions[Math.floor(Math.random() * questions.length)];

            if (!db[from]) db[from] = {};
            db[from].quizGame = {
                active: true,
                correctIndex: pick.c,
                correctAnswer: pick.a[pick.c],
                timestamp: Date.now(),
                difficulty: diffQuiz.key,
                reward: diffQuiz.reward,
                timeout: diffQuiz.timeout,
            };
            saveDB();

            const optLetters = ['A', 'B', 'C', 'D'];
            const optionsText = pick.a.map((opt, i) => line(`${optLetters[i]} ⦁ ${opt}`)).join('\n');

            const quizHeader = `${diffQuiz.emoji} ${diffQuiz.label} · ⏳ ${diffQuiz.timeout/1000}s · 💰 ${diffQuiz.reward}€`;
            if (sendButtons) {
                await sendButtons(sock, from, `${sec('🧠 QUIZ')}\n${boxOpen()}\n${line(quizHeader)}\n${line(`❓ _${pick.q}_`)}\n${line('')}\n${optionsText}\n${line('')}\n${line('⚡ Rispondi _A/B/C/D_ ✨')}\n${boxEnd()}`, [
                    { label: '❌ Termina', id: 'quiz termina' },
                    { label: '🔄 Nuova domanda', id: 'quiz termina' },
                ], msg);
            } else {
                await sock.sendMessage(from, {
                    text: `${sec('🧠 QUIZ')}\n${boxOpen()}\n${line(quizHeader)}\n${line(`❓ _${pick.q}_`)}\n${line('')}\n${optionsText}\n${line('')}\n${line('⚡ Rispondi _A/B/C/D_ ✨')}\n${boxEnd()}`,
                }, { quoted: msg });
            }

            setTimeout(() => {
                if (db[from]?.quizGame?.active) {
                    db[from].quizGame.active = false;
                    saveDB();
                    sock.sendMessage(from, { text: `${sec('⏰ TEMPO SCADUTO')}\n${boxOpen()}\n${line(`Risposta: _*${pick.a[pick.c]}*_ ✨`)}\n${line(`⏳ ${diffQuiz.timeout/1000}s scaduti — ${diffQuiz.emoji} ${diffQuiz.label}`)}\n${boxEnd()}` }).catch(() => {});
                }
            }, diffQuiz.timeout);
    },
};
