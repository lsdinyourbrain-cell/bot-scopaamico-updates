'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'check',
    aliases: ['showdb', 'debug'],
    description: "Mostra e modifica i dati di un utente nel database (solo owner). Uso: .check @utente | .check @utente set <campo> <valore> | add <campo> <n> | del <campo> | reset",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, reply, services } = context;
        const { db, getUser, saveDB, sameJid } = services;

        if (!isOwner) return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);

        // ── Risoluzione target 
        let target = mentioned[0] || targetJid || null;
        if (!target && isReply) target = contextInfo?.participant || null;
        if (!target && textArgs.trim()) {
            const first = textArgs.trim().split(/\s+/)[0];
            const num = first.replace(/\D/g, '').slice(0, 16);
            if (num.length >= 8) target = num + '@s.whatsapp.net';
        }
        if (!target) {
            return reply(
`📌 ${sec('CHECK')}
▸ Tagga o rispondi a un utente
▸ (anche solo il numero: _.check 39..._)
▸ _azioni:_
▸ • _set <campo> <valore>_
▸ • _add <campo> <numero>_
▸ • _del <campo>_
▸ • _reset_
▸ _es. .check @utente set money 5000_
`);
        }

        // ── Azione da eseguire 
        const parts = textArgs.trim().split(/\s+/).map(p => p.trim()).filter(Boolean);
        const action = (parts.find(p => ['set', 'add', 'del', 'reset'].includes(p.toLowerCase())) || 'show').toLowerCase();
        const field = parts[parts.indexOf(parts.find(p => ['set', 'add', 'del'].includes(p.toLowerCase()))) + 1] || '';
        const rawValue = parts.slice(parts.indexOf(parts.find(p => ['set', 'add'].includes(p.toLowerCase()))) + 2).join(' ').trim();

        // Individua il record dell'utente in questa chat (o crealo)
        const userData = getUser(target, from);

        // ── RESET: ripristina ai valori di default 
        if (action === 'reset') {
            const keys = Object.keys(userData);
            for (const k of keys) {
                if (k === 'cooldowns' || k === 'lastDaily' || k === 'streakDay' || k === 'streakCount' || k === 'lastWealthTax' || k === 'wealthTaxPaid') continue;
                delete userData[k];
            }
            saveDB();
            return reply(`${sec('RESET ESEGUITO')}\n${boxOpen()}\n${line(`🧹 *_RESET ESEGUITO_*\n\n▸ @${target.split('@')[0]} ripristinato ai valori di default.\n▸ Campi rimossi: _${keys.length}_\n\n`)}\n${boxEnd()}`);
        }

        // ── SET / ADD / DEL 
        if ((action === 'set' || action === 'add') && !field) {
            return reply(`${sec('INFO')}\n${boxOpen()}\n${line('⚠️ Specifica il campo.\n▸ _es. .check @utente set money 5000_\n▸ _es. .check @utente add money 100_')}\n${boxEnd()}`);
        }

        if (action === 'del') {
            if (!field) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Specifica il campo da eliminare. ▸ _es. .check @utente del spouse')}
${boxEnd()}`);
            if (field === 'cooldowns') return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Non puoi eliminare i cooldown interi.')}
${boxEnd()}`);
            const existed = field in userData;
            delete userData[field];
            if (existed) saveDB();
            return reply(`${sec('CAMPO ELIMINATO')}\n${boxOpen()}\n${line(`🗑️ *_CAMPO ELIMINATO_*\n\n▸ Utente: _@${target.split('@')[0]}_\n▸ Campo: _${field}_\n▸ Stato: _${existed ? 'eliminato ✓' : 'non esisteva'}_\n\n`)}\n${boxEnd()}`);
        }

        if (action === 'set' || action === 'add') {
            if (!rawValue) return reply(`${sec('INFO')}\n${boxOpen()}\n${line('⚠️ Specifica il valore.\n▸ _es. .check @utente set money 5000_')}\n${boxEnd()}`);

            if (action === 'add') {
                const delta = Number(rawValue.replace(/[^\d\-.]/g, ''));
                if (isNaN(delta)) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Il valore deve essere un numero.')}
${boxEnd()}`);
                const cur = Number(userData[field]) || 0;
                userData[field] = cur + delta;
                saveDB();
                return reply(
`${sec('CAMPO AGGIORNATO')}\n${boxOpen()}\n${line(`Utente: _@${target.split('@')[0]}_`)}\n${line(`Campo: _${field}_`)}\n${line(`${cur} → _${userData[field]}_ (${delta >= 0 ? '+' : ''}${delta})`)}\n${boxEnd()}`);
            }

            // SET con parsing automatico del valore
            let value;
            if (rawValue === 'true' || rawValue === 'false') {
                value = rawValue === 'true';
            } else if (rawValue === 'null') {
                value = null;
            } else if (/^-?\d+(\.\d+)?$/.test(rawValue.replace(/[€\s]/g, ''))) {
                value = parseFloat(rawValue.replace(/[€\s]/g, ''));
            } else {
                try {
                    value = JSON.parse(rawValue);
                } catch (_) {
                    value = rawValue;
                }
            }

            const prev = userData[field];
            userData[field] = value;
            saveDB();
            const prevStr = prev === undefined ? '—' : (typeof prev === 'object' ? JSON.stringify(prev) : String(prev));
            const newStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return reply(
`${sec('CAMPO IMPOSTATO')}\n${boxOpen()}\n${line(`Utente: _@${target.split('@')[0]}_`)}\n${line(`Campo: _${field}_`)}\n${line(`Da: _${prevStr}_`)}\n${line(`A: _${newStr}_`)}\n${boxEnd()}`);
        }

        // ── SHOW: dump completo del record 
        const short = target.split('@')[0];
        const linee = [];
        for (const [k, v] of Object.entries(userData)) {
            if (v === undefined || v === null) {
                linee.push(`▸ _${k}:_ \`-\``);
            } else if (typeof v === 'object') {
                const s = JSON.stringify(v);
                linee.push(`▸ _${k}:_ \`${s.length > 90 ? s.slice(0, 90) + '…' : s}\``);
            } else if (typeof v === 'boolean') {
                linee.push(`▸ _${k}:_ ${v ? '✅ sì' : '❌ no'}`);
            } else {
                const s = String(v);
                linee.push(`▸ _${k}:_ \`${s.length > 90 ? s.slice(0, 90) + '…' : s}\``);
            }
        }

        // Presenza dell'utente in altre chat
        const altre = Object.entries(db).filter(([chat, users]) =>
            chat !== from && chat !== '_owners' && users && typeof users === 'object' && (users[target] || Object.keys(users).some(j => sameJid(j, target)))
        ).length;

        const totLines = linee.length;
        const chunk = linee.slice(0, 30).join('\n');
        const extra = totLines > 30 ? `\n▸ _… e altri ${totLines - 30} campi_` : '';

        const text =
`🔍 ${sec('CHECK DB')}
▸ Chat: _${from}_
▸ Utente: _${short}_ (${target.includes('@lid') ? 'LID' : 'PN'})
▸ Campi totali: _${totLines}_
▸ Presenza in altre ${altre} chat
${chunk}${extra}
▸ _modifica: .check @utente set <campo> <valore>_
`;

        // Risposta lunga → invio diretto, senza pulsante Ripeti
        await sock.sendMessage(from, { text }, { quoted: msg });
    },
};
