'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDarkFont } = require('../../lib/font');

module.exports = {
    name: 'streak',
    aliases: ['serie'],
    description: "Ritorna ogni giorno per accumulare la serie di monete: ogni giorno di fila aumenta il premio.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, formatMoney, applyTax } = services;

        const uDB = getUser(sender, from);

        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);

        const lastKey = uDB.streakDay || null;
        const count = uDB.streakCount || 0;

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);

        let newCount = count;
        let reward = 0;

        if (lastKey === todayKey) {
            // Già preso oggi: nessun premio, mostra solo lo stato
            return reply(`${sec('STREAK')}\n${boxOpen()}\n${line(`⏳ Hai già ritirato il premio di oggi!`)}\n${line(`🔥 Serie: _${count} giorni_`)}\n${line('🕐 Torna domani per continuare la serie.')}\n${boxEnd()}`);
        }

        if (lastKey === yesterdayKey) {
            newCount = count + 1;
            reward = 10 + (newCount - 1) * 3;
        } else {
            newCount = 1;
            reward = 10;
        }

        uDB.streakCount = newCount;
        uDB.streakDay = todayKey;
        const taxed = applyTax(reward, uDB.money);
        uDB.money += taxed.net;
        saveDB();

        const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';

        const resultText = `${sec('STREAK')}\n${boxOpen()}\n${line(`🔥 Streak: ${newCount} ${newCount === 1 ? 'giorno' : 'giorni'}${newCount > 1 ? ' ✨' : ' 🆕'}`)}\n${line(`${sec('INFO')}\n${boxOpen()}\n${line(`Lordo: _+${formatMoney(reward)}€_ ▸ Netto: _+${formatMoney(taxed.net)}€_${taxLine}`)}\n${boxEnd()}`)}\n${line(`Saldo: _${uDB.money}€_`)}\n${boxEnd()}`;

        await sendButtons(sock, from, toDarkFont(resultText), [
            { label: `.${command}`, id: `${command}` },
        ], msg);
    },
};