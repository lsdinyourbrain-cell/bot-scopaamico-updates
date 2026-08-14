'use strict';

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    if (cc >= 48 && cc <= 57) return String.fromCodePoint(0x1D7E2 + cc - 48);
    return c;
}).join('');

module.exports = {
    name: 'clear',
    aliases: ['pulizia', 'cache', 'svuota'],
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
`🧹 *CACHE PULITA*
━━━━━━━━━━━━━━━━━━
✨ Tutto pulito, fra!
in ${elapsed} ms.
🗑️ File temporanei rimossi:
${result.deletedFiles}
💾 Spazio liberato:
${freedMB} KB
📦 Cache gruppi azzerata:
${result.groupEntries}
📊 Stato attuale:
💾 DB: ${dbKB} KB
📄 Log: ${logKB} KB
🗂️ Temp (prima):
${tempBeforeMB} KB
⚡ Il bot ora risponde
più veloce! 🚀
━━━━━━━━━━━━━━━━━━`);
    },
};
