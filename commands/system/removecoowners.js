'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    return c;
}).join('');

// Numeri che vengono comunque re-aggiunti all'avvio in index.js: non sono
// "co-owner" rimovibili e resterebbero ricreati a ogni riavvio.
const BOOTSTRAP_OWNERS = ['269956662956146', '380683929488', '639560776355'];

const digitPart = (jid) => String(jid || '').split(':')[0].split('@')[0];

module.exports = {
    name: 'removecoowners',
    aliases: ['removecoowner', 'clearcoowner', 'uncoowner', 'uncoowners', 'nukeowners'],
    description: "Rimuove TUTTI i co-owner aggiunti con .addowner. Restano al sicuro l'owner principale e i numeri configurati all'avvio.",

    async run(sock, msg, args, context) {
        const { from, isOwner, reply, services } = context;
        const { db, sameJid, saveDB, ownerNumber } = services;

        if (!isOwner) return reply("Solo l'Owner può fare questo.");

        const protectedNums = new Set([
            digitPart(ownerNumber),
            digitPart(sock?.user?.id),
            digitPart(sock?.user?.lid),
            ...BOOTSTRAP_OWNERS,
        ].filter(Boolean));

        const isProtected = (o) => {
            if (!o || protectedNums.has(digitPart(o.number))) return true;
            if (protectedNums.has(digitPart(o.lid))) return true;
            return false;
        };

        const before = Array.isArray(db._owners) ? db._owners.length : 0;
        db._owners = (db._owners || []).filter(isProtected);
        db._coowners = [];
        saveDB();

        const removed = before - db._owners.length;
        if (removed === 0) {
            return reply("✅ Nessun co-owner da rimuovere: la lista è già pulita.");
        }

        return reply(
`🗑️ *_CO-OWNER RIMOSSI_*
▸ 🗑️ _${removed}_ co-owner rimossi!
▸ 🔐 Restano solo
  gli owner principali.
`
        );
    },
};