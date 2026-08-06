'use strict';

// Utility "progresso di caricamento": invia un messaggio con percentuale che
// avanza nel tempo (0% → 100%), aggiornandolo sul posto con l'edit di baileys.
// Quando il comando ha finito, chiama done() per sostituire il testo col
// risultato, oppure fail() per mostrare un errore. Se l'edit non è
// supportato/fallisce, si limita a inviare il risultato finale.

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const BAR_LEN = 10;

const build = (label, pct, bar) =>
`╭────〔 ⏳ ${label} 〕────╮
│ ${bar}
│ ${pct}%
╰──────────────────────────╯`;

const buildBar = (pct) => {
    const filled = Math.round((pct / 100) * BAR_LEN);
    return '▰'.repeat(filled) + '▱'.repeat(BAR_LEN - filled);
};

// Avvia il progresso. Ritorna un oggetto { done, fail, text }:
//   done(finalText)  → sostituisce il progresso col testo finale
//   fail(errText)    → mostra un errore
//   text             → il testo corrente (utile per log)
const showProgress = async (sock, from, { label = 'ELABORAZIONE', duration = 2500, steps = 10, quoted } = {}) => {
    let msgKey = null;
    try {
        const first = await sock.sendMessage(from, { text: build(label, 0, buildBar(0)) }, { quoted });
        msgKey = first.key;
    } catch (_) {
        // Impossibile inviare il progresso: il comando andrà avanti senza.
        msgKey = null;
    }

    let stopped = false;
    const finish = async (text) => {
        stopped = true;
        if (msgKey) {
            try { await sock.sendMessage(from, { text, edit: msgKey }); return; } catch (_) {}
        }
        await sock.sendMessage(from, { text }, { quoted });
    };

    const tick = async () => {
        const stepMs = Math.max(80, Math.floor(duration / steps));
        for (let i = 1; i <= steps; i++) {
            if (stopped) return;
            await wait(stepMs);
            const pct = Math.round((i / steps) * 100);
            try {
                await sock.sendMessage(from, { text: build(label, pct, buildBar(pct)), edit: msgKey });
            } catch (_) {}
        }
    };
    tick();

    return {
        done: (text) => finish(text),
        fail: (errText) => finish(errText),
        get stopped() { return stopped; },
    };
};

module.exports = { showProgress, buildBar }; 