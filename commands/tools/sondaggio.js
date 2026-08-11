'use strict';

module.exports = {
    name: 'sondaggio',
    aliases: ['poll', 'sondaggio2'],
    description: "Crea un sondaggio nativo WhatsApp. Uso: .sondaggio <domanda> | <opzione1> | <opzione2> (aggiungi 'multi' per risposta multipla).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply } = context;

        if (!textArgs || !textArgs.includes('|')) {
            return reply("📊 *Come si usa*\n\n.sondaggio <domanda> | <opzione1> | <opzione2> | …\n\nEsempio:\n`.sondaggio Dove andiamo sabato? | Mare | Montagna | Città`\n\nAggiungi `multi` alla fine per permettere più risposte.");
        }

        const parts = String(textArgs).split('|').map((s) => s.trim()).filter(Boolean);
        const question = parts.shift();
        if (!question) return reply("⚠️ Scrivi prima la domanda del sondaggio.");

        let multi = false;
        if (/^multi(ple|pla)?$/i.test(parts[parts.length - 1] || '')) {
            multi = true;
            parts.pop();
        }

        if (parts.length < 2) {
            return reply("⚠️ Servono almeno 2 opzioni separandole con ` | `.");
        }
        if (parts.length > 10) {
            return reply("⚠️ Massimo 10 opzioni per sondaggio.");
        }

        try {
            await sock.sendMessage(from, {
                poll: {
                    name: question.slice(0, 200),
                    values: parts.map((o) => o.slice(0, 100)),
                    selectableCount: multi ? parts.length : 1,
                },
            }, { quoted: msg });
        } catch (e) {
            console.error('[sondaggio] errore:', e.message);
            return reply("❌ Non riesco a creare il sondaggio qui. Riprova.");
        }
    },
};