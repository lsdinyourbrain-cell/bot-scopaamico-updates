'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { WORDLE_POOL, WORD_LEN, MAX_ATTEMPTS, GAME_TIMEOUT_MS, renderWordleGrid, pickTarget } = require('../../lib/wordle');

const DIFFICULTIES = {
    facile:    { key: 'facile',    emoji: '🟢', description: 'più tentativi', attempts: 6 },
    media:     { key: 'media',     emoji: '🟡', description: 'tentativi medi', attempts: 5 },
    difficile: { key: 'difficile', emoji: '🔴', description: 'pochi tentativi', attempts: 4 },
};

module.exports = {
    name: 'wordle',
    aliases: ['wordle-ita', 'wordleita'],
    description: "Indovina la parola segreta di 5 lettere in 6 tentativi. Difficoltà: .wordle facile/media/difficile (o .wordle e scegli). Verde = giusta, giallo = spostata, grigio = assente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, randomChoice, sharp, sendButtons } = services;

        if (!isGroup) return reply("Il Wordle si gioca solo nei gruppi.");

        const qLower = String(textArgs || '').trim().toLowerCase();
        const isQuit = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLower) || qLower.startsWith('stop ') || qLower.startsWith('termina') || qLower.startsWith('abbandona') || qLower.startsWith('annulla');
        if (isQuit) {
            if (!db[from]?.wordleGame?.active) return reply("Nessun Wordle attivo.");
            const active = db[from].wordleGame;
            if (active.lastMsgKey) { try { await sock.sendMessage(from, { delete: active.lastMsgKey }); } catch (_) {} }
            const target = active.target;
            active.active = false;
            delete db[from].wordleGame;
            saveDB();
            const t = `${sec('🛑 WORDLE TERMINATO')}\n${boxOpen()}\n${line(`Parola era *${target}* ✨`)}\n${line(`Terminato da @${sender.split('@')[0]}`)}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '🔄 Nuova partita', id: 'wordle' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg, [sender]);
            }
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        if (db[from]?.wordleGame?.active) {
            const t = `${sec('🟩 WORDLE ATTIVO')}\n${boxOpen()}\n${line('C\'è già un Wordle in corso ✨')}\n${line('Scrivi una parola o termina')}\n${boxEnd()}`;
            if (sendButtons) {
                return sendButtons(sock, from, t, [
                    { label: '❌ Termina', id: 'wordle termina' },
                    { label: '🔄 Nuova partita', id: 'wordle termina' },
                ], msg);
            }
            return reply("C'è già un Wordle in corso! Scrivi una parola di 5 lettere per provare.");
        }

        const arg = String(textArgs || '').trim().toLowerCase();
        const diff = DIFFICULTIES[arg] || DIFFICULTIES.media;

        // Parole già usate da questo giocatore → anti-ripetizione.
        const used = db[from]?.wordleUsed?.[sender] || [];
        const picked = pickTarget({ exclude: used, random: Math.random });
        const target = picked.word;

        db[from] = db[from] || {};
        db[from].wordleGame = {
            active: true,
            target,
            difficulty: diff.key,
            maxAttempts: diff.attempts,
            attempts: [],
            sender,
            timestamp: Date.now(),
            lastMsgKey: null,
        };
        // Aggiorna l'elenco parole già usate dal giocatore (persistito).
        db[from].wordleUsed = db[from].wordleUsed || {};
        db[from].wordleUsed[sender] = picked.used;
        saveDB();

        let boardBuffer;
        try {
            boardBuffer = await renderWordleGrid(sharp, []);
        } catch (e) {
            console.error('[wordle] render iniziale:', e.message);
            delete db[from].wordleGame;
            saveDB();
            return reply("❌ Errore nella generazione della griglia.");
        }

        const sent = await sock.sendMessage(from, {
            image: boardBuffer,
            caption: `${diff.emoji} *WORDLE* · ${diff.key.toUpperCase()}\n\n🎉 Dai, si parte!\nChe figata 🔥\n🎯 Parola segreta di *${WORD_LEN}* lettere.\n🟩 verde = giusta, posto giusto\n🟨 giallo = giusta, ma spostata\n⬛ grigio = lettera assente\n\n_Hai ${diff.attempts} tentativi!_ \n_Scrivi una parola._\n`,
        }, { quoted: msg });

        db[from].wordleGame.lastMsgKey = sent?.key || null;
        saveDB();
        if (sendButtons) {
            try {
                await sendButtons(sock, from, `${sec('🟩 WORDLE CONTROLLI')}\n${boxOpen()}\n${line('Parola in corso ✨')}\n${line('❌ Termina — rivela la parola')}\n${line('🔄 Nuova — termina e rigioca')}\n${boxEnd()}`, [
                    { label: '❌ Termina', id: 'wordle termina' },
                    { label: '🔄 Nuova partita', id: 'wordle termina' },
                ], msg);
            } catch (_) {}
        }

        setTimeout(() => {
            const g = db[from]?.wordleGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                if (g.lastMsgKey) {
                    sock.sendMessage(from, { text: `⏰ *Tempo finito!*\nLa parola era *${g.target}*.`, edit: g.lastMsgKey }).catch(() => {});
                } else {
                    sock.sendMessage(from, { text: `⏰ *Tempo finito!*\nLa parola era *${g.target}*.` }).catch(() => {});
                }
            }
        }, GAME_TIMEOUT_MS);
    },
};