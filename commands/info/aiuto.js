'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

//
//  AIUTO — Vex Bot
//  .aiuto            → invia un file .txt con TUTTI i comandi spiegati
//  .aiuto <comando>  → spiega un singolo comando (uso, alias, descrizione)
//  .aiuto <sezione>  → elenca tutti i comandi di una sezione con le descrizioni
//  Le descrizioni sono prese direttamente dai moduli: sempre aggiornate.
//

const { SECTIONS } = require('./menu');
const pkg = require('../../package.json');

const uniqueCommands = (commands) =>
    [...new Set(commands.values())]
        .filter(m => !m.hidden)
        .sort((a, b) => a.name.localeCompare(b.name));

const cleanDesc = (m) => String(m.description || '').replace(/\s+/g, ' ').trim();

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
    out += ` GUIDE COMPLETA — Vex Bot v${pkg.version} \n`;
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

    return out;
};

const explain = (mod) => {
    const aliases = (mod.aliases && mod.aliases.length)
        ? mod.aliases.map(a => '.' + a).join(', ')
        : '';
    const lines = [
        line(`Comando: .${mod.name}`),
        ...(aliases ? [line(`Alias: ${aliases}`)] : []),
        line(''),
        line(cleanDesc(mod)),
        line(''),
        line('Scrivi `.aiuto` per la guida completa,'),
        line('o `.menu` per navigare le sezioni.'),
    ];
    return `${sec(`AIUTO — .${mod.name.toUpperCase()}`)}\n${boxOpen()}\n${lines.join('\n')}\n${boxEnd()}`;
};

const sectionDump = (section, commands) => {
    const rows = section.items.map(([emoji, cmd]) => {
        const mod = commands.get(cmd);
        const desc = mod ? cleanDesc(mod) : '';
        return line(`${emoji} \`.${cmd}\` — ${desc}`);
    });
    return (
`${sec(`SEZIONE ${section.title}`)}
${boxOpen()}
${line(`${section.emoji} ${section.title} · ${section.items.length} comandi`)}
${line('')}
${rows.join('\n')}
${line('')}
${line('Per il dettaglio: `.aiuto <comando>`')}
${boxEnd()}`);
};

module.exports = {
    name: 'aiuto',
    aliases: ['help', 'guida', 'helpme'],
    description: "Invia la guida completa (.txt) con tutti i comandi, spiega un comando (.aiuto <comando>) o una sezione (.aiuto <sezione>).",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { commands } = services;

        if (!commands) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Guida non disponibile in questo momento. Riprova tra poco.')}
${boxEnd()}`);
        }

        const q = String(textArgs || '').trim().toLowerCase();

        if (!q) {
            const txt = buildGuideTxt(commands);
            return sock.sendMessage(from, {
                document: Buffer.from(txt, 'utf-8'),
                mimetype: 'text/plain',
                fileName: 'Guida Vex Bot.txt',
            }, { quoted: msg }).catch(() => reply(`${sec('ERRORE')}
${boxOpen()}
${line('Guida pronta ma il file non è stato inviato. Riprova tra poco.')}
${boxEnd()}`));
        }

        const mod = commands.get(q);
        if (mod) return reply(explain(mod));

        const foundSec = SECTIONS.find(s => s.key === q)
            || SECTIONS.find((s, i) => String(i + 1) === q);
        if (foundSec) return reply(sectionDump(foundSec, commands));

        const near = uniqueCommands(commands)
            .map(m => m.name)
            .filter(n => n.includes(q) || q.includes(n))
            .slice(0, 5);
        const sug = near.length ? near.map(n => '.' + n).join(', ') : '';
        const sugLines = sug ? [line(`Forse cercavi: ${sug}`), line('')] : [];
        return reply(
`${sec('NON TROVATO')}
${boxOpen()}
${line(`Comando o sezione *${q}* non trovato.`)}
${sugLines.join('\n')}${sugLines.length ? '' : ''}
${line('Usa `.aiuto` per la guida completa,')}
${line('o `.menu` per vedere tutte le sezioni.')}
${boxEnd()}`);
    },
};
