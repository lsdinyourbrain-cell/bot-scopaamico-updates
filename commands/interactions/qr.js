'use strict';

module.exports = {
    name: 'qr',
    aliases: ['qrcode'],
    description: "Genera un QR code per un testo o link (o da un messaggio citato).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios } = services;

        const quoted = isReply ? (contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text || '') : '';
        const data = String(quoted || textArgs || '').trim();
        if (!data) return reply('⚠️ _[uso]: Scrivi il testo da codificare._\n▸ *Uso:* \`.qr https://esempio.it\` _(o cita un messaggio)_');

        try {
            const encoded = encodeURIComponent(data);
            const res = await axios.get(
                `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encoded}`,
                { responseType: 'arraybuffer', timeout: 15000 }
            );
            const buf = Buffer.from(res.data);
            await sock.sendMessage(from, {
                image: buf,
                caption: `✦ *_QR CODE_*\n━━━━━━━━━━━━━━\n▸ *Contenuto:* _${data.slice(0, 80)}_`,
            }, { quoted: msg });
        } catch (_) {
            await reply('⚠️ _Non riesco a generare il QR. Riprova più tardi._');
        }
    },
};