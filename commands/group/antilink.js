'use strict';

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'antilink',
    aliases: ['bloccalink', 'nolink'],
    description: "Esegue il comando .antilink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, loadAntilink, saveAntilink, DEFAULT_ANTILINK_GROUP, sharp, webpmux, ANTILINK_PLATFORMS, toggleAntilinkWhitelist } = services;


            if (!isGroup) {
                return reply(
`🔗 ${toDecorated('ANTILINK', 'outline', '✠')}
━━━━━━━━━━━━━━
ℹ️ Questo sistema funziona
solo nei *gruppi*.
In chat privata non ci sono
link da filtrare. 😊
━━━━━━━━━━━━━━
◈ _Vex Bot_`
                );
            }

            if (!isOwner) {
                return reply(
`⛔ *ACCESSO NEGATO*
━━━━━━━━━━━━━━
Il comando *.antilink* è
riservato all'*Owner del bot*.
━━━━━━━━━━━━━━
◈ _Vex Bot_`
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
                const wlNow = Array.isArray(alConfig.whitelist) ? alConfig.whitelist : [];
                const guardOn = Object.entries(alConfig).some(([k, v]) => k !== 'whitelist' && Boolean(v));

                return reply(
`🔗 ${toDecorated('ANTILINK — STATO', 'outline', '✠')}
━━━━━━━━━━━━━━
${statusLines}
━━━━━━━━━━━━━━
🛡️ *Guard impostazioni:* ${guardOn ? 'ATTIVO' : 'spento'}
▸ (nome/foto/desc/promozioni)
📋 *Whitelist:* ${wlNow.length} autorizzati
💡 *Uso:*
▸ _.antilink [piattaforma] [on/off]_
▸ _.antilink tutti on/off_
▸ _.antilink wl/unwl @utente_
▸ _.antilink wlist_
◈ _Vex Bot_`
                );
            }

            const sub      = args[0].toLowerCase();  // piattaforma, "tutti" o whitelist
            const stateArg = args[1]?.toLowerCase();  // "on" o "off"

            // ── WHITELIST: wl / unwl / wlist (admin e owner) ─────────────
            // Si può autorizzare una persona anche solo TAGGANDOLA o
            // rispondendo a un suo messaggio:
            //   .antilink wl @utente   ·  rispondi a un suo msg: .antilink wl
            if (['wl', 'whitelist', 'unwl', 'unwhitelist', 'wlist', 'whitelistlista'].includes(sub)) {
                if (!isOwner && !isSenderAdmin) {
                    return reply(`⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━\n▸ Solo admin/owner gestiscono\n  la whitelist antilink.`);
                }
                if (sub === 'wlist' || sub === 'whitelistlista') {
                    const cfgNow = getAntilinkGroup(from);
                    const wl = Array.isArray(cfgNow.whitelist) ? cfgNow.whitelist : [];
                    return reply(
`📋 *WHITELIST ANTILINK*
━━━━━━━━━━━━━━
${wl.length ? wl.map((w, i) => `▸ ${i + 1}. +${String(w).replace(/[^0-9]/g, '')}`).join('\n') : '_Vuota._'}
━━━━━━━━━━━━━━
▸ Aggiungi: _.antilink wl @utente_
▸ Rimuovi: _.antilink unwl @utente_
◈ _Vex Bot_`);
                }
                const isAdd = sub.startsWith('wl') || sub === 'whitelist';
                const targetWl = targetJid;
                if (!targetWl) {
                    return reply(
`⚠️ *USO WHITELIST*
━━━━━━━━━━━━━━
▸ ${isAdd ? 'Aggiungi' : 'Rimuovi'} con tag:
▸ _.antilink ${isAdd ? 'wl' : 'unwl'} @utente_
▸ Oppure rispondi a un suo
  messaggio con lo stesso comando.
━━━━━━━━━━━━━━
▸ Lista: _.antilink wlist_
◈ _Vex Bot_`);
                }
                toggleAntilinkWhitelist(from, targetWl, isAdd);
                const wlAfter = getAntilinkGroup(from).whitelist || [];
                await sock.sendMessage(from, {
                    text: `${isAdd ? '✅' : '🗑️'} *WHITELIST ${isAdd ? '+' : '−'}*\n━━━━━━━━━━━━━━\n▸ @${String(targetWl).split('@')[0]} ${isAdd ? 'ora è autorizzato/a.' : 'rimosso/a dalla whitelist.'}\n▸ Membri in lista: *${wlAfter.length}*\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`,
                    mentions: [targetWl],
                });
                return;
            }

            // Validazione argomento on/off
            if (stateArg !== 'on' && stateArg !== 'off') {
                return reply(
`⚠️ *ANTILINK — ERRORE*
━━━━━━━━━━━━━━
Specifica *on* o *off*.
Esempio:
*.antilink instagram on*
*.antilink tutti off*
━━━━━━━━━━━━━━
◈ _Vex Bot_`
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
━━━━━━━━━━━━━━
◈ _Vex Bot_`
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
━━━━━━━━━━━━━━
◈ _Vex Bot_`
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
━━━━━━━━━━━━━━
◈ _Vex Bot_`
            );
    },
};
