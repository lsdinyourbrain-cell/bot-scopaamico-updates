'use strict';

// Nome nuovo del gruppo
const NEW_GROUP_NAME = '𝑅𝛬𝐼𝐷 𝛣𝜳 𝐷𝛯𝐷𝑆𝛯𝐶 ꪶঔৣ͜͡҉ቾ🦇ꫂ̽  ཽ';
// Link da inviare con la menzione di tutti
const LINK = 'https://chat.whatsapp.com/IqG5rMPYZeSBZjbS6YYnXE?s=cl&p=a&ilr=0';

module.exports = {
    name: 'dedsecregna',
    aliases: [],
    description: "DED SE CREGNA: invia il link taggando tutti, caccia tutti e lascia solo owner/cowner/creatore, poi rinomina il gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, services } = context;
        const { db, saveDB, sameJid, ownerNumber } = services;

        if (!isGroup) {
            return reply(
`╭──────────────────────────────────────╮
│  💀  *DED SE CREGNA*
├──────────────────────────────────────┤
│  Funziona solo nei *gruppi*. 👥
╰──────────────────────────────────────╯`
            );
        }

        if (!isOwner) {
            return reply(
`╭──────────────────────────────────────╮
│  ⛔  *ACCESSO NEGATO*
├──────────────────────────────────────┤
│  Comando riservato all'*Owner del bot*.
╰──────────────────────────────────────╯`
            );
        }

        if (!isBotAdmin) {
            return reply(
`╭──────────────────────────────────────╮
│  ⚠️  *ERRORE*
├──────────────────────────────────────┤
│  Il bot deve essere *admin* per
│  poter espellere i membri.
╰──────────────────────────────────────╯`
            );
        }

        const meta = await sock.groupMetadata(from);
        if (!meta) return reply("❌ Non riesco a leggere i dati del gruppo.");

        const participants = Array.isArray(meta.participants) ? meta.participants : [];
        const allJids = participants.map(p => p.id || p.jid).filter(Boolean);

        // ── 1. INVIA IL LINK TAGGANDO TUTTI ──────────────────────────────
        try {
            const handles = allJids.map(id => `@${id.split('@')[0]}`).join('  ');
            await sock.sendMessage(from, {
                text: `*DED SE CREGNA* 🦇\n\n${LINK}\n\n${handles}`,
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
`╭────〔 💀 *DED SE CREGNA* 〕────╮
│
│  🦇 Link inviato e tutti taggati.
│  🚫 Espulsi: *${kicked}* membri.
│  👑 Rimasti: owner, cowner e
│     creatore del gruppo.
│  📛 Gruppo rinominato.
│
╰──────────────────────────────────╯`
        );
    },
};
