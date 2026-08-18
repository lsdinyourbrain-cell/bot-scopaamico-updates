'use strict';

const EV = require('../../lib/events');

module.exports = {
    name: 'russia',
    aliases: ['revolver', 'roulettarussa'],
    description: "Roulette russa: 4 colpi su 6 sono fatali, premio 2x la puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt, db, formatMoney } = services;

        const cooldownKey = 'russia';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
const cdMs = 10000;
            if (now - last < cdMs) {
                const remain = Math.ceil((cdMs - (now - last)) / 1000);
                return reply(`⏳ Calma! Devi ancora riprenderti. Riprova tra *${remain}s*.`);
            }
            userData.cooldowns[cooldownKey] = now;

            const puntata = parseInt(args[0]);
            if (isNaN(puntata) || puntata < 10) return reply("⚠️ _[uso]: puntata non valida (minimo 10€) — .russia 100_");
            if (puntata > 1_000_000) return reply("⚠️ Puntata massima: *1.000.000€*.");

            const uDB = getUser(sender, from);
            if (uDB.money < puntata) return reply(`❌ Saldo insufficiente. Hai *${uDB.money}€*.`);

            // 4 colpi su 6 sono fatali; se sopravvivi il premio è 2x la puntata
            // (x3 con l'evento slotoro attivo)
            const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
            const fatale = randomInt(1, 6) <= 4;
            if (fatale) uDB.money -= puntata;
            else uDB.money += puntata * 2 * evMult;
        saveDB();

        const resultText =
`🔫 *_ROULETTE RUSSA_*
━━━━━━━━━━━━━━
Carichi il revolver e
premi il grilletto...

${fatale ? '💥 *BANG!* Colpito!' : '😅 *CLACK!* Sei vivo!'}

${fatale ? `❌ Perduti: -${formatMoney(puntata)}€` : `✅ Vincita: +${formatMoney(puntata * 2 * evMult)}€${evMult > 1 ? ' (x3 slotoro 🎰)' : ''}`}
▸ *Saldo:* _${formatMoney(uDB.money)}€_
◈ _Vex Bot_`;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
        ], msg);
    },
};