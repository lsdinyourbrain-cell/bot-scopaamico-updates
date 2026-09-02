'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

module.exports = {
    name: 'toimg',
    aliases: ['toimage', 'stickerimg'],
    description: "Converte uno sticker in immagine. Rispondi a uno sticker per convertirlo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { downloadContentFromMessage, fs, os, path, sharp, showProgress } = services;

        const quotedSticker = isReply ? contextInfo?.quotedMessage?.stickerMessage : null;
        const directSticker = msg.message?.stickerMessage;

        const sticker = quotedSticker || directSticker;
        if (!sticker) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line(`${sec('STICKER')}\n${boxOpen()}\n${line('[uso]: rispondi a uno *sticker* per convertirlo in immagine._ ▸ *Uso:* rispon...')}\n${boxEnd()}`)}
${boxEnd()}`);
        }

        try {
            const prog = await showProgress(sock, from, { label: 'CONVERSIONE', duration: 2000, quoted: msg });

            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const stamp = Date.now();
            const pngPath = path.join(os.tmpdir(), `${stamp}.png`);
            await sharp(buffer).png().toFile(pngPath);

            await sock.sendMessage(from, { image: fs.readFileSync(pngPath), caption: `${sec('TOIMG')}\n${boxOpen()}\n${line('_Ecco la tua immagine!_')}\n${boxEnd()}` }, { quoted: msg });
            await prog.done(`${sec('IMMAGINE PRONTA')}\n${boxOpen()}\n${line('_Immagine pronta!_')}\n${boxEnd()}`);
            try { fs.unlinkSync(pngPath); } catch (e) {}
        } catch (err) {
            console.error('[toimg]', err.message);
            await reply('❌ Errore durante la conversione. Assicurati di aver risposto a uno sticker valido.');
        }
    },
};