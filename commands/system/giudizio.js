'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

// ─────────────────────────────────────────────────────────────────────────────
//  GIUDIZIO — Vex Bot (solo OWNER)
//  I link dei gruppi nuovi si impostano (massimo 3):
//   `.giudizio set link1 <url>`  (oppure `.giudizio set link <url>`)
//   `.giudizio set link2 <url>`
//   `.giudizio set link3 <url>`
//  Nei gruppi `.giudizio` esegue, in ordine:
//   1. toglie admin a tutti
//   2. chiude il gruppo
//   3. rinomina il gruppo
//   4. manda le 3 frasi: la prima frase col link1, poi gli eventuali
//      link2/link3 come messaggi separati, ognuno con hide tag a tutti
//   5. manda la frase finale e svuota il gruppo da tutti
//  Invia SOLO i testi previsti qui sotto, nessun messaggio aggiuntivo.
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_NAME = '⌜ˢᵛᵗ ᵇʸ 𝓭𝑒𝐍ย𝐍ĆƗ𝐚я丂Ɨ⌟';

const FRASE_1 = "𝔦𝔩 𝔟𝔬𝔱 𝔡𝔢𝔠𝔦𝔡𝔢𝔯𝔞' 𝔩𝔞 𝔰𝔬𝔯𝔱𝔢 𝔡𝔦 𝔮𝔲𝔢𝔰𝔱𝔬 𝔤𝔯𝔲𝔭𝔭𝔬...";
const FRASE_2 = "𝓱𝓪 𝓭𝓮𝓬𝓲𝓼𝓸 𝓬𝓱𝓮 𝓲𝓵 𝓰𝓻𝓾𝓹𝓹𝓸 𝓪𝓷𝓭𝓻𝓪' 𝓪𝓯𝓯𝓸𝓷𝓭𝓸😜";
const FRASE_3 = '𝓸𝓰𝓷𝓲 𝓬𝓸𝓼𝓪 𝓱𝓪 𝓾𝓷 𝓲𝓷𝓲𝔃𝓲𝓸 𝓮 𝓾𝓷𝓪 𝓯𝓲𝓷𝓮. 𝓶𝓪 𝓸𝓰𝓷𝓲 𝓯𝓲𝓷𝓮 è 𝓾𝓷 𝓷𝓾𝓸𝓿𝓸 𝓲𝓷𝓲𝔃𝓲𝓸: è 𝓼𝓽𝓪𝓽𝓪 𝓹𝓸𝓼𝓽𝓪 𝓯𝓲𝓷𝓮 𝓪 𝓺𝓾𝓮𝓼𝓽𝓸 𝓰𝓻𝓾𝓹𝓹𝓸 𝓹𝓮𝓻 𝓸𝓼𝓹𝓲𝓽𝓪𝓻𝓷𝓮 𝓾𝓷𝓸 𝓶𝓲𝓰𝓵𝓲𝓸𝓻𝓮..';
const FRASE_4 = '𝖉𝖊𝖓𝖚𝖓𝖈𝖎𝖆𝖗𝖘𝖎 𝖗𝖊𝖌𝖓𝖆 𝖎𝖓 𝖔𝖌𝖓𝖎 𝖚𝖓𝖎𝖛𝖊𝖗𝖘𝖔👑';

const MSG_DELAY  = 2000; // ms tra un messaggio e l'altro (anti rate-limit)

