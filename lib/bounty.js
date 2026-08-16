'use strict';

const activeBounties = {};

const BONUS_MIN = 100;
const BONUS_MAX = 500;
// Probabilità che un messaggio tenti lo spawn di una taglia. Ridotta da 0.05
// a 0.02 per far "spammare" molto meno la taglia nelle chat attive.
// Durante l'evento "Taglia regale" viene triplicata.
const SPAWN_CHANCE = 0.02;

// Cooldown tra una taglia e l'altra per lo stesso gruppo: evitiamo che appena
// una taglia viene incassata ne compaia subito un'altra.
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minuti
// Con l'evento "Taglia regale" il cooldown scende a 3 minuti.
const REGAL_COOLDOWN_MS = 3 * 60 * 1000;
const lastBountyTs = {};

const trySpawnBounty = (chatId, members, regal = false) => {
    if (activeBounties[chatId]) return null;
    const cd = regal ? REGAL_COOLDOWN_MS : COOLDOWN_MS;
    if (lastBountyTs[chatId] && Date.now() - lastBountyTs[chatId] < cd) return null;
    if (!members || members.length < 2) return null;
    const target = members[Math.floor(Math.random() * members.length)];
    const reward = Math.floor(Math.random() * (BONUS_MAX - BONUS_MIN + 1)) + BONUS_MIN;
    const finalReward = regal ? Math.round(reward * 2.5) : reward;
    activeBounties[chatId] = { target: target.jid || target.id || target, reward: finalReward, timestamp: Date.now() };
    lastBountyTs[chatId] = Date.now();
    return activeBounties[chatId];
};

// Check economico PRIMA di chiamare groupMetadata (che è una rete/API call):
// solo una frazione dei messaggi arriva davvero a fetchare i partecipanti.
const shouldTrySpawnBounty = (chatId, regal = false) => {
    const cd = regal ? REGAL_COOLDOWN_MS : COOLDOWN_MS;
    const chance = regal ? SPAWN_CHANCE * 3 : SPAWN_CHANCE;
    return (
        !activeBounties[chatId]
        && (!lastBountyTs[chatId] || Date.now() - lastBountyTs[chatId] >= cd)
        && Math.random() < chance
    );
};

const claimBounty = (chatId, userId) => {
    const bounty = activeBounties[chatId];
    if (!bounty) return null;
    if (bounty.target === userId) return null;
    const success = Math.random() < 0.6;
    if (success) {
        delete activeBounties[chatId];
        return bounty.reward;
    }
    return 0;
};

const getBounty = (chatId) => activeBounties[chatId] || null;

const removeBounty = (chatId) => { delete activeBounties[chatId]; };

module.exports = { trySpawnBounty, claimBounty, getBounty, removeBounty, shouldTrySpawnBounty };
