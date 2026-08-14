'use strict';

const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    name: 'wasted',
    aliases: ['gta', 'wastedgta'],
    description: 'Applica filtro WASTED stile GTA alla foto profilo.',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, targetJid, isReply, contextInfo, mentioned, textArgs, services } = context;
        const { showProgress } = services;

        try {
            let target = targetJid;
            
            if (isReply && contextInfo.participant) {
                target = contextInfo.participant;
            } else if (!target && mentioned.length > 0) {
                target = mentioned[0];
            } else if (!target) {
                target = sender;
            }

            const prog = await showProgress(sock, from, { label: 'WASTED GTA', duration: 2500, quoted: msg });

            let pfpUrl;
            try {
                pfpUrl = await sock.profilePictureUrl(target, 'image');
            } catch (_) {
                pfpUrl = null;
            }

            if (!pfpUrl) {
                return reply('❌ Foto profilo non trovata (privata o assente).');
            }

            const pfpResponse = await axios.get(pfpUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const pfpBuffer = Buffer.from(pfpResponse.data);

            // Crea effetto WASTED con sharp
            const wastedBuffer = await sharp(pfpBuffer)
                .resize(512, 512, { fit: 'cover', position: 'center' })
                .grayscale() // Bianco e nero
                .modulate({ brightness: 1.2, saturation: 0 }) // Più chiaro, desaturato
                .composite([
                    // Overlay rosso scuro
                    {
                        input: Buffer.from(`
                            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                                <rect width="512" height="512" fill="#8b0000" opacity="0.3"/>
                            </svg>
                        `),
                        blend: 'over'
                    },
                    // Testo WASTED
                    {
                        input: Buffer.from(`
                            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="wastedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" style="stop-color:#ff0000;stop-opacity:1" />
                                        <stop offset="50%" style="stop-color:#ff4444;stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:#ff0000;stop-opacity:1" />
                                    </linearGradient>
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="8" result="blur"/>
                                        <feMerge>
                                            <feMergeNode in="blur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>
                                <text x="256" y="200" 
                                    font-family="Impact, Arial Black, sans-serif" 
                                    font-size="80" 
                                    font-weight="bold" 
                                    fill="url(#wastedGrad)" 
                                    text-anchor="middle" 
                                    stroke="#000" 
                                    stroke-width="6"
                                    filter="url(#glow)">WASTED</text>
                                <text x="256" y="280" 
                                    font-family="Arial, sans-serif" 
                                    font-size="18" 
                                    fill="#ffcccc" 
                                    text-anchor="middle"
                                    stroke="#000"
                                    stroke-width="2">${target.split('@')[0]}</text>
                            </svg>
                        `),
                        blend: 'over'
                    }
                ])
                .png()
                .toBuffer();

            await sock.sendMessage(from, {
                image: wastedBuffer,
                caption: `💀 *${target.split('@')[0]} WASTED*\n\n*Grand Theft Auto: Vex Bot Edition*`
            }, { quoted: msg });
            await prog.done('💀 *WASTED generato!* ✅');

        } catch (e) {
            console.error('[wasted]', e);
            await reply('❌ Errore durante la generazione dell\'effetto WASTED.');
        }
    },
};