'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDarkFont } = require('../../lib/font');
const EV = require('../../lib/events');

module.exports = {
    name: 'work',
    aliases: ['lavora', 'turno'],
    description: "Lavora un turno per guadagnare monete (cooldown di 20 minuti).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt, randomChoice, formatMoney, applyTax, db } = services;

        const cooldownKey = 'work';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
        const cdMs = 20 * 60 * 1000;
        // Il pulsante "Nuovo turno" NON bypassa il cooldown (niente farming).
        if (now - last < cdMs) {
            const remain = Math.ceil((cdMs - (now - last)) / 60000);
            return reply(`${sec('ATTESA')}\n${boxOpen()}\n${line(`⏳ Hai appena finito un turno!`)}\n${line(`😴 Riposa per ancora _${remain} minuti_.`)}\n${boxEnd()}`);
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

        // Eventi casuali del turno: fortuna, straordinario o giornata storta.
        const roll = Math.random();
        let event = null;
        if (roll < 0.10) {
            event = { label: '🔥 STRAORDINARIO!', mult: 2, emoji: '🔥' };
        } else if (roll < 0.30) {
            event = { label: '😎 Mancia del capo!', mult: 1.5, emoji: '😎' };
        } else if (roll < 0.40) {
            event = { label: '😤 Giornata storta...', mult: 0.5, emoji: '😤' };
        }

        const lavoro = randomChoice(lavori);
        const base = lavoro.paga();
        const evMult = EV.isActive(db, from, 'doppioguadagno') ? 2 : 1;
        const gross = Math.max(1, Math.round(base * (event ? event.mult : 1) * evMult));
        const taxed = applyTax(gross, userData.money);
        userData.money += taxed.net;
        saveDB();

        const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';
        const eventLine = event ? line(`${event.emoji} _${event.label}_`) : '';
        const evLine = evMult > 1 ? line(`💰 _Evento: guadagno x${evMult}_`) : '';

        const resultText = `${sec('WORK')}\n${boxOpen()}\n${line(`💼 _${lavoro.emoji} ${lavoro.nome}_`)}\n${line(`Lordo: _+${formatMoney(gross)}€_ ▸ Netto: _+${formatMoney(taxed.net)}€_${taxLine}`)}\n${event ? eventLine : ''}\n${evMult > 1 ? evLine : ''}\n${line(`Saldo: _${formatMoney(userData.money)}€_ | Prossimo turno: _20 minuti_` )}\n${boxEnd()}`;

        await sendButtons(sock, from, toDarkFont(resultText), [
            { label: `💼 Nuovo turno`, id: `.${command}` },
        ], msg);
    },
};
