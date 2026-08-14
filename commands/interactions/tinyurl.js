'use strict';

module.exports = {
    name: 'tinyurl',
    aliases: ['short', 'shorten'],
    description: "Accorcia un URL con TinyURL.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, showProgress } = services;

        const quoted = isReply ? (contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text || '') : '';
        const url = String(quoted || textArgs || '').trim();
        if (!url || !/^https?:\/\//i.test(url)) {
            return reply('⚠️ _[uso]: Scrivi un link da accorciare._\n▸ *Uso:* \`.tinyurl https://esempio.it\` _(o cita un messaggio)_');
        }

        try {
            const prog = await showProgress(sock, from, { label: 'ACCORCIA LINK', duration: 2500, quoted: msg });
            const { data } = await axios.get('https://tinyurl.com/api-create.php', { params: { url }, timeout: 10000 });
            const short = String(data).trim();
            if (!/^https?:\/\//i.test(short)) return prog.done('⚠️ _Non riesco ad accorciare questo link._');
            await prog.done(`🔗 *_LINK ACCORCIATO_*\n━━━━━━━━━━━━━━\n▸ _${short}_\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        } catch (_) {
            await reply('⚠️ _Errore nell\'accorciare il link. Riprova più tardi._');
        }
    },
};