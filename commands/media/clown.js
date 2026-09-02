'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    name: 'clown',
    aliases: ['circo', 'pagliaccio'],
    description: 'Applica effetto clown alla foto profilo. Uso: .clown (@utente)',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, targetJid, isReply, mentioned, services } = context;
        const { showProgress } = services;

        try {
            let target = sender;
            if (mentioned.length > 0) {
                target = mentioned[0];
            } else if (isReply && msg.message.extendedTextMessage?.contextInfo?.participant) {
                target = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (mentioned.length === 0 && args.length > 0) {
                const input = args[0].replace('@', '');
                if (input.includes('wa.me/')) {
                    target = input.split('/').pop() + '@s.whatsapp.net';
                } else if (input.includes('@')) {
                    target = input;
                } else {
                    target = sender;
                }
            }

            let pfpUrl;
            try {
                pfpUrl = await sock.profilePictureUrl(target, 'image');
            } catch (_) {
                try {
                    pfpUrl = await sock.profilePictureUrl(sender, 'image');
                    target = sender;
                } catch (__) {
                    return reply('❌ Impossibile ottenere la foto profilo.');
                }
            }

            if (!pfpUrl) {
                return reply('❌ Foto profilo non disponibile per questo utente.');
            }

            const prog = await showProgress(sock, from, { label: 'CLOWN', duration: 2500, quoted: msg });

            const resp = await axios.get(pfpUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const inputBuffer = Buffer.from(resp.data);
            const img = sharp(inputBuffer);
            const meta = await img.metadata();
            const w = meta.width;
            const h = meta.height;
            const size = Math.min(w, h);

            const noseSize = Math.round(size * 0.15);
            const overlaySize = size;

            const svgOverlay = `
                <svg width="${overlaySize}" height="${overlaySize}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <clipPath id="circle">
                            <circle cx="${overlaySize / 2}" cy="${overlaySize / 2}" r="${overlaySize / 2}"/>
                        </clipPath>
                    </defs>
                    <rect x="0" y="0" width="${overlaySize}" height="${overlaySize}" fill="none"/>
                    <ellipse cx="${overlaySize / 2}" cy="${Math.round(overlaySize * 0.55)}" rx="${Math.round(overlaySize * 0.35)}" ry="${Math.round(overlaySize * 0.06)}" fill="#e74c3c" opacity="0.6"/>
                    <circle cx="${overlaySize / 2}" cy="${Math.round(overlaySize * 0.55)}" r="${noseSize}" fill="#e74c3c" opacity="0.8"/>
                    <circle cx="${Math.round(overlaySize * 0.35)}" cy="${Math.round(overlaySize * 0.1)}" r="${Math.round(overlaySize * 0.15)}" fill="#2ecc71" opacity="0.7"/>
                    <circle cx="${Math.round(overlaySize * 0.65)}" cy="${Math.round(overlaySize * 0.1)}" r="${Math.round(overlaySize * 0.15)}" fill="#e74c3c" opacity="0.7"/>
                    <ellipse cx="${overlaySize / 2}" cy="${Math.round(overlaySize * 0.25)}" rx="${Math.round(overlaySize * 0.25)}" ry="${Math.round(overlaySize * 0.12)}" fill="#9b59b6" opacity="0.6"/>
                </svg>
            `;

            const resized = await img.resize(overlaySize, overlaySize, { fit: 'cover' }).toBuffer();
            const overlayed = await sharp(resized)
                .composite([{
                    input: Buffer.from(svgOverlay),
                    top: 0,
                    left: 0
                }])
                .png()
                .toBuffer();

            await sock.sendMessage(from, {
                image: overlayed,
                caption: `${sec('CLOWN')}\n${boxOpen()}\n${line('_Ecco a te, pagliaccio!_')}\n${boxEnd()}`
            }, { quoted: msg });
            await prog.done(`${sec('CLOWN')}\n${boxOpen()}\n${line('_Clown pronto!_')}\n${boxEnd()}`);

        } catch (e) {
            console.error('[clown]', e);
            await reply('❌ Errore durante la generazione dell\'effetto clown.');
        }
    },
};