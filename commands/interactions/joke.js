'use strict';

const jokes = [
    "Perché i programmatori confondono Halloween con Natale? Perché Oct 31 = Dec 25! 🎃🎄",
    "Cosa fa un pesce quando è arrabbiato? Si agita! 🐟😤",
    "Perché il pollo ha attraversato la strada? Per arrivare dall'altra parte! 🐔",
    "Cosa dice un calamaro quando si arrabbia? Mi hai stufato! 🦑🔥",
    "Perché i fantasimi sono così cattivi a mentire? Perché sono trasparenti! 👻",
    "Qual è il colmo per un giardiniere? Avere i pollice nero! 🌱",
    "Cosa fa un cane con un trapano? Fora! 🐕🔧",
    "Perché il libro di matematica è triste? Perché ha troppi problemi! 📚😢",
    "Qual è il colmo per un muratore? Avere i calcoli renali! 🧱",
    "Cosa dice una foglia all'autunno? Mi sono rotta il ramo... ti lascio! 🍂",
    "Perché il caffè non va mai dal dottore? Perché è sempre macinato! ☕",
    "Qual è l'animale più disordinato? Il ca-porco-spino! 🦔",
    "Perché il mare è blu? Perché i pesci fanno blu blu! 🌊🐠",
    "Cosa fa un sommergibile quando è annoiato? La capa-sot-tuffa! 🚤",
    "Perché gli uccelli non usano i social? Perché hanno già Twitter! 🐦",
    "Qual è il colmo per un elettricista? Avere la corrente alternata! ⚡",
    "Perché la banana va dal dottore? Perché non si sfoglia bene! 🍌",
    "Cosa dice un semaforo all'altro? Non guardarmi che sto cambiando! 🚦",
    "Perché il carbone è così triste? Perché quando si arrabbia carbonizza tutto! 💀",
    "Cosa fa un gatto quando cade? Miao... che botta! 🐱💥",
];

module.exports = {
    name: 'joke',
    aliases: ['barzelletta', 'ridere'],
    description: "Racconta una barzelletta random.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await sendButtons(sock, from, `😂 *Barzelletta:*\n\n${joke}`, [
            { label: '.joke', id: 'joke' },
        ], msg);
    },
};
