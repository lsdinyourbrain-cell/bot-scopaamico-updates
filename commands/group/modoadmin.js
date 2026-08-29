'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'modoadmin',
    aliases: ['adminmode', 'modeadmin', 'soloadmin'],
    description: "MODO ADMIN: solo gli admin del gruppo possono usare il bot.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Il modo admin funziona solo nei gruppi.')}\n${boxEnd()}`);

        if (!isOwner && !isSenderAdmin) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gli admin del gruppo possono cambiare il modo admin.')}\n${boxEnd()}`);
        }

        const arg = String(textArgs || '').trim().toLowerCase();
        const current = Boolean(db[from]?._modoadmin);

        let next;
        if (['on', 'attiva', 'si', '1', 'true', 'yes'].includes(arg)) next = true;
        else if (['off', 'disattiva', 'no', '0', 'false'].includes(arg)) next = false;
        else next = !current;

        if (!db[from]) db[from] = {};
        db[from]._modoadmin = next;
        saveDB();

        const state = next ? 'ATTIVO' : 'DISATTIVO';
        const text =
`${sec('MODO ADMIN')}
${boxOpen()}
${line(`Stato: ${state}`)}
${line(next ? 'Solo gli admin del gruppo possono usare il bot.' : 'Il bot è di nuovo utilizzabile da tutti.')}
${boxEnd()}`;

        await sendButtons(sock, from, text, [
            { label: next ? '🔴 Disattiva' : '🟢 Attiva', id: next ? 'modoadmin off' : 'modoadmin on' },
        ], msg);
    },
};