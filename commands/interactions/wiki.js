'use strict';

module.exports = {
    name: 'wiki',
    aliases: ['wikipedia', 'enciclopedia'],
    description: "Cerca il riassunto di una voce su Wikipedia (italiana).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, sendButtons } = services;

        const term = String(textArgs || '').trim();
        if (!term) return reply('⚠️ Scrivi la voce da cercare.\n👉 *Uso:* `.wiki torre eiffel`');

        try {
            const { data } = await axios.get(
                'https://it.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(term),
                { timeout: 10000 }
            );
            if (!data || data.type === 'disambiguation' || !data.extract) {
                const title = data?.title || term;
                if (data?.type === 'disambiguation') {
                    return reply(`⚠️ *${title}* è una pagina di disambiguazione. Sii più specifico.\n👉 ${data?.content_urls?.desktop?.page || ''}`);
                }
                return reply('❌ Voce non trovata. Controlla l\'ortografia o prova un termine diverso.');
            }

            const ext = data.extract;
            const txt = `📚 *${data.title}*\n\n${ext.length > 900 ? ext.slice(0, 900) + '…' : ext}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`;
            const again = 'wiki ' + term;
            const thumb = data.thumbnail?.source || null;

            if (thumb) {
                await sock.sendMessage(from, { image: { url: thumb }, caption: txt }, { quoted: msg });
            } else {
                await sendButtons(sock, from, txt, [
                    { label: '.wiki', id: again },
                ], msg);
            }
        } catch (_) {
            await reply('❌ Errore nella ricerca. Riprova più tardi.');
        }
    },
};