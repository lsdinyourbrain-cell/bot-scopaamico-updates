'use strict';

// Impiccato (hangman) — versione curata con arte ASCII del boia, suggerimento
// di categoria, tracciamento lettere e timer. Lo stato vive in
// db[from].impiccatoGame e un handler in index.js processa i tentativi.

const WORD_BANK = [
    { word: 'ELEFANTE', categoria: 'Animali' },
    { word: 'COMPUTER', categoria: 'Tecnologia' },
    { word: 'GIUNGLA', categoria: 'Natura' },
    { word: 'PIZZA', categoria: 'Cibo' },
    { word: 'MONTAGNA', categoria: 'Geografia' },
    { word: 'BIBLIOTECA', categoria: 'Luoghi' },
    { word: 'ASTRONAUTA', categoria: 'Mestieri' },
    { word: 'CHITARRA', categoria: 'Musica' },
    { word: 'ARCOBALENO', categoria: 'Natura' },
    { word: 'CAVALLO', categoria: 'Animali' },
    { word: 'TELEFONO', categoria: 'Tecnologia' },
    { word: 'GELATO', categoria: 'Cibo' },
    { word: 'STELLA', categoria: 'Spazio' },
    { word: 'FERRARI', categoria: 'Auto' },
    { word: 'OCEANO', categoria: 'Geografia' },
    { word: 'DENTISTA', categoria: 'Mestieri' },
    { word: 'BICICLETTA', categoria: 'Sport' },
    { word: 'VULCANO', categoria: 'Geografia' },
    { word: 'CROISSANT', categoria: 'Cibo' },
    { word: 'PIPISTRELLO', categoria: 'Animali' },
    { word: 'ORDINATORE', categoria: 'Tecnologia' },
    { word: 'CAMPIONE', categoria: 'Sport' },
    { word: 'FANTASMA', categoria: 'Altro' },
    { word: 'TRENO', categoria: 'Mezzi' },
    { word: 'FIORE', categoria: 'Natura' },
    { word: 'PESCE', categoria: 'Animali' },
    { word: 'GUITARRA', categoria: 'Musica' },  // accetteremo anche CHITARRA
    { word: 'SOLE', categoria: 'Spazio' },
    { word: 'LUNA', categoria: 'Spazio' },
    { word: 'MAESTRA', categoria: 'Mestieri' },
    { word: 'POMODORO', categoria: 'Cibo' },
    { word: 'DRAGO', categoria: 'Mitologia' },
    { word: 'CASTELLO', categoria: 'Luoghi' },
    { word: 'TIGRE', categoria: 'Animali' },
    { word: 'ROSA', categoria: 'Natura' },
    { word: 'SAHARA', categoria: 'Geografia' },
    { word: 'MUMIA', categoria: 'Mitologia' },
    { word: 'POETA', categoria: 'Mestieri' },
    { word: 'BARCA', categoria: 'Mezzi' },
];

// 7 stadi del boia (0 = solo forca, 6 = boia completo = game over).
const HANGMAN_STAGES = [
    // 0 errori
    `  ┌───┐
  │   │
  │
  │
  │
  │
──┴──`,
    // 1 errore (testa)
    `  ┌───┐
  │   │
  │   O
  │
  │
  │
──┴──`,
    // 2 errori (testa + corpo)
    `  ┌───┐
  │   │
  │   O
  │   │
  │
  │
──┴──`,
    // 3 errore (testa + corpo + braccio sx)
    `  ┌───┐
  │   │
  │   O
  │  /│
  │
  │
──┴──`,
    // 4 errori (testa + corpo + 2 braccia)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │
  │
──┴──`,
    // 5 errori (testa + corpo + 2 braccia + gamba sx)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │  /
  │
──┴──`,
    // 6 errori (boia completo)
    `  ┌───┐
  │   │
  │   O
  │  /│\\
  │  / \\
  │
──┴──`,
];

const MAX_WRONG = 6;
const GAME_TIMEOUT_MS = 120000; // 2 minuti

const maskWord = (word, guessed) =>
    word.split('').map((ch) => (guessed.includes(ch) ? ch : ' _ ')).join('');

const formatGuessed = (guessed) =>
    guessed.length ? guessed.sort().join('  ') : '—';

const buildBoardText = (game) => {
    const art = HANGMAN_STAGES[game.wrong];
    const masked = maskWord(game.word, game.guessed);
    const remaining = MAX_WRONG - game.wrong;
    return `${art}

🔤 Parola:  *${masked}*
📂 Categoria: ${game.categoria}
❌ Errori: ${game.wrong}/${MAX_WRONG}  (mancano ${remaining})
📝 Lettere provate: ${formatGuessed(game.guessed)}

Scrivi una *lettera* o tenta la *parola intera*!`;
};

module.exports = {
    name: 'impiccato',
    aliases: ['hangman', 'boia'],
    description: "Gioca all'impiccato: indovina la parola prima che il boia sia completo! Uso: .impiccato",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, randomChoice } = services;

        if (!isGroup) return reply("L'impiccato si gioca solo nei gruppi.");

        if (db[from]?.impiccatoGame?.active) {
            return reply("C'è già una partita di impiccato in corso! Scrivi una lettera per partecipare.");
        }

        const pick = randomChoice(WORD_BANK);
        const word = pick.word.toUpperCase();

        db[from] = db[from] || {};
        db[from].impiccatoGame = {
            active: true,
            word,
            categoria: pick.categoria,
            wrong: 0,
            guessed: [],
            sender,
            timestamp: Date.now(),
        };
        saveDB();

        await reply(
            `╔════════════════════════════════╗\n` +
            `║     🔴 *IMPICCATO* 🔴          ║\n` +
            `╠════════════════════════════════╣\n` +
            `${buildBoardText(db[from].impiccatoGame)}\n` +
            `⏳ Tempo: 2 minuti` +
            `\n╚════════════════════════════════╝`
        );

        // Timer di scadenza
        setTimeout(() => {
            const g = db[from]?.impiccatoGame;
            if (g?.active && Date.now() - g.timestamp >= GAME_TIMEOUT_MS) {
                g.active = false;
                saveDB();
                sock.sendMessage(from, {
                    text: `⏰ *Tempo scaduto!* La parola era *${g.word}* (${g.categoria}).`,
                }).catch(() => {});
            }
        }, GAME_TIMEOUT_MS);
    },
};

module.exports.MAX_WRONG = MAX_WRONG;
module.exports.GAME_TIMEOUT_MS = GAME_TIMEOUT_MS;
module.exports.buildBoardText = buildBoardText;
