'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'qr',
    aliases: ['qrcode'],
    description: "Genera un QR code per un testo o link (o da un messaggio citato).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { axios } = services;

        const quoted = isReply ? (contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text || '') : '';
        const data = String(quoted || textArgs || '').trim();
        if (!data) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: Scrivi il testo da codificare._ ▸ *Uso:* \\`.qr https://esempio.it\\` _(...')}
${boxEnd()}`);

        try {
            const encoded = encodeURIComponent(data);
            const res = await axios.get(
                `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=${encoded}`,
                { responseType: 'arraybuffer', timeout: 15000 }
            );
            const buf = Buffer.from(res.data);
            await sock.sendMessage(from, {
                image: buf,
                caption: `${sec('QR CODE')}\n${boxOpen()}\n${line(` *_QR CODE_*\n\n▸ *Contenuto:* _${data.slice(0, 80)}_`)}\n${boxEnd()}`,
            }, { quoted: msg });
        } catch (_) {
            await reply('⚠️ _Non riesco a generare il QR. Riprova più tardi._');
        }
    },
};