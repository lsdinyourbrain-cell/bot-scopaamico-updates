'use strict';

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
            return reply(`⏳ Hai già ritirato il premio di oggi!\n▸ 🔥 Serie: _${count} giorni_\n▸ 🕐 Torna domani per continuare la serie.`);
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

        const resultText =
`🔥 _Streak: ${newCount} ${newCount === 1 ? 'giorno' : 'giorni'}_${newCount > 1 ? ' ✨' : ' 🆕'}
▸ Lordo: _+${formatMoney(reward)}€_ ▸ Netto: _+${formatMoney(taxed.net)}€_${taxLine}
▸ Saldo: _${uDB.money}€_
▸ Vex Bot`;;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}`, id: `${command}` },
        ], msg);
    },
};