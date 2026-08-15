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

module.exports = { applyTax, taxRate };
