'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// ─────────────────────────────────────────────────────────────────────────────
//  STRUTTURA — Vex Bot (solo OWNER)
//  Mostra tutte le cartelle del bot con i NOMI dei file che contengono.
//  Solo nomi, nessun contenuto. Esclude le cartelle tecniche pesanti
//  (node_modules, .git, sessione, media generati).
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'auth_info_baileys',
    'temp', 'logs', '.github', '__pycache__',
]);
const MAX_PER_DIR = 40;   // oltre: mostra i primi N + conteggio
const MAX_DIRS = 60;      // sicurezza per gruppi/cartelle enormi

module.exports = {
    name: 'struttura',
    aliases: ['alberofile', 'files', 'directory'],
    hidden: true,
    description: "Elenca tutte le cartelle del bot e i nomi dei file (solo owner).",

    async run(sock, msg, args, context) {
        const { from, isOwner, reply, services } = context;
        const { projectDir } = services;

        if (!isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        const root = String(args[0] || '').trim() ? path.join(projectDir, args[0]) : projectDir;
        if (!root.startsWith(projectDir) || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Cartella non trovata.')}
${boxEnd()}`);
        }

        const sections = [];
        let dirCount = 0;

        const walk = (dir, label) => {
            if (dirCount >= MAX_DIRS) return;
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
            const files = entries.filter(e => e.isFile() && e.name.endsWith('.js')).map(e => e.name).sort();
            const dirs = entries.filter(e => e.isDirectory() && !EXCLUDED_DIRS.has(e.name)).map(e => e.name).sort();
            if (files.length || dirs.length) {
                dirCount++;
                let block = `📁 *${label}/*`;
                for (const d of dirs) {
                    walk(path.join(dir, d), `${label}/${d}`);
                }
                if (files.length) {
                    const shown = files.slice(0, MAX_PER_DIR);
                    block += `\n└ ${shown.join(', ')}`;
                    if (files.length > MAX_PER_DIR) block += `\n└ …+${files.length - MAX_PER_DIR} altri file`;
                }
                sections.push(block);
            }
        };

        // Cartelle di primo livello + radice
        walk(root, 'bot');

        const text =
`🗂️ *STRUTTURA DEL BOT*
${sections.join('\n\n')}
▸ Solo nomi file · niente contenuti
▸ \`.struttura commands\` per una sola cartella`;

        await reply(text);
    },
};
