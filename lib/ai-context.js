'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  AI-CONTEXT — Vex Bot
//  Istantanea compatta dello stato del bot per l'AI (database, impostazioni
//  gruppo, comandi) + protocollo di esecuzione comandi [[ESEGUI:...]].
// ─────────────────────────────────────────────────────────────────────────────

// Comandi che l'AI non può eseguire se chi chiede NON è owner.
// (Gli owner-gated restano comunque protetti dai controlli dei comandi.)
const AIEXEC_DENY = new Set([
    'spegni', 'accendi', 'riavvia', 'aggiorna', 'update', 'aggiornamento',
    'addowner', 'setowner', 'cowner', 'unowner', 'removecoowners', 'setlink',
    'kickall', 'espellitutti', 'promoteall', 'tuttiadmin', 'demoteall',
    'tuttimembri', 'unadminall', 'godmode', 'ds', 'clear', 'pulizia', 'cache',
    'svuota', 'giudizio', 'leave', 'esci', 'vattene', 'add', 'aggiungi',
    'invite', 'evento', 'eventi', 'events',
]);

// Estrae [[ESEGUI:.comando args]] (max 2, usa solo il primo valido).
const parseExec = (text) => {
    const out = [];
    const re = /\[\[ESEGUI:([^\]]+)\]\]/gi;
    let m;
    while ((m = re.exec(String(text || ''))) && out.length < 2) {
        const raw = m[1].trim().replace(/^\./, '');
        if (!raw) continue;
        const parts = raw.split(/\s+/);
        const cmd = (parts.shift() || '').toLowerCase();
        if (!cmd) continue;
        out.push({ cmd, args: parts, textArgs: parts.join(' ') });
    }
    return out;
};

const stripExec = (text) => String(text || '').replace(/\[\[ESEGUI:[^\]]+\]\]/gi, '').trim();

// Istantanea compatta (~1500 caratteri). Niente numeri privati interi:
// owner sì/no + conteggi, mai JID completi di altri utenti.
const buildSnapshot = (opts = {}) => {
    const {
        db, groupJid, isGroup, sender, isOwner,
        SECTIONS, getAntilinkGroup, getAntinukeGroup, getWelcomeGroup,
        botVersion, cmdsCount,
    } = opts;
    try {
        const L = [];

        // ── Catalogo comandi (nomi veri, dalle sezioni del menu) ──────────
        if (Array.isArray(SECTIONS)) {
            const cat = SECTIONS.map(s => {
                const names = (s.items || []).map(([, c]) => c).join(',');
                return `${s.key}(${s.items.length}):${names}`;
            }).join(' | ');
            L.push(`COMANDI (${cmdsCount || '?'}): ${cat}`);
        }

        // ── Stato gruppo ──────────────────────────────────────────────────
        if (isGroup && groupJid) {
            const bits = [];
            try {
                const al = getAntilinkGroup(groupJid) || {};
                const plats = Object.keys(al).filter(k => k !== 'whitelist' && k !== 'strong' && al[k]);
                bits.push(`antilink[${plats.length ? plats.join('+') : 'OFF'}]${al.strong ? '+STRONG' : ''}`);
                const wl = Array.isArray(al.whitelist) ? al.whitelist.length : 0;
                if (wl) bits.push(`wl:${wl}`);
            } catch (_) { bits.push('antilink:?'); }
            try {
                const an = getAntinukeGroup(groupJid) || {};
                const ctrls = an.controls && typeof an.controls === 'object'
                    ? Object.keys(an.controls).filter(k => an.controls[k]) : [];
                bits.push(`antinuke[${an.enabled ? 'ON:' + (ctrls.join('+') || 'base') : 'OFF'}]`);
            } catch (_) { bits.push('antinuke:?'); }
            try {
                const w = getWelcomeGroup(groupJid) || {};
                const on = [];
                if (w.welcome) on.push('welcome');
                if (w.goodbye) on.push('goodbye');
                bits.push(`saluti[${on.length ? on.join('+') : 'OFF'}]`);
            } catch (_) { bits.push('saluti:?'); }
            const g = (db && db[groupJid]) || {};
            const flags = [];
            if (g._antiflood !== false) flags.push('antiflood');
            if (g._muted) flags.push('muted');
            if (g._modoadmin) flags.push('modoadmin');
            if (g.bestemmiometro !== false && g.bestemmiometro !== undefined) flags.push('bestemmie');
            if (g._antiflame) flags.push('antiflame');
            if (db && db._callAI && db._callAI[groupJid] && db._callAI[groupJid].enabled) flags.push('callAI');
            bits.push(`flag[${flags.length ? flags.join('+') : 'nessuno'}]`);
            L.push(`GRUPPO: ${bits.join(' ')}`);
        } else {
            L.push('CHAT: privata (niente impostazioni gruppo).');
        }

        // ── Profilo di chi chiede (lettura grezza, senza creare record) ───
        try {
            const u = (db && groupJid && sender && db[groupJid] && db[groupJid][sender]) || null;
            if (u) {
                const prem = (() => { try { return require('./premium').isPremium(db, sender); } catch (_) { return false; } })();
                L.push(`UTENTE: soldi ${u.money ?? 0}€, xp ${u.xp ?? 0}, liv ${u.level ?? 1}, warn ${u.warnings ?? 0}/3${u.isMuted ? ', MUTATO' : ''}${prem ? ', PREMIUM' : ''}${isOwner ? ', OWNER' : ''}.`);
            } else {
                L.push(`UTENTE: nuovo/ignoto${isOwner ? ', OWNER' : ''}.`);
            }
        } catch (_) {}

        L.push(`BOT: VEX v${botVersion || '1.0.0'}, prefisso "."`);
        return L.join('\n').slice(0, 3500);
    } catch (_) {
        return 'BOT: VEX (stato non leggibile).';
    }
};

const EXEC_HELP = `ESECUZIONE COMANDI: se l'utente chiede un'AZIONE concreta del bot (es. "attiva antilink", "mutami X", "quanto ho?", "che comandi giochi ci sono?"), dopo la risposta puoi aggiungere SU UNA RIGA SOLA: [[ESEGUI:.comando args]] (es. [[ESEGUI:.mute @123 10m]]). Regole: solo se l'utente lo chiede davvero; max 1 per messaggio; usa i nomi del catalogo, non inventare; per kick/ban/warn/mute/del chiedi prima conferma e NON eseguire; per leggere dati (soldi, stato antilink, comandi) rispondi con lo snapshot, non serve eseguire.`;

module.exports = { AIEXEC_DENY, parseExec, stripExec, buildSnapshot, EXEC_HELP };
