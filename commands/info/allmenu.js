'use strict';
const fs = require('fs');
const path = require('path');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const cleanDesc = (m) => String(m.description || '').replace(/\s+/g, ' ').trim();

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
    description: 'Mostra TUTTI i comandi del bot in ordine alfabetico, in un unico messaggio.',
    async run(sock, msg, args, context) {
        const { from, services } = context;
        const { sendButtons, commands } = services || {};

        // ── RACCOLTA COMANDI (unici, no hidden) ─────────────────────
        let mods = [];
        if (commands && typeof commands.values === 'function' && commands.size) {
            mods = [...new Set(commands.values())]
                .filter(m => m && typeof m.name === 'string' && !m.hidden)
                .sort((a, b) => a.name.localeCompare(b.name));
        }
        // fallback filesystem se Map vuota o non disponibile
        if (!mods.length) {
            try {
                const cmdDir = path.join(__dirname, '..', '..', 'commands');
                const files = walk(cmdDir);
                const seen = new Set();
                for (const f of files) {
                    try {
                        delete require.cache[require.resolve(f)];
                        const m = require(f);
                        if (m && typeof m.name === 'string' && typeof m.run === 'function' && !m.hidden) {
                            const n = m.name.trim().toLowerCase();
                            if (n && !seen.has(n)) {
                                seen.add(n);
                                mods.push({ name: n, description: m.description || '', aliases: m.aliases || [] });
                            }
                        } else if (m && typeof m.name === 'string' && !m.hidden) {
                            const n = m.name.trim().toLowerCase();
                            if (n && !seen.has(n)) {
                                seen.add(n);
                                mods.push({ name: n, description: m.description || '', aliases: m.aliases || [] });
                            }
                        }
                    } catch (_) {
                        // fallback basename se require fallisce ma file esiste
                        const base = path.basename(f, '.js').toLowerCase();
                        if (base && !seen.has(base) && base !== 'estorsione') {
                            // ignora hidden noto
                            seen.add(base);
                            mods.push({ name: base, description: '', aliases: [] });
                        }
                    }
                }
                mods.sort((a, b) => a.name.localeCompare(b.name));
            } catch (e) {
                mods = [];
            }
        }

        const total = mods.length;
        if (!total) {
            const txt = `${sec('ALLMENU')}\n${boxOpen()}\n${line('Nessun comando trovato.')}\n${boxEnd()}`;
            if (typeof sendButtons === 'function') return sendButtons(sock, from, txt, [{ label: '🏠 Menu', id: 'menu' }], msg);
            return sock.sendMessage(from, { text: txt }, { quoted: msg });
        }

        const lista = mods.map(m => `│ • .${m.name} — ${cleanDesc(m)}`).join('\n');
        const buildText = `${sec('ALLMENU')}\n${boxOpen()}\n${lista}\n${boxEnd()}`;

        // ── INVIO: documento se lungo, altrimenti singolo messaggio ──
        if (buildText.length > 900) {
            try {
                return await sock.sendMessage(from, {
                    document: Buffer.from(buildText, 'utf-8'),
                    mimetype: 'text/plain',
                    fileName: 'Guida Vex Bot - Allmenu.txt',
                }, { quoted: msg });
            } catch (e) {
                // fallback a invio testo spezzato se documento fallisce
                if (typeof sendButtons === 'function') {
                    try {
                        return await sendButtons(sock, from, buildText, [{ label: '🏠 Menu', id: 'menu' }], msg);
                    } catch (_) {}
                }
                return sock.sendMessage(from, { text: buildText }, { quoted: msg });
            }
        }

        // testo corto: singolo messaggio via sendButtons
        const buttons = [{ label: '🏠 Menu', id: 'menu' }];
        try {
            if (typeof sendButtons === 'function') {
                await sendButtons(sock, from, buildText, buttons, msg);
            } else {
                await sock.sendMessage(from, { text: buildText }, { quoted: msg });
            }
        } catch (e) {
            await sock.sendMessage(from, { text: buildText }, { quoted: msg });
        }
    }
};
