'use strict';

module.exports = {
    name: 'modoadmin',
    aliases: ['adminmode', 'modeadmin', 'soloadmin'],
    description: "MODO ADMIN: solo gli admin del gruppo possono usare il bot (i non-admin ricevono un ❌ e nessuna risposta).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply('⚠️ *Modo admin* funziona solo nei gruppi.');

        if (!isOwner && !isSenderAdmin) {
            return reply('❌ Solo gli admin del gruppo possono cambiare il modo admin.');
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
        const text = `🛡️ *MODO ADMIN ${state}*\n\n${next
            ? 'Da ora solo gli *admin del gruppo* possono usare il bot.\nChi non è admin riceverà una reazione ❌ e nessuna risposta.'
            : 'Il bot è di nuovo utilizzabile da tutti i membri del gruppo.'}`;

        await sendButtons(sock, from, text, [
            { label: next ? '.modoadmin off' : '.modoadmin on', id: next ? 'modoadmin off' : 'modoadmin on' },
        ], msg);
    },
};