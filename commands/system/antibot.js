'use strict';

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'antibot',
    aliases: [],
    description: "Attiva/disattiva filtro antibot: quando qualcuno esegue un comando, caccia gli altri bot che rispondono.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        if (!db._antibot) db._antibot = {};
        if (!db._antibot[from]) db._antibot[from] = { enabled: false, whitelist: [] };

        const cfg = db._antibot[from];
        const sub = (textArgs || '').trim().toLowerCase();

        if (sub === 'on' || sub === 'true' || sub === '1') {
            cfg.enabled = true;
            saveDB();
            return reply(`🤖 ${toDecorated('ANTIBOT ATTIVATO', 'outline', '✠')} — quando qualcuno usa un comando, gli altri bot che rispondono verranno rimossi.`);
        }
        if (sub === 'off' || sub === 'false' || sub === '0') {
            cfg.enabled = false;
            saveDB();
            return reply(`🤖 ${toDecorated('ANTIBOT DISATTIVATO', 'outline', '✠')}.`);
        }

        if (sub.startsWith('whitelist ') || sub.startsWith('wl ')) {
            const num = sub.replace(/^(whitelist|wl)\s+/, '').replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply("⚠️ _[uso]:_ numero non valido.\n▸ .antibot whitelist <numero>");
            if (cfg.whitelist.includes(num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w !== num);
                saveDB();
                return reply(`✅ _${num}_ rimosso dalla whitelist antibot.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ _${num}_ aggiunto alla whitelist antibot.`);
        }

        const status = cfg.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        const wlList = cfg.whitelist.length ? cfg.whitelist.map(w => `▸ _${w}_`).join('\n') : '▸ _Nessuno._';
        return reply(
`🤖 ${toDecorated('ANTIBOT', 'outline', '✠')}
━━━━━━━━━━━━━━━━━━
▸ Stato: _${status}_
━━━━━━━━━━━━━━━━━━
📋 *Come funziona*
▸ Quando un membro usa un
  comando (es. .menu), gli altri
  bot che rispondono con output
  automatico vengono cacciati.
━━━━━━━━━━━━━━━━━━
📋 *Whitelist*
${wlList}
▸ Uso: \`.antibot on/off\`
  \`.antibot whitelist <n>\`
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};
