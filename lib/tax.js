'use strict';

/**
 * Sistema di tassazione progressiva Vex Bot (MODALITA' Austera).
 *
 * Il governo ha appena varato una riforma fiscale più rigida:
 * i giovani (saldi bassi) si tengono quasi tutto, i ricchi vengono
 * decurtati pesantemente. Obiettivo: rendere i soldi difficili da
 * accumulare, così da stimolare giochi di gruppo e interazione.
 */

const BRACKETS = [
    { max:      1_000, tax:  0 },   // sotto 1 000€ → tassati 0 (lancialo a zero)
    { max:      5_000, tax:  3 },   // 1k-5k    → 3%
    { max:     20_000, tax:  8 },   // 5k-20k   → 8%
    { max:    100_000, tax: 15 },   // 20k-100k → 15%
    { max:    500_000, tax: 25 },   // 100k-500k→ 25%
    { max: Infinity,    tax: 40 },   // >500k    → 40%  (top ricchi = colpevo!)
];

// ── TASSA SUL PATRIMONIO ───────────────────────────────────────────────────
// Ogni 24h chi ha un saldo elevato viene decurtato di una percentuale
// progressiva del patrimonio totale (non dei guadagni). I poveri stanno
// sereni, i Paperoni pagano. Owner esente (gestito in index.js).
const WEALTH_BRACKETS = [
    { min:        0, tax: 0 },   // sotto 5.000€   → 0%
    { min:    5_000, tax: 2 },   // 5k-20k    → 2%
    { min:   20_000, tax: 5 },   // 20k-100k  → 5%
    { min:  100_000, tax: 10 },  // 100k-500k → 10%
    { min:  500_000, tax: 15 },  // >500k     → 15%
];

const wealthTaxRate = (balance) => {
    const b = Number(balance) || 0;
    let rate = 0;
    for (const br of WEALTH_BRACKETS) {
        if (b >= br.min) rate = br.tax;
    }
    return rate;
};

const applyWealthTax = (balance) => {
    const b = Math.max(0, Math.floor(Number(balance) || 0));
    const rate = wealthTaxRate(b);
    const tax = Math.floor((b * rate) / 100);
    return { net: b - tax, tax, rate, balance: b };
};

const taxRate = (balance) => {
    const b = Number(balance) || 0;
    for (const br of BRACKETS) {
        if (b <= br.max) return br.tax;
    }
    return BRACKETS.at(-1).tax;
};

const applyTax = (gross, balance) => {
    const g = Math.max(0, Math.floor(Number(gross) || 0));
    if (g === 0) return { net: 0, tax: 0, rate: 0 };

    const rate = taxRate(balance);
    const tax = Math.floor((g * rate) / 100);
    const net = g - tax;

    return { net, tax, rate };
};

module.exports = { applyTax, taxRate, applyWealthTax, wealthTaxRate };
