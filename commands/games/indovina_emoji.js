'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  INDOVINA_EMOJI — Vex Bot
//  Indovina film/serie/canzoni dai "rebus" a emoji. Livelli facile/media/
//  difficile come l'impiccato. Risposta via pulsanti (3 opzioni).
//  Stato della partita in db[from].emojiGame.
// 

// Rebus: { emoji, answer (nome), hints: [risposte sbagliate] }
const PUZZLES = [
    // 🟢 Facile — molto noti
    { level: 'facile', emoji: '🚗💨', answer: 'Fast & Furious', hints: ['Taxi Driver', 'Speed'] },
    { level: 'facile', emoji: '🧙♂️⏳💍', answer: 'Il Signore degli Anelli', hints: ['Harry Potter', 'Game of Thrones'] },
    { level: 'facile', emoji: '🦇🏙️', answer: 'Batman', hints: ['Spiderman', 'Superman'] },
    { level: 'facile', emoji: '🐭🏰', answer: 'Topolino', hints: ['Paperino', 'Pluto'] },
    { level: 'facile', emoji: '🟡🔴', answer: 'Pikachu', hints: ['Snorlax', 'Eevee'] },
    { level: 'facile', emoji: '💣🕰️', answer: 'Bomberman', hints: ['Mario', 'Sonic'] },
    { level: 'facile', emoji: '👑🦁', answer: 'Il Re Leone', hints: ['Biancaneve', 'La Sirenetta'] },
    { level: 'facile', emoji: '🍔🍟', answer: 'McDonald', hints: ['Burger King', 'KFC'] },
    { level: 'facile', emoji: '🟠🎃', answer: 'Halloween', hints: ['Natale', 'Pasqua'] },
    { level: 'facile', emoji: '🐠🔍', answer: 'Alla ricerca di Nemo', hints: ['Dory', 'Shark Tale'] },
    { level: 'facile', emoji: '🌊🤴', answer: 'La Sirenetta', hints: ['Pocahontas', 'Rapunzel'] },
    { level: 'facile', emoji: '⚡👑', answer: 'Frozen', hints: ['Re Leone', 'Encanto'] },
    { level: 'facile', emoji: '👻🍀', answer: 'Casper', hints: ['Ghostbuster', 'Monsters Inc'] },
    { level: 'facile', emoji: '🐼🥋', answer: 'Kung Fu Panda', hints: ['Madagascar', 'Ice Age'] },
    { level: 'facile', emoji: '👸🐉', answer: 'Shrek', hints: ['Come d\'incanto', 'Brave'] },

    // 🟡 Media — meno scontati
    { level: 'media', emoji: '🐺🏛️', answer: 'Il Gladiatore', hints: ['300', 'Troia'] },
    { level: 'media', emoji: '🔍🧠', answer: 'Sherlock Holmes', hints: ['Hercule Poirot', 'Colombo'] },
    { level: 'media', emoji: '🌍🦕', answer: 'Jurassic Park', hints: ['King Kong', 'Godzilla'] },
    { level: 'media', emoji: '👻🔫', answer: 'Ghostbusters', hints: ['Men in Black', 'Casper'] },
    { level: 'media', emoji: '🚢❄️', answer: 'Titanic', hints: ['Poseidon', 'Speed'] },
    { level: 'media', emoji: '🕷️🦸', answer: 'Spiderman', hints: ['Batman', 'Flash'] },
    { level: 'media', emoji: '⏰🕐', answer: 'Ritorno al futuro', hints: ['Interstellar', 'Prima di mezzanotte'] },
    { level: 'media', emoji: '🍌🐵', answer: 'Tarzan', hints: ['Madagascar', 'Il libro della giungla'] },
    { level: 'media', emoji: '🥷🐢', answer: 'Tartarughe Ninja', hints: ['Voltron', 'Power Rangers'] },
    { level: 'media', emoji: '💍🔥', answer: 'Il trono di spade', hints: ['L\'anello del Nibelungo', 'La ruota del tempo'] },
    { level: 'media', emoji: '👽🌍', answer: 'Men in Black', hints: ['Alien', 'ET'] },
    { level: 'media', emoji: '🎸🔥', answer: 'Bohemian Rhapsody', hints: ['Whiplash', 'Yesterday'] },
    { level: 'media', emoji: '🍷🎭', answer: 'Romeo e Giulietta', hints: ['Otello', 'Amleto'] },
    { level: 'media', emoji: '🌊🦈', answer: 'Lo squalo', hints: ['Megalodon', 'Piranha'] },
    { level: 'media', emoji: '💊🔴', answer: 'Matrix', hints: ['Ghost in the Shell', 'Dark City'] },

    // 🔴 Difficile — niche/culturale
    { level: 'difficile', emoji: '🏔️🐻', answer: 'L\'orso', hints: ['Into the Wild', 'Il lupo'] },
    { level: 'difficile', emoji: '📚🔥', answer: 'Fahrenheit 451', hints: ['1984', 'Brave New World'] },
    { level: 'difficile', emoji: '🌙🎬', answer: 'Moonlight', hints: ['La la land', 'Birdman'] },
    { level: 'difficile', emoji: '🤖🧠', answer: 'Ex Machina', hints: ['Her', 'Automata'] },
    { level: 'difficile', emoji: '🧊👸', answer: 'Frozen', hints: ['Ice Age', 'Ritorno al futuro'] },
    { level: 'difficile', emoji: '🐙🎲', answer: 'Blade Runner 2049', hints: ['Ghost in the Shell', 'Akira'] },
    { level: 'difficile', emoji: '🌹👁️', answer: 'Il nome della rosa', hints: ['Il codice Da Vinci', 'Angeli e demoni'] },
    { level: 'difficile', emoji: '🔮💭', answer: 'Inception', hints: ['Mr. Robot', 'Black Mirror'] },
];

