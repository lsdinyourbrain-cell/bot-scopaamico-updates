'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  SHOP — ScopaAmico Bot
//  Negozio con carosello: ogni card è un oggetto (emoji, prezzo, effetto) con
//  i pulsanti 🛒 Compra / ℹ️ Info. Gli oggetti finiscono nello zaino
//  (u.shopInv = { id: quantità }) e si usano con .shop usa <id>.
//  Oggetti: cassa misteriosa, potenziamento XP, pass anti-bestemmia,
//  regalo VIP.
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = [
    {
        id: 'cassa',
        emoji: '📦',
        name: 'Cassa Misteriosa',
        price: 150,
        desc: 'Apri e vinci fino a 300€!\n(o anche niente 😅)',
        effect: '💸 +0€ / +50€ / +150€ / +300€',
    },
    {
        id: 'xp',
        emoji: '⚡',
        name: 'Potenziamento XP',
        price: 100,
        desc: '+50 XP istantanei\nper salire di livello.',
        effect: '⚡ +50 XP',
    },
    {
        id: 'pass',
        emoji: '🛡️',
        name: 'Pass Anti-Bestemmia',
        price: 80,
        desc: 'Perdona la tua prossima\nbestemmia, nessun record!',
        effect: '🛡️ 1 bestemmia perdonata',
    },
    {
        id: 'vip',
        emoji: '👑',
        name: 'Regalo VIP',
        price: 200,
        desc: 'Un trattamento da\nre: soldi e pregio VIP.',
        effect: '💰 +120€ · 🏅 pregio VIP',
    },
];

const SEP = '━━━━━━━━━━━━━━━━━━';

