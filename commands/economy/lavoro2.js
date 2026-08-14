'use strict';

// Secondo lavoro: un "lavoretto freelance" con un mini-racconto e una paga
// più alta (cooldown di 45 minuti). Storia della carriera in userData.lavoro2.

const GIGS = [
    { emoji: '🛠️', nome: 'da idraulico', tip: () => ['hai riparato un tubo in tilt', 'hai tolto un rubinetto trappola', 'hai sistemato lo scaldabagno'] },
    { emoji: '🎨', nome: 'da grafico', tip: () => ['hai rifatto la grafica del bar', 'hai disegnato la mascotte pazza', 'hai creato un logo troppo neon'] },
    { emoji: '🧹', nome: 'da pulizia straordinaria', tip: () => ['hai pulito un ufficio biohazard', 'hai smacchiato un bel tappeto', 'hai lucidato una vetrina sporca'] },
    { emoji: '🚚', nome: 'da corriere notturno', tip: () => ['hai consegnato 47 pacchi in 2 ore', 'hai portato un divano a braccia', 'hai guidato un furgone scassato'] },
    { emoji: '👨‍🍳', nome: 'da chef al volante', tip: () => ['hai preparato 80 panini al volo', 'hai grigliato 10 kg di cacio', 'hai inventato un piatto strano'] },
    { emoji: '🪴', nome: 'da giardiniere', tip: () => ['hai potato una siepe ribelle', 'hai trapiantato un albero alto', 'hai creato un orto in miniatura'] },
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
`💪 *_LAVORETTO_*
━━━━━━━━━━━━━━
▸ ${gig.emoji} Oggi ${gig.nome}:
▸ _${randomChoice(gig.tip())}._
${bonus ? '▸ 🔥 *_CRITICO! Paga massima!_*\n' : ''}▸ 💰 Guadagno: _+${formatMoney(guadagno)}_
━━━━━━━━━━━━━━
▸ 💳 Saldo: _${formatMoney(userData.money)}_
▸ 🧾 Carriera: _${userData.lavoro2.giorni} lavoretti_, _${formatMoney(userData.lavoro2.guadagnato)}_ accumulati
▸ ⏳ Nuovo lavoretto tra 45 minuti
◈ _Vex Bot_`;

        await sendButtons(sock, from, text, [
            { label: `💪 Altro lavoretto`, id: `.${command}` },
        ], msg);
    },
};