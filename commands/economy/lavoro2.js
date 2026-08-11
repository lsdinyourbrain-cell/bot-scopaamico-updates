'use strict';

// Secondo lavoro: un "lavoretto freelance" con un mini-racconto e una paga
// più alta (cooldown di 45 minuti). Storia della carriera in userData.lavoro2.

const GIGS = [
    { emoji: '🛠️', nome: 'da idraulico', tip: () => ['hai riparato una tubatura in tilt', 'hai sostituito un rubinetto trappola', 'hai sistemato lo scaldabagno esploso'] },
    { emoji: '🎨', nome: 'da grafico', tip: () => ['hai rifatto la grafica di una pizzeria', 'hai disegnato una mascotte indecente', 'hai creato un logo con troppo neon'] },
    { emoji: '🧹', nome: 'da pulizia straordinaria', tip: () => ['hai pulito un ufficio al limite del biohazard', 'hai smacchiato un tappeto misterioso', 'hai lucidato una vetrina grattandola'] },
    { emoji: '🚚', nome: 'da corriere notturno', tip: () => ['hai consegnato 47 pacchi in 2 ore', 'hai trasportato un divano per 12 piani senza ascensore', 'hai guidato un furgone con la radio rotta'] },
    { emoji: '👨‍🍳', nome: 'da chef al volante', tip: () => ['hai preparato 80 panini per un matrimonio', 'hai grigliato 10 kg di stracchino (non chiedere)', 'hai inventato un piatto che nessuno ha capito ma era buono'] },
    { emoji: '🪴', nome: 'da giardiniere', tip: () => ['hai potato una siepe ribelle', 'hai trapiantato un albero di 3 metri', 'hai creato un orto in un poggiolo minuscolo'] },
];

module.exports = {
    name: 'lavoro2',
    aliases: ['lavoretto', 'freelance'],
    description: "Fai un lavoretto freelance con storie, paga più alta e cooldown di 45 minuti. Uso: .lavoro2",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, reply, services } = context;
        const { getUser, saveDB, randomChoice, randomInt, formatMoney, sendButtons } = services;

        const userData = getUser(sender, from);
        userData.cooldowns = userData.cooldowns || {};
        const last = userData.cooldowns.lavoro2 || 0;
        const now = Date.now();
        const CD_MS = 45 * 60 * 1000;
        if (now - last < CD_MS) {
            const mins = Math.ceil((CD_MS - (now - last)) / 60000);
            return reply(`⏳ Hai già lavorato al lavoretto!\n☕ Riposa per ancora *${mins} minuti*.`);
        }
        userData.cooldowns.lavoro2 = now;

        const gig = randomChoice(GIGS);
        const roll = Math.random();
        const guadagno = roll < 0.1 ? randomInt(40, 90) : roll > 0.85 ? randomInt(480, 650) : randomInt(150, 450);
        const bonus = roll > 0.85;

        userData.money += guadagno;
        userData.lavoro2 = userData.lavoro2 || { giorni: 0, guadagnato: 0 };
        userData.lavoro2.giorni += 1;
        userData.lavoro2.guadagnato += guadagno;
        saveDB();

        const text =
`╔══════════════════════════════╗
║       💪 *LAVORETTO* 💪
╠══════════════════════════════╣
║  ${gig.emoji} Oggi ${gig.nome}:
║  _${randomChoice(gig.tip())}._
║
║  ${bonus ? '🔥 *CRITICO!* Paga massima!' : ''}
║  💰 Guadagno: *+${formatMoney(guadagno)}*
║
║  💳 Saldo: *${formatMoney(userData.money)}*
║
║  🧾 Carriera: ${userData.lavoro2.giorni} lavoretti,
║     ${formatMoney(userData.lavoro2.guadagnato)} accumulati
╠══════════════════════════════╣
║  ⏳ Nuovo lavoretto tra 45 minuti
╚══════════════════════════════╝`;

        await sendButtons(sock, from, text, [
            { label: `💪 Altro lavoretto`, id: `.${command}` },
        ], msg);
    },
};