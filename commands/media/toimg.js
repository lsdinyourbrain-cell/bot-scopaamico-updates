'use strict';

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
            return reply('⚠️ Rispondi a uno *sticker* per convertirlo in immagine.\n👉 *Uso:* rispondi allo sticker e scrivi `.toimg`');
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

            await sock.sendMessage(from, { image: fs.readFileSync(pngPath), caption: '🖼️ Ecco la tua immagine!' }, { quoted: msg });
            await prog.done('🖼️ *Immagine pronta!* ✅');
            try { fs.unlinkSync(pngPath); } catch (e) {}
        } catch (err) {
            console.error('[toimg]', err.message);
            await reply('❌ Errore durante la conversione. Assicurati di aver risposto a uno sticker valido.');
        }
    },
};