// Le risposte valide (senza placeholder).
const cleanAnswers = (arr) => arr.filter(p => {
    const clean = String(p.answer || '').trim();
    return Boolean(clean);
});
const LEVELS = {
    facile:    { emoji: '🟢', label: 'FACILE',    color: '🟢' },
    media:     { emoji: '🟡', label: 'MEDIA',     color: '🟡' },
    difficile: { emoji: '🔴', label: 'DIFFICILE', color: '🔴' },
};

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {
    name: 'indovina_emoji',
    aliases: ['rebus', 'indovinello_emoji', 'emojiquiz'],
    description: "Indovina film/serie/canzoni dai rebus a emoji, con livelli facile/media/difficile. Uso: .indovina_emoji, .indovina_emoji facile",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, reply, services } = context;
        const { db, saveDB, randomChoice, sendButtons } = services;

        if (!isGroup) return reply('Si gioca solo nei gruppi!');

        const q = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = q.split(/\s+/);

        // ── RISPOSTA DA PULSANTE 
        if (w1 === 'risp' && w2) {
            const g = db[from]?.emojiGame;
            if (!g || !g.active) return reply('Nessuna partita attiva. Usa `.indovina_emoji`!');
            try {
                const guess = decodeURIComponent(w2).trim().toLowerCase();
                const correct = String(g.answer).trim().toLowerCase();
                if (guess === correct) {
                    g.active = false;
                    saveDB();
                    // Piccolo premio
                    const u = context.services.getUser(sender, from);
                    const reward = 30;
                    u.money = (u.money || 0) + reward;
                    saveDB();
                    return sendButtons(sock, from,
`✅ *ESATTO!* 🎉

🛑 Era: *${g.answer}*!
💰 Premio: *+${reward}€*
`,
                        [
                            { label: `🔁 Nuova (${LEVELS[g.level]?.label || ''})`, id: `indovina_emoji ${g.level}` },
                            { label: '🏠 Menu', id: 'menu' },
                        ], msg);
                }
                return sendButtons(sock, from,
`❌ *SBAGLIATO!*

Ancora: *${g.emoji}*
💡 Continua a provare!`,
                    [
                        { label: `🟩 Facile`, id: 'indovina_emoji facile' },
                        { label: `🟨 Media`, id: 'indovina_emoji media' },
                        { label: `🟥 Difficile`, id: 'indovina_emoji difficile' },
                    ], msg);
            } catch (_) {
                return reply('❌ Risposta non valida.');
            }
        }

        // ── RIVELA / PASSA 
        if (w1 === 'passa' || w1 === 'rivela' || w1 === 'answer') {
            const g = db[from]?.emojiGame;
            if (!g?.active) return reply('Nessuna partita attiva.');
            g.active = false;
            saveDB();
            return sendButtons(sock, from,
`🏳️ Passo! Era: *${g.answer}*
`,
                [
                    { label: '🔁 Nuova', id: 'indovina_emoji' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── SELEZIONE LIVELLO 
        const level = LEVELS[q];
        if (!level) {
            if (db[from]?.emojiGame?.active && q === '') {
                return reply('🔍 C\'è già un rebus attivo! Rispondi con un pulsante.');
            }
            return sendButtons(sock, from,
`🔮 *INDOVINA L'EMOJI*

Ti lancio un rebus a emoji:
indovina film, serie o canzone!
Scegli la difficoltà:

🟢 Facile · molto noti
🟡 Media · un po' di testa
🔴 Difficile · vero culto!
`,
                [
                    { label: '🟢 Facile', id: 'indovina_emoji facile' },
                    { label: '🟡 Media', id: 'indovina_emoji media' },
                    { label: '🔴 Difficile', id: 'indovina_emoji difficile' },
                ], msg);
        }

        // ── NUOVO REBUS 
        const pool = cleanAnswers(PUZZLES).filter(p => p.level === q || (!q && true));
        const pick = randomChoice(pool.length ? pool : cleanAnswers(PUZZLES));

        // Costruisci le 3 opzioni (1 giusta + 2 dai ferri) e mescola.
        const wrongHints = (pick.hints || []).filter(h => String(h).toLowerCase() !== String(pick.answer).toLowerCase());
        const options = shuffle([pick.answer, ...wrongHints].slice(0, 3));
        if (!options.includes(pick.answer)) options[Math.floor(Math.random() * options.length)] = pick.answer;

        db[from] = db[from] || {};
        db[from].emojiGame = {
            active: true,
            level: q,
            emoji: pick.emoji,
            answer: pick.answer,
            sender,
            timestamp: Date.now(),
        };
        saveDB();

        return sendButtons(sock, from,
`${level.emoji} *EMOJI QUIZ* · ${level.label}

🌠 ${pick.emoji}

Indovina cosa rappresento!
Premi la risposta giusta 👇`,
            options.map(o => ({ label: o.slice(0, 28), id: `indovina_emoji risp ${encodeURIComponent(o)}` })),
            msg);
    },
};