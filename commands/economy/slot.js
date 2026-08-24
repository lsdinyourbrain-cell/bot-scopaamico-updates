'use strict';

const { toDarkFont } = require('../../lib/font');
const EV = require('../../lib/events');

module.exports = {
    name: 'slot',
    aliases: [],
    description: "Esegue il comando .slot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons, applyTax } = services;



            const puntata = 20;
            const uDB     = getUser(sender, from);
            if (uDB.money < puntata) return reply(`❌ Costa _${puntata}€_ girare la slot. Saldo attuale: _${uDB.money}€_.`);

            uDB.money -= puntata;
            const icone = ['🍒', '🍋', '🔔', '💎', '🍉'];
            const r     = [0, 1, 2].map(() => icone[Math.floor(Math.random() * icone.length)]);

            let win = 0;
            if (r[0] === r[1] && r[1] === r[2]) win = 100;
            else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) win = 40;
            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            win = win * evMult;

            const taxed = applyTax(win, uDB.money);
            uDB.money += taxed.net;
            saveDB();

            const frasiIronicheSlot = [
                "Sei il Robin Hood del gruppo, rubi ai poveri per dare a te stesso 😏",
                "Hai le mani più veloci di un borseggiatore a Napoli 🏃‍♂️",
                "A questo punto potresti comprare il gruppo... o rapinarlo direttamente 🏦💰",
                "Sei così ricco che la slot ti paga l'affitto 😂",
                "Hai più soldi di Paperone, ma continui a giocare come un ragazzino 🦆💸",
                "Attento, con tutto quel malloppo la Finanza ti sta già cercando 🕵️‍♂️"
            ];
            const extraRiccoSlot = uDB.money > 5000 ? `\n▸ _${frasiIronicheSlot[Math.floor(Math.random()*frasiIronicheSlot.length)]}_` : '';

            const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';
            const evLine = evMult > 1 && win > 0 ? `\n▸ 🎰 _Evento: vincita x${evMult}_` : '';
            const risultato = win > 0 ? `🎊 Vinci ${win}€!` : `💀 Hai perso ${puntata}€`;

            const resultText =
`🎰 _[ ${r[0]} | ${r[1]} | ${r[2]} ]_
▸ ${risultato}${evLine}${extraRiccoSlot}
▸ ${win > 0 ? `Lordo: _+${win}€_ ▸ Netto: _+${taxed.net}€_${taxLine}\n▸ Saldo: _${uDB.money}€_` : `Saldo: _${uDB.money}€_`}
▸ Vex Bot`;
            await sendButtons(sock, from, toDarkFont(resultText), [
                { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
            ], msg);
    },
};
