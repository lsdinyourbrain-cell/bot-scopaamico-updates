'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'wiki',
    aliases: ['wikipedia', 'enciclopedia'],
    description: "Cerca il riassunto di una voce su Wikipedia (italiana).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, showProgress } = services;

        const term = String(textArgs || '').trim();
        if (!term) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Scrivi la voce da cercare._ ▸ *Uso:* \\`.wiki torre eiffel\\`')}
${boxEnd()}`);

        try {
            const prog = await showProgress(sock, from, { label: 'WIKIPEDIA', duration: 3000, quoted: msg });
            const { data } = await axios.get(
                'https://it.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(term),
                { timeout: 10000 }
            );
            if (!data || data.type === 'disambiguation' || !data.extract) {
                const title = data?.title || term;
                if (data?.type === 'disambiguation') {
                    return prog.done(`${sec('INFO')}\n${boxOpen()}\n${line(`⚠️ _${title} è una pagina di disambiguazione._\n▸ _Sii più specifico._\n▸ 🔗 _${data?.content_urls?.desktop?.page || ''}_`)}\n${boxEnd()}`);
                }
                return prog.done('⚠️ _Voce non trovata. Controlla l\'ortografia o prova un termine diverso._');
            }

            const ext = data.extract;
            const txt = `${sec('INFO')}\n${boxOpen()}\n${line(`📚 *_${data.title}_*\n\n▸ ${ext.length > 900 ? ext.slice(0, 900) + '…' : ext}\n▸ 🔗 _${data.content_urls?.desktop?.page || ''}_\n\n`)}\n${boxEnd()}`;
            const thumb = data.thumbnail?.source || null;

            if (thumb) {
                await sock.sendMessage(from, { image: { url: thumb }, caption: txt }, { quoted: msg });
                await prog.done('📚 *Voce trovata!* ✅');
            } else {
                await prog.done(txt);
            }
        } catch (_) {
            await reply('⚠️ _Errore nella ricerca. Riprova più tardi._');
        }
    },
};