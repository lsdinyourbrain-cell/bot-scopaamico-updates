'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// Difficoltà: facile 10s low reward, media 7s, difficile 5s high reward
const DIFFS_ENIGMA = {
    facile:    { key: 'facile',    label: 'FACILE',    emoji: '🟢', timeout: 10000, reward: 30 },
    media:     { key: 'media',     label: 'MEDIA',     emoji: '🟡', timeout: 7000,  reward: 50 },
    difficile: { key: 'difficile', label: 'DIFFICILE', emoji: '🔴', timeout: 5000,  reward: 80 },
};

module.exports = {
    name: 'enigma',
    aliases: ['indovinello', 'riddle'],
    description: "Rispondi a un indovinello e vinci monete. Difficoltà: facile/media/difficile (10s/7s/5s).",

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

        const qLowerEn = String(textArgs || '').trim().toLowerCase();
        const isQuitEn = ['stop','termina','abbandona','annulla','fine','esci','basta','chiudi','ferma','lascia'].includes(qLowerEn) || qLowerEn.startsWith('stop ') || qLowerEn.startsWith('termina') || qLowerEn.startsWith('abbandona') || qLowerEn.startsWith('annulla');
        if (isQuitEn) {
            if (!db[from]?.enigma?.active) return reply(`${sec('ENIGMA')}\n${boxOpen()}\n${line('Nessun enigma attivo. Usa *.enigma* per iniziare!')}\n${boxEnd()}`);
            const ans = db[from].enigma.answer;
            db[from].enigma.active = false;
            saveDB();
            return sendButtons(sock, from, `${sec('🛑 ENIGMA TERMINATO')}\n${boxOpen()}\n${line(`Risposta era *${ans}* ✨`)}\n${line(`Terminato da @${show(sender, senderAlt)}`)}\n${boxEnd()}`, [
                { label: '🔄 Nuovo Enigma', id: 'enigma' },
                { label: '🏠 Menu', id: 'menu' },
            ], msg, [sender]);
        }
        if (db[from]?.enigma?.active) {
            const tActive = `${sec('🧩 ENIGMA ATTIVO')}\n${boxOpen()}\n${line('C\'è già un enigma in corso ✨')}\n${line('Rispondi qui o termina')}\n${boxEnd()}`;
            return sendButtons(sock, from, tActive, [
                { label: '❌ Termina', id: 'enigma termina' },
                { label: '🔄 Nuovo Enigma', id: 'enigma termina' },
            ], msg);
        }

        // ── SUGGERIMENTO (pulsante 💡) 
        if (String(args[0] || '').toLowerCase() === 'suggerimento') {
            const eg = db[from]?.enigma;
            if (!eg?.active) return reply(`${sec('ENIGMA')}\n${boxOpen()}\n${line('Nessun enigma attivo. Usa *.enigma* per iniziare!')}\n${boxEnd()}`);
            const ans = String(eg.answer || '');
            const hint = `${ans[0].toUpperCase()}${ans.slice(1).replace(/\S/g, '_')}`;
            return reply(`${sec('SUGGERIMENTO')}\n${boxOpen()}\n${line(`La risposta inizia con *"${ans[0].toUpperCase()}"*`)}\n${line(hint)}\n${boxEnd()}`);
        }

        // Difficoltà opzionale: .enigma facile/media/difficile (default facile 10s)
        const rawDiffEn = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0];
        const diffEn = DIFFS_ENIGMA[rawDiffEn] || DIFFS_ENIGMA.facile;

        if (!db[from]) db[from] = {};
        db[from].enigma = {
            active: true,
            answer: pick.a,
            sender,
            timestamp: Date.now(),
            difficulty: diffEn.key,
            reward: diffEn.reward,
            timeout: diffEn.timeout,
        };
        saveDB();

        const text = `${sec('ENIGMA')}\n${boxOpen()}\n${line(`*${pick.q}*`)}\n${line('')}\n${line(`${diffEn.emoji} ${diffEn.label} · ⏳ ${diffEn.timeout/1000}s · 💰 ${diffEn.reward}€`)}\n${line('🤔 Scrivi la risposta qui in chat!')}\n${boxEnd()}`;

        await sendButtons(sock, from, text, [
            { label: '❌ Termina', id: 'enigma termina' },
            { label: '💡 Suggerimento', id: 'enigma suggerimento' },
            { label: '🔄 Nuovo Enigma', id: 'enigma' },
        ], msg);

        setTimeout(() => {
            const cur = db[from]?.enigma;
            if (cur?.active && cur.answer === pick.a) {
                cur.active = false;
                saveDB();
                sock.sendMessage(from, { text: `${sec('TEMPO SCADUTO')}\n${boxOpen()}\n${line(`La risposta era: *${pick.a}*`)}\n${line(`⏳ ${diffEn.timeout/1000}s scaduti — ${diffEn.emoji} ${diffEn.label}`)}\n${boxEnd()}` }).catch(() => {});
            }
        }, diffEn.timeout);
    },
};
