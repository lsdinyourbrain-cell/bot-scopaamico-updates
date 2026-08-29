'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// ─────────────────────────────────────────────────────────────────────────────
//  STORIA — Vex Bot
//  Racconta una mini-storia scritta dall'IA, con protagonisti a scelta
//  (membri del gruppo, @tag, o personaggi inventati). Usa la key salvata
//  con `.ai set` oppure quella in .env (AI_API_KEY).
// ─────────────────────────────────────────────────────────────────────────────

const { askAI, needKey } = require('../../lib/ai');

const SEP = '━━━━━━━━━━━━━━━━━━';

const TEMPLATES = [
    'tre amici si perdono in un bosco incantato dove gli alberi parlano',
    'un gatto grasso e un piccione progettano di conquistare la città',
    'una pizzeria di paese scopre che la forchetta è un portale magico',
    'un gruppo di nonni fa irruzione in un torneo di eSport',
    'un robot da cucina acquista coscienza e apre un ristorante',
    'due vicini litigano per il parcheggio e diventano migliori amici',
    'un pirata moderno in pantofole cerca un tesoro sotto il supermercato',
    'una banda di scoiattoli ruba le noci e tiene in scacco il quartiere',
];

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {
    name: 'storia',
    aliases: ['storiella', 'racconto', 'favola'],
    description: "Racconta una mini-storia scritta dall'IA. Usa .storia (protagonisti a caso), .storia @tag @tag o .storia <tema>. Serve la chiave AI: .ai set \"chiave\". Uso: .storia",

    async run(sock, msg, args, context) {
        const { textArgs, from, mentioned, reply, services } = context;
        const { randomChoice, sendButtons } = services;

        const t = String(textArgs || '').trim();

        // Uso del comando.
        if (t === 'uso' || t === 'help') {
            return sendButtons(sock, from,
`📖 *_STORIA_*
${SEP}
▸ _Racconto una mini-storia dell'IA!_
${SEP}
▸ \`.storia\` → _protagonisti a caso_
▸ \`.storia @amico @amica\` → _i taggati_
▸ \`.storia cavalieri dello zodiaco\` → _tema a scelta_
${SEP}
`,
                [{ label: '🏠 Menu', id: 'menu' }], msg);
        }

        // Protagonisti: dai tag, altrimenti casuali (dal gruppo se possibile).
        let heroes = mentioned.map(jid => jid.split('@')[0]);
        if (!heroes.length) {
            try {
                const meta = await sock.groupMetadata(from).catch(() => null);
                if (meta?.participants?.length) {
                    heroes = shuffle(meta.participants.map(p => p.id.split('@')[0])).slice(0, 3);
                }
            } catch (_) { /* nessun gruppo */ }
        }
        if (!heroes.length) {
            heroes = shuffle(['Paolo', 'Greta', 'Luca', 'Sofia', 'Marco', 'Elena']).slice(0, 3);
        }

        const theme = t.replace(/^@\S+\s*/g, '').trim();
        const template = theme || randomChoice(TEMPLATES);

        const system = 'Sei un abile narratore italiano. Scrivi una mini-storia divertente e vivida di circa 120-180 parole, con un inizio, una svolta e un finale. Tono leggero e ironico, senza emoji eccessive.';
        const user = `Scrivi una mini-storia che coinvolge ${heroes.map(h => '@' + h).join(', ')}. Tema: ${template}.`;

        const activeKey = (services.db?._ai?.apiKey) || services.AI_API_KEY;
        if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') {
            return reply(needKey());
        }

        const prog = await services.showProgress(sock, from, { label: 'SCRIVO UNA STORIA', duration: 4000, quoted: msg });
        let content;
        try {
            content = await askAI({ services, system, user, maxTokens: 600 });
        } catch (e) {
            console.error('[storia]', e.message);
            await prog.done('❌ Errore IA. Riprova tra poco.');
            return;
        }

        if (content === null) {
            await prog.done(needKey());
            return;
        }
        await prog.done(`📖 *_STORIA_*\n${SEP}\n${content}\n`);
    },
};