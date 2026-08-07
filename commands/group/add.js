'use strict';

// Estrae il codice di invito da un link del tipo:
//   https://chat.whatsapp.com/CODICE
//   https://chat.whatsapp.com/CODICE?s=cl&p=a&ilr=0
const extractInviteCode = (text) => {
    const match = String(text || '').match(/chat\.whatsapp\.com\/([A-Za-z0-9_\-]+)/);
    return match ? match[1] : null;
};

module.exports = {
    name: 'add',
    aliases: ['aggiungi', 'invite'],
    description: "Nei gruppi aggiunge un utente. In privato, se invii un link di gruppo/community, il bot entra nel gruppo o in tutta la community.",

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, isOwner, isSenderAdmin, isBotAdmin, reply, textArgs, services } = context;
        const { db, saveDB, axios } = services;

        // ── DM: .add <link> → il bot entra nel gruppo/community ────────────
        if (!isGroup) {
            if (!isOwner) return reply("In privato *\.add* è riservato all'*Owner del bot*.");
            const code = extractInviteCode(textArgs);
            if (!code) return reply("Invia un link valido.\n\nEsempio:\n\.add https://chat.whatsapp.com/CODICE");
            return joinViaInvite(sock, from, code, reply);
        }

        // ── GRUPPO: aggiungi un utente al gruppo ───────────────────────────
        if (!isSenderAdmin) return reply("Solo gli admin.");
        if (!isBotAdmin) return reply("Rendimi admin prima.");

        let tgt = args.join(' ').replace(/[^0-9]/g, '');
        if (!tgt) return reply("Inserisci il numero o tagga. Es: .add 391234567890");

        tgt = tgt + '@s.whatsapp.net';
        try {
            await sock.groupParticipantsUpdate(from, [tgt], 'add');
            await reply(`☑️ @${tgt.split('@')[0]} aggiunto/a al gruppo.`);
        } catch (e) {
            await reply("❌ Impossibile aggiungere. Il numero potrebbe non essere su WhatsApp o ha privacy restrittiva.");
        }
    },
};

// Entra in un gruppo o in una community tramite il codice di invito.
async function joinViaInvite(sock, dmJid, code, reply) {
    // 1) Recupera info sull'invito per capire se è una community o un gruppo.
    let info = null;
    let isCommunity = false;
    try {
        info = await sock.groupGetInviteInfo(code);
    } catch (_) {
        info = null;
    }
    if (!info) {
        try {
            info = await sock.communityGetInviteInfo(code);
            isCommunity = true;
        } catch (_) {
            info = null;
        }
    }
    if (!info || !info.id) {
        return reply("❌ Link non valido o scaduto.");
    }

    // 2) Community: accetta l'invito (WhatsApp aggiunge automaticamente a
    //    tutti i sottogruppi) e poi elenca i gruppi della community.
    if (info.isCommunity || isCommunity) {
        try {
            const communityJid = await sock.communityAcceptInvite(code);
            let linked = null;
            try {
                linked = await sock.communityFetchLinkedGroups(communityJid);
            } catch (_) { linked = null; }
            const groups = linked?.linkedGroups?.length
                ? linked.linkedGroups.map(g => `  • ${g.subject}`).join('\n')
                : '  (nessun sottogruppo)';
            return reply(
`🌐 *Community raggiunta!*

${communityJid ? 'Sono entrato nella community e in tutti i suoi gruppi.' : 'Sono entrato nella community.'}

📁 *Gruppi:*
${groups}`
            );
        } catch (e) {
            console.error('[add] Errore ingresso community:', e.message);
            return reply("❌ Non riesco a entrare nella community. Potrebbe richiedere l'approvazione di un admin.");
        }
    }

    // 3) Gruppo normale: entra direttamente (se richiede approvazione,
    //    WhatsApp crea la richiesta di ingresso).
    try {
        const groupJid = await sock.groupAcceptInvite(code);
        if (groupJid) {
            return reply(`✅ Sono entrato nel gruppo *${info.subject || 'del link'}*!`);
        }
        return reply("✅ Richiesta di ingresso inviata al gruppo (attende approvazione di un admin).");
    } catch (e) {
        console.error('[add] Errore ingresso gruppo:', e.message);
        return reply("❌ Non riesco a entrare nel gruppo. Potrebbe richiedere l'approvazione di un admin o il link è scaduto.");
    }
}
