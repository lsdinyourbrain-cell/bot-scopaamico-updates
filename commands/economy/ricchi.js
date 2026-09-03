'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');
const DOT = '';
const toBold = (s) => '*' + String(s||'').trim() + '*';

module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, reply, services } = context;
        const { db, dispOf, formatMoney, sendButtons } = services;

        if (!isGroup) return reply("❌ Comando solo nei gruppi.");
        if (db._escludi?.[from]) {
            return reply(
`${sec('INFO')}\n${boxOpen()}\n${line(`🚫  ${toBold('CLASSIFICA DISATTIVATA')}`)}\n${line(``)}\n${line(`Gruppo escluso con ${toBold('.escludi')}`)}\n${line(``)}\n${line(' Vex Bot')}\n${boxEnd()}`);
        }

        const want = parseInt(String(textArgs || '').trim(), 10);
        const limit = Number.isInteger(want) && want > 0 ? Math.min(want, 20) : 5;

        const chatUsers = db[from] || {};
        const allSorted = Object.entries(chatUsers)
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
            .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
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
${line('Indice non valido.')}
${boxEnd()}`);
            const [jid, data] = entry;
            const txt =
`${toBold('PROFILO RICCHEZZA')}  ·  #${idx}

👤  @${dispOf(jid)} (${getNick(jid)})
💰  Contanti: ${toBold(formatMoney(data.money||0))}
🏦  Banca: ${toBold(formatMoney(data.bank||0))}

 Vex Bot`;
            await sendButtons(sock, from, txt, [{label:'📊 Classifica', id:'ricchi'}, {label:'🏠 Menu', id:'menu'}], msg, [jid], { headerTitle:'💎 Profilo', footerText:'⬇️' });
            return;
        }

        if (!allSorted.length) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`📭  ${toBold('NESSUNA RICCHEZZA')}\n\n▸ Nessun dato.\n\n Vex Bot`)}\n${boxEnd()}`);

        const sorted = allSorted.slice(0, limit);
        const mentions = sorted.map(([jid])=>jid);
        const lines = sorted.map(([jid,data], i)=>{
            const rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
            const nick=getNick(jid);
            return `${rank} @${dispOf(jid)} (${nick}) — ${formatMoney(data.money||0)}`;
        }).join('\n');

        const txt =
`${toBold('TOP ' + limit + ' RICCHI')}  ·  ${sorted.length}/${allSorted.length}

${lines}

 Vex Bot`;

        const secondJid = allSorted[1]?.[0];
        const btns = [
            { label: `🥇 ${getNick(allSorted[0][0]).slice(0,12)}`, id:'ricchi profilo 1' },
            secondJid ? { label: `🥈 ${getNick(secondJid).slice(0,12)}`, id:'ricchi profilo 2' } : null,
            { label:'📊 Aggiorna', id:'ricchi' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, mentions, { headerTitle:'💎 TOP RICCHI', footerText:'⬇️ Tocca' });
    },
};
