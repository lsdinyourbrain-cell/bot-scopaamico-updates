'use strict';

/**
 * Sistema di tassazione progressiva Vex Bot.
 *
 * Ogni volta che un utente guadagna soldi da attività "ricorrenti"
 * (lavoro, daily, scava, ecc.) una quota viene "devoluta allo Stato".
 *
 * La percentuale è PROGRESSIVA:
 *  - saldi bassi  → tassazione minima (sosteniamo i giovani avremiore!)
 *  - saldi alti   → tassazione maggiore (i grassi pagano di più)
 *
 * La tassa è CAP data (mai negativa): la quota a favore del giocatore
 * è sempre intera mentre la differenza va a tassare lo Stato.
 */

// Soglia saldo  → percentuale di tassazione
const BRACKETS = [
    { max:    5_000, tax: 1  },   // 1%  sotto i 5.000€
    { max:   25_000, tax: 3  },   // 3%  5k-25k
    { max:  100_000, tax: 6  },   // 6%
    { max:  500_000, tax: 9  },   // 9%
    { max: Infinity, tax: 12 },   // 12% oltre i 500k (top ricchi)
];

/**
 * Calcola la percentuale di tassazione in base al saldo attuale.
 * @param {number} balance — saldo attuale dell'utente
 * @returns {number} percentuale (0-100)
 */
const taxRate = (balance) => {
    const b = Number(balance) || 0;
    for (const br of BRACKETS) {
        if (b <= br.max) return br.tax;
    }
    return BRACKETS.at(-1).tax;
};

/**
 * Applica la tassazione su un guadagno.
 *
 * @param {number} gross        — somma lorda guadagnata
 * @param {number} balance      — saldo attuale dell'utente (prima del guadagno)
 * @returns {{net: number, tax: number, rate: number}}
 *          net  → somma effettivamente accreditata
 *          tax  → quota devoluta allo Stato (mai negativa)
 *          rate → percentuale applicata
 */
const applyTax = (gross, balance) => {
    const g = Math.max(0, Math.floor(Number(gross) || 0));
    if (g === 0) return { net: 0, tax: 0, rate: 0 };

    const rate = taxRate(balance);
    const tax = Math.floor((g * rate) / 100); // arrotondiamo per difetto
    const net = g - tax;

    return { net, tax, rate };
};

module.exports = { applyTax, taxRate };
