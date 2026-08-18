'use strict';

// Soglie anti-flood: più tolleranti del passato (6 messaggi in 4 secondi).
// I messaggi arretrati post-riconnessione vengono filtrati a monte in
// index.js (BACKLOG_GRACE_S), quindi qui contiamo solo il traffico reale.
const MAX_MSG = 6;
const WINDOW_MS = 4000;
const MUTE_DURATION = 60000;

const userTraffic = {};

const checkFlood = (userId) => {
    const now = Date.now();
    if (!userTraffic[userId]) userTraffic[userId] = [];
    userTraffic[userId] = userTraffic[userId].filter(t => now - t < WINDOW_MS);
    userTraffic[userId].push(now);
    return userTraffic[userId].length > MAX_MSG;
};

const cleanup = () => {
    const now = Date.now();
    for (const uid of Object.keys(userTraffic)) {
        userTraffic[uid] = userTraffic[uid].filter(t => now - t < WINDOW_MS);
        if (userTraffic[uid].length === 0) delete userTraffic[uid];
    }
};

setInterval(cleanup, 10000);

module.exports = { checkFlood, MUTE_DURATION };
