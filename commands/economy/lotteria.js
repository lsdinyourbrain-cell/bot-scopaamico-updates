'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'lotteria',
    aliases: [],
    description: "Compra un biglietto della lotteria (50€).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro, sendButtons } = services;


            const sub = args[0]?.toLowerCase();

            if (sub === 'estrai') {
                if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('La lotteria funziona solo nei gruppi.')}
${boxEnd()}`);
                // Solo l'owner o un admin del gruppo può estrarre il vincitore
                if (!isOwner && !isSenderAdmin) {
                    return reply("⚠️ Solo un *admin del gruppo* (o l'owner)\npuò estrarre il vincitore della lotteria.");
                }
                if (!db[from]?.lotteria) return reply("Nessuna lotteria attiva in questo gruppo.");
                const lotto = db[from].lotteria;
                const players = Object.keys(lotto.tickets);
                if (players.length === 0) return reply("Nessuno ha comprato biglietti.");
                let meta = null;
                try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
                const winner = players[Math.floor(Math.random() * players.length)];
                const premio = Math.floor(lotto.pool);
                const wDB = getUser(winner, from);
                wDB.money += premio;
                delete db[from].lotteria;
                saveDB();
                return await sock.sendMessage(from, {
                    text: `🎉 *_VINCITORE LOTTERIA!_*\n━━━━━━━━━━━━━━\n▸ 🏆 @${dispOf(winner, resolveJid(winner, meta))} vince _${premio}€_!\n▸ 🎟️ Biglietti: _${lotto.tickets[winner]}_\n━━━━━━━━━━━━━━\n`,
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
            await sendButtons(sock, from, `🎟️ *_LOTTERIA_*\n━━━━━━━━━━━━━━\n▸ ✅ Hai comprato un biglietto!\n▸ 🎟️ Totale tuoi: _${lotto.tickets[sender]}_\n▸ 💰 Montepremi: _${poolFinale}€_\n━━━━━━━━━━━━━━\n`, [
                { label: '.lotteria', id: 'lotteria' },
                { label: '.lotteria estrai', id: 'lotteria estrai' },
            ], msg);
    },
};
