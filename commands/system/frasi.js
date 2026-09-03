'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const phrasesLib = require('../../lib/phrases');

module.exports = {
    name: 'frasi',
    aliases: ['frase', 'setfrase', 'setfrasi', 'phrases'],
    description: 'Gestisci le frasi dei comandi (una frase per riga in phrases/*.txt). Solo admin/owner.',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { ARRAYS, COPY } = services;

        // Permessi: solo admin o owner
        if (isGroup && !isOwner && !isSenderAdmin) {
            return reply(`❌  Solo gli *admin* possono modificare le frasi.`);
        }
        if (!isGroup && !isOwner) {
            return reply(`❌ Solo l'owner può usare questo comando in privato.`);
        }

        const sub = String(args[0] || '').toLowerCase();

        // ── LISTA 
        if (!sub || sub === 'lista' || sub === 'list') {
            const keys = phrasesLib.listKeys();
            // Aggiungi anche le chiavi ARRAYS/COPY che non hanno ancora file
            const allKeys = [...new Set([...Object.keys(ARRAYS || {}), ...Object.keys(COPY || {}).map(k => 'copy_' + k), ...keys])].sort();
            const lines = allKeys.map(k => {
                const hasFile = phrasesLib.exists(k);
                const count = hasFile ? (phrasesLib.getPhrases(k) || []).length : (ARRAYS[k] || COPY[k.replace(/^copy_/, '')] || []).length;
                const icon = hasFile ? '' : '▫';
                return `${icon} \`${k}\` — ${count} frasi ${hasFile ? '(custom)' : '(default)'}`;
            }).join('\n');

            return reply(
`   *FRASI — LISTA*   

${lines || '_Nessuna frase trovata._'}

${line('Uso:')}
${line('`.frasi mostra <nome>` — vedi le frasi')}
${line('`.frasi aggiungi <nome> <frase>` — aggiungi')}
${line('`.frasi set <nome> frase1 | frase2 | ...` — sovrascrivi')}
${line('`.frasi rimuovi <nome> <numero>` — elimina')}
${line('`.frasi reset <nome>` — ripristina default')}

`
            );
        }

        // ── MOSTRA 
        if (sub === 'mostra' || sub === 'show' || sub === 'vedi') {
            const key = String(args[1] || '').toLowerCase().trim();
            if (!key) return reply(`⚠️ Uso: _.frasi mostra <nome>_\nEs: _.frasi mostra schiaffi_`);
            const phrases = phrasesLib.getPhrases(key) || ARRAYS[key] || COPY[key.replace(/^copy_/, '')] || null;
            if (!phrases) return reply(`❌ Nessuna frase trovata per \`${key}\`.\n${line('Prova _.frasi lista_')}`);
            const list = phrases.map((p, i) => `${String(i + 1).padStart(2, '0')}. ${p}`).join('\n');
            // Se troppo lungo, spezza
            const header = `   *FRASI — ${key.toUpperCase()}*   \n\n`;
            const txt = header + list + `\n\n${line(`Totale: ${phrases.length} frasi`)}\n\n`;
            if (txt.length > 3500) {
                // Invia come documento se troppo lungo
                return reply(`   *FRASI — ${key.toUpperCase()}*   \n\n${line(`Totale: ${phrases.length} frasi — invio prime 20:`)}\n${phrases.slice(0, 20).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`);
            }
            return reply(txt);
        }

        // ── AGGIUNGI 
        if (sub === 'aggiungi' || sub === 'add' || sub === 'nuova') {
            const key = String(args[1] || '').toLowerCase().trim();
            const frase = args.slice(2).join(' ').trim();
            if (!key || !frase) return reply(`⚠️ Uso: _.frasi aggiungi <nome> <frase>_\nEs: _.frasi aggiungi schiaffi nuova frase qui_`);
            if (frase.length > 400) return reply(`❌ Frase troppo lunga (max 400).`);
            // Aggiorna file
            const existing = phrasesLib.getPhrases(key) || ARRAYS[key] || COPY[key.replace(/^copy_/, '')] || [];
            const updated = [...existing, frase];
            phrasesLib.savePhrases(key, updated);
            // Aggiorna in memoria se è ARRAYS/COPY/POWER
            if (ARRAYS && ARRAYS[key]) ARRAYS[key] = updated;
            if (COPY && key.startsWith('copy_') && COPY[key.slice(5)]) COPY[key.slice(5)] = updated;
            // Power: se è scopa_1 ecc.
            try {
                const power = require('../../lib/power');
                const m = key.match(/^(scopa|sborra|sega|ditalino|squirt)_([123])$/);
                if (m && power.PHRASES[m[1]] && power.PHRASES[m[1]][m[2]]) power.PHRASES[m[1]][m[2]] = updated;
                const o = key.match(/^outro_(.+)$/);
                if (o && power.OUTRO && power.OUTRO[o[1]]) power.OUTRO[o[1]] = updated;
            } catch (_) {}

            return reply(
`   *FRASE AGGIUNTA*   

${line(`File: \`${key}.txt\``)}
${line(`Totale: ${updated.length} frasi`)}
${line(`Nuova: _${frase.slice(0, 80)}${frase.length > 80 ? '…' : ''}_`)}

`
            );
        }

        // ── SET (sovrascrivi tutto) 
        if (sub === 'set' || sub === 'imposta' || sub === 'sovrascrivi') {
            const key = String(args[1] || '').toLowerCase().trim();
            const rest = args.slice(2).join(' ').trim();
            if (!key || !rest) return reply(`⚠️ Uso: _.frasi set <nome> frase1 | frase2 | frase3_\nEs: _.frasi set schiaffi frase uno | frase due_\n${line('Separa le frasi con `|`')}`);
            const phrases = rest.split('|').map(s => s.trim()).filter(Boolean);
            if (!phrases.length) return reply(`❌ Nessuna frase valida.`);
            if (phrases.some(p => p.length > 400)) return reply(`❌ Una frase supera i 400 caratteri.`);
            phrasesLib.savePhrases(key, phrases);
            if (ARRAYS && ARRAYS[key]) ARRAYS[key] = phrases;
            if (COPY && key.startsWith('copy_') && COPY[key.slice(5)]) COPY[key.slice(5)] = phrases;
            try {
                const power = require('../../lib/power');
                const m = key.match(/^(scopa|sborra|sega|ditalino|squirt)_([123])$/);
                if (m && power.PHRASES[m[1]] && power.PHRASES[m[1]][m[2]]) power.PHRASES[m[1]][m[2]] = phrases;
                const o = key.match(/^outro_(.+)$/);
                if (o && power.OUTRO && power.OUTRO[o[1]]) power.OUTRO[o[1]] = phrases;
            } catch (_) {}

            return reply(
`   *FRASI IMPOSTATE*   

${line(`File: \`${key}.txt\``)}
${line(`Totale: ${phrases.length} frasi sovrascritte`)}

`
            );
        }

        // ── RIMUOVI 
        if (sub === 'rimuovi' || sub === 'elimina' || sub === 'del' || sub === 'remove') {
            const key = String(args[1] || '').toLowerCase().trim();
            const idxStr = String(args[2] || '').trim();
            if (!key || !idxStr) return reply(`⚠️ Uso: _.frasi rimuovi <nome> <numero>_\nEs: _.frasi rimuovi schiaffi 3_`);
            const idx = parseInt(idxStr, 10) - 1;
            if (isNaN(idx)) return reply(`❌ Numero non valido.`);
            const updated = phrasesLib.removePhrase(key, idx);
            if (!updated) return reply(`❌ Indice fuori range o file inesistente.\n${line('Vedi _.frasi mostra ' + key + '_')}`);
            if (ARRAYS && ARRAYS[key]) ARRAYS[key] = updated;
            if (COPY && key.startsWith('copy_') && COPY[key.slice(5)]) COPY[key.slice(5)] = updated;
            try {
                const power = require('../../lib/power');
                const m = key.match(/^(scopa|sborra|sega|ditalino|squirt)_([123])$/);
                if (m && power.PHRASES[m[1]] && power.PHRASES[m[1]][m[2]]) power.PHRASES[m[1]][m[2]] = updated;
            } catch (_) {}

            return reply(
`   *FRASE RIMOSSA*   

${line(`File: \`${key}.txt\``)}
${line(`Rimossa #${idx + 1}, rimaste ${updated.length}`)}

`
            );
        }

        // ── RESET 
        if (sub === 'reset' || sub === 'ripristina' || sub === 'default') {
            const key = String(args[1] || '').toLowerCase().trim();
            if (!key) return reply(`⚠️ Uso: _.frasi reset <nome>_`);
            const f = phrasesLib.fileFor(key);
            const fs = require('fs');
            if (!fs.existsSync(f)) return reply(`ℹ️ \`${key}.txt\` è già al default (nessun file custom).`);
            fs.unlinkSync(f);
            // Ricarica da ARRAYS/COPY originali? Serve riavvio per ripristinare, ma avvisiamo
            return reply(
`   *FRASI RESETTATE*   

${line(`File \`${key}.txt\` eliminato`)}
${line(`Al prossimo riavvio tornerà il default`)}
${line(`Oppure usa _.frasi set ${key} ..._ per reimpostare subito`)}

`
            );
        }

        return reply(
`   *FRASI — AIUTO*   

${line('`.frasi lista` — tutti i file')}
${line('`.frasi mostra <nome>` — vedi frasi')}
${line('`.frasi aggiungi <nome> <frase>` — aggiungi')}
${line('`.frasi set <nome> f1 | f2 | f3` — sovrascrivi')}
${line('`.frasi rimuovi <nome> <n>` — elimina n°')}
${line('`.frasi reset <nome>` — torna al default')}

${line('Esempi:')}
${line('`.frasi mostra schiaffi`')}
${line('`.frasi aggiungi verita Hai mai ...?`')}
${line('`.frasi set rissa X ha vinto! | Y ha perso`')}

`
        );
    },
};
