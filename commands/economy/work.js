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
            { emoji: '⚙️', nome: 'in fabbrica', paga: () => randomInt(80, 180) },
            { emoji: '🍔', nome: 'al fast food', paga: () => randomInt(50, 120) },
            { emoji: '👨‍💻', nome: 'da programmatore', paga: () => randomInt(140, 300) },
            { emoji: '🧑‍🌾', nome: 'in campagna', paga: () => randomInt(60, 140) },
            { emoji: '📦', nome: 'in magazzino', paga: () => randomInt(70, 150) },
            { emoji: '🛵', nome: 'da rider', paga: () => randomInt(55, 130) },
            { emoji: '🎓', nome: 'da tutor', paga: () => randomInt(90, 190) },
            { emoji: '🕵️', nome: 'da detective', paga: () => randomInt(120, 250) },
        ];

        const lavoro = randomChoice(lavori);
        const uDB = getUser(sender, from);
        const gross = lavoro.paga();
        const taxed = applyTax(gross, uDB.money);
        uDB.money += taxed.net;
        saveDB();

        const taxLine = taxed.tax > 0
            ? `\n▸ 🏛️ *Tassa:* _-${taxed.tax}€_ (${taxed.rate}%)`
            : '';

        const resultText =
`╔════════════════════╗
▸ 🧑‍💼 Hai lavorato: _${lavoro.emoji} ${lavoro.nome}_
╚════════════════════╝
▸ 💵 *Retribuzione lorda:* _+${formatMoney(gross)}€_
▸ 💳 *Entrate nette:* _+${formatMoney(taxed.net)}€_
${taxLine}
▸ 💰 *Saldo attuale:* _${formatMoney(uDB.money)}€_
▸ ⏳ Prossimo turno: _20 minuti_
◈ _Vex Bot_`;

        await sendButtons(sock, from, resultText, [
            { label: `💼 Nuovo turno`, id: `.${command}` },
        ], msg);
    },
};