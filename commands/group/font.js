'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const { toStyle, STYLES } = require('../../lib/font');

module.exports = {
    name: 'font',
    aliases: ['setfont', 'stilefont', 'fontgruppo'],
    description: "Cambia il font dei messaggi del bot nel gruppo (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, saveDB } = services;

        if (!isGroup) return reply(`${sec('GRUPPI')}\n${boxOpen()}\n${line('funziona solo nei gruppi.')}\n${boxEnd()}`);
        if (!isSenderAdmin && !isOwner) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('solo admin.')}\n${boxEnd()}`);

        const sub = String(context.textArgs || '').trim().toLowerCase();
        const available = Object.keys(STYLES);

        if (!sub || sub === 'lista' || sub === 'list') {
            const cur = (db[from] && db[from]._groupFont) || 'sansBold';
            const preview = available.map(s => `${s}: ${toStyle('ABC abc', s)}`).join('\n');
            return reply(`${sec('FONT GRUPPO')}\n${boxOpen()}\n${line(`Attuale: ${cur}`)}\n${line(preview)}\n${boxEnd()}\n▸ .font <stile>  es: .font gothic`);
        }

        if (!STYLES[sub]) {
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(`Stile sconosciuto: ${sub}`)}\n${line(`Disponibili: ${available.join(', ')}`)}\n${boxEnd()}`);
        }

        if (!db[from]) db[from] = {};
        db[from]._groupFont = sub;
        saveDB();
        const preview = toStyle(`Font impostato: ${sub}`, sub);
        return reply(`${sec('FONT OK')}\n${boxOpen()}\n${line(preview)}\n${line(`Ora i titoli useranno ${sub}`)}\n${boxEnd()}`);
    },
};
