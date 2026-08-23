'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICCHI — Vex Bot · v2 Premium
//  .ricchi → classifica ricchi: ENTRAMBI immagine + pulsanti
//  Tabella vera con POS | UTENTE | CONTANTI | BANCA
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━━━';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const { renderLeaderboardImage } = require('../../lib/leaderboard');

const BOLD_UP = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭';
const BOLD_LO = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';
const BOLD_DI = '𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵';
const toBold = (s) => String(s||'').split('').map(ch=>{
    const c=ch.charCodeAt(0);
    if(c>=65&&c<=90) return BOLD_UP[c-65]||ch;
    if(c>=97&&c<=122) return BOLD_LO[c-97]||ch;
    if(c>=48&&c<=57) return BOLD_DI[c-48]||ch;
    return ch;
});

module.exports = {
    name: 'ricchi',
    aliases: ['topricchi', 'ricchi-top', 'classificaricchi'],
    description: "Classifica dei membri più ricchi del gruppo: .ricchi oppure .ricchi <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, dispOf, formatMoney, sendButtons } = services;

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
            .filter(([jid, data]) => jid.includes('@') && data && typeof data === 'object')
            .sort((a, b) => (b[1].money || 0) - (a[1].money || 0))
            .slice(0, 20);

        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: classifica cambiata, riprova.');
            const [jid, data] = entry;
            const txt =
`${toBold('PROFILO RICCHEZZA')}  ·  #${idx}
${SEP}
👤  @${dispOf(jid)}
💰  Contanti: ${toBold(formatMoney(data.money||0))}
🏦  Banca: ${toBold(formatMoney(data.bank||0))}
💎  Totale: ${toBold(formatMoney((data.money||0)+(data.bank||0)))}
${SEP}
◈ Vex Bot`;
            await sock.sendMessage(from, { text: txt, mentions: [jid] }, { quoted: msg });
            const btns = [
                { label: '📊 Tabella', id: 'ricchi' },
                { label: '🏠 Menu', id: 'menu' },
            ];
            await sendButtons(sock, from, `${toBold('AZIONI')} — @${dispOf(jid)}`, btns, msg, [jid], { headerTitle: '💎 Profilo', footerText: '⬇️ Scegli' });
            return;
        }

        if (!allSorted.length) return reply(
`📭  ${toBold('NESSUNA RICCHEZZA')}
${SEP}
▸ Nessun dato disponibile.
▸ Lavora, gioca e vinci!
${SEP}
◈ Vex Bot`);

        const sorted = allSorted.slice(0, limit);
        const top10 = allSorted.slice(0, 10);

        const rowsImg = top10.map(([jid, data]) => ({
            name: dispOf(jid),
            money: formatMoney(data.money||0),
            bank: formatMoney(data.bank||0),
        }));

        let png;
        try {
            png = await renderLeaderboardImage({
                title: 'TOP RICCHI',
                subtitle: 'Patrimonio: contanti + banca',
                accent: '#fbbf24',
                accent2: '#f59e0b',
                rows: rowsImg,
            });
        } catch (e) {
            console.error('[ricchi] render:', e.message);
            return reply('⚠️ Errore tabella, riprova.');
        }

        const [leaderJid, leaderData] = allSorted[0];
        const leaderName = dispOf(leaderJid);

        await sock.sendMessage(from, {
            image: png,
            mimetype: 'image/png',
            caption:
`💎  ${toBold('TOP 10 RICCHI')}  💎
${SEP}
🥇  @${leaderName}  ·  ${formatMoney(leaderData.money||0)}  ·  banca ${formatMoney(leaderData.bank||0)}
${DOT}
${toBold('Classifica reale')} — dati live
${SEP}
◈ Vex Bot`,
            mentions: [leaderJid],
        }, { quoted: msg });

        const txt =
`${toBold('TOP')} ${toBold(String(limit))} ${toBold('RICCHI')}  ·  ${sorted.length}/${allSorted.length}
${SEP}
🥇  @${leaderName}  —  ${toBold(formatMoney(leaderData.money||0))}  ·  banca ${formatMoney(leaderData.bank||0)}
${DOT}
${toBold('Dettaglio')} → profilo utente
${toBold('Aggiorna')} → ricalcola
${SEP}
◈ Vex Bot`;

        const listRows = sorted.map(([jid, data], i) => ({
            header: `#${i+1}`,
            title: dispOf(jid),
            description: `${formatMoney(data.money||0)} · banca ${formatMoney(data.bank||0)}`,
            id: `ricchi profilo ${i+1}`,
        }));
        if (allSorted.length > limit) {
            const extra = allSorted.slice(limit, Math.min(limit+7,20));
            for(let i=0;i<extra.length;i++){
                const idx=limit+i+1;
                const [jid,data]=extra[i];
                listRows.push({
                    header: `#${idx}`,
                    title: dispOf(jid),
                    description: `${formatMoney(data.money||0)} · banca ${formatMoney(data.bank||0)}`,
                    id: `ricchi profilo ${idx}`,
                });
                if(listRows.length>=20) break;
            }
        }

        const btns = [
            { type: 'single_select', label: '👑 Dettaglio', title: '💎 Top ricchi', sectionTitle: 'Scegli utente', rows: listRows },
            { label: '📊 Aggiorna', id: 'ricchi' },
            { label: '🏠 Menu', id: 'menu' },
        ];

        await sendButtons(sock, from, txt, btns, msg, [leaderJid], { headerTitle: '💎 TOP RICCHI', footerText: '⬇️ Dettaglio o aggiorna' });
    },
};
