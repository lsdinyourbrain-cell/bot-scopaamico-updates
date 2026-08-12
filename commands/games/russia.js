'use strict';

module.exports = {
    name: 'russia',
    aliases: ['revolver', 'roulettarussa'],
    description: "Roulette russa: un colpo su sei è fatale, premio 5x la puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt, formatMoney } = services;

        const cooldownKey = 'russia';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
        const cdMs = 10000;
        if (!isButton && now - last < cdMs) {
            const remain = Math.ceil((cdMs - (now - last)) / 1000);
            return reply(`⏳ Calma! Devi ancora riprenderti. Riprova tra *${remain}s*.`);
        }
        userData.cooldowns[cooldownKey] = now;

        const puntata = parseInt(args[0]);
        if (isNaN(puntata) || puntata < 10) return reply("❌ Puntata non valida (minimo 10€).\n👉 *Uso:* `.russia 100`");

        const uDB = getUser(sender, from);
        if (uDB.money < puntata) return reply(`❌ Saldo insufficiente. Hai *${uDB.money}€*.`);

        // 1 colpo su 6 è fatale; il premio è 5x la puntata
        const fatale = randomInt(1, 6) === 1;
        if (fatale) uDB.money -= puntata;
        else uDB.money += puntata * 5;
        saveDB();

        const resultText =
`🔫 *ROULETTE RUSSA*
━━━━━━━━━━━━━━━━━━
🎯 Carichi il revolver e
premi il grilletto...

${fatale ? '💥 *BANG!* Colpito!' : '😅 *CLACK!* Sei vivo!'}

${fatale ? `❌ Perduti: -${formatMoney(puntata)}€` : `✅ Vincita: +${formatMoney(puntata * 5)}€`}
💰 *Saldo:* ${formatMoney(uDB.money)}€
━━━━━━━━━━━━━━━━━━`;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
        ], msg);
    },
};