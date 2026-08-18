'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  AIUTO — Vex Bot
//  .aiuto            → invia un file .txt con TUTTI i comandi spiegati
//  .aiuto <comando>  → spiega un singolo comando (uso, alias, descrizione)
//  .aiuto <sezione>  → elenca tutti i comandi di una sezione con le descrizioni
//  Le descrizioni sono prese direttamente dai moduli: sempre aggiornate.
// ─────────────────────────────────────────────────────────────────────────────

const { SECTIONS } = require('./menu');
const pkg = require('../../package.json');

const SEP = '━━━━━━━━━━━━━━━━━━';

// Raccoglie i comandi unici dal registro (la Map include alias → stesso modulo).
// I comandi marcati hidden:true restano utilizzabili ma NON appaiono né nella
// guida né nel menu: sono "nascosti" di proposito (es. .raid, .dedsecregna).
const uniqueCommands = (commands) =>
    [...new Set(commands.values())]
        .filter(m => !m.hidden)
        .sort((a, b) => a.name.localeCompare(b.name));

const cleanDesc = (m) => String(m.description || '').replace(/\s+/g, ' ').trim();

// Crea il file .txt con la guida completa, raggruppata per sezione.
const buildGuideTxt = (commands) => {
    const nameSection = new Map();
    for (const s of SECTIONS) {
        for (const [, cmd] of s.items) nameSection.set(cmd, s.title);
    }

    const bySection = new Map();
    for (const m of uniqueCommands(commands)) {
        const title = nameSection.get(m.name) || 'ALTRO';
        if (!bySection.has(title)) bySection.set(title, []);
        bySection.get(title).push(m);
    }

    let out = '';
    out += `✧ GUIDE COMPLETA — Vex Bot v${pkg.version} ✧\n`;
    out += `In chat usa "." davanti a ogni comando.\n`;
    out += `Menu interattivo: .menu  ·  Dettaglio comando: .aiuto <comando>\n\n`;

    for (const title of [...SECTIONS.map(s => s.title), 'ALTRO']) {
        const list = bySection.get(title);
        if (!list || !list.length) continue;
        out += `\n${'═'.repeat(34)}\n`;
        out += `${title} (${list.length})\n`;
        out += `${'─'.repeat(34)}\n`;
        for (const m of list) {
            const aliases = (m.aliases && m.aliases.length)
                ? `  [alias: ${m.aliases.map(a => '.' + a).join(', ')}]`
                : '';
            out += `• .${m.name}${aliases} — ${cleanDesc(m)}\n`;
        }
    }

    // Solo i comandi con la spiegazione: nessuna riga finale decorativa.
    return out;
};

// Spiegazione di un singolo comando.
const explain = (mod) => {
    const aliases = (mod.aliases && mod.aliases.length)
        ? `\n📎 Alias: ${mod.aliases.map(a => '.' + a).join(', ')}`
        : '';
    return (
`📘 *_AIUTO — .${mod.name}_*${aliases}
${SEP}
▸ 📝 ${cleanDesc(mod)}
${SEP}
▸ 💡 Scrivi \`.aiuto\` per la guida completa,
  o \`.menu\` per navigare le sezioni.`);
};

// Elenco dei comandi di una sezione con le descrizioni complete.
const sectionDump = (section, commands) => {
    const rows = section.items.map(([emoji, cmd]) => {
        const mod = commands.get(cmd);
        const desc = mod ? cleanDesc(mod) : '';
        return `${emoji} \`.${cmd}\` — ${desc}`;
    });
    return (
`${section.emoji} *_SEZIONE ${section.title}_* · _${section.items.length} comandi_
${SEP}
${rows.join('\n')}
${SEP}
💡 Per il dettaglio: \`.aiuto <comando>\``);
};

module.exports = {
    name: 'aiuto',
    aliases: ['help', 'guida', 'helpme'],
    description: "Invia la guida completa (.txt) con tutti i comandi, spiega un comando (.aiuto <comando>) o una sezione (.aiuto <sezione>).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { commands } = services;

        if (!commands) {
            return reply("❌ Guida non disponibile in questo momento. Riprova tra poco.");
        }

        const q = String(textArgs || '').trim().toLowerCase();

        // ".aiuto" / ".guida" (o il pulsante 📖 Guida del menu) SENZA
        // argomenti: invia il file .txt con TUTTI i comandi spiegati.
        if (!q) {
            const txt = buildGuideTxt(commands);
            return sock.sendMessage(from, {
                document: Buffer.from(txt, 'utf-8'),
                mimetype: 'text/plain',
                fileName: 'Guida Vex Bot.txt',
            }, { quoted: msg }).catch(() => reply("📄 Guida pronta ma il file non è stato inviato. Riprova tra poco."));
        }

        // ── COMANDO (priorità: un comando può avere lo stesso nome di una sezione) ─
        const mod = commands.get(q);
        if (mod) return reply(explain(mod));

        // ── SEZIONE ───────────────────────────────────────────────────────
        const sec = SECTIONS.find(s => s.key === q)
            || SECTIONS.find((s, i) => String(i + 1) === q);
        if (sec) return reply(sectionDump(sec, commands));

        // ── NON TROVATO: suggerisci i comandi più simili ──────────────────
        const near = uniqueCommands(commands)
            .map(m => m.name)
            .filter(n => n.includes(q) || q.includes(n))
            .slice(0, 5);
        const sug = near.length ? `\n\nForse cercavi: ${near.map(n => '.' + n).join(', ')}` : '';
        return reply(
`❓ Comando o sezione *${q}* non trovato.${sug}

💡 Usa \`.aiuto\` per la guida completa,
   o \`.menu\` per vedere tutte le sezioni.`);
    },
};