module.exports = {
    name: 'shop',
    aliases: ['negozio', 'store'],
    description: "Negozio del gruppo: compra oggetti con i soldi in contante e usali con .shop usa <oggetto>. Uso: .shop, .shop inv",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, reply, services } = context;
        const { db, saveDB, getUser, sendButtons, sendCarousel, formatMoney, sharp } = services;
        const u = getUser(sender, from);
        if (!u.shopInv || typeof u.shopInv !== 'object') u.shopInv = {};

        const t = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = t.split(/\s+/);

        // ── SHOP INVENTARIO ──────────────────────────────────────────────
        if (w1 === 'inv' || w1 === 'zaino' || w1 === 'inventory') {
            const owned = Object.entries(u.shopInv).filter(([, n]) => n > 0);
            if (!owned.length) {
                return sendButtons(sock, from,
`🎒 *ZAINO*
${SEP}
Non hai ancora oggetti.
Compra qualcosa al negozio!
${SEP}`,
                    [{ label: '🛍️ Vai al negozio', id: 'shop' }, { label: '🏠 Menu', id: 'menu' }], msg);
            }
            const lines = owned.map(([id, n]) => {
                const it = ITEMS.find(x => x.id === id);
                if (!it) return null;
                return `${it.emoji} ${it.name} ×${n} — \`.shop usa ${id}\``;
            }).filter(Boolean).join('\n');
            return sendButtons(sock, from,
`🎒 *ZAINO*
${SEP}
${lines}
${SEP}
Usa: \`.shop usa <oggetto>\``,
                [
                    { label: '🛍️ Negozio', id: 'shop' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── USA OGGETTO ──────────────────────────────────────────────────
        if (w1 === 'usa' || w1 === 'use') {
            const id = (w2 || '').trim();
            const it = ITEMS.find(x => x.id === id || x.name.toLowerCase() === id);
            if (!it) return reply(`❓ Oggetto non trovato.\nElenco: ${ITEMS.map(x => x.id).join(', ')}`);
            if (!(u.shopInv[it.id] > 0)) return reply(`❌ Non hai *${it.name}* nello zaino. Compralo con \`.shop\``);

            u.shopInv[it.id] -= 1;
            const out = [];

            if (it.id === 'cassa') {
                const roll = Math.random();
                let gain = 0;
                if (roll < 0.05) gain = 300;
                else if (roll < 0.25) gain = 150;
                else if (roll < 0.50) gain = 50;
                u.money += gain;
                out.push(gain > 0 ? `💸 Hai vinto *${formatMoney(gain)}*!` : '💨 Niente... la fortuna è cieca!');
            } else if (it.id === 'xp') {
                u.xp = (Number.isFinite(u.xp) ? u.xp : 0) + 50;
                out.push('⚡ +50 XP istantanei!');
            } else if (it.id === 'pass') {
                u.passAntiBestemmia = (u.passAntiBestemmia || 0) + 1;
                out.push('🛡️ La prossima bestemmia ti sarà perdonata!');
            } else if (it.id === 'vip') {
                u.money += 120;
                if (!Array.isArray(u.pregi)) u.pregi = [];
                u.pregi.push({ rank: '👑 VIP del gruppo', lv: 0, ts: Date.now() });
                if (u.pregi.length > 12) u.pregi = u.pregi.slice(-12);
                out.push('💰 +120€!', '🏅 Pregio *👑 VIP del gruppo* aggiunto!');
            }
            saveDB();
            return reply(`${it.emoji} *${it.name}* usato!\n${out.join('\n')}\n${SEP}\n💰 Saldo: *${formatMoney(u.money)}*`);
        }

        // ── INFO OGGETTO ─────────────────────────────────────────────────
        if (w1 === 'info') {
            const id = (w2 || '').trim();
            const it = ITEMS.find(x => x.id === id || x.name.toLowerCase() === id);
            if (!it) return reply(`❓ Oggetto non trovato.\nElenco: ${ITEMS.map(x => x.id).join(', ')}`);
            return reply(`${it.emoji} *${it.name}*\n${SEP}\n💰 Prezzo: *${formatMoney(it.price)}*\n\n${it.desc}\n\n✨ Effetto:\n${it.effect}\n${SEP}\nCompra: \`.shop\`\nUsa: \`.shop usa ${it.id}\``);
        }

        // ── COMPRA (da pulsante) ─────────────────────────────────────────
        if (w1 === 'compra') {
            const id = (w2 || '').trim();
            const it = ITEMS.find(x => x.id === id || x.name.toLowerCase() === id);
            if (!it) return reply(`❓ Oggetto non trovato.\nElenco: ${ITEMS.map(x => x.id).join(', ')}`);
            if (u.money < it.price) {
                return sendButtons(sock, from,
`❌ Servono *${formatMoney(it.price)}* in contante.
Hai ${formatMoney(u.money)}€.

👉 Usa \`.daily\` o \`.work\`!`,
                    [{ label: '🛍️ Negozio', id: 'shop' }, { label: '🏠 Menu', id: 'menu' }], msg);
            }
            u.money -= it.price;
            u.shopInv[it.id] = (u.shopInv[it.id] || 0) + 1;
            saveDB();
            return sendButtons(sock, from,
`✅ *${it.emoji} ${it.name}* comprato!
${SEP}
💰 -${formatMoney(it.price)}€
🎒 Zaino: ${Object.values(u.shopInv).reduce((s, n) => s + n, 0)} oggetti
Saldo: *${formatMoney(u.money)}€*
${SEP}
Usalo subito: \`.shop usa ${it.id}\``,
                [
                    { label: '🎒 Zaino', id: 'shop inv' },
                    { label: '🛍️ Negozio', id: 'shop' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }

        // ── NEGOZIO (carosello) ──────────────────────────────────────────
        const cards = ITEMS.map(it => ({
            title: `${it.emoji} ${it.name}`,
            subtitle: `${formatMoney(it.price)}€`,
            body: `${it.desc}\n\n✨ ${it.effect}`,
            footer: 'ScopaAmico Shop',
            buttons: [
                { label: `🛒 Compra · ${it.price}€`, id: `shop compra ${it.id}` },
                { label: 'ℹ️ Info', id: `shop info ${it.id}` },
            ],
        }));

        const sent = await sendCarousel(sock, from, {
            text: `🛍️ *NEGOZIO SCOPAMICO*
${SEP}
Compra con i soldi in *contante*.
Poi usa gli oggetti con
\`.shop usa <oggetto>\`.

🎒 Il tuo zaino: *${Object.values(u.shopInv).reduce((s, n) => s + n, 0)}* oggetti
💰 Saldo: *${formatMoney(u.money)}€*
${SEP}
Scorri per vedere gli oggetti 👇`,
            cards,
        }, msg);

        if (!sent) {
            return sendButtons(sock, from,
`🛍️ *NEGOZIO*
${SEP}
${ITEMS.map(it => `${it.emoji} ${it.name} · ${formatMoney(it.price)}€`).join('\n')}
${SEP}
Compra: \`.shop compra <id>\`
Info: \`.shop info <id>\``,
                [
                    { label: '🎒 Zaino', id: 'shop inv' },
                    { label: '🏠 Menu', id: 'menu' },
                ], msg);
        }
        return true;
    },
};

module.exports.ITEMS = ITEMS;
