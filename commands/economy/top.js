'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SEP = '';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const toBold = (s) => '*' + String(s||'').trim() + '*';

module.exports = {
    name: 'top',
    aliases: ['topattivi', 'attivi', 'classifica'],
    description: "Classifica dei membri più attivi del gruppo: .top oppure .top <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, reply, services } = context;
        const { db, dispOf, sendButtons } = services;

        if (!isGroup) return reply("❌ Comando solo nei gruppi.");
        if (db._escludi?.[from]) {
            return reply(
`🚫  ${toBold('CLASSIFICA DISATTIVATA')}
${SEP}
▸ Gruppo escluso con ${toBold('.escludi')}
▸ Un admin può riammettere con
  ${toBold('.escludi off')}
${SEP}
◈ Vex Bot`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 20) : 5;

        const chatUsers = db[from] || {};
        const allSorted = Object.entries(chatUsers)
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object' && (data.msgCount || 0) > 0)
            .sort((a, b) => (b[1].msgCount || 0) - (a[1].msgCount || 0))
            .slice(0, 20);
        const getNick = (jid) => {
            const n = db[from]?.[jid]?.name;
            if (n && String(n).trim()) return String(n).trim();
            const d = dispOf(jid);
            return /^\d+$/.test(d) ? '+' + d : d;
        };

        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Indice non valido: classifica cambiata, riprova.')}
${boxEnd()}`);
            const [jid, data] = entry;
            const lvl = data.level || 1;
            const xp = data.xp || 0;
            const bar = (() => {
                const pct = Math.min(100, Math.max(0, Math.floor((xp % 1000)/10) ));
                const filled = Math.floor(pct/10);
                return '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${pct}%`;
            })();
            const nick = getNick(jid);
            const tag = dispOf(jid);
            const txt =
`${toBold('PROFILO ATTIVITA')}  ·  #${idx}
${SEP}
👤  @${tag} (${nick})
💬  ${toBold(String(data.msgCount||0))} messaggi
⭐  Livello ${toBold(String(lvl))}  ·  XP ${xp}
${bar}
${SEP}
◈ Vex Bot`;
            const btns = [
                { label: '📊 Classifica', id: 'top' },
                { label: '🏠 Menu', id: 'menu' },
            ];
            await sendButtons(sock, from, txt, btns, msg, [jid], { headerTitle: '👤 Profilo', footerText: '⬇️ Scegli' });
            return;
        }

        if (!allSorted.length) return reply(
`📭  ${toBold('NESSUNA ATTIVITA')}
${SEP}
▸ Nessun dato disponibile.
▸ Scrivi in chat e torna qui!
${SEP}
◈ Vex Bot`);

        const sorted = allSorted.slice(0, limit);
        const mentions = sorted.map(([jid]) => jid);

        const lines = sorted.map(([jid, data], i) => {
            const rank = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `${i+1}.`;
            const nick = getNick(jid);
            const tag = dispOf(jid);
            return `${rank} @${tag} (${nick}) — ${data.msgCount||0} msg · Lv ${data.level||1}`;
        }).join('\n');

        const txt =
`${toBold('TOP ' + limit + ' ATTIVI')}  ·  ${sorted.length}/${allSorted.length}
${SEP}
${lines}
${SEP}
◈ Vex Bot`;

        const secondJid = allSorted[1]?.[0];
        const leaderNick = getNick(allSorted[0][0]);
        const secondNick = secondJid ? getNick(secondJid) : null;
        const btns = [
            { label: `🥇 ${leaderNick.slice(0,12)}`, id: 'top profilo 1' },
            secondNick ? { label: `🥈 ${secondNick.slice(0,12)}`, id: 'top profilo 2' } : null,
            { label: '📊 Aggiorna', id: 'top' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, mentions, { headerTitle: '🏆 TOP ATTIVI', footerText: '⬇️ Tocca' });
    },
};
