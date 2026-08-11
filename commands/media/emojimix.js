'use strict';

const { makeSticker } = require('../../lib/sticker-webp');

// Estrae i primi due emoji dal testo (gestendo cluster di più codepoint).
const pickEmojis = (text) => {
    const raw = String(text || '');
    if (!/\p{Extended_Pictographic}/u.test(raw)) return [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const clusters = [...segmenter.segment(raw)].map((s) => s.segment);
    const emoji = clusters.filter((c) => /\p{Extended_Pictographic}/u.test(c)).slice(0, 2);
    return emoji;
};

const codepointOf = (cluster) => {
    const base = cluster.replace(/[\u{FE0F}\u{FE0E}\u{200D}]/gu, '');
    const cp = base.codePointAt(0);
    return cp ? cp.toString(16) : null;
};

const buildUrl = (cp1, cp2) => `https://emojik.vercel.app/s/${cp1}_${cp2}?size=512`;

module.exports = {
    name: 'emojimix',
    aliases: ['emix', 'emoji-mix'],
    description: "Fonde due emoji in una sola (Emoji Kitchen). Uso: .emojimix 😂❤️ oppure .emojimix 😂 ❤️",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, webpmux, axios } = services;

        const emojis = pickEmojis(textArgs);
        if (emojis.length < 2) {
            return reply("😜 *Come si usa*\n\n.emojimix <emoji1> <emoji2>\n\nEsempio: `.emojimix 😂❤️` oppure `.emojimix 😱 😍`");
        }

        const cp1 = codepointOf(emojis[0]);
        const cp2 = codepointOf(emojis[1]);
        if (!cp1 || !cp2) return reply("⚠️ Emoji non valide.");

        try {
            const url = buildUrl(cp1, cp2);
            const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });

            const png = Buffer.from(data);
            if (png.length < 100) throw new Error('risposta vuota');

            const sticker = await makeSticker(sharp, webpmux, png);
            await sock.sendMessage(from, { sticker, stickerName: 'Emoji Mix', stickerAuthor: 'ScopaAmico' }, { quoted: msg });
        } catch (e) {
            console.error('[emojimix]', e.message);
            return reply("❌ Non riesco a fondere queste emoji. Prova con una coppia più usata (es. 😂❤️).");
        }
    },
};