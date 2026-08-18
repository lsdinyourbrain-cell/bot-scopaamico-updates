'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  JID HELPERS — Vex Bot
//  Gestione dei JID in modalità LID di WhatsApp: il partecipante di un gruppo
//  può essere un LID (numero casuale @lid) oppure il PN reale (@s.whatsapp.net).
//  - dispOf()  : numero "leggibile" da mostrare nei testi (mai @lid strani)
//  - resolveJid(): risolve un LID nel PN reale usando le groupMetadata
// ─────────────────────────────────────────────────────────────────────────────

// Numero da mostrare: preferisce il PN alternativo, altrimenti il numero del
// JID (con @lid il numero casuale resta comunque leggibile da WhatsApp).
const dispOf = (jid, alt) => String(alt || jid || '').split('@')[0];

// Risolve un JID nel suo PN reale usando i partecipanti delle groupMetadata.
// Se il jid non è @lid (o non trovato) torna il jid originale.
const resolveJid = (jid, meta) => {
    if (!jid || !String(jid).endsWith('@lid')) return jid;
    const list = Array.isArray(meta?.participants) ? meta.participants : [];
    const found = list.find(p => String(p?.id || p?.jid || '').toLowerCase() === String(jid).toLowerCase());
    return found?.phoneNumber || jid;
};

module.exports = { dispOf, resolveJid };