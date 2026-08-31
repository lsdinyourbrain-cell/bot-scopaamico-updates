'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// 
//  FAKENEWS — Vex Bot
//  Genera una notizia (palesemente) falsa e satirica sul gruppo, scritta
//  dall'IA, in stile tg. Key: `.ai set "chiave"` o .env.
// 

const { askAI, needKey } = require('../../lib/ai');

const SEP = '';

const FORMATS = [
    'titolo + breve articolo da telegiornale',
    'titolo scandalistico + due righe da tabloid',
    'titolo + lancio d\'agenzia serio con dettagli assurdi',
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
    name: 'fakenews',
    aliases: ['gionnale', 'notiziario', 'falso', 'satira'],
    description: "Crea una notizia finta e satirica sul gruppo, in stile telegiornale. Serve la chiave AI: .ai set \"chiave\". Uso: .fakenews [protagonisti o tema]",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, pushName, mentioned, reply, services } = context;
        const { randomChoice, sendButtons } = services;

        const t = String(textArgs || '').trim();

        if (t === 'uso' || t === 'help') {
            return sendButtons(sock, from,
`📰 *_FAKENEWS_*
${SEP}
▸ _Una notizia finta e satirica_
  _sul gruppo, in stile tg._
${SEP}
▸ \`.fakenews\` → _a caso_
▸ \`.fakenews @amico vende finti NFT\` → _con dettagli_
${SEP}
`,
                [{ label: '🏠 Menu', id: 'menu' }], msg);
        }

        // Nome del gruppo.
        let groupName = 'il gruppo';
        try {
            const meta = await sock.groupMetadata(from).catch(() => null);
            if (meta?.subject) groupName = meta.subject;
        } catch (_) { /* non in gruppo */ }

        // Protagonisti dai tag o dal gruppo.
        let heroes = mentioned.map(jid => '@' + jid.split('@')[0]);
        if (!heroes.length) {
            try {
                const meta = await sock.groupMetadata(from).catch(() => null);
                if (meta?.participants?.length) {
                    heroes = shuffle(meta.participants.map(p => '@' + p.id.split('@')[0])).slice(0, 3);
                }
            } catch (_) { /* nessun gruppo */ }
        }
        const cast = heroes.length ? heroes.join(', ') : '@' + (pushName || sender.split('@')[0]);

        const detail = t.replace(/^@\S+\s*/g, '').trim();
        const theme = detail || randomChoice([
            'ha inventato il Wi-Fi a base di mozzarella',
            'compra un\'isola privata pagando in figurine',
            'rivela che il panettone di giugno è una cospirazione',
            'eletto sindaco del gruppo per alzata di mano',
            'vince 10 milioni grattando una scheda con la forchetta',
            'scopre che il portiere di casa è un agente segreto',
        ]);

        const system = 'Sei un redattore satirico. Scrivi una notizia FALSA e divertente in stile telegiornale italiano. Produci: TITOLO in maiuscolo su una riga, poi un breve testo di 3-5 righe serio ma assurdo. Solo testo, max 100 parole, nessuna emoji.';
        const user = `Notizia su "${groupName}", protagonisti: ${cast}. Fattaccio: ${theme}.`;

        const activeKey = (services.db?._ai?.apiKey) || services.AI_API_KEY;
        if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') {
            return reply(needKey());
        }

        const prog = await services.showProgress(sock, from, { label: 'STAMPO IL GIORNALE', duration: 3500, quoted: msg });
        let content;
        try {
            content = await askAI({ services, system, user, maxTokens: 500 });
        } catch (e) {
            console.error('[fakenews]', e.message);
            await prog.done('❌ Errore IA. Riprova tra poco.');
            return;
        }

        if (content === null) {
            await prog.done(needKey());
            return;
        }
        await prog.done(`📰 *_FAKENEWS_* · _${groupName}_\n${SEP}\n${content}\n${SEP}\n☝️ _Notizia evidentemente falsa_ 😄\n`);
    },
};