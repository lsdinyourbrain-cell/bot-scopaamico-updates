'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  CARTE — Vex Bot
//  Bustine collezionabili stile Pokémon:
//   .carte              → menu principale
//   .carte apri         → compra una busta (500€) e apre 5 carte
//   .carte coll         → collezione (carosello delle carte possedute)
//   .carte set <key>    → elenco completo di un set (PUL/BES/SER)
//   .carte guida        → come funziona
//  L'apertura mostra la busta, poi le 5 carte in un carosello nativo con le
//  card renderizzate come PNG (lib/cards). I duplicati vengono rimborsati in
//  automatico; le ✦ shiny hanno il bordo dorato e il doppio rimborso.
// ─────────────────────────────────────────────────────────────────────────────

const cards = require('../../lib/cards');

const SEP = '━━━━━━━━━━━━━━━━━━';

const MAIN_MENU_TEXT = `🎴 *CARTE SCOPAMICO*
${SEP}
Apri le *buste* e colleziona
*${cards.TOTAL_CARDS} carte* su 3 set!

🎁 Busta · ${cards.PACK_COST}€ · 5 carte
⭐ Da Comune a Leggendaria
✦ Shiny rare · bordo dorato!

💰 I duplicati vengono
rimborsati in automatico.
${SEP}`;

const MENU_BTNS = [
    { label: `🎁 Apri busta · ${cards.PACK_COST}€`, id: 'carte apri' },
    { label: '📚 Collezione', id: 'carte coll' },
    { label: '📖 Guida', id: 'carte guida' },
];

const AFTER_PULL_BTNS = [
    { label: `🎁 Apri ancora · ${cards.PACK_COST}€`, id: 'carte apri' },
    { label: '📚 Collezione', id: 'carte coll' },
    { label: '🏠 Menu carte', id: 'carte' },
];

const fmtEuro = (n, formatMoney) => {
    try { return formatMoney(n); } catch (_) { return String(n); }
};

