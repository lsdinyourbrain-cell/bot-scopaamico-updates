'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const facts = [
    "I polpi hanno tre cuori. ❤️❤️❤️",
    "Un gruppo di fenici si chiama 'fiammata'. 🔥",
    "Le banane sono bacche, ma le fragole no. 🍌",
    "Il miele non scade mai. 🍯",
    "Gli occhi di uno struzzo sono più grandi del suo cervello. 👀",
    "Un giorno su Venere è più lungo di un anno su Venere. 🌍",
    "Gli orsi polari sono mancini. 🐻‍❄️",
    "Le formiche non dormono mai. 🐜",
    "Il cuore di un gamberetto è nella sua testa. 🦐",
    "L'acqua calda gela più velocemente di quella fredda (Effetto Mpemba). 💧",
    "Le mucche hanno migliori amiche e si stressano se separate. 🐄",
    "La lingua di una balenottera azzurra pesa quanto un elefante. 🐋",
    "Un fulmine è più caldo della superficie del sole. ⚡",
    "I gatti non possono gustare i sapori dolci. 🐱",
    "Le api possono riconoscere i volti umani. 🐝",
    "Il 90% della vitamina D nel tuo corpo viene dal sole. ☀️",
    "Ci sono più alberi sulla Terra che stelle nella Via Lattea. 🌳",
    "Il sangue umano può percorrere 96.000 km al giorno. 🩸",
    "Un litro di acqua di mare contiene circa 35 grammi di sale. 🌊",
    "I canguri non possono camminare all'indietro. 🦘",
];

module.exports = {
    name: 'fact',
    aliases: ['curiosita', 'sapevi'],
    description: "Mostra una curiosità random.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;

        const fact = facts[Math.floor(Math.random() * facts.length)];
        await sendButtons(sock, from, `${sec('LO SAPEVI')}\n${boxOpen()}\n${line(`_${fact}_`)}\n${boxEnd()}`, [
            { label: '.fact', id: 'fact' },
        ], msg);
    },
};
