'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { searchLyrics } = require('../../lib/lyrics');

module.exports = {
    name: 'lyrics',
    aliases: [],
    description: "Cerca il testo completo di una canzone. Uso: .lyrics <titolo> <artista>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios, sendButtons } = services;

        const query = (textArgs || '').trim();
        if (!query) {
            return sendButtons(sock, from,
                `${sec('INFO')}\n${boxOpen()}\n${line('⚠️ _[uso]: scrivi il titolo e l\'artista della canzone._')}\n${line(`Esempio: \`.lyrics Blinding Lights The Weeknd\``)}\n${boxEnd()}`,
                [{ label: '.lyrics Blinding Lights', id: 'lyrics Blinding Lights The Weeknd' }],
                msg);
        }

        try {
            const found = await searchLyrics(axios, query);
            if (!found || !found.lyrics) {
                return reply(`⚠️ Ho trovato *${query}*, ma il testo non è disponibile.`);
            }

            const lyrics = found.lyrics.slice(0, 6000) + (found.lyrics.length > 6000 ? '\n\n…testo tagliato qui.' : '');
            const head = `${sec('LYRICS')}\n${boxOpen()}\n${line(`*${found.title || query}*${found.artist ? ' — _' + found.artist + '_' : ''}`)}\n${boxEnd()}`;
            await sock.sendMessage(from, { text: head + lyrics + '\n\n' }, { quoted: msg });
        } catch (e) {
            console.error('[lyrics]', e.message);
            await reply("Non riesco a recuperare il testo in questo momento. Riprova più tardi.");
        }
    },
};