module.exports = {
    name: 'carte',
    aliases: ['buste', 'booster', 'cards'],
    description: 'Bustine collezionabili stile Pokémon: apri buste da 500€, raccogli 47 carte su 3 set e trova le leggendarie! Uso: .carte, .carte apri, .carte coll',

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, reply, services } = context;
        const { db, saveDB, getUser, sendButtons, sendCarousel, sharp, sleep, formatMoney } = services;

        const t = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = t.split(/\s+/);

        const u = getUser(sender, from);
        cards.initUserCards(u);

        // ── APRI BUSTA ───────────────────────────────────────────────────
        if (w1 === 'apri') {
            if (u.money < cards.PACK_COST) {
                return reply(
`❌ Servono *${cards.PACK_COST}€* in contante.
Hai ${fmtEuro(u.money, formatMoney)}€ (in banca: ${fmtEuro(u.bank || 0, formatMoney)}€).

👉 Usa \`.daily\`, \`.work\` o
\`.preleva\` per procurarteli!`);
            }
            u.money -= cards.PACK_COST;
            u.cardsOpened = (u.cardsOpened || 0) + 1;

            // Pescaggio + aggiornamento collezione (duplicati → rimborso).
            const pulls = cards.openPack();
            const results = pulls.map(pull => ({ pull, res: cards.addCard(u, pull) }));
            const refundTotal = results.reduce((s, r) => s + (r.res.isNew ? 0 : r.res.refund), 0);
            if (refundTotal > 0) u.money += refundTotal;
            saveDB();

            const countNew = results.filter(r => r.res.isNew).length;
            const countShiny = pulls.filter(p => p.shiny).length;

            // 1) La busta (immagine) + "apertura in corso".
            try {
                const packBuf = await cards.renderPack(sharp);
                await sock.sendMessage(from, {
                    image: packBuf,
                    caption: `🎁 *BUSTA SCOPAMICO*\n${SEP}\nStrappo la pellicola...\n⭐ ${cards.PACK_COST}€ · n°${u.cardsOpened}\n${SEP}\nApertura in corso...`,
                }, { quoted: msg });
                if (typeof sleep === 'function') await sleep(900);
            } catch (e) {
                console.error('[carte] render busta:', e.message);
                if (typeof sleep === 'function') await sleep(300);
            }

            // 2) Le 5 carte in carosello nativo.
            const images = [];
            for (const r of results) {
                try {
                    const buf = await cards.renderCard(sharp, {
                        set: r.pull.set,
                        card: r.pull.card,
                        entry: r.res.entry,
                    });
                    images.push({ ...r, buf });
                } catch (e) {
                    console.error('[carte] render card:', e.message);
                }
            }

            const summary =
`🎁 *BUSTA APERTA* · n°${u.cardsOpened}
${SEP}
🆕 Nuove carte: *${countNew}*
👥 Duplicati: *${results.length - countNew}*
${refundTotal > 0 ? `💰 Rimborso duplicati: +${fmtEuro(refundTotal, formatMoney)}€` : ''}
${countShiny ? `✦ SHINY trovate: *${countShiny}*!` : ''}
${SEP}
Scorri per vedere le carte 👇`;

            if (images.length) {
                const sent = await sendCarousel(sock, from, {
                    text: summary,
                    cards: images.map(({ pull, buf, res }) => ({
                        title: `${pull.shiny ? '✦ ' : ''}${pull.card.id}`,
                        subtitle: `${pull.rarity.emoji} ${pull.rarity.label}`,
                        body: res.isNew ? '🆕 Nuova carta!' : `👥 Duplicato · +${fmtEuro(res.refund, formatMoney)}€`,
                        footer: `${pull.set.name}`,
                        imageBuffer: buf,
                    })),
                }, msg);
                if (!sent) {
                    // Fallback: elenco testuale se il carosello non parte.
                    await sock.sendMessage(from, {
                        text: summary + '\n\n' + results.map(r =>
                            `${r.res.isNew ? '🆕' : '👥'} ${r.pull.rarity.emoji} ${r.pull.card.id} ${r.pull.card.name}${r.pull.shiny ? ' ✦' : ''}`
                        ).join('\n'),
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(from, {
                    text: summary + '\n\n(non sono riuscito a generare le immagini delle carte)',
                }, { quoted: msg });
            }

            await sendButtons(sock, from, '🎴 Cosa facciamo ora?', AFTER_PULL_BTNS, msg);
            return;
        }

        // ── COLLEZIONE (carosello) ───────────────────────────────────────
        if (w1 === 'coll' || w1 === 'collezione') {
            const stats = cards.collectionStats(u);
            const owned = cards.sortOwned(u);
            if (!owned.length) {
                return sendButtons(sock, from,
`📚 *COLLEZIONE*
${SEP}
Non hai ancora nessuna carta!
Apri la tua prima busta 🎁
${SEP}`,
                    [
                        { label: `🎁 Apri busta · ${cards.PACK_COST}€`, id: 'carte apri' },
                        { label: '📖 Guida', id: 'carte guida' },
                        { label: '🏠 Menu carte', id: 'carte' },
                    ], msg);
            }

            const top = owned.slice(0, 10);
            const images = [];
            for (const o of top) {
                try {
                    const buf = await cards.renderCard(sharp, {
                        set: o.set,
                        card: o.card,
                        entry: o.entry,
                    });
                    images.push({ ...o, buf });
                } catch (e) {
                    console.error('[carte] render collezione:', e.message);
                }
            }

            const setProgress = cards.SETS
                .map(s => `${s.emoji} ${s.key} ${stats.bySet[s.key] || 0}/${s.cards.length}`)
                .join('\n');

            const header =
`📚 *COLLEZIONE*
${SEP}
🎴 Carte: *${stats.owned}*/${stats.total}
👥 Duplicati totali: *${stats.dupes}*
🎁 Buste aperte: *${stats.opened}*
${SEP}
${setProgress}
${SEP}
Prime 10 per rarità 👇`;

            if (images.length) {
                const sent = await sendCarousel(sock, from, {
                    text: header,
                    cards: images.map(({ card, entry, set, buf }) => ({
                        title: `${entry.shiny ? '✦ ' : ''}${card.id}`,
                        subtitle: `${cards.RARITY[card.rarity].emoji} ${cards.RARITY[card.rarity].label}${entry.shiny ? ' ✦' : ''}`,
                        body: entry.dupes ? `Posseduta ×1 · ${entry.dupes} duplicato/i` : 'Posseduta',
                        footer: `${set.name}`,
                        imageBuffer: buf,
                    })),
                }, msg);
                if (!sent) {
                    await sock.sendMessage(from, { text: header }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(from, { text: header }, { quoted: msg });
            }

            await sendButtons(sock, from, '📚 Altre opzioni 👇', [
                { label: '🎁 Apri busta', id: 'carte apri' },
                { label: '🏠 Menu carte', id: 'carte' },
                { label: '📖 Guida', id: 'carte guida' },
            ], msg);
            return;
        }

        // ── ELENCO DI UN SET ─────────────────────────────────────────────
        if (w1 === 'set') {
            const set = cards.SET_BY_KEY[String(w2 || '').toUpperCase()];
            if (!set) {
                const lines = cards.SETS.map(s => `${s.emoji} ${s.key} — ${s.name} (${s.cards.length} carte)`);
                return reply(`ℹ️ Set disponibili:\n${lines.join('\n')}`);
            }
            const rows = set.cards.map(c => {
                const entry = u.cards[`${set.key}:${c.id}`];
                const r = cards.RARITY[c.rarity];
                const mark = entry
                    ? `${entry.shiny ? '✦' : '✔'}${entry.dupes ? ' ×' + entry.dupes : ''}`
                    : '·';
                return `${mark} ${r.emoji} ${c.id} ${c.name}`;
            }).join('\n');

            return sendButtons(sock, from,
`${set.emoji} *${set.name.toUpperCase()}*
${SEP}
${set.cards.length} carte · ✔ posseduta
· mancante · ✦ shiny
${SEP}
${rows}
${SEP}`,
                [
                    { label: '🏠 Menu carte', id: 'carte' },
                    { label: '📚 Collezione', id: 'carte coll' },
                    { label: '🎁 Apri busta', id: 'carte apri' },
                ], msg);
        }

        // ── GUIDA ────────────────────────────────────────────────────────
        if (w1 === 'guida') {
            return sendButtons(sock, from,
`📖 *COME FUNZIONA*
${SEP}
🎁 \`.carte apri\` compra una
busta da ${cards.PACK_COST}€ con 5 carte.

⭐ Rarità (da più comune):
⚪ Comune · 🟢 Non comune
🔵 Rara · 🟣 Epica
🟡 Leggendaria

✦ Le *shiny* (5%) hanno il
bordo dorato e il doppio
rimborso da duplicato.

👥 Una carta già posseduta
diventa un duplicato e
viene rimborsata in €.

📚 \`.carte coll\` mostra la
tua collezione.
${SEP}`,
                [
                    { label: `🎁 Apri busta · ${cards.PACK_COST}€`, id: 'carte apri' },
                    { label: '📚 Collezione', id: 'carte coll' },
                    { label: '🏠 Menu carte', id: 'carte' },
                ], msg);
        }

        // ── MENU PRINCIPALE (default) ────────────────────────────────────
        return sendButtons(sock, from, MAIN_MENU_TEXT, MENU_BTNS, msg);
    },
};
