'use strict';

const wyrQuestions = [
    "Preferiresti essere invisibile o poter volare?",
    "Preferiresti leggere le menti o viaggiare nel tempo?",
    "Preferiresti avere un milione di euro o saper parlare tutte le lingue?",
    "Preferiresti vivere senza internet o senza cibo cucinato?",
    "Preferiresti essere ricco e triste o povero e felice?",
    "Preferiresti fare sempre freddo o sempre caldo?",
    "Preferiresti non dormire mai o mangiare solo la stessa cosa per sempre?",
    "Preferiresti sapere quando morirai o come morirai?",
    "Preferiresti essere il più intelligente del mondo o il più forte?",
    "Preferiresti non avere amici ma avere tutto o avere amici ma non avere niente?",
    "Preferiresti poter parlare con gli animali o parlare tutte le lingue?",
    "Preferiresti diventare famoso o rendere famoso qualcun altro?",
    "Preferiresti non invecchiare mai o non ammalarti mai?",
    "Preferiresti rivivere il passato o vedere il futuro?",
    "Preferiresti essere super forte o super veloce?",
    "Preferiresti cantare come un angelo o ballare come un professionista?",
    "Preferiresti vivere sulla luna o su Marte?",
    "Preferiresti avere un drone personale o un robot domestico?",
    "Preferiresti essere un personaggio dei cartoni o un personaggio dei film?",
    "Preferiresti poter respirare sott'acqua o poter volare?",
];

module.exports = {
    name: 'wyr',
    aliases: ['preferisci', 'wouldyourather'],
    description: "Una domanda 'Preferiresti?' random.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        const q = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];
        await reply(`🤔 *Preferiresti...*\n\n_“${q}”_\n\nRispondi con 1️⃣ o 2️⃣!`);
    },
};
