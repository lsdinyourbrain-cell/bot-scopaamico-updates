'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOP — Vex Bot · v2 Premium
//  .top → classifica attività: invia ENTRAMBI immagine PNG vera + messaggio
//  con pulsanti (👑 Dettaglio single_select + 📊 Aggiorna + 🏠 Menu).
//  Tabella reale con POS | UTENTE | MESSAGGI | LIVELLO via lib/leaderboard.
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
    name: 'top',
    aliases: ['topattivi', 'attivi', 'classifica'],
    description: "Classifica dei membri più attivi del gruppo: .top oppure .top <n> (max 20).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
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

        // ── PROFILO UTENTE (single_select) ────────────────────────────────
        if (String(args[0] || '').toLowerCase() === 'profilo') {
            const idx = parseInt(args[1], 10);
            const entry = allSorted[idx - 1];
            if (!entry) return reply('⚠️ Indice non valido: classifica cambiata, riprova.');
            const [jid, data] = entry;
            const lvl = data.level || 1;
            const xp = data.xp || 0;
            const bar = (() => {
                const pct = Math.min(100, Math.max(0, Math.floor((xp % 1000)/10) ));
                const filled = Math.floor(pct/10);
                return '█'.repeat(filled) + '░'.repeat(10-filled) + ` ${pct}%`;
            })();
            const txt =
`${toBold('PROFILO ATTIVITA')}  ·  #${idx}
${SEP}
👤  @${dispOf(jid)}
💬  ${toBold(String(data.msgCount||0))} messaggi
⭐  Livello ${toBold(String(lvl))}  ·  XP ${xp}
${bar}
${SEP}
◈ Vex Bot`;
            await sock.sendMessage(from, { text: txt, mentions: [jid] }, { quoted: msg });
            // pulsanti di ritorno
            const btns = [
                { label: '📊 Tabella', id: 'top' },
                { label: '🏠 Menu', id: 'menu' },
            ];
            await sendButtons(sock, from, `${toBold('AZIONI')} — profilo di @${dispOf(jid)}`, btns, msg, [jid], { headerTitle: '👤 Profilo', footerText: '⬇️ Scegli azione' });
            return;
        }

        // Se non ci sono dati
        if (!allSorted.length) return reply(
`📭  ${toBold('NESSUNA ATTIVITA')}
${SEP}
▸ Nessun dato disponibile.
▸ Scrivi in chat e torna qui!
${SEP}
◈ Vex Bot`);

        const sorted = allSorted.slice(0, limit);
        const top10 = allSorted.slice(0, 10);

        // ── PREPARA RIGHE PER IMMAGINE ────────────────────────────────────
        const rowsImg = top10.map(([jid, data]) => ({
            name: dispOf(jid),
            msg: `${data.msgCount||0} msg`,
            level: `Lv ${data.level||1}`,
        }));

        let png;
        try {
            png = await renderLeaderboardImage({
                title: 'TOP ATTIVI',
                subtitle: 'Messaggi inviati in questo gruppo',
                accent: '#22d3ee',
                accent2: '#6366f1',
                rows: rowsImg,
            });
        } catch (e) {
            console.error('[top] render:', e.message);
            return reply('⚠️ Errore tabella, riprova.');
        }

        const [leaderJid, leaderData] = allSorted[0];
        const leaderName = dispOf(leaderJid);

        // ── INVIA IMMAGINE + CAPTION TAGGATA ──────────────────────────────
        await sock.sendMessage(from, {
            image: png,
            mimetype: 'image/png',
            caption:
`🏆  ${toBold('TOP 10 ATTIVI')}  🏆
${SEP}
🥇  @${leaderName}  ·  ${leaderData.msgCount||0} msg  ·  Lv ${leaderData.level||1}
${DOT}
${toBold('Classifica reale')} — dati dal vivo
${SEP}
◈ Vex Bot`,
            mentions: [leaderJid],
        }, { quoted: msg });

        // ── MESSAGGIO SOTTO CON PULSANTI (Entrambi) ───────────────────────
        const txt =
`${toBold('TOP')} ${toBold(String(limit))} ${toBold('ATTIVI')}  ·  ${sorted.length}/${allSorted.length}
${SEP}
🥇  @${leaderName}  —  ${toBold(String(leaderData.msgCount||0))} msg  ·  Lv ${leaderData.level||1}
${DOT}
${toBold('Dettaglio')} → scegli un utente
${toBold('Aggiorna')} → ricalcola classifica
${SEP}
◈ Vex Bot`;

        const listRows = sorted.map(([jid, data], i) => ({
            header: `#${i + 1}`,
            title: dispOf(jid),
            description: `${data.msgCount||0} msg · Lv ${data.level||1}`,
            id: `top profilo ${i + 1}`,
        }));
        // aggiungi leader extra se limit < total per vedere tutti?
        if (allSorted.length > limit) {
            const extra = allSorted.slice(limit, Math.min(limit+7, 20));
            for (let i=0;i<extra.length;i++){
                const idx = limit+i+1;
                const [jid,data]=extra[i];
                listRows.push({
                    header: `#${idx}`,
                    title: dispOf(jid),
                    description: `${data.msgCount||0} msg · Lv ${data.level||1}`,
                    id: `top profilo ${idx}`,
                });
                if (listRows.length>=20) break;
            }
        }

        const btns = [
            { type: 'single_select', label: '👑 Dettaglio', title: '🏆 Top attivi', sectionTitle: 'Scegli utente', rows: listRows },
            { label: '📊 Aggiorna', id: 'top' },
            { label: '🏠 Menu', id: 'menu' },
        ];

        await sendButtons(sock, from, txt, btns, msg, [leaderJid], { headerTitle: '🏆 TOP ATTIVI', footerText: '⬇️ Scegli un utente' });
    },
};
