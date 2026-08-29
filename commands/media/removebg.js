'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { downloadMediaBuffer } = require('../../lib/media-utils');

// Rimozione dello sfondo via remove.bg. La chiave API va impostata in .env
// come REMOVEBG_API_KEY (gratuita: https://www.remove.bg/it/api).
const getApiKey = () => (process.env.REMOVEBG_API_KEY || process.env.REMOVEBG_KEY || '').trim();

module.exports = {
    name: 'removebg',
    aliases: ['rbg', 'nobg'],
    description: "Rimuove lo sfondo da un'immagine. Uso: rispondi a un'immagine con .removebg (richiede REMOVEBG_API_KEY in .env)",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { downloadMediaMessage, showProgress } = services;

        const apiKey = getApiKey();
        if (!apiKey) {
            return reply("🔑 *_REMOVE.BG NON CONFIGURATO_*\n━━━━━━━━━━━━━━\n▸ Aggiungi nel file _`.env`_ del bot:\n▸ `REMOVEBG_API_KEY=tua_chiave`\n━━━━━━━━━━━━━━\n▸ La chiave è _gratuita_ su https://www.remove.bg/it/api");
        }

        try {
            const media = await downloadMediaBuffer(sock, msg, from, contextInfo, sender, downloadMediaMessage);
            if (!media || media.kind === 'video') {
                return reply("⚠️ Rispondi a un'immagine per rimuoverne lo sfondo.");
            }

            const prog = await showProgress(sock, from, { label: 'REMOVE BG', duration: 4000, quoted: msg });

            const form = new FormData();
            form.append('image_file', new Blob([media.buffer], { type: 'image/png' }), 'image.png');
            form.append('size', 'auto');
            form.append('format', 'png');

            const res = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: { 'X-Api-Key': apiKey },
                body: form,
                signal: AbortSignal.timeout(60000),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                console.error('[removebg] API error:', res.status, text.slice(0, 200));
                return reply(`❌ remove.bg ha risposto con errore *${res.status}*. Controlla la chiave API o riprova.`);
            }

            const result = Buffer.from(await res.arrayBuffer());
            await sock.sendMessage(from, { image: result, caption: '🧹 *_SFONDO RIMOSSO_*\n━━━━━━━━━━━━━━\n▸ _Sfondo rimosso!_\n' }, { quoted: msg });
            await prog.done('🧹 *_SFONDO RIMOSSO_*\n━━━━━━━━━━━━━━\n▸ _Sfondo rimosso!_\n');
        } catch (e) {
            console.error('[removebg]', e.message);
            return reply("❌ Errore durante la rimozione dello sfondo. Riprova.");
        }
    },
};