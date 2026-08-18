'use strict';

module.exports = {
    name: 'enigma',
    aliases: ['indovinello', 'riddle'],
    description: "Rispondi a un indovinello e vinci monete.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, senderAlt, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, isButton, services } = context;
        const { db, getUser, saveDB, sendButtons, randomInt } = services;

        const show = (jid, alt) => String(alt || jid || '').split('@')[0];

        const riddles = [
            { q: "Ha un letto ma non dorme, ha una bocca ma non mangia. Chi è?", a: "Il fiume" },
            { q: "Cosa ha un occhio ma non può vedere?", a: "Un ago" },
            { q: "Più è grande e meno ci vedi. Cosa è?", a: "Il buio" },
            { q: "Può correre ma non camminare, ha una bocca ma non parla. Cosa è?", a: "Un fiume" },
            { q: "Cosa sale ma non scende mai?", a: "L'età" },
            { q: "Ha denti ma non mangia. Cosa è?", a: "Il pettine" },
            { q: "Cosa ha mani ma non può applaudire?", a: "L'orologio" },
            { q: "Cosa può riempire una stanza senza occupare spazio?", a: "La luce" },
            { q: "Ha una testa e una coda, ma non ha corpo. Cosa è?", a: "Una moneta" },
            { q: "Cosa ha tasti ma non può scrivere?", a: "Il pianoforte" },
            { q: "Cosa è pieno di buchi ma contiene ancora acqua?", a: "Una spugna" },
            { q: "Cosa ha un collo ma non ha testa?", a: "Una bottiglia" },
            { q: "Più ne togli, più diventa grande. Cosa è?", a: "Una buca" },
            { q: "Cosa cammina su quattro zampe al mattino, due a mezzogiorno e tre alla sera?", a: "L'uomo" },
            { q: "Cosa ha radici che nessuno vede, ma è più alta degli alberi?", a: "La montagna" },
            { q: "Cosa ha parole ma non parla mai?", a: "Il libro" },
        ];

        const pick = riddles[randomInt(0, riddles.length - 1)];

        // ── SUGGERIMENTO (pulsante 💡) ────────────────────────────────────
        if (String(args[0] || '').toLowerCase() === 'suggerimento') {
            const eg = db[from]?.enigma;
            if (!eg?.active) return reply('Nessun enigma attivo. Usa `.enigma` per iniziare!');
            const ans = String(eg.answer || '');
            const hint = `${ans[0].toUpperCase()}${ans.slice(1).replace(/\S/g, '_')}`;
            return reply(`💡 *Suggerimento:*\nLa risposta inizia con *"${ans[0].toUpperCase()}"*\n${hint}`);
        }

        if (!db[from]) db[from] = {};
        db[from].enigma = {
            active: true,
            answer: pick.a,
            sender,
            timestamp: Date.now(),
        };
        saveDB();

        const text =
`🧩 *_ENIGMA_*
━━━━━━━━━━━━━━
*${pick.q}*

🤔 Scrivi la risposta qui in
chat entro 45 secondi!

💰 Premio: *50€*
◈ _Vex Bot_`;

        await sendButtons(sock, from, text, [
            { label: '💡 Suggerimento', id: 'enigma suggerimento' },
            { label: '🎁 Nuovo Enigma', id: `${command}` },
        ], msg);

        setTimeout(() => {
            if (db[from]?.enigma?.active) {
                db[from].enigma.active = false;
                saveDB();
                sock.sendMessage(from, { text: `⏰ *Tempo scaduto!*\nLa risposta era: *${pick.a}*` }).catch(() => {});
            }
        }, 45000);
    },
};
