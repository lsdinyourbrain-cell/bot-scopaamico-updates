'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const EV = require('../../lib/events');

module.exports = {
    name: 'roulette',
    aliases: [],
    description: "Esegue il comando .roulette.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const puntata = Number.parseInt(args[0], 10);
            if (!Number.isInteger(puntata) || puntata <= 0) {
                const t = `${sec('🎰 ROULETTE GLASS')}\n${boxOpen()}\n${line('💎 Uso: *.roulette <importo>* ✨')}\n${line('💫 Esempio: _.roulette 50_ 🔮')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            if (puntata > 1_000_000) {
                const t = `${sec('🎰 ROULETTE')}\n${boxOpen()}\n${line('💎 Puntata max _1.000.000€_ ✨')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t }, { quoted: msg });
            }
            const uDB = getUser(sender, from);
            if (uDB.money < puntata) {
                const t = `${sec('💸 FONDI INSUFFICIENTI')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — hai _${formatMoney(uDB.money)}_ 💫`)}\n${line('🔮 _Servono più fondi per girare_')}\n${boxEnd()}`;
                return sock.sendMessage(from, { text: t, mentions: [sender] }, { quoted: msg });
            }

            const win = Math.random() < 0.47;
            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            uDB.money += win ? puntata * evMult : -puntata;
            saveDB();

            const resultText = `${sec(win ? '🎰 ROULETTE WIN' : '🎰 ROULETTE GLASS')}\n${boxOpen()}\n${line(`💎 @${dispOf(sender)} — _${formatMoney(puntata)}_ puntati ✨`)}\n${line(win ? `✨ _È uscito il tuo numero!_ 💫` : `🫠 _Giro storto, riprova_ 💎`)}\n${evMult>1 && win ? line(`🎰 Evento _x${evMult}_ 🔮`) : ''}\n${line(`💳 Saldo: _${formatMoney(uDB.money)}_ • 🎰 glass spin`)}\n${boxEnd()}`;
            await sendButtons(sock, from, resultText, [
                { label: `🎰 Rigioca ${puntata} ✨`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
