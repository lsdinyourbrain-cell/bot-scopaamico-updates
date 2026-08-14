'use strict';

module.exports = {
    name: 'antiwzbusiness',
    aliases: ['antiwb', 'awb'],
    description: "Attiva/disattiva filtro anti WhatsApp Business.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        if (!db._antiwzb) db._antiwzb = {};
        if (!db._antiwzb[from]) db._antiwzb[from] = { enabled: false, whitelist: [] };

        const cfg = db._antiwzb[from];
        const sub = (textArgs || '').trim().toLowerCase();

        if (sub === 'on' || sub === 'true' || sub === '1') {
            cfg.enabled = true;
            saveDB();
            return reply("🛡️ *_Anti WhatsApp Business ATTIVATO_*.");
        }
        if (sub === 'off' || sub === 'false' || sub === '0') {
            cfg.enabled = false;
            saveDB();
            return reply("🛡️ *_Anti WhatsApp Business DISATTIVATO_*.");
        }

        if (sub.startsWith('whitelist ') || sub.startsWith('wl ')) {
            const num = sub.replace(/^(whitelist|wl)\s+/, '').replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply("⚠️ _[uso]:_ numero non valido.\n▸ .antiwzbusiness whitelist <numero>");
            if (cfg.whitelist.includes(num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w !== num);
                saveDB();
                return reply(`✅ _${num}_ rimosso dalla whitelist.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ _${num}_ aggiunto alla whitelist.`);
        }

        const status = cfg.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        const wlList = cfg.whitelist.length ? cfg.whitelist.map(w => `▸ _${w}_`).join('\n') : '▸ _Nessuno._';
        return reply(
`🛡️ *_ANTI WZ BUSINESS_*
━━━━━━━━━━━━━━━━━━
▸ Stato: _${status}_
━━━━━━━━━━━━━━━━━━
📋 *Whitelist*
${wlList}
▸ Uso: \`.antiwzbusiness on/off\`
  \`.antiwzbusiness whitelist <n>\`
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`);
    },
};
