'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'call',
    aliases: ['chiamata', 'vocaleai'],
    description: "Modalità chiamata AI: trascrive vocali e risponde con AI (simula chiamata). Limiti anti-crash.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, saveDB } = services;

        const sub = String(context.textArgs||'').trim().toLowerCase();
        const cfg = (db._callAI && db._callAI[from]) || { enabled: false, maxMin: 5, cooldown: 30 };

        if (!sub || sub === 'stato' || sub === 'info') {
            return reply(
`${sec('CALL AI')}
${boxOpen()}
${line(`Stato: ${cfg.enabled ? '🟢 ATTIVA' : '🔴 SPENTA'}`)}
${line(`Max durata: ${cfg.maxMin} min`)}
${line(`Cooldown: ${cfg.cooldown}s`)}
${line(`Limiti: 1 chiamata alla volta, max 10 vocali/ora`)}
${boxEnd()}
▸ .call on/off — attiva/disattiva
▸ Invia un vocale quando attiva: trascrivo e rispondo con AI
▸ Nota: join chiamata diretta non stabile via Baileys (P2P cifrata), uso vocali come alternativa affidabile`);
        }

        if (!isGroup) return reply(`${sec('GRUPPI')}\n${boxOpen()}\n${line('solo nei gruppi.')}\n${boxEnd()}`);
        if (!isSenderAdmin && !isOwner) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('solo admin.')}\n${boxEnd()}`);

        if (sub === 'on' || sub === 'attiva' || sub === 'enable') {
            if (!db._callAI) db._callAI = {};
            db._callAI[from] = { ...cfg, enabled: true };
            saveDB();
            return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('🟢 Attivata')}\n${line('Invia un vocale: lo trascrivo e rispondo con AI')}\n${line('Limite: max 60s per vocale, 10/ora')}\n${boxEnd()}`);
        }
        if (sub === 'off' || sub === 'disattiva' || sub === 'disable') {
            if (!db._callAI) db._callAI = {};
            db._callAI[from] = { ...cfg, enabled: false };
            saveDB();
            return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('🔴 Disattivata')}\n${boxEnd()}`);
        }
        return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('Uso: .call on/off')}\n${line('.call stato')}\n${boxEnd()}`);
    },
};
