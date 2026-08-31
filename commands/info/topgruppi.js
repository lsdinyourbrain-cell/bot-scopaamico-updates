'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SEP = '';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const toBold = (s) => '*' + String(s||'').trim() + '*';

module.exports = {
    name: 'topgruppi',
    aliases: ['topgroup', 'topchat', 'classificagruppi', 'topgruppiactivi'],
    description: "Classifica dei gruppi più attivi del bot: messaggi, utenti attivi e nome del gruppo.",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { db, sendButtons, getCachedGroupMeta } = services;

        const att = db._gruppiAttivita || {};
        const esclusi = db._escludi || {};
        const list = Object.entries(att)
            .filter(([gid]) => gid.endsWith('@g.us') && !esclusi[gid])
            .sort((a, b) => (b[1].n || 0) - (a[1].n || 0))
            .slice(0, 10);

        if (!list.length) {
            return reply(`🏆  ${toBold('TOP GRUPPI')}\n${SEP}\n▸ Nessun dato ancora.\n${SEP}\n◈ Vex Bot`);
        }

        if (String(args[0] || '').toLowerCase() === 'info') {
            const idx = parseInt(args[1], 10);
            const entry = list[idx - 1];
            if (!entry) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Indice non valido.')}
${boxEnd()}`);
            const [gid, data] = entry;
            let meta=null; try{ meta=await getCachedGroupMeta(sock,gid); }catch(_){}
            const name = meta?.subject || gid.split('@')[0];
            const txt = `${toBold('INFO GRUPPO')}  ·  #${idx}\n${SEP}\n📛  ${name}\n💬  ${toBold(String(data.n||0))} messaggi\n🆔  ${gid.split('@')[0]}\n${SEP}\n◈ Vex Bot`;
            await sendButtons(sock, from, txt, [{label:'📊 Tabella', id:'topgruppi'}, {label:'🏠 Menu', id:'menu'}], msg, null, { headerTitle:'🏆 Info Gruppo', footerText:'⬇️' });
            return;
        }

        const names = new Map();
        const membersCount = new Map();
        await Promise.all(list.map(async ([gid]) => {
            try {
                const meta = await getCachedGroupMeta(sock, gid);
                names.set(gid, meta?.subject ? String(meta.subject).slice(0,24) : gid.split('@')[0]);
                membersCount.set(gid, Array.isArray(meta?.participants)? meta.participants.length : 0);
            } catch (_) {
                names.set(gid, gid.split('@')[0]);
                membersCount.set(gid, 0);
            }
        }));

        const lines = list.map(([gid,data], i)=>{
            const rank=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
            const name=names.get(gid)||gid.split('@')[0];
            return `${rank} ${name} — ${data.n||0} msg · ${membersCount.get(gid)||0} membri`;
        }).join('\n');

        const txt =
`${toBold('TOP GRUPPI')}  ·  ${list.length} gruppi
${SEP}
${lines}
${SEP}
◈ Vex Bot`;

        const btns = [
            { label: `🥇 ${String(names.get(list[0]?.[0])||'').slice(0,12)}`, id:'topgruppi info 1' },
            list[1] ? { label: `🥈 ${String(names.get(list[1][0])||'').slice(0,12)}`, id:'topgruppi info 2' } : null,
            { label:'📊 Aggiorna', id:'topgruppi' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, null, { headerTitle:'🏆 TOP GRUPPI', footerText:'⬇️ Tocca' });
    },
};
