'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'tombola',
    aliases: ['bingo', 'cartella'],
    description: "Estrai una cartella della tombola e controlla se hai fatto qualche vincita.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt } = services;

        const cooldownKey = 'tombola';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
        const cdMs = 15000;
        if (now - last < cdMs) {
            const remain = Math.ceil((cdMs - (now - last)) / 1000);
            return reply(`${sec('TOMBOLA')}\n${boxOpen()}\n${line(`⏳ L'estrazione sta ancora girando. Riprova tra *${remain}s*.`)}\n${boxEnd()}`);
        }
        userData.cooldowns[cooldownKey] = now;

        const uDB = getUser(sender, from);
        const costo = 15;
        if (uDB.money < costo) return reply(`${sec('TOMBOLA')}\n${boxOpen()}\n${line(`❌ Costa *${costo}€* estrarre una cartella. Saldo: *${uDB.money}€*.`)}\n${boxEnd()}`);

        uDB.money -= costo;

        // Cartella 3x5 con 15 numeri estratti da 1-90 senza ripetizioni
        const numeri = [];
        while (numeri.length < 15) {
            const n = randomInt(1, 90);
            if (!numeri.includes(n)) numeri.push(n);
        }

        // Estrazione di 8 numeri casuali
        const estratti = [];
        const pool = Array.from({ length: 90 }, (_, i) => i + 1);
        while (estratti.length < 8) {
            const i = randomInt(0, pool.length - 1);
            estratti.push(pool.splice(i, 1)[0]);
        }

        const inCartella = numeri.filter(n => estratti.includes(n));
        const pieni = (inCartella.length / 2) | 0; // ogni coppia vale una vincita

        let vincita = 0;
        if (inCartella.length >= 8) vincita = 500;
        else if (pieni >= 3) vincita = 100;
        else if (pieni >= 1) vincita = 25;

        uDB.money += vincita;
        saveDB();

        const righe = [];
        for (let r = 0; r < 3; r++) {
            const row = numeri.slice(r * 5, r * 5 + 5);
            righe.push(row.map(n => estratti.includes(n) ? `▣` : n.toString().padStart(2, '0')).join(' · '));
        }

        const resultText = `${sec('TOMBOLA')}\n${boxOpen()}\n${line(righe[0])}\n${line(righe[1])}\n${line(righe[2])}\n${line('')}\n${line(`Numeri estratti: _${estratti.join(' ')}_` )}\n${line(`In cartella: _${inCartella.length}_`)}\n${line(vincita > 0 ? `🎉 Vincita: +${vincita}€!` : '😿 Nessuna vincita.')}\n${line(`Saldo: _${uDB.money}€_`)}\n${boxEnd()}`;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
        ], msg);
    },
};
