'use strict';

module.exports = {
    name: 'work',
    aliases: ['lavora', 'turno'],
    description: "Lavora un turno per guadagnare monete (cooldown di 20 minuti).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt, randomChoice, formatMoney, applyTax } = services;

        const cooldownKey = 'work';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
        const cdMs = 20 * 60 * 1000;
        if (!isButton && now - last < cdMs) {
            const remain = Math.ceil((cdMs - (now - last)) / 60000);
            return reply(`⏳ Hai appena finito un turno!\n😴 Riposa per ancora _${remain} minuti_.`);
        }
        userData.cooldowns[cooldownKey] = now;

        const lavori = [
            { emoji: '⚙️', nome: 'in fabbrica', paga: () => randomInt(30, 90) },
            { emoji: '🍔', nome: 'al fast food', paga: () => randomInt(20, 60) },
            { emoji: '👨‍💻', nome: 'da programmatore', paga: () => randomInt(60, 150) },
            { emoji: '🧑‍🌾', nome: 'in campagna', paga: () => randomInt(25, 70) },
            { emoji: '📦', nome: 'in magazzino', paga: () => randomInt(30, 80) },
            { emoji: '🛵', nome: 'da rider', paga: () => randomInt(20, 70) },
            { emoji: '🎓', nome: 'da tutor', paga: () => randomInt(40, 100) },
            { emoji: '🕵️', nome: 'da detective', paga: () => randomInt(50, 130) },
        ];

        const lavoro = randomChoice(lavori);
        const uDB = getUser(sender, from);
        const gross = lavoro.paga();
        const taxed = applyTax(gross, uDB.money);
        uDB.money += taxed.net;
        saveDB();

        const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';

        const resultText =
`💼 _${lavoro.emoji} ${lavoro.nome}_
▸ Lordo: _+${formatMoney(gross)}€_ ▸ Netto: _+${formatMoney(taxed.net)}€_${taxLine}
▸ Saldo: _${formatMoney(uDB.money)}€_ | Prossimo turno: _20 minuti_
▸ Vex Bot`;

        await sendButtons(sock, from, resultText, [
            { label: `💼 Nuovo turno`, id: `.${command}` },
        ], msg);
    },
};