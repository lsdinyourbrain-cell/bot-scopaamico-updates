'use strict';

// Utility "progresso di caricamento" (ORMAI DISATTIVATA).
//
// NOTA: l'animazione di caricamento è stata rimossa (era fastidiosa: inviava una
// serie di messaggi con la percentuale). showProgress ora è un passacarte:
// non invia alcun progresso e restituisce done/fail che inviano direttamente il
// risultato finale. Tutti i comandi che la usano (.ai, effetti audio, .toimg,
// .sticker, download, ecc.) continuano a funzionare senza modifiche.

// Avvia il progresso. Ritorna un oggetto { done, fail, stopped }:
//   done(finalText)  → invia direttamente il testo finale
//   fail(errText)    → invia un errore
const showProgress = async (sock, from, { label = 'ELABORAZIONE', duration = 2500, steps = 10, quoted } = {}) => {
    const finish = async (text) => {
        await sock.sendMessage(from, { text }, { quoted }).catch(() => {});
    };
    return {
        done: (text) => finish(text),
        fail: (errText) => finish(errText),
        get stopped() { return true; },
    };
};

module.exports = { showProgress };