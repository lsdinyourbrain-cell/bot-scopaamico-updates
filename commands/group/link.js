'use strict';

module.exports = {
    name: 'link',
    aliases: ['collegamento', 'codice'],
    description: "Link del gruppo. Gli admin decidono se anche i normali utenti possono generarlo. Il link viene inviato con un pulsante che lo copia (nessuna menzione).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, sendButtons } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");

        const arg = String(textArgs || '').trim().toLowerCase();

        // ── Amministrazione: l'admin decide se i normali possono usare .link ──
        if (['on', 'attiva', 'si', '1', 'true', 'yes', 'off', 'disattiva', 'no', '0', 'false'].includes(arg)) {
            if (!isOwner && !isSenderAdmin) {
                return reply('⚠️ _[uso]:_ solo gli admin del gruppo possono cambiare chi può usare .link.');
            }
            const enable = ['on', 'attiva', 'si', '1', 'true', 'yes'].includes(arg);
            if (!db[from]) db[from] = {};
            db[from]._linkOpen = enable;
            saveDB();
            const state = enable ? 'ATTIVO' : 'DISATTIVO';
            const text = `🔗 *_LINK_*
━━━━━━━━━━━━━━
▸ *Accesso al link:* ${state}
${enable
    ? '▸ Ora tutti i membri del gruppo possono usare *\.link*.'
    : '▸ Da ora solo gli *admin* possono usare *\.link*.'}
━━━━━━━━━━━━━━`;
            return sendButtons(sock, from, text, [
                { label: enable ? '.link off' : '.link on', id: enable ? 'link off' : 'link on' },
            ], msg);
        }

        const open = Boolean(db[from]?._linkOpen);
        if (!isOwner && !isSenderAdmin && !open) {
            return reply('⚠️ _[uso]:_ solo gli admin possono usare .link in questo gruppo.');
        }

        try {
            const inviteCode = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${inviteCode}`;
            await sendButtons(sock, from, `🔗 *_LINK DEL GRUPPO_*\n━━━━━━━━━━━━━━\n${link}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`, [
                { type: 'copy', label: '📋 Copia link', copy: link },
            ], msg);
        } catch (_) {
            await reply("⚠️ _[uso]:_ non riesco a generare il link. Assicurati che il bot sia admin del gruppo.");
        }
    },
};