module.exports = {
    name: 'giudizio',
    aliases: [],
    hidden: true,
    description: "Rito di fine gruppo: demote all, chiusura, rinomina, frasi con max 3 link hide-tag e svuotamento (solo owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, reply, services } = context;
        const { db, saveDB, sameJid, sleep } = services;

        if (!isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        // ── SET DEI LINK (max 3) ──────────────────────────────────────────
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'set') {
            const slotRaw = String(args[1] || '').toLowerCase();
            const mSlot = slotRaw.match(/^links?([123])?$/);
            const link = String(textArgs || '').replace(/^set\s+(?:links?[123]?\s+)?/i, '').trim();
            if (!mSlot || !/^https?:\/\/\S+$/i.test(link)) {
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('USO* ━━━━━━━━━━━━━━ ▸ \`.giudizio set link1 <url>\` ▸ \`.giudizio set link2 <url...')}
${boxEnd()}`);
            }
            const slot = mSlot[1] || '1';
            db._giudizio = { ...(db._giudizio || {}), ['link' + slot]: link };
            saveDB();
            return reply(`✅ *LINK${slot} IMPOSTATO*\n━━━━━━━━━━━━━━\n▸ ${link}\n━━━━━━━━━━━━━━\n`);
        }

        if (!isGroup) {
            const cfg = db._giudizio || {};
            const lines = [1, 2, 3].map(n => cfg['link' + n] ? `▸ link${n}: ${cfg['link' + n]}` : `▸ link${n}: —`).join('\n');
            return reply(`⚖️ *GIUDIZIO*\n━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━\n▸ Imposta: \`.giudizio set link1/2/3 <url>\`\n▸ Nei gruppi: \`.giudizio\`\n━━━━━━━━━━━━━━\n`);
        }

        const cfg = db._giudizio || {};
        const links = [cfg.link1, cfg.link2, cfg.link3].filter(l => typeof l === 'string' && /^https?:\/\//i.test(l));
        if (!links.length) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('NESSUN LINK* ━━━━━━━━━━━━━━ ▸ Prima imposta almeno il primo link: ▸ \`.giudizi...')}
${boxEnd()}`);
        }

        try {
            const meta = await sock.groupMetadata(from);
            const participants = Array.isArray(meta?.participants) ? meta.participants : [];
            const jidOf = (p) => p.phoneNumber || p.id || p.jid;
            const botJid = sock.user?.id || sock.user?.lid || '';

            // 1. Toglie admin a tutti in un colpo solo (il superadmin non è
            //    retrocedibile dall'API)
            const admins = participants
                .filter(p => p.admin === 'admin')
                .map(jidOf).filter(Boolean)
                .filter(j => !sameJid(j, botJid));
            if (admins.length) {
                try { await sock.groupParticipantsUpdate(from, admins, 'demote'); } catch (_) {}
            }

            // 2. Chiude il gruppo (possono scrivere solo gli admin)
            try { await sock.groupSettingUpdate(from, 'announcement'); } catch (_) {}

            // 3. Rinomina il gruppo
            try { await sock.groupUpdateSubject(from, GROUP_NAME); } catch (_) {}

            await sleep(MSG_DELAY);

            // 4-6. Le frasi: la terza include il link1; poi gli eventuali
            //      link2 e link3 come messaggi separati. Ognuno tagga tutti
            //      in hide tag (menzioni invisibili).
            await sock.sendMessage(from, { text: FRASE_1 });
            await sleep(MSG_DELAY);
            await sock.sendMessage(from, { text: FRASE_2 });
            await sleep(MSG_DELAY);

            const allJids = participants.map(jidOf).filter(Boolean);
            const hiddenTag = allJids.map(() => '\u200b').join(' ');
            await sock.sendMessage(from, {
                text: `${FRASE_3}\n\n${links[0]}\n${hiddenTag}`,
                mentions: allJids,
            });
            for (const extra of links.slice(1)) {
                await sleep(MSG_DELAY);
                await sock.sendMessage(from, {
                    text: `${extra}\n${hiddenTag}`,
                    mentions: allJids,
                });
            }
            await sleep(MSG_DELAY);

            // 7. Frase finale
            await sock.sendMessage(from, { text: FRASE_4 });

            // 8. Svuota il gruppo da tutti (tranne il bot stesso): un'unica
            //    chiamata con l'elenco completo = rimozione istantanea di massa.
            //    Se il server rifiuta la chiamata unica, retry dopo 700ms.
            const targets = allJids.filter(j => !sameJid(j, botJid));
            if (targets.length) {
                try {
                    await sock.groupParticipantsUpdate(from, targets, 'remove');
                } catch (e) {
                    console.error('[giudizio] rimozione massiva fallita, retry:', e.message);
                    await sleep(700);
                    try { await sock.groupParticipantsUpdate(from, targets, 'remove'); } catch (_) {}
                }
            }
        } catch (e) {
            console.error('[giudizio]', e.message);
        }
    },
};
