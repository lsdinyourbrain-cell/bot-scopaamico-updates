'use strict';

module.exports = {
    name: 'clear',
    aliases: ['pulizia', 'cache', 'svuota', 'ds'],
    description: "Pulisce le cache e i file temporanei del bot per renderlo più veloce.",

    async run(sock, msg, args, context) {
        const { reply, services } = context;
        const { clearBotCache } = services;

        if (!context.isOwner) {
            return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━━━━━\nComando riservato\nall'Owner del bot.\n━━━━━━━━━━━━━━━━━━");
        }

        const before = Date.now();
        const result = clearBotCache();
        const elapsed = Date.now() - before;
        const freedMB = (result.freedBytes / 1024).toFixed(2);
        const tempBeforeMB = (result.tempTotalBefore / 1024).toFixed(2);
        const dbKB = (result.dbBytes / 1024).toFixed(1);
        const logKB = (result.logBytes / 1024).toFixed(1);

        await reply(
`🧹 *CACHE PULITA* — *DS* ✅
━━━━━━━━━━━━━━━━━━━━
✨ Pulito in *${elapsed}ms* — il bot vola ora!

🗑️ File rimossi: *${result.deletedFiles}*
💾 Spazio liberato: *${freedMB} KB*
📦 Cache gruppi: *${result.groupEntries}* azzerate
━━━━━━━━━━━━━━━━━━━━
📊 *Stato attuale*
💾 DB: *${dbKB} KB*  •  📄 Log: *${logKB} KB*
🗂️ Temp prima: *${tempBeforeMB} KB*
━━━━━━━━━━━━━━━━━━━━
⚡ *VEX BOT* — più veloce! 🚀`);
    },
};
