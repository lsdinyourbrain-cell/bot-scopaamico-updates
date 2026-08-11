'use strict';

// Scarica un media (immagine/video/sticker) dal messaggio corrente o da
// quello citato. Ritorna { buffer, kind } dove kind ∈ 'image'|'video'|'sticker',
// oppure null se non c'è alcun media.

const downloadMediaBuffer = async (sock, msg, from, contextInfo, sender, downloadMediaMessage) => {
    const quotedRaw = contextInfo?.quotedMessage || {};
    const quotedInner =
        quotedRaw.imageMessage ||
        quotedRaw.videoMessage ||
        quotedRaw.stickerMessage ||
        quotedRaw.ephemeralMessage?.message?.imageMessage ||
        quotedRaw.ephemeralMessage?.message?.videoMessage ||
        quotedRaw.ephemeralMessage?.message?.stickerMessage ||
        quotedRaw.viewOnceMessage?.message?.imageMessage ||
        quotedRaw.viewOnceMessageV2?.message?.imageMessage;

    const directMedia = msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage || null;

    const media = directMedia || quotedInner || null;
    if (!media) return null;

    const kind = media.mimetype?.includes('video')
        ? 'video'
        : (media === quotedRaw?.stickerMessage || media === (directMedia && msg.message?.stickerMessage)) ? 'sticker' : 'image';

    const mediaKey = kind === 'video' ? 'videoMessage' : kind === 'sticker' ? 'stickerMessage' : 'imageMessage';
    const mediaMsg = quotedInner ? {
        key: {
            remoteJid: from,
            fromMe: false,
            id: contextInfo?.stanzaId,
            participant: contextInfo?.participant || sender,
        },
        message: { [mediaKey]: quotedInner },
    } : msg;

    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage,
    });
    return { buffer, kind, mimetype: media.mimetype || '' };
};

module.exports = { downloadMediaBuffer };