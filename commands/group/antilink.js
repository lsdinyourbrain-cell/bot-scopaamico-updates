'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'antilink',
    aliases: ['bloccalink', 'nolink'],
    description: "Esegue il comando .antilink.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, loadAntilink, saveAntilink, DEFAULT_ANTILINK_GROUP, sharp, webpmux, ANTILINK_PLATFORMS, toggleAntilinkWhitelist } = services;

            if (!isGroup) {
                return reply(`${sec('ANTILINK')}\n${boxOpen()}\n${line('Questo sistema funziona')}\n${line('solo nei gruppi.')}\n${boxEnd()}`);
            }

            if (!isOwner) {
                return reply(`${sec('ACCESSO NEGATO')}\n${boxOpen()}\n${line('Il comando .antilink è')}\n${line("riservato all'Owner del bot.")}\n${boxEnd()}`);
            }

            const alConfig = getAntilinkGroup(from);
            const platformNames = Object.keys(ANTILINK_PLATFORMS);

            if (!args[0]) {
                const statusLines = platformNames.map(p => {
                    const icon = alConfig[p] ? '🟢' : '🔴';
                    const label = alConfig[p] ? 'ON ' : 'OFF';
                    return `${icon} *${p}* ➔ ${label}`;
                }).join('\n');
                const wlNow = Array.isArray(alConfig.whitelist) ? alConfig.whitelist : [];
                const guardOn = Object.entries(alConfig).some(([k, v]) => k !== 'whitelist' && Boolean(v));

                return reply(
`${sec('ANTILINK — STATO')}
${boxOpen()}
${statusLines}
${line(`🛡️ Guard: ${guardOn ? 'ATTIVO' : 'spento'}`)}
${line(`📋 Whitelist: ${wlNow.length} autorizzati`)}
${boxEnd()}
▸ .antilink [piattaforma] [on/off]
▸ .antilink tutti on/off
▸ .antilink wl/unwl @utente`
                );
            }

            const sub      = args[0].toLowerCase();
            const stateArg = args[1]?.toLowerCase();

            if (['wl', 'whitelist', 'unwl', 'unwhitelist', 'wlist', 'whitelistlista'].includes(sub)) {
                if (!isOwner && !isSenderAdmin) {
                    return reply(`${sec('ACCESSO NEGATO')}\n${boxOpen()}\n${line('Solo admin/owner gestiscono')}\n${line('la whitelist antilink.')}\n${boxEnd()}`);
                }
                if (sub === 'wlist' || sub === 'whitelistlista') {
                    const cfgNow = getAntilinkGroup(from);
                    const wl = Array.isArray(cfgNow.whitelist) ? cfgNow.whitelist : [];
                    return reply(
`${sec('WHITELIST ANTILINK')}
${boxOpen()}
${wl.length ? wl.map((w, i) => `${line(`${i + 1}. +${String(w).replace(/[^0-9]/g, '')}`)}`).join('\n') : line('_Vuota._')}
${boxEnd()}
▸ .antilink wl @utente
▸ .antilink unwl @utente`);
                }
                const isAdd = sub.startsWith('wl') || sub === 'whitelist';
                const targetWl = targetJid;
                if (!targetWl) {
                    return reply(
`${sec('WHITELIST — USO')}
${boxOpen()}
${line(`${isAdd ? 'Aggiungi' : 'Rimuovi'} con tag:`)}
${line(`.antilink ${isAdd ? 'wl' : 'unwl'} @utente`)}
${boxEnd()}
▸ .antilink wlist`);
                }
                toggleAntilinkWhitelist(from, targetWl, isAdd);
                const wlAfter = getAntilinkGroup(from).whitelist || [];
                await sock.sendMessage(from, {
                    text: `${sec(`WHITELIST ${isAdd ? '+' : '−'}`)}\n${boxOpen()}\n${line(`@${String(targetWl).split('@')[0]} ${isAdd ? 'ora è autorizzato/a.' : 'rimosso/a dalla whitelist.'}`)}\n${line(`Membri in lista: ${wlAfter.length}`)}\n${boxEnd()}`,
                    mentions: [targetWl],
                });
                return;
            }

            if (stateArg !== 'on' && stateArg !== 'off') {
                return reply(
`${sec('ANTILINK — ERRORE')}
${boxOpen()}
${line('Specifica on o off.')}
${line('.antilink instagram on')}
${line('.antilink tutti off')}
${boxEnd()}`
                );
            }

            const newState = stateArg === 'on';

            if (sub === 'tutti') {
                const data = loadAntilink();
                if (!data[from]) data[from] = DEFAULT_ANTILINK_GROUP();
                platformNames.forEach(p => { data[from][p] = newState; });
                saveAntilink(data);

                const icon = newState ? '🟢' : '🔴';
                return reply(
`${sec('ANTILINK AGGIORNATO')}
${boxOpen()}
${line(`${icon} Tutti i filtri → ${stateArg.toUpperCase()}`)}
${line(`Ogni link sarà ${newState ? 'bloccato 🚫' : 'permesso ✅'}.`)}
${line('(Gli admin del gruppo sono esentati.)')}
${boxEnd()}`
                );
            }

            if (!platformNames.includes(sub)) {
                return reply(
`${sec('ANTILINK — ERRORE')}
${boxOpen()}
${line(`"${sub}" non è una piattaforma valida.`)}
${line(`Disponibili: ${platformNames.join(', ')}`)}
${boxEnd()}`
                );
            }

            setAntilinkPlatform(from, sub, newState);

            const icon = newState ? '🟢' : '🔴';
            await reply(
`${sec('ANTILINK AGGIORNATO')}
${boxOpen()}
${line(`Piattaforma: ${sub}`)}
${line(`Stato: ${icon} ${stateArg.toUpperCase()}`)}
${line(newState ? `I link ${sub} verranno eliminati.` : `I link ${sub} sono ora permessi.`)}
${line('(Admins del gruppo sempre esentati.)')}
${boxEnd()}`
            );
    },
};
