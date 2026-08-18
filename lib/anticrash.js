'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ANTICRASH — Vex Bot
//  Watchdog che rileva blocchi e sovraccarichi:
//   1. Event loop fermo (i timer non scattano in tempo) → il bot è bloccato
//   2. Memoria heap oltre la soglia                          → sta per morire
//   In entrambi i casi chiama onCrash(reason) e index.js riavvia la
//   connessione in modo pulito (il gestore 'connection.close' esiste già).
//  Un rate-limit evita loop di riavvio continui.
// ─────────────────────────────────────────────────────────────────────────────

const WATCHDOG_INTERVAL_MS = 15000;
const EVENT_LOOP_MAX_DELAY_MS = 90000;
const HEAP_MAX_MB = 1800;
const RESTART_MIN_INTERVAL_MS = 60000;

let crashed = false;
let lastRestartTs = 0;

const trigger = (onCrash, reason) => {
    if (crashed) return;
    const now = Date.now();
    if (now - lastRestartTs < RESTART_MIN_INTERVAL_MS) return;
    crashed = true;
    lastRestartTs = now;
    if (typeof onCrash === 'function') onCrash(reason);
};

const watch = (onCrash) => {
    let lastTick = Date.now();
    const timer = setInterval(() => {
        const now = Date.now();
        const delay = now - lastTick - WATCHDOG_INTERVAL_MS;
        lastTick = now;

        if (delay > EVENT_LOOP_MAX_DELAY_MS) {
            trigger(onCrash, `event loop bloccato (${Math.round(delay / 1000)}s)`);
            return;
        }

        const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        if (heapMb > HEAP_MAX_MB) {
            trigger(onCrash, `memoria heap troppo alta (${heapMb}MB)`);
        }
    }, WATCHDOG_INTERVAL_MS);
    timer.unref();
    return timer;
};

const reset = () => { crashed = false; };

module.exports = { watch, trigger, reset };