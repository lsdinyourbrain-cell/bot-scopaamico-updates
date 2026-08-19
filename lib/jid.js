'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  JID HELPERS — Vex Bot
//  Gestione dei JID in modalità LID di WhatsApp: il partecipante di un gruppo
//  può essere un LID (numero casuale @lid) oppure il PN reale (@s.whatsapp.net).
//  - dispOf()  : numero "leggibile" da mostrare nei testi (mai @lid strani)
//  - resolveJid(): risolve un LID nel PN reale usando le groupMetadata
// ─────────────────────────────────────────────────────────────────────────────

// Numero da mostrare: preferisce il PN reale se il jid è un @lid e conosciamo
// la mappatura (registrata da index.js con setLidDisplayResolver), altrimenti
// il numero del JID (con @lid il numero casuale resta comunque leggibile).
// Se il chiamante fornisce `alt` (es. un nome) lo usa direttamente.
let lidDisplayResolver = null;
const setLidDisplayResolver = (fn) => { lidDisplayResolver = fn; };

const dispOf = (jid, alt) => {
    if (alt !== undefined) return String(alt).split('@')[0];
    const s = String(jid || '');
    if (s.endsWith('@lid') && typeof lidDisplayResolver === 'function') {
        const pn = lidDisplayResolver(s);
        if (pn) return String(pn).split('@')[0];
    }
    return s.split('@')[0];
};

// Risolve un JID nel suo PN reale usando i partecipanti delle groupMetadata.
// Se il jid non è @lid (o non trovato) torna il jid originale.
const resolveJid = (jid, meta) => {
    if (!jid || !String(jid).endsWith('@lid')) return jid;
    const list = Array.isArray(meta?.participants) ? meta.participants : [];
    const found = list.find(p => String(p?.id || p?.jid || '').toLowerCase().replace(/:\d+(?=@)/, '') === String(jid).toLowerCase().replace(/:\d+(?=@)/, ''));
    return found?.phoneNumber || jid;
};

module.exports = { dispOf, resolveJid, setLidDisplayResolver };