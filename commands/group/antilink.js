'use strict';

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'antilink',
    aliases: ['bloccalink', 'nolink'],
    description: "Esegue il comando .antilink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, loadAntilink, saveAntilink, DEFAULT_ANTILINK_GROUP, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            if (!isGroup) {
                return reply(
`🔗 ${toDecorated('ANTILINK', 'outline', '✠')}
━━━━━━━━━━━━━━
ℹ️ Questo sistema funziona
solo nei *gruppi*.
In chat privata non ci sono
link da filtrare. 😊
━━━━━━━━━━━━━━`
                );
            }

            if (!isOwner) {
                return reply(
`⛔ *ACCESSO NEGATO*
━━━━━━━━━━━━━━
Il comando *.antilink* è
riservato all'*Owner del bot*.
━━━━━━━━━━━━━━`
                );
            }

            // Carica (o inizializza) la config per questo gruppo specifico
            const alConfig = getAntilinkGroup(from);
            const platformNames = Object.keys(ANTILINK_PLATFORMS);

            // Mostra stato attuale se nessun argomento
            if (!args[0]) {
                const statusLines = platformNames.map(p => {
                    const icon = alConfig[p] ? '🟢' : '🔴';
                    const label = alConfig[p] ? 'ON ' : 'OFF';
                    return `${icon} *${p}* ➔ ${label}`;
                }).join('\n');

                return reply(
`🔗 ${toDecorated('ANTILINK — STATO', 'outline', '✠')}
━━━━━━━━━━━━━━
${statusLines}
💡 *Uso:*
.antilink [piattaforma] [on/off]
.antilink tutti on/off
*Piattaforme:*
${platformNames.filter(p => p !== 'altri').join(', ')}, altri
━━━━━━━━━━━━━━`
                );
            }

            const sub      = args[0].toLowerCase();  // piattaforma o "tutti"
            const stateArg = args[1]?.toLowerCase();  // "on" o "off"

            // Validazione argomento on/off
            if (stateArg !== 'on' && stateArg !== 'off') {
                return reply(
`⚠️ *ANTILINK — ERRORE*
━━━━━━━━━━━━━━
Specifica *on* o *off*.
Esempio:
*.antilink instagram on*
*.antilink tutti off*
━━━━━━━━━━━━━━`
                );
            }

            const newState = stateArg === 'on';

            // Caso speciale: "tutti" applica a tutte le piattaforme
            if (sub === 'tutti') {
                const data = loadAntilink();
                if (!data[from]) data[from] = DEFAULT_ANTILINK_GROUP();
                platformNames.forEach(p => { data[from][p] = newState; });
                saveAntilink(data);

                const icon = newState ? '🟢' : '🔴';
                return reply(
`🔗 ${toDecorated('ANTILINK AGGIORNATO', 'outline', '✠')}
━━━━━━━━━━━━━━
${icon} Tutti i filtri → *${stateArg.toUpperCase()}*
Ogni link sarà ${newState ? 'bloccato 🚫' : 'permesso ✅'}.
(Gli admin del gruppo
sono esentati.)
━━━━━━━━━━━━━━`
                );
            }

            // Verifica che la piattaforma esista
            if (!platformNames.includes(sub)) {
                return reply(
`⚠️ *ANTILINK — ERRORE*
━━━━━━━━━━━━━━
"*${sub}*" non è una
piattaforma valida.
Piattaforme disponibili:
${platformNames.join(', ')}
━━━━━━━━━━━━━━`
                );
            }

            // Aggiorna la singola piattaforma per questo gruppo
            setAntilinkPlatform(from, sub, newState);

            const icon = newState ? '🟢' : '🔴';
            await reply(
`🔗 ${toDecorated('ANTILINK AGGIORNATO', 'outline', '✠')}
━━━━━━━━━━━━━━
Piattaforma: *${sub}*
Stato: ${icon} *${stateArg.toUpperCase()}*
${newState
    ? `I link *${sub}* verranno eliminati\nautomaticamente. 🚫`
    : `I link *${sub}* sono ora *permessi*\nin questo gruppo. ✅`}
(Admins del gruppo
sempre esentati.)
━━━━━━━━━━━━━━`
            );
    },
};
