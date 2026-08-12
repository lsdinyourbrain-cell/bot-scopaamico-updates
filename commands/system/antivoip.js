'use strict';

module.exports = {
    name: 'antivoip',
    aliases: [],
    description: "Attiva/disattiva il filtro antivoip (solo +39) e whitelist.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;

        if (!isGroup) return reply("Funziona solo nei gruppi.");
        if (!isSenderAdmin) return reply("Solo gli admin possono usare questo comando.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        if (!db._antivoip) db._antivoip = {};
        if (!db._antivoip[from]) db._antivoip[from] = { enabled: false, whitelist: [] };

        const cfg = db._antivoip[from];
        const sub = (textArgs || '').trim().toLowerCase();

        if (sub === 'on' || sub === 'true' || sub === '1') {
            cfg.enabled = true;
            saveDB();
            return reply("🛡️ *Antivoip ATTIVATO* — i numeri non +39 verranno rimossi.");
        }
        if (sub === 'off' || sub === 'false' || sub === '0') {
            cfg.enabled = false;
            saveDB();
            return reply("🛡️ *Antivoip DISATTIVATO*.");
        }

        if (sub.startsWith('whitelist ') || sub.startsWith('wl ')) {
            const num = sub.replace(/^(whitelist|wl)\s+/, '').replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply("Numero non valido. Usa: .antivoip whitelist <numero>");
            if (cfg.whitelist.includes(num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w !== num);
                saveDB();
                return reply(`✅ ${num} rimosso dalla whitelist antivoip.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ ${num} aggiunto alla whitelist antivoip.`);
        }

        const status = cfg.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO';
        const wlList = cfg.whitelist.length ? cfg.whitelist.map(w => `• ${w}`).join('\n') : 'Nessun numero in whitelist.';
        return reply(
`🛡️ *ANTIVOIP*
━━━━━━━━━━━━━━━━━━
${status}
📋 *Whitelist:*
${wlList}
🇮🇹 Blocca numeri non
italiani (+39).
*Comandi:*
.antivoip on/off
.antivoip whitelist <n>
━━━━━━━━━━━━━━━━━━`);
    },
};
