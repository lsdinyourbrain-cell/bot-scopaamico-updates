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
            return reply("╭────〔 ⛔ ACCESSO NEGATO 〕────╮\n│ Comando riservato all'Owner del bot.\n╰──────────────────────────────╯");
        }

        const before = Date.now();
        const result = clearBotCache();
        const elapsed = Date.now() - before;
        const freedMB = (result.freedBytes / 1024 / 1024).toFixed(2);

        await reply(
`╭────〔 🧹 ${SB('CACHE PULITA')} 〕────╮
│                              │
│ ✨ Operazione completata in  │
│    ${elapsed} ms.               │
│                              │
│ 🗑️ File temporanei rimossi:  │
│    ${result.deletedFiles}                │
│ 💾 Spazio liberato:          │
│    ${freedMB} MB              │
│ 🔄 Cache gruppi azzerata:    │
│    ${result.groupEntries}                │
│                              │
│ ⚡ Il bot ora risponde più   │
│    veloce! 🚀                │
╰──────────────────────────────╯`);
    },
};
