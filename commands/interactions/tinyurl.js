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
            return reply('⚠️ Scrivi un link da accorciare.\n👉 *Uso:* `.tinyurl https://esempio.it` (o cita un messaggio)');
        }

        try {
            const prog = await showProgress(sock, from, { label: 'ACCORCIA LINK', duration: 2500, quoted: msg });
            const { data } = await axios.get('https://tinyurl.com/api-create.php', { params: { url }, timeout: 10000 });
            const short = String(data).trim();
            if (!/^https?:\/\//i.test(short)) return prog.done('❌ Non riesco ad accorciare questo link.');
            await prog.done(`🔗 *Link accorciato:*\n${short}`);
        } catch (_) {
            await reply('❌ Errore nell\'accorciare il link. Riprova più tardi.');
        }
    },
};