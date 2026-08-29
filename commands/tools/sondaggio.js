'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'sondaggio',
    aliases: ['poll', 'sondaggio2'],
    description: "Crea un sondaggio nativo WhatsApp. Uso: .sondaggio <domanda> | <opzione1> | <opzione2> (aggiungi 'multi' per risposta multipla).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply } = context;

        if (!textArgs || !textArgs.includes('|')) {
            return reply("📊 *_Come si usa_*\n━━━━━━━━━━━━━━━━━━\n▸ .sondaggio <domanda> | <opzione1> | <opzione2> | …\n▸ *Esempio:*\n  \`.sondaggio Dove andiamo sabato? | Mare | Montagna | Città\`\n▸ Aggiungi \`multi\` alla fine\n  per permettere più risposte.\n━━━━━━━━━━━━━━━━━━");
        }

        const parts = String(textArgs).split('|').map((s) => s.trim()).filter(Boolean);
        const question = parts.shift();
        if (!question) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Scrivi prima la domanda del sondaggio.')}
${boxEnd()}`);

        let multi = false;
        if (/^multi(ple|pla)?$/i.test(parts[parts.length - 1] || '')) {
            multi = true;
            parts.pop();
        }

        if (parts.length < 2) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Servono almeno 2 opzioni separandole con \` | \`.')}
${boxEnd()}`);
        }
        if (parts.length > 10) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Massimo 10 opzioni per sondaggio.')}
${boxEnd()}`);
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