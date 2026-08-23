'use strict';
const fs = require('fs');
const path = require('path');

function toSansBold(str) { return '*' + String(str||'').trim() + '*'; }

const walk = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        return e.isFile() && e.name.endsWith('.js') ? [p] : [];
    });
};

module.exports = {
    name: 'allmenu',
    aliases: ['allhelp','listacomandi'],
    description: 'Mostra TUTTI i comandi del bot in ordine alfabetico, paginati.',
    async run(sock, msg, args, context) {
        const { from, sender, services } = context;
        const { sendButtons, commands } = services || {};

        // ── RACCOLTA COMANDI ─────────────────────────────────────────
        let names = [];
        let totalLoaded = 0;
        if (commands && typeof commands.values === 'function' && commands.size) {
            const seen = new Set();
            for (const mod of commands.values()) {
                if (!mod || typeof mod.name !== 'string') continue;
                if (mod.hidden) continue;
                const n = mod.name.trim().toLowerCase();
                if (!n || seen.has(n)) continue;
                seen.add(n);
                names.push(n);
            }
            totalLoaded = names.length;
        }
        // fallback filesystem se Map vuota o non disponibile
        if (!names.length) {
            try {
                const cmdDir = path.join(__dirname, '..', '..', 'commands');
                const files = walk(cmdDir);
                const seen = new Set();
                for (const f of files) {
                    try {
                        delete require.cache[require.resolve(f)];
                        const m = require(f);
                        if (m && typeof m.name === 'string' && typeof m.run === 'function') {
                            const n = m.name.trim().toLowerCase();
                            if (n && !seen.has(n) && !m.hidden) { seen.add(n); names.push(n); }
                        } else {
                            const base = path.basename(f, '.js').toLowerCase();
                            if (base && !seen.has(base)) { seen.add(base); names.push(base); }
                        }
                    } catch (_) {
                        const base = path.basename(f, '.js').toLowerCase();
                        if (base && !seen.has(base)) { seen.add(base); names.push(base); }
                    }
                }
                totalLoaded = names.length;
            } catch (e) {
                names = [];
            }
        }

        names.sort((a,b) => a.localeCompare(b));
        const total = names.length || 0;
        if (!total) {
            const txt = `${toSansBold('ALLMENU')}  📚\n${'━'.repeat(22)}\n▸ Nessun comando trovato.\n${'━'.repeat(22)}\n◈ _Vex Bot_`;
            if (typeof sendButtons === 'function') return sendButtons(sock, from, txt, [{ label: '🏠 Menu', id: 'menu' }], msg);
            return sock.sendMessage(from, { text: txt }, { quoted: msg });
        }

        const PER_PAGE = 28;
        const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
        let page = parseInt(String(args[0]||'').trim(), 10);
        if (!Number.isFinite(page) || page < 1) page = 1;
        if (page > totalPages) page = totalPages;

        const start = (page - 1) * PER_PAGE;
        const slice = names.slice(start, start + PER_PAGE);

        // ── GRAFICA ──────────────────────────────────────────────────
        const title = toSansBold('ALLMENU');
        const line = '━'.repeat(26);
        const thin = '─'.repeat(26);
        // tabella numerata con box unicode
        const pad = (n) => String(n).padStart(3, '0');
        let bodyLines = [];
        for (let i=0;i<slice.length;i++) {
            const idx = start + i + 1;
            const cmd = slice[i];
            // riga tipo:  001 │ .gayometro
            bodyLines.push(`${pad(idx)} │ .${cmd}`);
        }
        const table = bodyLines.join('\n');

        const header = `${title} — ${total} ${toSansBold('COMANDI')}  📚`;
        const footer = `Pagina ${page}/${totalPages}  •  ${total} totali`;
        const hint = `💡 Usa .allmenu <num> o i pulsanti`;

        const text = `${header}\n${line}\n${table}\n${thin}\n${footer}\n${hint}\n${line}\n◈ _Vex Bot_`;

        // ── PULSANTI ─────────────────────────────────────────────────
        const buttons = [];
        // single_select per salto pagina (max 20 righe)
        if (totalPages > 1) {
            const rows = [];
            const maxRows = Math.min(totalPages, 20);
            // se troppe pagine, mostra finestre scorrevoli centrate su page
            let startP = 1;
            if (totalPages > 20) {
                startP = Math.max(1, Math.min(page - 10, totalPages - 19));
            }
            for (let p = startP; p < startP + maxRows && p <= totalPages; p++) {
                const fromIdx = (p-1)*PER_PAGE + 1;
                const toIdx = Math.min(p*PER_PAGE, total);
                rows.push({
                    header: p === page ? '●' : '○',
                    title: `Pagina ${p}`,
                    description: `${fromIdx}-${toIdx} • ${p===page?'● attuale':''}`.trim(),
                    id: `allmenu ${p}`
                });
            }
            buttons.push({
                type: 'single_select',
                label: '📄 Vai a pagina',
                title: `📄 Seleziona pagina (1-${totalPages})`,
                sectionTitle: 'Pagine disponibili',
                rows
            });
        }
        // quick_reply prev/next (max 3 bottoni totali, single_select conta 1)
        // se abbiamo già single_select, possiamo aggiungere max 2 quick_reply
        const quick = [];
        if (page > 1) quick.push({ label: '⬅️ Precedente', id: `allmenu ${page-1}` });
        if (page < totalPages) quick.push({ label: '➡️ Successivo', id: `allmenu ${page+1}` });
        // aggiungi quick fino a riempire max 3 slot totali
        for (const q of quick) {
            if (buttons.length < 3) buttons.push(q);
        }
        // se nessuna pagina (single) aggiungi home
        if (buttons.length === 0) buttons.push({ label: '🏠 Menu', id: 'menu' });
        // se solo single_select e nessun quick, aggiungi home come quick se spazio
        if (buttons.length === 1 && buttons[0].type === 'single_select' && totalPages>1) {
            // aggiungi almeno un quick se spazio
            if (page > 1 && buttons.length < 3) buttons.push({ label: '⬅️ Indietro', id: `allmenu ${page-1}` });
            else if (page < totalPages && buttons.length < 3) buttons.push({ label: '➡️ Avanti', id: `allmenu ${page+1}` });
        }

        try {
            if (typeof sendButtons === 'function') {
                await sendButtons(sock, from, text, buttons.slice(0,3), msg);
            } else {
                await sock.sendMessage(from, { text }, { quoted: msg });
            }
        } catch (e) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
    }
};
