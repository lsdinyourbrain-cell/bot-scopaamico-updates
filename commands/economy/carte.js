'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

//
//  CARTE — Vex Bot
//  Bustine collezionabili stile Pokémon:
//   .carte              → menu principale
//   .carte apri         → compra una busta (500€) e apre 5 carte
//   .carte coll         → collezione (carosello delle carte possedute)
//   .carte set <key>    → elenco completo di un set (PUL/BES/SER)
//   .carte guida        → come funziona
//  L'apertura mostra la busta, poi le 5 carte in un carosello nativo con le
//  card renderizzate come PNG (lib/cards). I duplicati vengono rimborsati in
//  automatico; le  shiny hanno il bordo dorato e il doppio rimborso.
//

const cards = require('../../lib/cards');

const MAIN_MENU_TEXT =
`${sec('CARTE VEX')}
${boxOpen()}
${line('Apri le *buste* e colleziona')}
${line(`*${cards.TOTAL_CARDS} carte* su 3 set!`)}
${line('')}
${line(`🎁 Busta · ${cards.PACK_COST}€ · 5 carte`)}
${line('⭐ Da Comune a Leggendaria')}
${line('✨ Shiny rare · bordo dorato!')}
${line('')}
${line('💰 I duplicati vengono')}
${line('rimborsati in automatico.')}
${boxEnd()}`;

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

        if (w1 === 'apri') {
            if (u.money < cards.PACK_COST) {
                return reply(
`${sec('CARTE')}
${boxOpen()}
${line(`Servono *${cards.PACK_COST}€* in contante.`)}
${line(`Hai ${fmtEuro(u.money, formatMoney)}€ (banca: ${fmtEuro(u.bank || 0, formatMoney)}€).`)}
${line('')}
${line('Usa `.daily`, `.work` o `.preleva`!')}
${boxEnd()}`);
            }
            u.money -= cards.PACK_COST;
            u.cardsOpened = (u.cardsOpened || 0) + 1;

            const pulls = cards.openPack();
            const results = pulls.map(pull => ({ pull, res: cards.addCard(u, pull) }));
            const refundTotal = results.reduce((s, r) => s + (r.res.isNew ? 0 : r.res.refund), 0);
            if (refundTotal > 0) u.money += refundTotal;
            saveDB();

            const countNew = results.filter(r => r.res.isNew).length;
            const countShiny = pulls.filter(p => p.shiny).length;

            try {
                const packBuf = await cards.renderPack(sharp);
                await sock.sendMessage(from, {
                    image: packBuf,
                    caption:
`${sec('BUSTA VEX')}
${boxOpen()}
${line('Strappo la pellicola...')}
${line(`⭐ ${cards.PACK_COST}€ · n°${u.cardsOpened}`)}
${line('Apertura in corso...')}
${boxEnd()}`,
                }, { quoted: msg });
                if (typeof sleep === 'function') await sleep(900);
            } catch (e) {
                console.error('[carte] render busta:', e.message);
                if (typeof sleep === 'function') await sleep(300);
            }

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
`${sec(`BUSTA APERTA · n°${u.cardsOpened}`)}
${boxOpen()}
${line(`🆕 Nuove carte: *${countNew}*`)}
${line(`👥 Duplicati: *${results.length - countNew}*`)}
${refundTotal > 0 ? line(`💰 Rimborso duplicati: +${fmtEuro(refundTotal, formatMoney)}€`) + '\n' : ''}${countShiny ? line(`✨ SHINY trovate: *${countShiny}*!`) + '\n' : ''}${line('Scorri per vedere le carte 👇')}
${boxEnd()}`;

            if (images.length) {
                const sent = await sendCarousel(sock, from, {
                    text: summary,
                    cards: images.map(({ pull, buf, res }) => ({
                        title: `${pull.shiny ? '✨ ' : ''}${pull.card.id}`,
                        subtitle: `${pull.rarity.emoji} ${pull.rarity.label}`,
                        body: res.isNew ? '🆕 Nuova carta!' : `👥 Duplicato · +${fmtEuro(res.refund, formatMoney)}€`,
                        footer: `${pull.set.name}`,
                        imageBuffer: buf,
                    })),
                }, msg);
                if (!sent) {
                    await sock.sendMessage(from, {
                        text: summary + '\n\n' + results.map(r =>
                            `${r.res.isNew ? '🆕' : '👥'} ${r.pull.rarity.emoji} ${r.pull.card.id} ${r.pull.card.name}${r.pull.shiny ? ' ✨' : ''}`
                        ).join('\n'),
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(from, {
                    text: summary + '\n\n(non sono riuscito a generare le immagini delle carte)',
                }, { quoted: msg });
            }

            await sendButtons(sock, from, `${sec('CARTE')}\n${boxOpen()}\n${line('Cosa facciamo ora?')}\n${boxEnd()}`, AFTER_PULL_BTNS, msg);
            return;
        }

        if (w1 === 'coll' || w1 === 'collezione') {
            const stats = cards.collectionStats(u);
            const owned = cards.sortOwned(u);
            if (!owned.length) {
                return sendButtons(sock, from,
`${sec('COLLEZIONE')}
${boxOpen()}
${line('Non hai ancora nessuna carta!')}
${line('Apri la tua prima busta 🎁')}
${boxEnd()}`,
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
`${sec('COLLEZIONE')}
${boxOpen()}
${line(`🎴 Carte: *${stats.owned}*/${stats.total}`)}
${line(`👥 Duplicati totali: *${stats.dupes}*`)}
${line(`🎁 Buste aperte: *${stats.opened}*`)}
${line('')}
${line(setProgress)}
${line('')}
${line('Prime 10 per rarità 👇')}
${boxEnd()}`;

            if (images.length) {
                const sent = await sendCarousel(sock, from, {
                    text: header,
                    cards: images.map(({ card, entry, set, buf }) => ({
                        title: `${entry.shiny ? '✨ ' : ''}${card.id}`,
                        subtitle: `${cards.RARITY[card.rarity].emoji} ${cards.RARITY[card.rarity].label}${entry.shiny ? ' ✨' : ''}`,
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

            await sendButtons(sock, from, `${sec('COLLEZIONE')}\n${boxOpen()}\n${line('Altre opzioni 👇')}\n${boxEnd()}`, [
                { label: '🎁 Apri busta', id: 'carte apri' },
                { label: '🏠 Menu carte', id: 'carte' },
                { label: '📖 Guida', id: 'carte guida' },
            ], msg);
            return;
        }

        if (w1 === 'set') {
            const set = cards.SET_BY_KEY[String(w2 || '').toUpperCase()];
            if (!set) {
                const lines = cards.SETS.map(s => `${s.emoji} ${s.key} — ${s.name} (${s.cards.length} carte)`);
                return reply(
`${sec('SET DISPONIBILI')}
${boxOpen()}
${line(lines.join('\n'))}
${boxEnd()}`);
            }
            const rows = set.cards.map(c => {
                const entry = u.cards[`${set.key}:${c.id}`];
                const r = cards.RARITY[c.rarity];
                const mark = entry
                    ? `${entry.shiny ? '✨' : '✔'}${entry.dupes ? ' ×' + entry.dupes : ''}`
                    : '·';
                return line(`${mark} ${r.emoji} ${c.id} ${c.name}`);
            }).join('\n');

            return sendButtons(sock, from,
`${sec(set.name.toUpperCase())}
${boxOpen()}
${line(`${set.cards.length} carte · ✔ posseduta · · mancante · ✨ shiny`)}
${line('')}
${rows}
${boxEnd()}`,
                [
                    { label: '🏠 Menu carte', id: 'carte' },
                    { label: '📚 Collezione', id: 'carte coll' },
                    { label: '🎁 Apri busta', id: 'carte apri' },
                ], msg);
        }

        if (w1 === 'guida') {
            return sendButtons(sock, from,
`${sec('COME FUNZIONA')}
${boxOpen()}
${line(`🎁 \`.carte apri\` compra una busta da ${cards.PACK_COST}€ con 5 carte.`)}
${line('')}
${line('⭐ Rarità (da più comune):')}
${line('⚪ Comune · 🟢 Non comune')}
${line('🔵 Rara · 🟣 Epica')}
${line('🟡 Leggendaria')}
${line('')}
${line('✨ Le *shiny* (5%) hanno il bordo dorato')}
${line('e il doppio rimborso da duplicato.')}
${line('')}
${line('👥 Una carta già posseduta diventa')}
${line('un duplicato e viene rimborsata in €.')}
${line('')}
${line('📚 `.carte coll` mostra la collezione.')}
${boxEnd()}`,
                [
                    { label: `🎁 Apri busta · ${cards.PACK_COST}€`, id: 'carte apri' },
                    { label: '📚 Collezione', id: 'carte coll' },
                    { label: '🏠 Menu carte', id: 'carte' },
                ], msg);
        }

        return sendButtons(sock, from, MAIN_MENU_TEXT, MENU_BTNS, msg);
    },
};
