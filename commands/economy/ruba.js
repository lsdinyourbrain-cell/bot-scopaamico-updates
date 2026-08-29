'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { dispOf, resolveJid } = require('../../lib/jid');

module.exports = {
    name: 'ruba',
    aliases: [],
    description: "Tenta di rubare soldi a un utente.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sleep, claimBounty, getBounty, removeBounty, bestemmiometro } = services;


            if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('Funziona solo nei gruppi.')}
${boxEnd()}`);
            if (!targetJid) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: .ruba @utente')}
${boxEnd()}`);
            if (sameJid(sender, targetJid)) return reply("Non puoi rubare a te stesso, scemo 😂");

            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

            const targetData = getUser(targetJid, from);
            const thiefData = getUser(sender, from);

            if (targetData.money < 10) {
                return await sock.sendMessage(from, {
                    text: `@${disp(targetJid)} è al verde, non ha niente da rubare! 🍃`,
                    mentions: [targetJid],
                });
            }

            const frasiIroniche = [
                "Sei il Robin Hood del gruppo, rubi ai poveri per dare a te stesso 😏",
                "Hai le mani più veloci di un borseggiatore a Napoli 🏃‍♂️",
                "A questo punto potresti comprare il gruppo... o rapinarlo direttamente 🏦💰",
                "Sei così ricco che la banca ti chiama per chiedere prestiti 😂",
                "Hai più soldi di Paperone, ma continui a rubare come un ragazzino 🦆💸",
                "Attento, con tutto quel malloppo la Finanza ti sta già cercando 🕵️‍♂️"
            ];
            const pickFrase = () => frasiIroniche[Math.floor(Math.random() * frasiIroniche.length)];

            const success = Math.random() < 0.45;
            if (!success) {
                const penalty = Math.floor(Math.random() * 30) + 10;
                thiefData.money = Math.max(0, thiefData.money - penalty);
                saveDB();
                const isRiccoFail = (thiefData.money > 5000) || ((thiefData.totaleRubato || 0) > 5000);
                const extraFail = isRiccoFail ? `\n▸ _${pickFrase()}_` : '';
                return reply(
`🚔 *_BECCATO!_*
▸ 😱 Il proprietario ti ha fatto una multa di _${penalty}€_!${extraFail}
▸ 💰 Saldo: _${thiefData.money}€_
`);
            }

            const stolen = Math.min(targetData.money, Math.floor(Math.random() * 100) + 20);
            targetData.money -= stolen;
            thiefData.money += stolen;
            thiefData.totaleRubato = (thiefData.totaleRubato || 0) + stolen;
            saveDB();

            const isRicco = (thiefData.money > 5000) || (thiefData.totaleRubato > 5000);
            const extraRicco = isRicco ? `\n▸ _${pickFrase()}_` : '';
            await sock.sendMessage(from, {
                text: `🕵️ *_FURTO!_*\n━━━━━━━━━━━━━━\n▸ 💀 @${disp(sender)} ha rubato _${stolen}€_ a @${disp(targetJid)}!${extraRicco}\n━━━━━━━━━━━━━━\n▸ 💰 Il tuo saldo: _${thiefData.money}€_\n`,
                mentions: [sender, targetJid],
            });
    },
};
