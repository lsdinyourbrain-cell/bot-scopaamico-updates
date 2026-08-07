'use strict';

// ============================================================================
//  ANTINUKE — HELPERS
// ============================================================================
//  Sistema di protezione del gruppo. La configurazione vive in db._antinuke:
//  {
//    enabled:   false,
//    whitelist: [],        // utenti fidati (esenti da TUTTI i controlli)
//    snapshot:  { subject, desc },  // impostazioni "bloccate" (per antigc)
//    controls: {
//        antilink:   true,  // blocca link (messaggi + sondaggi)
//        antipoll:   true,  // blocca qualsiasi sondaggio
//        antitagall: true,  // blocca @all / tag di massa
//        antiadmin:  true,  // blocca promo/demote non autorizzati
//        antigc:     true,  // blocca cambio nome/desc/impostazioni
//        antibot:    true,  // rimuovi bot in ingresso
//        antifake:   true,  // rimuovi account sospetti in ingresso
//    }
//  }
//  "Ultra sicuro": SOLO owner e whitelist possono fare azioni distruttive
//  (promuovere, cambiare impostazioni del gruppo). Gli admin NORMALI vengono
//  bloccati su quelle azioni: chi ha davvero bisogno dei pieni poteri va
//  messo in whitelist.
// ============================================================================

const ANTINUKE_CONTROLS = {
    antilink  : 'Blocca link (messaggi + sondaggi)',
    antipoll  : 'Blocca qualsiasi sondaggio',
    antitagall: 'Blocca @all / tag di massa',
    antiadmin : 'Blocca promo/demote non autorizzati',
    antigc    : 'Blocca cambio nome/desc/impostazioni',
    antibot   : 'Rimuovi bot in ingresso',
    antifake  : 'Rimuovi account sospetti in ingresso',
};

const DEFAULT_ANTINUKE_GROUP = () => ({
    enabled: false,
    whitelist: [],
    snapshot: null,
    controls: Object.fromEntries(Object.keys(ANTINUKE_CONTROLS).map(k => [k, true])),
});

const getAntinukeGroup = (db, groupJid) => {
    if (!db._antinuke) db._antinuke = {};
    if (!db._antinuke[groupJid]) db._antinuke[groupJid] = DEFAULT_ANTINUKE_GROUP();
    const cfg = db._antinuke[groupJid];
    if (!cfg.controls) cfg.controls = DEFAULT_ANTINUKE_GROUP().controls;
    if (!Array.isArray(cfg.whitelist)) cfg.whitelist = [];
    return cfg;
};

// Normalizza un jid o numero a sole cifre (es. "15483147193@s.whatsapp.net" -> "15483147193")
const toDigits = (input) => String(input || '').replace(/[^0-9]/g, '');

const isAntinukeWhitelisted = (cfg, jid) => {
    if (!cfg?.whitelist?.length) return false;
    const norm = toDigits(jid);
    if (!norm) return false;
    return cfg.whitelist.some(w => {
        const wn = toDigits(w);
        return wn && (norm === wn || norm.endsWith(wn) || wn.endsWith(norm));
    });
};

// Estrae il testo completo di un sondaggio (nome + tutte le opzioni)
const extractPollText = (msg) => {
    try {
        const poll = msg?.message?.pollCreationMessage;
        if (!poll) return '';
        const parts = [poll.name];
        for (const opt of (poll.options || [])) {
            if (opt?.optionName) parts.push(opt.optionName);
        }
        return parts.filter(Boolean).join(' ');
    } catch (_) {
        return '';
    }
};

module.exports = {
    ANTINUKE_CONTROLS,
    DEFAULT_ANTINUKE_GROUP,
    getAntinukeGroup,
    isAntinukeWhitelisted,
    extractPollText,
};
