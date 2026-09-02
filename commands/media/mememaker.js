'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { escapeXml, wrapLines } = require('../../lib/svg-utils');
const { downloadMediaBuffer } = require('../../lib/media-utils');

// Aggiunge testo sopra e sotto a un'immagine (stile meme classico).
const buildBarSvg = (text, width) => {
    const lines = wrapLines(String(text).toUpperCase(), 26, 4);
    const lineH = 44;
    const pad = 12;
    const height = lines.length * lineH + pad * 2;
    const texts = lines.map((line, i) =>
        `<text x="${width / 2}" y="${pad + i * lineH + 30}" text-anchor="middle" font-family="Impact, Arial, sans-serif" font-size="32" font-weight="900" fill="#ffffff" stroke="#000000" stroke-width="3" paint-order="stroke">${escapeXml(line)}</text>`
    ).join('');
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#000000"/>${texts}</svg>`;
};

module.exports = {
    name: 'mememaker',
    aliases: ['memeimg', 'memetext', 'caption'],
    description: "Aggiunge testo sopra/sotto a un'immagine in stile meme. Uso: rispondi a un'immagine con .mememaker <testo sopra> | <testo sotto>",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { sharp, downloadMediaMessage, showProgress } = services;

        const [topRaw = '', bottomRaw = ''] = String(textArgs || '').split('|').map((s) => s.trim());
        if (!topRaw && !bottomRaw) {
            return reply(`${sec('INFO')}\n${boxOpen()}\n${line('⚠️ _[uso]: rispondi a un\'immagine e scrivi il testo del meme._')}\n${line(`\`.mememaker testo sopra | testo sotto\``)}\n${line(`Esempio: \`.mememaker quando mia madre dice | di no\``)}\n${boxEnd()}`);
        }

        try {
            const media = await downloadMediaBuffer(sock, msg, from, contextInfo, sender, downloadMediaMessage);
            if (!media || media.kind === 'video') {
                return reply("⚠️ Rispondi a un'immagine (o uno sticker) per creare il meme.");
            }

            const prog = await showProgress(sock, from, { label: 'MEME', duration: 2000, quoted: msg });

            const imgW = 512;
            const resized = await sharp(media.buffer)
                .rotate()
                .resize(imgW, null, { fit: 'inside' })
                .png()
                .toBuffer({ resolveWithObject: true });
            const meta = resized.info;
            const imgH = Math.min(meta.height, 430);

            const imgFinal = await sharp(media.buffer)
                .rotate()
                .resize(imgW, imgH, { fit: 'cover' })
                .png()
                .toBuffer();

            const topSvg = buildBarSvg(topRaw, imgW);
            const bottomSvg = buildBarSvg(bottomRaw, imgW);
            const [topBar, bottomBar] = await Promise.all([
                sharp(Buffer.from(topSvg)).png().toBuffer(),
                sharp(Buffer.from(bottomSvg)).png().toBuffer(),
            ]);

            const topMeta = await sharp(topBar).metadata();
            const bottomMeta = await sharp(bottomBar).metadata();
            const totalH = topMeta.height + imgH + bottomMeta.height;

            const composite = await sharp({ create: { width: imgW, height: totalH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } })
                .composite([
                    { input: topBar, top: 0, left: 0 },
                    { input: imgFinal, top: topMeta.height, left: 0 },
                    { input: bottomBar, top: topMeta.height + imgH, left: 0 },
                ])
                .png()
                .toBuffer();

            await sock.sendMessage(from, {
                image: composite,
                caption: `${sec('MEMEMAKER')}\n${boxOpen()}\n${line(`${topRaw ? `${sec('INFO')}\n${boxOpen()}\n${line('⬆️ _')}\n${boxEnd()}` + topRaw.slice(0, 60) + '_' : ''}${bottomRaw ? `${sec('INFO')}\n${boxOpen()}\n${line('⬇️ _')}\n${boxEnd()}` + bottomRaw.slice(0, 60) + '_' : ''}`)}\n${boxEnd()}`,
            }, { quoted: msg });
            await prog.done(`${sec('MEME')}\n${boxOpen()}\n${line('_Meme pronto!_')}\n${boxEnd()}`);
        } catch (e) {
            console.error('[mememaker]', e.message);
            return reply("❌ Errore durante la creazione del meme. Riprova con un'altra immagine.");
        }
    },
};