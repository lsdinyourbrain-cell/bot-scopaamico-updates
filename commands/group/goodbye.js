'use strict';

module.exports = {
    name: 'goodbye',
    aliases: ['arrivederci'],
    description: "Attiva/disattiva il messaggio di arrivederci nel gruppo (solo owner).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, getWelcomeGroup, setWelcomeGroup } = services;


            if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
            if (!isOwner) return reply("⚠️ _[uso]:_ solo l'owner del bot può modificare questa impostazione.");

            const config = getWelcomeGroup(from);
            const arg = textArgs.toLowerCase().trim();

            if (!arg || (arg !== 'on' && arg !== 'off' && arg !== 'true' && arg !== 'false' && arg !== 'si' && arg !== 'no' && arg !== 'attivo' && arg !== 'disattivo')) {
                const status = config.goodbye ? '🟢 ATTIVO' : '🔴 DISATTIVO';
                return reply(
`👋 *ARRIVEDERCI GRUPPO*
━━━━━━━━━━━━━━
Stato attuale: ${status}
Uso: .goodbye <on|off>
Es: .goodbye on
━━━━━━━━━━━━━━
◈ _Vex Bot_`
                );
            }

            const enable = ['on', 'true', 'si', 'attivo'].includes(arg);
            setWelcomeGroup(from, 'goodbye', enable);

            await reply(
`👋 *ARRIVEDERCI GRUPPO*
━━━━━━━━━━━━━━
${enable ? '✅ Attivato' : '❌ Disattivato'}
Il messaggio di arrivederci
${enable ? 'verrà inviato' : 'NON verrà più inviato'}
quando qualcuno esce.
━━━━━━━━━━━━━━
◈ _Vex Bot_`
            );
    },
};