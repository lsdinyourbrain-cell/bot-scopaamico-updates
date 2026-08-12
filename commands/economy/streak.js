'use strict';

module.exports = {
    name: 'streak',
    aliases: ['serie'],
    description: "Ritorna ogni giorno per accumulare la serie di monete: ogni giorno di fila aumenta il premio.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, formatMoney } = services;

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
            return reply(`📅 *STREAK*\n━━━━━━━━━━━━━━━━━━\nHai già ritirato il premio\ndi oggi!\n🔥 Serie: *${count} giorni*\n🕐 Torna domani per\ncontinuare la serie.\n━━━━━━━━━━━━━━━━━━`);
        }

        if (lastKey === yesterdayKey) {
            newCount = count + 1;
            reward = 20 + (newCount - 1) * 5;
        } else {
            newCount = 1;
            reward = 20;
        }

        uDB.streakCount = newCount;
        uDB.streakDay = todayKey;
        uDB.money += reward;
        saveDB();

        const resultText =
`🔥 *STREAK*
━━━━━━━━━━━━━━━━━━
📅 Oggi: ${today.toLocaleDateString('it-IT')}

🔥 Serie: *${newCount}* ${newCount === 1 ? 'giorno' : 'giorni'}
di fila!
${newCount > 1 ? '✨ Serie mantenuta!' : '🆕 Nuova serie iniziata!'}
💰 Premio ritirato: *+${formatMoney(reward)}€*
💳 Saldo attuale: *${formatMoney(uDB.money)}€*
━━━━━━━━━━━━━━━━━━`;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}`, id: `${command}` },
        ], msg);
    },
};