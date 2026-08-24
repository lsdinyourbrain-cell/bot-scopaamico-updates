'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  TOP — Vex Bot · v2 Premium
//  .top → classifica attività: invia ENTRAMBI immagine PNG vera + messaggio
//  con pulsanti (👑 Dettaglio single_select + 📊 Aggiorna + 🏠 Menu).
//  Tabella reale con POS | UTENTE | MESSAGGI | LIVELLO via lib/leaderboard.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━━━';
const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';
const { renderLeaderboardImage, buildTextTable } = require('../../lib/leaderboard');

const toBold = (s) => '*' + String(s||'').trim() + '*';
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
        const getNick = (jid) => {
            const n = db[from]?.[jid]?.name;
            if (n && String(n).trim()) return String(n).trim();
            const d = dispOf(jid);
            return /^\d+$/.test(d) ? '+' + d : d;
        };

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
            name: getNick(jid),
            msg: `${data.msgCount||0} msg`,
            level: `Lv ${data.level||1}`,
        }));

        let png = null;
        try {
            png = await renderLeaderboardImage({
                title: 'TOP ATTIVI',
                subtitle: 'Messaggi inviati in questo gruppo',
                accent: '#22d3ee',
                accent2: '#6366f1',
                rows: rowsImg,
            });
            if (!png || png.length < 8000) throw new Error('PNG vuota o troppo piccola');
        } catch (e) {
            console.error('[top] render fallback to testo:', e.message);
            png = null;
        }

        const [leaderJid, leaderData] = allSorted[0];
        const leaderNick = getNick(leaderJid);
        const leaderTag = dispOf(leaderJid);

        // ── INVIA TABELLA: se PNG ok manda foto, altrimenti tabella di testo con nick/+numero
        if (png) {
            await sock.sendMessage(from, {
                image: png,
                mimetype: 'image/png',
                caption:
`🏆  ${toBold('TOP 10 ATTIVI')}  🏆
${SEP}
🥇  @${leaderTag} (${leaderNick})  ·  ${leaderData.msgCount||0} msg  ·  Lv ${leaderData.level||1}
${DOT}
${toBold('Classifica reale')} — dati dal vivo
${SEP}
◈ Vex Bot`,
                mentions: [leaderJid],
            }, { quoted: msg });
        } else {
            const textTable = buildTextTable(rowsImg, {
                title: 'TOP 10 ATTIVI',
                subtitle: 'Messaggi inviati in questo gruppo',
                columns: [
                    { key:'rank', label:'POS', width:4, align:'center' },
                    { key:'name', label:'UTENTE', width:22, align:'left' },
                    { key:'msg', label:'MESSAGGI', width:10, align:'right' },
                    { key:'level', label:'LIVELLO', width:8, align:'right' },
                ]
            });
            await sock.sendMessage(from, {
                text: `${textTable}\n\n🥇 @${leaderTag} — ${leaderData.msgCount||0} msg`,
                mentions: [leaderJid],
            }, { quoted: msg });
        }

        // ── MESSAGGIO SOTTO CON PULSANTI (Entrambi) ───────────────────────
        const txt =
`${toBold('TOP')} ${toBold(String(limit))} ${toBold('ATTIVI')}  ·  ${sorted.length}/${allSorted.length}
${SEP}
🥇  @${leaderTag} (${leaderNick})  —  ${toBold(String(leaderData.msgCount||0))} msg  ·  Lv ${leaderData.level||1}
${DOT}
${toBold('Dettaglio')} → scegli un utente
${toBold('Aggiorna')} → ricalcola classifica
${SEP}
◈ Vex Bot`;

        // Pulsanti veri (quick_reply, non single_select): 3 bottoni sotto al messaggio
        const secondJid = allSorted[1]?.[0];
        const secondNick = secondJid ? getNick(secondJid) : null;
        const btns = [
            { label: `🥇 ${leaderNick.slice(0,12)}`, id: 'top profilo 1' },
            secondNick ? { label: `🥈 ${secondNick.slice(0,12)}`, id: 'top profilo 2' } : null,
            { label: '📊 Aggiorna', id: 'top' },
        ].filter(Boolean);

        await sendButtons(sock, from, txt, btns, msg, [leaderJid, secondJid].filter(Boolean), { headerTitle: '🏆 TOP ATTIVI', footerText: '⬇️ Tocca un pulsante' });
    },
};
