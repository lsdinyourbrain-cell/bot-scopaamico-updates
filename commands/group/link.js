'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'link',
    aliases: ['collegamento', 'codice'],
    description: "Link del gruppo. Gli admin decidono se anche i normali utenti possono generarlo. Il link viene inviato con un pulsante che lo copia (nessuna menzione).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}
${boxOpen()}
${line('questo comando funziona solo nei gruppi.')}
${boxEnd()}`);

        const arg = String(textArgs || '').trim().toLowerCase();

        if (['on', 'attiva', 'si', '1', 'true', 'yes', 'off', 'disattiva', 'no', '0', 'false'].includes(arg)) {
            if (!isOwner && !isSenderAdmin) {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin del gruppo possono cambiare chi può usare .link.')}
${boxEnd()}`);
            }
            const enable = ['on', 'attiva', 'si', '1', 'true', 'yes'].includes(arg);
            if (!db[from]) db[from] = {};
            db[from]._linkOpen = enable;
            saveDB();
            const state = enable ? 'ATTIVO' : 'DISATTIVO';
            const text =
`${sec('LINK')}
${boxOpen()}
${line(`Accesso al link: *${state}*`)}
${line(enable ? 'Ora tutti i membri possono usare *.link*.' : 'Da ora solo gli *admin* possono usare *.link*.')}
${boxEnd()}`;
            return sendButtons(sock, from, text, [
                { label: enable ? '.link off' : '.link on', id: enable ? 'link off' : 'link on' },
            ], msg);
        }

        const open = Boolean(db[from]?._linkOpen);
        if (!isOwner && !isSenderAdmin && !open) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('solo gli admin possono usare .link in questo gruppo.')}
${boxEnd()}`);
        }

        try {
            const inviteCode = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${inviteCode}`;
            const linkText =
`${sec('LINK DEL GRUPPO')}
${boxOpen()}
${line('e pigliate sto link down 👇')}
${line(`\`${link}\``)}
${boxEnd()}`;
            await sendButtons(sock, from, linkText, [
                { type: 'copy', label: '📋 Copia link', copy: link },
            ], msg);
        } catch (_) {
            await reply(`${sec('ERRORE')}
${boxOpen()}
${line('non riesco a generare il link. Assicurati che il bot sia admin del gruppo.')}
${boxEnd()}`);
        }
    },
};
