'use strict';

const EV = require('../../lib/events');

module.exports = {
    name: 'poker',
    aliases: ['elev', 'scala'],
    description: "Sfida il bot a poker: chi ha la mano migliore vince la puntata.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { getUser, saveDB, sendButtons, randomInt, db } = services;

        const cooldownKey = 'poker';
        const userData = getUser(sender, from);
        if (!userData.cooldowns) userData.cooldowns = {};
        const last = userData.cooldowns[cooldownKey] || 0;
        const now = Date.now();
        const cdMs = 6000;
        if (now - last < cdMs) {
            const remain = Math.ceil((cdMs - (now - last)) / 1000);
            return reply(`⏳ Calma! La mano sta ancora girando. Riprova tra *${remain}s*.`);
        }
        userData.cooldowns[cooldownKey] = now;

        const puntata = parseInt(args[0]);
        if (isNaN(puntata) || puntata < 10) return reply("⚠️ _[uso]: puntata non valida (minimo 10€) — .poker 50_");
        if (puntata > 1_000_000) return reply("⚠️ Puntata massima: *1.000.000€*.");

        const uDB = getUser(sender, from);
        if (uDB.money < puntata) return reply(`❌ Saldo insufficiente. Hai *${uDB.money}€*.`);

        const mazzo = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        const semi = ['♠', '♥', '♦', '♣'];

        const pesca = () => {
            const carta = mazzo[randomInt(0, mazzo.length - 1)];
            const seme = semi[randomInt(0, semi.length - 1)];
            return { carta, seme };
        };

        const val = (c) => mazzo.indexOf(c.carta);

        const valutamano = (cards) => {
            const ord = cards.slice().sort((a, b) => val(b) - val(a));
            const v = ord.map(c => val(c));
            if (v[0] === v[1] && v[1] === v[2]) return { tipo: 3, nome: 'TRIS', forza: v[0] };
            if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) {
                let coppia, singolo;
                if (v[0] === v[1]) { coppia = v[0]; singolo = v[2]; }
                else if (v[1] === v[2]) { coppia = v[1]; singolo = v[0]; }
                else { coppia = v[0]; singolo = v[1]; }
                return { tipo: 1, nome: 'COPPIA', forza: coppia * 100 + singolo };
            }
            return { tipo: 0, nome: 'CARTE ALTE', forza: v[0] * 10000 + v[1] * 100 + v[2] };
        };

        const manoUtente = [pesca(), pesca(), pesca()];
        const manoBot = [pesca(), pesca(), pesca()];

        const vu = valutamano(manoUtente);
        const vb = valutamano(manoBot);

        let esito;
        const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
        if (vu.tipo > vb.tipo || (vu.tipo === vb.tipo && vu.forza > vb.forza)) {
            uDB.money += puntata * evMult;
            esito = `✅ *HAI VINTO!* (+${puntata * evMult}€${evMult > 1 ? ' x3 slotoro 🎰' : ''})`;
        } else if (vb.tipo > vu.tipo || (vb.tipo === vu.tipo && vb.forza > vu.forza)) {
            uDB.money -= puntata;
            esito = `❌ *HAI PERSO!* (-${puntata}€)`;
        } else {
            esito = `🤝 *PAREGGIO!* (0€)`;
        }
        saveDB();

        const carta = (c) => `[${c.carta}${c.seme}]`;
        const resultText =
`🃏 *_POKER_*
━━━━━━━━━━━━━━
▸ *Le tue carte:* _${manoUtente.map(carta).join(' ')}_
▸ *La tua mano:* _${vu.nome}_
▸ *Carte bot:* _${manoBot.map(carta).join(' ')}_
▸ *Mano bot:* _${vb.nome}_

${esito}
▸ *Saldo:* _${uDB.money}€_
◈ _Vex Bot_`;

        await sendButtons(sock, from, resultText, [
            { label: `.${command}${textArgs ? ' ' + textArgs : ''}`, id: `${command}${textArgs ? ' ' + textArgs : ''}` },
        ], msg);
    },
};
