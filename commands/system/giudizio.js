'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  GIUDIZIO — Vex Bot (solo OWNER)
//  Il link del gruppo nuovo si imposta con `.giudizio set link <url>`.
//  Nei gruppi `.giudizio` esegue, in ordine:
//   1. toglie admin a tutti
//   2. chiude il gruppo
//   3. rinomina il gruppo
//   4. manda le 3 frasi (la terza con il link + hide tag a tutti)
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
    description: "Rito di fine gruppo: demote all, chiusura, rinomina, frasi con link hide-tag e svuotamento (solo owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, reply, services } = context;
        const { db, saveDB, sameJid, sleep } = services;

        if (!isOwner) {
            return reply("⛔ *ACCESSO NEGATO*\n━━━━━━━━━━━━━━\n▸ Comando riservato\n  all'Owner del bot.\n━━━━━━━━━━━━━━\n◈ _Vex Bot_");
        }

        // ── SET DEL LINK ──────────────────────────────────────────────────
        const sub = String(args[0] || '').toLowerCase();
        if (sub === 'set') {
            const link = String(textArgs || '').replace(/^set\s+(?:link\s+)?/i, '').trim();
            if (!/^https?:\/\/\S+$/i.test(link)) {
                return reply("⚠️ *USO*\n━━━━━━━━━━━━━━\n▸ `.giudizio set link <url>`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_");
            }
            db._giudizio = { link };
            saveDB();
            return reply(`✅ *LINK IMPOSTATO*\n━━━━━━━━━━━━━━\n▸ ${link}\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }

        if (!isGroup) {
            const cur = db._giudizio?.link;
            return reply(`⚖️ *GIUDIZIO*\n━━━━━━━━━━━━━━\n${cur ? `▸ Link attuale:\n▸ ${cur}` : '▸ Nessun link impostato.'}\n━━━━━━━━━━━━━━\n▸ Imposta: \`.giudizio set link <url>\`\n▸ Nei gruppi: \`.giudizio\`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_`);
        }

        const link = db._giudizio?.link;
        if (!link) {
            return reply("⚠️ *NESSUN LINK*\n━━━━━━━━━━━━━━\n▸ Prima imposta il link:\n▸ `.giudizio set link <url>`\n━━━━━━━━━━━━━━\n◈ _Vex Bot_");
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

            // 4-6. Le tre frasi: la terza include il link e tagga tutti in hide tag
            await sock.sendMessage(from, { text: FRASE_1 });
            await sleep(MSG_DELAY);
            await sock.sendMessage(from, { text: FRASE_2 });
            await sleep(MSG_DELAY);

            const allJids = participants.map(jidOf).filter(Boolean);
            const hiddenTag = allJids.map(() => '\u200b').join(' ');
            await sock.sendMessage(from, {
                text: `${FRASE_3}\n\n${link}\n${hiddenTag}`,
                mentions: allJids,
            });
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
