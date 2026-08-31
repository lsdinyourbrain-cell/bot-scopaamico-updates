'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// 
//  GENIO — Vex Bot
//  Chiedi qualcosa al Genio della lampada: risponde con saggezza, ironia o
//  poesia (a scelta), sempre con l'IA. Key: `.ai set "chiave"` o .env.
// 

const { askAI, needKey } = require('../../lib/ai');

const SEP = '';

const STYLES = {
    saggezza: 'rispondi con profonda saggezza zen, breve ma illuminante.',
    ironia: 'rispondi con ironia e sarcasmo brillante, da vero genio dispettoso.',
    poesia: 'rispondi con una breve poesia inventata e toccante.',
    profezia: 'rispondi come un oracolo enigmatico, criptico e misterioso.',
};

const STYLE_KEYS = Object.keys(STYLES);

module.exports = {
    name: 'genio',
    aliases: ['lampada', 'oracolo', 'magico'],
    description: "Il Genio della lampada risponde a qualsiasi domanda con saggezza, ironia, poesia o profezia. Uso: .genio <domanda>, .genio ironia <domanda>. Serve la chiave AI: .ai set \"chiave\"",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { sendButtons } = services;

        const t = String(textArgs || '').trim();

        if (!t) {
            return sendButtons(sock, from,
`🧞 *_GENIO DELLA LAMPADA_*
${SEP}
▸ _Chiedimi qualcosa e rispondo!_
${SEP}
▸ \`.genio Sarò ricco?\` → _stile a caso_
▸ \`.genio ironia Devo studiare?\` → _stile scelto_
${SEP}
▸ _Stili:_ saggezza · ironia · poesia · profezia
${SEP}
`,
                [
                    { label: '🐉 Saperi (sagg.)', id: 'genio saggezza Chi sono io?' },
                    { label: '😏 Ironia', id: 'genio ironia Dimmi la verità' },
                    { label: '📜 Poesia', id: 'genio poesia L\'amore vero esiste?' },
                ], msg);
        }

        let parts = t.split(' ');
        const first = parts[0].toLowerCase();
        let style;
        if (STYLE_KEYS.includes(first)) {
            style = first;
            parts = parts.slice(1);
        } else {
            style = STYLE_KEYS[Math.floor(Math.random() * STYLE_KEYS.length)];
        }
        const question = parts.join(' ').trim() || 'Dimmi qualcosa di saggio';

        const system = `Sei il Genio della lampada. Devi ${STYLES[style]} Rispondi in italiano, massimo 3-4 frasi.`;
        const user = `La mia domanda è: "${question}"`;

        const activeKey = (services.db?._ai?.apiKey) || services.AI_API_KEY;
        if (!activeKey || activeKey === 'INSERISCI_QUI_LA_TUA_API_KEY') {
            return reply(needKey());
        }

        const prog = await services.showProgress(sock, from, { label: 'IL GENIO RISPONDE', duration: 3500, quoted: msg });
        let content;
        try {
            content = await askAI({ services, system, user, maxTokens: 500 });
        } catch (e) {
            console.error('[genio]', e.message);
            await prog.done('❌ Errore IA. Riprova tra poco.');
            return;
        }

        if (content === null) {
            await prog.done(needKey());
            return;
        }
        const emoji = style === 'ironia' ? '😏' : style === 'poesia' ? '📜' : style === 'profezia' ? '🔮' : '🧞';
        await prog.done(`${emoji} *_GENIO_* · _stile ${style}_\n${SEP}\n${content}\n`);
    },
};