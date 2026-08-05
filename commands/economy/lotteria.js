'use strict';

module.exports = {
    name: 'lotteria',
    aliases: [],
    description: "Compra un biglietto della lotteria (50€).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const sub = args[0]?.toLowerCase();

            if (sub === 'estrai') {
                if (!db[from]?.lotteria) return reply("Nessuna lotteria attiva in questo gruppo.");
                const lotto = db[from].lotteria;
                const players = Object.keys(lotto.tickets);
                if (players.length === 0) return reply("Nessuno ha comprato biglietti.");
                const winner = players[Math.floor(Math.random() * players.length)];
                const premio = Math.floor(lotto.pool);
                const wDB = getUser(winner, from);
                wDB.money += premio;
                delete db[from].lotteria;
                saveDB();
                return await sock.sendMessage(from, {
                    text: `🎉 *LOTTERIA — VINCITORE!* 🎉\n\n🏆 @${winner.split('@')[0]} vince *${premio}€*!\n🎟️ Biglietti: ${lotto.tickets[winner]}`,
                    mentions: [winner],
                });
            }

            const costo = 50;
            const uDB = getUser(sender, from);
            if (uDB.money < costo) return reply(`Il biglietto costa ${costo}€. Ne hai solo ${uDB.money}€.`);

            uDB.money -= costo;

            if (!db[from]) db[from] = {};
            if (!db[from].lotteria) db[from].lotteria = { pool: 0, tickets: {} };

            const lotto = db[from].lotteria;
            lotto.pool += costo * 0.8;
            if (!lotto.tickets[sender]) lotto.tickets[sender] = 0;
            lotto.tickets[sender]++;
            saveDB();

            const poolFinale = Math.floor(lotto.pool);
            await sendButtons(sock, from, `🎟️ *LOTTERIA!*\n\nHai comprato un biglietto! (${lotto.tickets[sender]} totale)\n💰 Montepremi: *${poolFinale}€*`, [
                { label: '🎟️ .lotteria', id: 'lotteria' },
                { label: '🏆 .lotteria estrai', id: 'lotteria estrai' },
            ], msg);
    },
};
