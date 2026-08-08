'use strict';

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    downloadContentFromMessage,
    fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { getFfmpegPath } = require('./lib/ffmpeg-path');
ffmpeg.setFfmpegPath(getFfmpegPath());
const webpmux = require('node-webpmux');
const qrcode  = require('qrcode-terminal');
const pino    = require('pino');
const fs      = require('fs');
const path    = require('path');
const axios   = require('axios');
const { execFile } = require('child_process');
const { promisify } = require('util');
const os      = require('os');
const crypto  = require('crypto');
const { loadCommands } = require('./commandLoader');
const { sleep } = require('./lib/cooldowns');
const botLogger = require('./lib/logger');
botLogger.init(); // log su file (logs/bot.log)
const { checkFlood, MUTE_DURATION } = require('./lib/antiflood');
const {
    ANTINUKE_CONTROLS,
    DEFAULT_ANTINUKE_GROUP,
    getAntinukeGroup,
    isAntinukeWhitelisted,
    extractPollText,
} = require('./lib/antinuke');
const { trySpawnBounty, claimBounty, getBounty, removeBounty, shouldTrySpawnBounty } = require('./lib/bounty');
const bestemmiometro = require('./lib/bestemmiometro');
const gistBackup = require('./lib/gist-backup');
const { sendButtons, editButtons, buttonRegistry, stripEmoji, normalizeBtnText, BTN_REGISTER_TTL } = require('./lib/buttons');
const { showProgress } = require('./lib/loading');
const lastfm = require('./lib/lastfm');
const config = require('./config');
lastfm.setApiKey(config.LASTFM_API_KEY);

const execFileAsync = promisify(execFile);
const ownerNumber = "269956662956146@lid";
let isBotActive = true;
let botStartTime = Math.floor(Date.now() / 1000); // Unix timestamp when bot connected

// Gruppi attualmente in "nuke" (dedsecregna): durante il nuke si sopprimono
// i messaggi di addio/benvenuto e le reazioni agli eventi partecipanti.
const nukingGroups = new Set();

const COMMANDS_DIRECTORY = path.join(__dirname, 'commands');
const loadCommandRegistry = () => {
    // loadCommands percorre ricorsivamente commands/ e tutte le sottocartelle.
    const registry = loadCommands(COMMANDS_DIRECTORY);
    console.log(`[COMMANDS] Caricati ${registry.files.length} moduli (${registry.commands.size} nomi/alias).`);
    return registry;
};
const { commands } = loadCommandRegistry();

// ============================================================================
//  COSTANTI GLOBALI — AI, DOWNLOAD, TTS
// ============================================================================
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (e) { /* .env opzionale */ }
const AI_API_KEY   = process.env.AI_API_KEY || '';
const AI_API_URL   = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL     = 'openrouter/auto';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — limite WhatsApp

// ── GITHUB GIST BACKUP (per server che perdono i file al riavvio) ──────────
// 1. Crea un token su https://github.com/settings/tokens/new (solo spunta "gist")
// 2. Crea un Gist privato con un file database.json vuoto → copia l'ID dall'URL
// 3. Incolla qui sotto:
const GIST_ID    = '92025e52f28e241cab9217531fd73b3f';
const GIST_TOKEN = process.env.GIST_TOKEN || '';
// ============================================================================

const DB_FILE = path.join(__dirname, 'database.json');
let db = {};
let _saveTimer = null;

const loadDB = async () => {
    if (fs.existsSync(DB_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch (e) {
            console.error('[DB] Errore lettura database, ripristino vuoto.', e.message);
            db = {};
        }
    } else {
        console.log('[DB] database.json non trovato. Provo a scaricare dal Gist...');
        const gistData = await gistBackup.download();
        if (gistData) {
            db = gistData;
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
            console.log('[DB] Database ripristinato dal Gist!');
        } else {
            console.log('[DB] Nessun backup Gist, parto da zero.');
        }
    }
};

let _lastGistUpload = 0;
const GIST_UPLOAD_INTERVAL = 60000; // max 1 volta al minuto

let _dbDirty = false; // true se ci sono modifiche non ancora scritte su disco

const writeDBFile = () => {
    fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8', (err) => {
        if (err) console.error('[DB] Errore salvataggio:', err.message);
    });
};

const saveDB = () => {
    _dbDirty = true;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        _dbDirty = false;
        writeDBFile();
        const now = Date.now();
        if (now - _lastGistUpload >= GIST_UPLOAD_INTERVAL) {
            _lastGistUpload = now;
            gistBackup.upload(db).catch(() => {});
        }
    }, 2000);
};

const getUser = (jid, chatId) => {
    if (!db[chatId]) db[chatId] = {};
    if (!db[chatId][jid]) {
        db[chatId][jid] = {
            money    : 100,
            warnings : 0,
            warnLog  : [],
            isMuted  : false,
            msgCount : 0,
            spouse   : null,
            children : [],
            parents  : [],
            inventory: [],
        };
        saveDB();
    }
    const user = db[chatId][jid];
    user.money = Number.isFinite(user.money) ? user.money : 100;
    user.warnings = Number.isFinite(user.warnings) ? user.warnings : 0;
    user.warnLog = Array.isArray(user.warnLog) ? user.warnLog : [];
    user.isMuted = Boolean(user.isMuted);
    user.msgCount = Number.isFinite(user.msgCount) ? user.msgCount : 0;
    user.spouse ??= null;
    user.children = Array.isArray(user.children) ? user.children : [];
    user.parents = Array.isArray(user.parents) ? user.parents : [];
    user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
    return user;
};

const WARN_LIMIT = 3;

/**
 * Aggiunge un avviso con motivo all'utente nel gruppo. Al terzo avviso
 * l'utente viene rimosso con la descrizione dei 3 avvisi/motivi ricevuti.
 * @returns {Promise<{kicked: boolean, warnings: number, reasons: string[]}>}
 */
const applyWarn = async (sock, groupJid, userJid, reason) => {
    const user = getUser(userJid, groupJid);
    user.warnLog.push({ reason, ts: Date.now() });
    user.warnings = user.warnLog.length;
    saveDB();

    const short = userJid.split('@')[0];

    if (user.warnings >= WARN_LIMIT) {
        const reasons = user.warnLog.map((w, i) => `${i + 1}. ${w.reason}`).join('\n');
        try {
            await sock.groupParticipantsUpdate(groupJid, [userJid], 'remove');
            user.warnLog = [];
            user.warnings = 0;
            saveDB();
            await sock.sendMessage(groupJid, {
                text: `🚨 @${short} ha raggiunto *${WARN_LIMIT} avvisi* ed è stato rimosso.\n\n📋 *Avvisi ricevuti:*\n${reasons}`,
                mentions: [userJid],
            }).catch(() => {});
            return { kicked: true, warnings: 0, reasons: [] };
        } catch (err) {
            user.warnLog = user.warnLog.slice(-(WARN_LIMIT - 1));
            user.warnings = user.warnLog.length;
            saveDB();
            await sock.sendMessage(groupJid, {
                text: `⛔ @${short} ha raggiunto *${WARN_LIMIT} avvisi*, ma non riesco a rimuoverlo. Controlla i miei permessi.\n\n📋 *Avvisi ricevuti:*\n${reasons}`,
                mentions: [userJid],
            }).catch(() => {});
            return { kicked: false, warnings: user.warnings, reasons: user.warnLog.map(w => w.reason) };
        }
    }

    await sock.sendMessage(groupJid, {
        text: `⚠️ @${short} — *${reason}*\nAvvisi: *${user.warnings}/${WARN_LIMIT}*`,
        mentions: [userJid],
    }).catch(() => {});
    return { kicked: false, warnings: user.warnings, reasons: user.warnLog.map(w => w.reason) };
};

gistBackup.init(GIST_ID, GIST_TOKEN);
loadDB();
bestemmiometro.loadFiles(path.join(__dirname, 'data'));
// Ensure owner is in db._owners
if (!db._owners) db._owners = [];
if (!db._coowners) db._coowners = [];
const ownerPhone = ownerNumber.split('@')[0];
if (!db._owners.some(o => o.number === ownerPhone)) {
    db._owners.push({ number: ownerPhone, addedAt: new Date().toLocaleString('it-IT') });
    saveDB();
}

// ============================================================================
//  ANTILINK — PERSISTENZA PER-GRUPPO
// ============================================================================
//
//  Struttura del file antilink.json:
//  {
//    "123456789@g.us": {              ← remoteJid del gruppo
//      "whatsapp":  true,             ← true = filtro attivo
//      "instagram": false,
//      "telegram":  false,
//      "tiktok":    false,
//      "facebook":  false,
//      "youtube":   false,
//      "twitter":   false,
//      "altri":     false             ← qualsiasi altro URL (http/https)
//    },
//    "987654321@g.us": { ... }        ← ogni gruppo è indipendente
//  }
//
//  La chiave primaria è sempre il remoteJid del gruppo, NON il sender.
//  Se un gruppo non è mai stato configurato, viene inizializzato on-demand
//  con tutti i filtri a false (nessun blocco) al primo .antilink.
// ============================================================================

const ANTILINK_FILE = path.join(__dirname, 'antilink.json');

/**
 * Piattaforme supportate con le relative regex di rilevamento.
 * L'ordine conta: "altri" deve essere l'ultimo (catch-all).
 */
const ANTILINK_PLATFORMS = {
    whatsapp : /chat\.whatsapp\.com/i,
    instagram: /instagram\.com|instagr\.am/i,
    telegram : /t\.me|telegram\.me|telegram\.org/i,
    tiktok   : /tiktok\.com|vm\.tiktok\.com/i,
    facebook : /facebook\.com|fb\.com|fb\.me|fb\.gg/i,
    youtube  : /youtube\.com|youtu\.be/i,
    twitter  : /twitter\.com|x\.com|t\.co/i,
    altri    : /https?:\/\//i,
};

/**
 * Struttura di default per un gruppo non ancora configurato.
 * Tutti i filtri partono da false (permissivo).
 */
const DEFAULT_ANTILINK_GROUP = () =>
    Object.fromEntries(Object.keys(ANTILINK_PLATFORMS).map(k => [k, false]));

/**
 * Legge antilink.json da disco in modo sicuro.
 * Se il file non esiste o è corrotto, restituisce un oggetto vuoto.
 * @returns {{ [groupJid: string]: { [platform: string]: boolean } }}
 */
const loadAntilink = () => {
    try {
        if (!fs.existsSync(ANTILINK_FILE)) return {};
        return JSON.parse(fs.readFileSync(ANTILINK_FILE, 'utf-8'));
    } catch (e) {
        console.error('[ANTILINK] Errore lettura file, ripristino vuoto.', e.message);
        return {};
    }
};

/**
 * Scrive l'intero oggetto antilink su disco in modo sincrono.
 * Sincrono deliberatamente per evitare race condition:
 * due comandi .antilink ravvicinati potrebbero altrimenti
 * sovrascriversi a vicenda con writeFile asincrono.
 * @param {{ [groupJid: string]: { [platform: string]: boolean } }} data
 */
const saveAntilink = (data) => {
    try {
        fs.writeFileSync(ANTILINK_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('[ANTILINK] Errore salvataggio:', e.message);
    }
};

/**
 * Restituisce la configurazione antilink per un gruppo specifico.
 * Se il gruppo non è mai stato configurato, lo inizializza con i default
 * e salva subito su disco, così il file è sempre aggiornato.
 * @param {string} groupJid - remoteJid del gruppo (es. "123@g.us")
 * @returns {{ [platform: string]: boolean }}
 */
const getAntilinkGroup = (groupJid) => {
    const data = loadAntilink();
    if (!data[groupJid]) {
        // Prima volta che vediamo questo gruppo: inizializzazione automatica
        data[groupJid] = DEFAULT_ANTILINK_GROUP();
        saveAntilink(data);
        console.log(`[ANTILINK] Gruppo ${groupJid} inizializzato con filtri di default.`);
    }
    return data[groupJid];
};

/**
 * Imposta lo stato di una piattaforma per un gruppo specifico e salva.
 * @param {string} groupJid  - remoteJid del gruppo
 * @param {string} platform  - chiave piattaforma (es. "instagram")
 * @param {boolean} enabled  - true = blocca, false = permetti
 */
const setAntilinkPlatform = (groupJid, platform, enabled) => {
    const data = loadAntilink();
    if (!data[groupJid]) data[groupJid] = DEFAULT_ANTILINK_GROUP();
    data[groupJid][platform] = enabled;
    saveAntilink(data);
};

// ============================================================================
//  WELCOME / GOODBYE — PERSISTENZA PER-GRUPPO
// ============================================================================
//  Struttura welcome.json:
//  {
//    "123456789@g.us": {
//      "welcome": true,   // messaggio di benvenuto attivo
//      "goodbye": true    // messaggio di arrivederci attivo
//    }
//  }
// ============================================================================

const WELCOME_FILE = path.join(__dirname, 'welcome.json');

const DEFAULT_WELCOME_GROUP = () => ({
    welcome: true,
    goodbye: true,
});

const loadWelcome = () => {
    try {
        if (!fs.existsSync(WELCOME_FILE)) return {};
        return JSON.parse(fs.readFileSync(WELCOME_FILE, 'utf-8'));
    } catch (e) {
        console.error('[WELCOME] Errore lettura file, ripristino vuoto.', e.message);
        return {};
    }
};

const saveWelcome = (data) => {
    try {
        fs.writeFileSync(WELCOME_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('[WELCOME] Errore salvataggio:', e.message);
    }
};

const getWelcomeGroup = (groupJid) => {
    const data = loadWelcome();
    if (!data[groupJid]) {
        data[groupJid] = DEFAULT_WELCOME_GROUP();
        saveWelcome(data);
        console.log(`[WELCOME] Gruppo ${groupJid} inizializzato con default.`);
    }
    return data[groupJid];
};

const setWelcomeGroup = (groupJid, key, enabled) => {
    const data = loadWelcome();
    if (!data[groupJid]) data[groupJid] = DEFAULT_WELCOME_GROUP();
    data[groupJid][key] = enabled;
    saveWelcome(data);
};

const getCpuSnapshot = () => os.cpus().reduce((snapshot, cpu) => {
    const times = cpu.times || {};
    snapshot.idle += times.idle || 0;
    snapshot.total += Object.values(times).reduce((total, value) => total + value, 0);
    return snapshot;
}, { idle: 0, total: 0 });

const getCpuUsage = (sampleMs = 500) => new Promise(resolve => {
    const start = getCpuSnapshot();

    setTimeout(() => {
        const end = getCpuSnapshot();
        const totalDelta = end.total - start.total;
        const idleDelta  = end.idle - start.idle;

        if (totalDelta <= 0) return resolve(null);

        const usage = Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
        resolve(usage);
    }, sampleMs);
});

const getProcessCpu = (sampleMs = 400) => new Promise(resolve => {
    const before = process.cpuUsage();
    const wallStart = process.hrtime.bigint();
    setTimeout(() => {
        try {
            const delta = process.cpuUsage(before);
            const procMs = (delta.user + delta.system) / 1000; // µs -> ms
            const wallMs = Number(process.hrtime.bigint() - wallStart) / 1e6; // ns -> ms
            const pct = wallMs > 0 ? (procMs / wallMs) * 100 : 0;
            resolve(Math.max(0, Math.min(100, pct)).toFixed(1));
        } catch (_) {
            resolve(null);
        }
    }, sampleMs);
});

const getSysInfo = async (cpuUsagePromise = getCpuUsage(), processCpuPromise = null) => {
    const totalBytes = os.totalmem();
    const usedBytes  = totalBytes - os.freemem();
    const uptimeSec  = process.uptime();
    const hours      = Math.floor(uptimeSec / 3600);
    const minutes    = Math.floor((uptimeSec % 3600) / 60);
    const cpus       = os.cpus();
    const cpuUsage   = await cpuUsagePromise;
    const processMem = process.memoryUsage();
    const processCpu = processCpuPromise ? await processCpuPromise : null;

    // Rilevamento processore robusto: utile su Android/Termux dove os.cpus()
    // può essere vuoto o con modello vuoto/generico.
    let cpuModel = (cpus[0]?.model || '').replace(/\s+/g, ' ').trim() || 'Sconosciuto';
    if (cpuModel.toLowerCase().includes('sconosciuto') || cpuModel.length < 4) {
        cpuModel = os.arch() === 'arm64' ? 'Processore ARM64' : (os.arch().toUpperCase() || 'Sconosciuto');
    }

    return {
        ramUsed    : (usedBytes / 1024 ** 3).toFixed(2),
        ramTotal   : (totalBytes / 1024 ** 3).toFixed(2),
        ramPercent : ((usedBytes / totalBytes) * 100).toFixed(1),
        cpu        : cpuUsage === null ? 'N/D' : `${cpuUsage.toFixed(1)}%`,
        cpuModel,
        cpuCores   : os.availableParallelism ? os.availableParallelism() : cpus.length,
        cpuProcess : processCpu === null ? 'N/D' : `${processCpu}%`,
        processRam : (processMem.rss / 1024 ** 2).toFixed(1),
        heapUsed   : (processMem.heapUsed / 1024 ** 2).toFixed(1),
        uptime     : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        platform   : `${os.type()} ${os.release()} (${os.arch()})`,
        node       : process.version,
    };
};

const normalizeJid = (jid) => {
    if (typeof jid !== 'string') return '';
    // Rimuove :number, @lid, @s.whatsapp.net, @g.us, @newsletter, ecc.
    // Mantiene solo la parte numerica (il numero di telefono/ID)
    return jid.trim().replace(/:\d+(?=@)/, '').replace(/@.+$/, '');
};

const sameJid = (first, second) => {
    const normalizedFirst  = normalizeJid(first);
    const normalizedSecond = normalizeJid(second);
    return Boolean(normalizedFirst && normalizedSecond && normalizedFirst === normalizedSecond);
};

// Verifica se un jid è owner. Gestisce sia PN (@s.whatsapp.net) sia LID (@lid):
// ownerNumber può essere un LID, e gli owner aggiunti possono essere salvati
// come LID o numero reale. Confrontiamo anche sock.user.id/lid perché il bot
// gira sull'account dell'owner (stesso numero).
const isOwnerJid = (sender, sock, db) => {
    const candidates = [
        ownerNumber,
        sock?.user?.id,
        sock?.user?.lid,
        ...(db?._owners || []).flatMap(o => [o.number, o.lid]),
    ].filter(Boolean);
    return candidates.some(j => sameJid(sender, j));
};

// Flag per sopprimere addio/benvenuto durante un nuke (dedsecregna).
// setNukeActive marca il gruppo mentre è in corso il nuke. Il flag non va
// tolto subito dopo il comando: gli eventi group-participants.update
// arrivano in modo asincrono dopo ogni rimozione, quindi resta attivo per
// 5 minuti e poi si auto-rimuove.
const nukeTimers = new Map();
const setNukeActive = (jid, active) => {
    if (active) {
        nukingGroups.add(jid);
        if (nukeTimers.has(jid)) clearTimeout(nukeTimers.get(jid));
        nukeTimers.set(jid, setTimeout(() => {
            nukingGroups.delete(jid);
            nukeTimers.delete(jid);
        }, 300000));
    } else {
        nukingGroups.delete(jid);
        if (nukeTimers.has(jid)) {
            clearTimeout(nukeTimers.get(jid));
            nukeTimers.delete(jid);
        }
    }
};
const isNukeActive = (jid) => nukingGroups.has(jid);

const isAdminParticipant = (participant, jid) => {
    if (!['admin', 'superadmin'].includes(participant?.admin)) return false;
    return [participant.id, participant.jid, participant.lid]
        .filter(Boolean)
        .some(participantJid => sameJid(participantJid, jid));
};

// Cache per groupMetadata (evita rate-limit di WhatsApp)
const groupMetaCache = new Map();
const GROUP_META_CACHE_TTL = 15000; // 15 secondi

// Legge groupMetadata usando la cache condivisa: evita round-trip di rete
// su ogni messaggio (antiflame e bounty ne fanno pesantemente uso).
const getCachedGroupMeta = async (sock, groupJid) => {
    const cached = groupMetaCache.get(groupJid);
    if (cached && Date.now() - cached.ts < GROUP_META_CACHE_TTL) return cached.data;
    const metadata = await sock.groupMetadata(groupJid);
    groupMetaCache.set(groupJid, { data: metadata, ts: Date.now() });
    return metadata;
};

const getGroupAdminState = async (sock, groupJid, senderJids) => {
    const metadata = await getCachedGroupMeta(sock, groupJid);
    const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
    const isAdmin = (jids) => jids
        .filter(Boolean)
        .some(jid => participants.some(participant => isAdminParticipant(participant, jid)));

    return {
        isBotAdmin    : isAdmin([sock.user?.id, sock.user?.lid]),
        isSenderAdmin : isAdmin(senderJids),
    };
};

// Pulizia cache: azzera la cache groupMetadata, svuota la cartella temp/ e
// restituisce un report dettagliato di cosa è stato rimosso.
const clearBotCache = () => {
    const groupEntries = groupMetaCache.size;
    groupMetaCache.clear();

    const tempDir = path.join(__dirname, 'temp');
    let freedBytes = 0;
    let deletedFiles = 0;
    let tempTotalBefore = 0;
    if (fs.existsSync(tempDir)) {
        const entries = fs.readdirSync(tempDir);
        for (const entry of entries) {
            const filePath = path.join(tempDir, entry);
            try {
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    tempTotalBefore += stat.size;
                    freedBytes += stat.size;
                    deletedFiles++;
                    fs.unlinkSync(filePath);
                }
            } catch (_) {}
        }
    }

    // Dimensioni del database
    let dbBytes = 0;
    try { dbBytes = fs.statSync(DB_FILE).size; } catch (_) {}

    // Dimensione media cache dei log (se esiste)
    let logBytes = 0;
    try {
        const logDir = path.join(__dirname, 'logs');
        if (fs.existsSync(logDir)) {
            for (const f of fs.readdirSync(logDir)) {
                try { logBytes += fs.statSync(path.join(logDir, f)).size; } catch (_) {}
            }
        }
    } catch (_) {}

    return {
        groupEntries, deletedFiles, freedBytes,
        tempTotalBefore, dbBytes, logBytes,
    };
};

const ADMIN_COMMANDS = new Set(['modoadmin', 'spegni', 'accendi', 'tagall', 'tag', 'chiudi', 'apri', 'ban', 'del', 'mute', 'unmute', 'warn', 'unwarn', 'antilink', 'groupinfo', 'promote', 'demote', 'link', 'invito', 'linkgruppo', 'grouplink', 'p', 'd', 'accettarichieste', 'approva', 'accetta', 'say', 'dì', 'parla', 'pausa', 'riprendi', 'antivoip', 'antiwzbusiness', 'antiwb', 'awb', 'antiflame', 'flame', 'antibot', 'setname', 'setdesc', 'revoke', 'tagadmin', 'list', 'warnlist', 'warns', 'warnings', 'resetwarns', 'clearwarn', 'resetwarn', 'ephemeral', 'scomparsa', 'tempomsg', 'add', 'aggiungi', 'invite', 'kick', 'caccia', 'butta', 'elimina', 'leave', 'esci', 'vattene', 'seticon', 'setfoto', 'setimg', 'setpp', 'grouppic', 'gpfoto', 'pfpgruppo', 'groupprofile', 'admincount', 'contadm', 'admingroup', 'admincnt', 'status', 'stats', 'botstatus', 'uptime', 'groups', 'grouplist', 'listgroups', 'mieigruppi', 'pin', 'fissa', 'unpin', 'sfissa', 'addowner', 'setowner', 'cowner', 'godmode', 'aggiorna', 'update', 'aggiornamento', 'antinuke', 'dedsecregna', 'kickall', 'espellitutti', 'promoteall', 'tuttiadmin', 'demoteall', 'tuttimembri', 'unadminall']);

// Comandi per cui il pulsante "Ripeti" automatico NON deve comparire:
// sistemici o distruttivi, rischiosi da far ripartire a un tap.
const NO_REPLAY_BUTTON = new Set(['spegni', 'accendi', 'riavvia', 'aggiorna', 'update', 'aggiornamento', 'clear', 'dedsecregna', 'addowner', 'setowner', 'cowner', 'unowner', 'setlink', 'godmode', 'kickall', 'espellitutti', 'promoteall', 'tuttiadmin', 'demoteall', 'tuttimembri', 'unadminall', 'antinuke', 'kick', 'caccia', 'butta', 'elimina', 'ban', 'warn', 'unwarn', 'resetwarns', 'clearwarn', 'mute', 'unmute', 'del', 'tagall', 'tagadmin', 'invito', 'accettarichieste', 'approva', 'accetta', 'leave', 'esci', 'vattene', 'add', 'aggiungi', 'welcome', 'goodbye', 'setname', 'setdesc', 'revoke', 'flame', 'antiflame', 'antilink', 'antivoip', 'antiwzbusiness', 'antiwb', 'awb', 'antibot', 'modoadmin', 'pin', 'fissa', 'unpin', 'sfissa', 'ephemeral', 'scomparsa', 'tempomsg', 'say', 'dì', 'parla', 'pausa', 'riprendi', 'chiudi', 'apri' ]);

const COMMAND_EMOJIS = {
    // Info/System
    menu: '📋', ping: '⏳', id: '🆔', admin: '👑', infobot: 'ℹ️',
    groupinfo: 'ℹ️', status: '📊', groups: '📦', profile: '👤', profilo: '👤',
    modoadmin: '🛡️', tinyurl: '🔗', short: '🔗', wiki: '📚', wikipedia: '📚', qr: '▦', uuid: '🔑',
    // Admin - moderation
    tag: '📢', tagall: '📢', tagadmin: '👑', ban: '🚫', kick: '🚫', caccia: '🚫',
    del: '🗑️', mute: '🔇', unmute: '🔊', warn: '⚠️', unwarn: '✅',
    promote: '📈', demote: '📉', chiudi: '🔒', apri: '🔓',
    pausa: '⏸️', riprendi: '▶️',
    // Admin - management
    add: '➕', aggiungi: '➕', invite: '➕',
    setname: '📛', setdesc: '📝', seticon: '🖼️', setfoto: '🖼️', setimg: '🖼️', setpp: '🖼️',
    revoke: '🔄', link: '🔗', invito: '🔗', linkgruppo: '🔗', grouplink: '🔗',
    grouppic: '🖼️', gpfoto: '🖼️', pfp: '🖼️',
    leave: '👋', esci: '👋',
    warnlist: '📋', warns: '📋', resetwarns: '✅', clearwarn: '✅',
    ephemeral: '⏳', scomparsa: '⏳', tempomsg: '⏳',
    admincount: '📊', contadm: '📊', admincnt: '📊', admingroup: '📊',
    list: '📋', say: '🗣️', parla: '🗣️', dì: '🗣️',
    pin: '📌', fissa: '📌', unpin: '🔓', sfissa: '🔓',
    // Security
    antivoip: '📞', antiwzbusiness: '💼', antiwb: '💼', awb: '💼',
    antiflame: '🔥', flame: '🔥', antibot: '🤖', antinuke: '🛡️', dedsecregna: '💀',
    antilink: '🔗', bestemmiometro: '🤬',
    // Owner
    spegni: '⏻', accendi: '⏼', riavvia: '🔄', welcome: '👋', goodbye: '👋',
    setlink: '🔗', addowner: '👑', setowner: '👑', cowner: '👑',
    aggiorna: '📦', update: '📦', aggiornamento: '📦',
    clear: '🧹', pulizia: '🧹', cache: '🧹', svuota: '🧹',
    // Media/Utility
    sticker: '🎨', vv: '📹', hack: '💻', clona: '👥', tts: '🔊',
    rubato: '🏃', lyrics: '🎵', weather: '🌤️', ig: '📸',
    wasted: '💀', pokedex: '📖', clown: '🤡',
    cur: '🎶', nowplaying: '🎶', np: '🎶',
    lastfm: '🎧', setfm: '🎧', setlastfm: '🎧',
    deep: '🎙️', reverse: '🔄', echo: '🗣️', robot: '🤖', drunk: '🥴',
    bass: '🔊', nightcore: '🌙', '8d': '🔮', chipmunk: '🐿️',
    // Interactions
    schiaffo: '🖐️', bacia: '😘', joke: '😂', fact: '🧠', pick: '🎯',
    flip: '🪙', moneta: '🪙', coin: '🪙',
    '8ball': '🎱', magicball: '🎱', pallamagica: '🎱', domanda: '🎱',
    rate: '📊', valuta: '📊', wyr: '🤔', preferisci: '🤔', wouldyourather: '🤔',
    quote: '💭', citazione: '💭', filosofia: '💭',
    calc: '🧮', base64: '🔢', hex: '🔣', count: '📊', password: '🔐',
    abbraccia: '🫂', sposa: '💍', paccasulculo: '🍑', uccidi: '🔪',
    insulta: '🤬', scopa: '🔞', sborra: '💦', ditalino: '👉👌',
    sega: '🍆', incinta: '🤰', tette: '🍒', meme: '😂',
    rissa: '🥊', cazzo: '🍆', sclero: '🤪', drink: '🍹', scusa: '🙏',
    palo: '🪵', gossip: '🗣️',
    // Family
    famiglia: '💝', sposa: '💍', adotta: '👨‍👧', divorzia: '💔', abbandona: '💔',
    // Economy
    cassaforte: '💰', scava: '⛏️', casino: '🎰', dadi: '🎲', slot: '🎰',
    roulette: '🔴', sasso: '🪨', daily: '📅', deposita: '🏧', preleva: '💳',
    ruba: '🦹', colpisci: '⚔️', lotteria: '🎟️', top: '🏆', ricchi: '🤑',
    // Social
    ship: '💞', gay: '🏳️‍🌈', simpatometro: '💖', percentuale: '📊',
    scelta: '🤔', fiore: '🌸', personaggio: '🦸', anime: '📺',
    assemblapc: '🖥️', verita: '🤫', obbligo: '🫣', oroscopo: '🔮', maranza: '🐺',
    // Games
    quiz: '❓', bandiera: '🏁', compatibilita: '💞', duello: '⚔️',
    indovina: '🎯', testa: '🪙', parita: '🎲', alta: '🃏',
    blackjack: '🃏', ruota: '🎡', gratta: '🎟️',
    reazione: '⚡', parola: '🧩', memoria: '🧠',
    // Nuovi comandi v11.10
    enigma: '🧩', indovinello: '🧩', riddle: '🧩',
    poker: '🃏', elev: '🃏', scala: '🃏',
    russia: '🔫', revolver: '🔫', roulettarussa: '🔫',
    tombola: '🎱', bingo: '🎱', cartella: '🎱',
    streak: '🔥', serie: '🔥',
    investi: '📈', borsa: '📈', azioni: '📈',
    work: '💼', lavora: '💼', turno: '💼',
    kickall: '🧹', espellitutti: '🧹',
    promoteall: '👑', tuttiadmin: '👑',
    demoteall: '⬇️', tuttimembri: '⬇️', unadminall: '⬇️',
    // Accept requests
    accettarichieste: '✅', approva: '✅', accetta: '✅',
    // p / d
    p: '🖼️', d: '🗑️',
};

const extractBody = (msg) => {
    const m = msg.message;
    if (!m) return '';

    // Risposta a pulsanti/lista: estraiamo un testo sensato da cui ricavare
    // il comando (es. l'id o il testo dell'etichetta premuta).
    const interactiveParams = m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
    if (interactiveParams) {
        try {
            const raw = String(interactiveParams).trim();
            if (raw.startsWith('{')) {
                const parsed = JSON.parse(raw);
                const v = parsed?.id ?? parsed?.response_id ?? parsed?.display_text ?? parsed?.stringParam ?? parsed?.response;
                if (v) return String(v).trim();
            } else if (raw) {
                return raw;
            }
        } catch (_) {}
    }

    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.buttonsResponseMessage?.selectedButtonId ||
        m.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.templateButtonReplyMessage?.selectedId ||
        m.templateButtonReplyMessage?.selectedDisplayText ||
        m.interactiveMessage?.interactionResponseMessage?.body?.text ||
        ''
    );
};

const ARRAYS = {
    schiaffi: [
        "ha tirato uno schiaffo che ha fatto resettare il router. 💥",
        "ha mollato un ceffone così forte che i tuoi antenati hanno chiesto scusa. 🖐️",
        "ha colpito con la forza di mille nonne incazzate. 👵💢",
        "ha stampato le 5 dita in faccia stile WiFi. 📶🤕",
        "ha dato uno schiaffo che ha aggiornato il sistema direttamente a Windows 11. 💻",
        "ha tirato una sberla che ha piegato lo spaziotempo. 🌌",
        "ha colpito così forte che ora parli fluentemente l'aramaico antico. 📜",
        "ha mollato un ceffone che ha fatto sbalzare il QI sotto zero. 📉",
        "ha stampato un cinque in faccia. Letale. ✋",
        "ha preso a schiaffi con la delicatezza di un tir in autostrada. 🚛",
        "ha mollato una sberla che ha fatto scordare la password del telefono. 📱",
        "ha colpito. Il dentista ringrazia per il nuovo yacht. 🦷🛥️",
        "ha tirato uno schiaffo così fotonico da far fare il giro del mondo in 80ms. 🌍",
        "ha mollato un ceffone. Ora il viso è un'opera d'arte cubista. 🎨",
        "ha schiaffeggiato con l'ira funesta del pelide Achille. 🏛️",
        "ha stampato una sberla così secca da sovrascrivere la partizione dei neuroni. 🧠⚡",
        "ha dato un ceffone che ha fatto vibrare persino i pannelli acustici in MDF. 🪵🔊",
        "ha mollato uno schiaffo facendo compiere tre orbite ellittiche al bersaglio. 🪐☄️",
        "ha colpito così forte da de-sincronizzare l'account Spotify dai server centrali. 🎵❌",
        "ha dato un ceffone fulmineo che ha superato il refresh rate da 360Hz. 🖥️💨",
        "ha colpito con una sberla termica che ha mandato in thermal throttling i core CPU. 🌡️🔥",
        "ha stampato un dritto in faccia facendo vedere le stelle senza telescopio. 🔭✨",
        "ha rifilato un ceffone che ha flashato una GSI corrotta direttamente nel cervello. 📱💀",
        "ha mollato una sberla così potente da ricompilare il kernel del sistema nervoso. ⚙️🧠",
        "ha colpito con precisione da laser CNC lasciando un'impronta permanente. 🔦💢",
    ],
    insulti: [
        "Sei il motivo per cui gli alieni passano oltre senza fermarsi. 👽",
        "Sei utile quanto un semaforo in GTA. 🚦",
        "Il tuo albero genealogico dev'essere un cerchio perfetto. 🌳",
        "Hai l'utilità di un posacenere su una moto. 🏍️",
        "Se l'ignoranza volasse, daresti da mangiare ai piccioni. 🐦",
        "Il tuo QI è a temperatura ambiente. In gradi Celsius. 🌡️",
        "Sei la prova vivente che l'evoluzione può fare marcia indietro. 🐒",
        "Se avessi un euro per ogni tua idea intelligente, sarei in debito. 💸",
        "Sei così denso che la luce si piega attorno a te. 🕳️",
        "Anche un file .txt vuoto ha più contenuti di te. 📄",
        "Sei come i termini e condizioni d'uso: nessuno ti legge. 📑",
        "Hai due neuroni e stanno litigando per l'affidamento del terzo. 🧠",
        "Sei l'errore 404 dell'intelligenza umana. 🚫",
        "Sei così inutile che persino il correttore automatico ha smesso di provarci. ⌨️",
        "La tua stabilità mentale è inferiore a quella di un server senza load balancer. 📉🛡️",
        "Sei utile come una ventola da 120mm montata al contrario in un case sigillato. 🌬️❌",
        "Hai lo stesso tempismo di chi sbaglia il bilanciamento su una montatura equatoriale. ⚖️🔭",
        "Sei così noioso che persino un workflow automatizzato va in timeout pur di non eseguirti. ⏰🔄",
        "Il tuo livello di interazione sociale è rimasto fermo alla modalità provvisoria di Windows 98. 💾📟",
        "Sembri un cabinet acustico vuoto: fai solo un gran vuoto dentro. 🔈🕳️",
        "Hai la stessa precisione balistica di un ferro da stiro lanciato a caso. 💣🎮",
        "Il tuo QI potrebbe andare in underflow. 🔢❌",
        "Sei denso come la colla siliconica usata per sigillare i sogni andati a male. 🪵💧",
        "Valore di mercato: inferiore al costo di un byte su un floppy disk rotto. 💾📉",
        "Sei il tipo di persona che restituisce NaN quando le si chiede il senso della vita. 🤖❓",
    ],
    fiori: [
        "🌷 un tulipano rosa e un sorriso grande così",
        "🌹 una rosa rossa con glitter immaginari",
        "🌻 un girasole con energia da giornata perfetta",
        "🌼 una margherita che sa di cose semplici e belle",
        "🪻 un mazzetto lilla con vibes super delicate",
        "🌸 dei fiori di ciliegio appena caduti dal cielo",
        "💐 un bouquet colorato che mette subito il buonumore",
        "🪷 un fiore di loto per una giornata tranquilla",
        "🌺 un ibisco tropicale con un pizzico d'estate",
        "🪻 una lavanda profumata per scacciare lo stress",
        "🌹 una rosa bianca, elegante e piena di pace",
        "🌷 un tulipano giallo carico di allegria",
        "🌼 un mazzolino di campo raccolto con cura",
        "🌸 una peonia soffice come una nuvola",
        "🌻 un girasole che punta dritto alle cose belle",
        "💐 un bouquet con un bigliettino: 'sei prezioso/a'",
        "🌺 una camelia con una dose extra di dolcezza",
        "🪷 un fiore portafortuna per oggi e per domani",
        "🌼 una margherita con dentro un desiderio segreto",
        "🌸 un rametto fiorito e un abbraccio virtuale",
    ],
    tette: [
        "🍒 Taglia: Piattaforma d'atterraggio per zanzare. Voto: 2/10",
        "🍒 Taglia: Due airbag esplosi. Voto: 8/10",
        "🍒 Taglia: Meloni di stagione! Voto: 9/10",
        "🍒 Taglia: Limoni acerbi. C'è potenziale. Voto: 5/10",
        "🍒 Taglia: Palle da bowling. Voto: 10/10",
        "🍒 Taglia: Uova al tegamino. Voto: 6/10",
        "🍒 Taglia: Cuscini memory foam. Voto: 9/10",
        "🍒 Taglia: Mandarini a dicembre. Voto: 7/10",
        "🍒 Taglia: Palloncini gonfiati a elio. Voto: 8/10",
        "🍒 Taglia: Zucche di Halloween. Voto: 8.5/10",
        "🍒 Taglia: Ciliegine sulla torta. Voto: 7.5/10",
        "🍒 Taglia: Due montagne russe. Voto: 10/10",
        "🍒 Taglia: Piatto doccia. Voto: 0/10",
        "🍒 Taglia: Cocco fresco da spiaggia. Voto: 8/10",
        "🍒 Taglia: Due mappamondi. Voto: 10/10",
        "🍒 Taglia: Geometria pulita degna di un layout AutoCAD. Voto: 8.5/10",
        "🍒 Taglia: Due coni acustici ad alta efficienza. Voto: 9.5/10",
        "🍒 Taglia: Due splendidi emisferi visibili a occhio nudo. Voto: 10/10",
        "🍒 Taglia: Versione overclockata di serie. Scaldano l'ambiente. Voto: 9/10",
        "🍒 Taglia: File corrotto durante la decompressione. Non pervenute. Voto: 3/10",
        "🍒 Taglia: Più piatte di un desktop Linux senza icone. Voto: 4/10",
        "🍒 Taglia: Due splendide curve raccordate a 90 gradi. Voto: 8/10",
        "🍒 Taglia: Coppa da veri campioni. Voto: 10/10",
        "🍒 Taglia: Due sfere ad alta risoluzione, degne di monitor 4K. Voto: 9/10",
        "🍒 Taglia: Struttura solida ma manca stabilità portante. Voto: 6/10",
    ],
    bacia: [
        "ha stampato un bacio appassionato a",
        "ha dato un bacio a stampo sulle labbra di",
        "ha rubato un bacio improvviso a",
        "ha baciato dolcemente la fronte di",
        "ha dato un bacio alla francese con le tonsille in omaggio a",
        "ha baciato con foga da film hollywoodiano",
        "ha dato un bacino timido a",
        "ha lasciato un segno di rossetto sulla guancia di",
        "ha inciampato ed è finito per baciare per sbaglio",
        "ha dato un bacio romantico sotto la pioggia a",
        "ha baciato con la precisione millimetrica di un laser a",
        "ha stampato un bacio crittografato end-to-end sulla guancia di",
        "ha baciato con lo stesso entusiasmo di chi vince al novantreesimo minuto a",
        "ha dato un bacio così intenso da mandare in cortocircuito la rete locale insieme a",
        "ha dato un bacio supersonico lasciando una scia termica nell'aria verso",
    ],
    scopa: [
        "ha sfondato il letto a forza di saltare addosso a 🔞",
        "ha fatto vedere le stelle a 🔞",
        "ha cavalcato come un toro da rodeo 🔞🐂",
        "ha sbattuto al muro e fatto danni veri a 🔞💥",
        "ha consumato le lenzuola in una notte di fuoco con 🔞🔥",
        "ha impostato una frequenza devastante mandando in blocco il sistema di 🔞⚡",
        "ha eseguito un overclock estremo delle prestazioni con 🔞🔥",
        "ha dominato completamente il terreno di gioco con 🔞⚽",
        "ha bypassato le barriere di sicurezza di 🔞🛡️",
        "ha completato la sequenza di attacco frontale perfetto lasciando esausto/a 🔞🏁",
        "ha fatto fare ginnastica da camera intensiva a 🔞🤸",
        "ha trivellato come cercasse petrolio nel corpo di 🔞🛢️",
        "ha fatto fare i salti mortali sul materasso a 🔞🏎️",
        "ha fatto gridare il nome di tutti i santi del calendario a 🔞📝",
        "ha fatto sudare sette camicie (e perso tutti i vestiti) con 🔞💦",
    ],
    paccasulculo: [
        "ha dato una pacca talmente allegra da far applaudire anche le sedie 🍑",
        "ha lanciato una pacca con precisione da chirurgo del caos 🍑✨",
        "ha dato una pacca così teatrale che è partita la sigla finale 🎬🍑",
        "ha fatto una pacca veloce e poi ha fatto finta di niente 😇🍑",
        "ha consegnato una pacca premium, con effetto sonoro incluso 🔊🍑",
        "ha dato una pacca che ha migliorato il morale del gruppo del 3% 📈🍑",
        "ha fatto una pacca da manuale, voto dieci e lode 🏆🍑",
        "ha dato una pacca con l'eleganza di un ballerino/a di salsa 💃🍑",
        "ha sferrato una pacca amichevole a velocità supersonica 💨🍑",
        "ha dato una pacca e ha lasciato soltanto vibes positive ✨🍑",
        "ha fatto una pacca così precisa da meritare il replay VAR 📺🍑",
        "ha dato una pacca con la delicatezza di un peluche impazzito 🧸🍑",
        "ha lasciato una pacca firmata, timbrata e approvata ✅🍑",
        "ha dato una pacca da protagonista assoluto/a della scena 🌟🍑",
        "ha fatto una pacca e il gruppo ha chiesto il bis 👏🍑",
        "ha regalato una pacca di incoraggiamento, versione deluxe 🎁🍑",
    ],
    uccidi: [
        "ha sconfitto in un duello immaginario",
        "ha battuto in una sfida a Mario Kart contro",
        "ha mandato KO a colpi di cuscino",
        "ha vinto una battaglia di meme contro",
        "ha superato in una gara di karaoke contro",
        "ha messo in fuga con una combo da videogame",
        "ha battuto in un duello di sguardi contro",
        "ha conquistato il titolo di campione contro",
        "ha fatto perdere una partita a sasso-carta-forbici a",
        "ha dominato in una battaglia di GIF contro",
        "ha chiuso il match con una mossa da cartone animato contro",
        "ha vinto il torneo immaginario contro",
        "ha ottenuto una vittoria epica contro",
        "ha fatto ragequitare per finta",
        "ha strappato una vittoria all'ultimo secondo contro",
        "ha battuto con una mossa segreta da gamer contro",
    ],
    abbraccia: [
        "ha stretto in un abbraccio da otto secondi esatti",
        "ha dato un abbraccio così caldo da sciogliere il ghiaccio",
        "ha avvolto in un abbraccio morbido come una coperta",
        "ha regalato un abbraccio con bonus serenità",
        "ha dato un abbraccio che ricarica la batteria sociale",
        "ha abbracciato con tutta l'energia di un golden retriever",
        "ha lasciato un abbraccio grande formato",
        "ha dato un abbraccio con modalità coccola attivata",
        "ha stretto forte forte in un abbraccio",
        "ha mandato un abbraccio con consegna immediata",
        "ha dato un abbraccio che merita una colonna sonora",
        "ha avviato una terapia a base di abbracci con",
        "ha regalato un abbraccio certificato anti-giornata-no",
        "ha abbracciato con delicatezza e mille stelline",
        "ha dato un abbraccio da copertina",
        "ha condiviso un abbraccio pieno di bene",
    ],
    sposa: [
        "ha tirato fuori un anello brillante e ha fatto la proposta a",
        "ha chiesto di sposarlo/a sotto una pioggia di coriandoli a",
        "ha organizzato una proposta con orchestra immaginaria per",
        "ha aperto una scatolina misteriosa davanti a",
        "ha preparato una proposta da film romantico per",
        "ha promesso pizza, serie TV e felicità a",
        "ha chiesto un sì con un cartello pieno di cuori a",
        "ha fatto una proposta con effetti speciali per",
        "ha lanciato il bouquet e ha guardato negli occhi",
        "ha scritto una lettera dolcissima per",
        "ha prenotato una luna di miele immaginaria con",
        "ha chiesto di diventare compagni/e di avventure a",
        "ha preparato una proposta con 100 emoji per",
        "ha fatto partire la musica romantica e ha chiesto a",
        "ha scelto il momento perfetto per fare la proposta a",
        "ha promesso di dividere anche l'ultima fetta di pizza con",
    ],
    caos: [
        "ha fatto salire troppo la temperatura delle vibes con",
        "ha acceso una scena super movimentata insieme a",
        "ha trasformato la chat in un romanzo rosa con",
        "ha creato un caos romantico fuori scala con",
        "ha fatto partire una telenovela piena di emoji con",
        "ha lasciato tutti senza parole dopo una serata di vibes con",
        "ha reso la situazione decisamente piccante con",
        "ha trasformato il gruppo in una commedia romantica con",
        "ha alzato il livello del drama romantico con",
        "ha fatto saltare il termostato delle emozioni con",
        "ha creato un momento da film vietato ai dettagli con",
        "ha portato la chat in modalità 'troppo entusiasmo' con",
        "ha acceso fuochi d'artificio immaginari con",
        "ha fatto perdere la calma, ma con stile, a",
        "ha reso tutto più caotico e romantico con",
        "ha chiuso la scena con un sorriso malizioso verso",
    ],
    verita: [
        "Qual è la figuraccia più grande che hai fatto in pubblico?",
        "Hai mai rubato qualcosa, anche di piccolo?",
        "Qual è l'ultima persona di questo gruppo che hai stalkerato sui social?",
        "Qual è il tuo segreto più inconfessabile?",
        "Hai mai finto di stare male per evitare un impegno?",
        "Cosa pensi veramente del creatore di questo bot?",
        "Qual è la bugia più grossa che hai mai raccontato a un tuo ex?",
        "Hai mai spiato il telefono di qualcuno di nascosto?",
        "Quale membro del gruppo butteresti giù dalla torre?",
    ],
    obbligo: [
        "Manda l'ultima foto che hai salvato nella galleria, qualunque essa sia.",
        "Scrivi 'Ti amo' al primo contatto della rubrica e manda lo screen.",
        "Imposta come immagine di profilo una foto imbarazzante scelta dal gruppo per 24h.",
        "Invia un audio in cui canti la sigla di Peppa Pig a squarciagola.",
        "Scrivi a tua madre/tuo padre che hai deciso di scappare in Messico.",
        "Manda lo screen della tua cronologia di ricerca (no modalità incognito!).",
        "Registra un audio di 30 secondi in cui fai il verso di una gallina disperata.",
        "Dichiara il tuo amore a caso a una persona in questo gruppo.",
    ],
    cazzo: [
        "Piccolo ma funzionale, dicono",
        "Sembra un microscopio, ma fa il suo dovere",
        "È una lancia, attento a non ferire nessuno",
        "Le dimensioni non contano, conta come lo usi",
        "Purtroppo non è un'arma di distruzione di massa",
    ],
    rissa: [
        "X ha colpito Y con una sedia di plastica!",
        "Y ha schivato il colpo e ha dato un pugno a X!",
        "X sta vincendo, ma Y ha tirato fuori un coltello!",
        "Entrambi sono finiti a terra, un pareggio pietoso",
        "Y ha vinto la rissa grazie a una mossa a sorpresa!",
    ],
    gossip: [
        "[sender] è stato visto baciare un manichino al centro commerciale",
        "[sender] ha comprato una bambola gonfiabile",
        "[sender] scrive poesie d'amore ai muri",
        "[sender] ha segretamente una cotta per un bot di Telegram",
        "[sender] spia i vicini con il binocolo",
    ],
    palo: [
        "Il palo è arrivato, e fa male pure a guardarlo",
        "Ti ha rifiutato senza nemmeno guardarti negli occhi",
        "Il tuo amore non è corrisposto, torna a giocare",
        "Ti ha risposto 'sei solo un amico'",
        "Meglio lasciar perdere, il palo è epico",
    ],
    scusa: [
        "Ti chiedo perdono, ho esagerato",
        "Scusami, non volevo, ero sotto effetto di troppi caffè",
        "Perdonami, sono stato un idiota",
        "Ti prego, accetta le mie scuse, non succederà più",
        "Mi metto in ginocchio, perdonami!",
    ],
    drink: [
        "Cocktail alla fragola con ombrellino",
        "Birra gelata direttamente dal frigo",
        "Un buon bicchiere di vino rosso locale",
        "Coca cola ghiacciata",
        "Whisky liscio, per dimenticare",
    ],
    oroscopo: [
        "Oggi la fortuna è dalla tua parte, ma occhio al portafoglio",
        "Ti aspetta un incontro inaspettato, probabilmente un corriere",
        "La luna dice che dovresti riposare di più",
        "Evita di litigare, specialmente con il bot",
        "Un successo improvviso ti aspetta, forse una notifica",
    ],
    sclero: [
        "BASTA! Non ne posso più di questo gruppo!",
        "Vado a vivere in una grotta senza Wi-Fi, addio!",
        "Mi licenzio, cercatevi un altro bot",
        "Il mio processore sta bruciando per le vostre cavolate",
        "A volte vorrei solo spegnermi e non riaccendermi più",
    ],
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const COPY = {
    slap: [
        'ha tirato uno schiaffo che si è sentito anche nel gruppo vicino.',
        'ha dato una sberla con una sicurezza assurda.',
        'ha lasciato il segno. Letteralmente.',
        'ha tirato uno schiaffo da scena finale di una serie.',
        'ha dato un ceffone: silenzio totale per tre secondi.',
    ],
    insults: [
        'Hai un talento raro: complicare anche le cose facili.',
        'Non sei in ritardo, vivi proprio su un altro fuso orario.',
        'Hai portato il caos, come sempre. Iconico però.',
        'Sei la prova che si può parlare tanto e dire poco.',
        'Oggi non ci sei proprio con la testa, ma va bene così.',
    ],
    curves: [
        'Voto del bot: 8/10. Oggi si vola.',
        'Voto del bot: 6/10. Onesto, ci sta.',
        'Voto del bot: 10/10. Main character energy.',
        'Voto del bot: 7/10. Niente male dai.',
        'Voto del bot: 9/10. Qui c’è qualità.',
    ],
    kiss: [
        'ha dato un bacio a',
        'ha rubato un bacino a',
        'ha baciato con molta sicurezza',
        'ha lasciato un bacio sulla guancia di',
        'ha fatto partire un momento super romantico con',
    ],
    adults: [
        'ha avuto una serata decisamente movimentata con',
        'ha acceso un po’ troppo le vibes con',
        'ha creato caos romantico insieme a',
        'ha fatto perdere la calma a',
    ],
};

const formatMoney = (value) => `${Math.max(0, Math.floor(Number(value) || 0))}€`;

// ── TRIS — RENDER BOARD ──────────────────────────────────────────────────
//  Converte l'array board in una stringa con emoji.
//  Le celle vuote mostrano il numero (1️⃣-9️⃣), quelle occupate ❌ o ⭕.
const getContextInfo = (message = {}) => {
    // Cerca contextInfo in tutti i tipi di messaggio possibili.
    // Il viewOnce reply puo' arrivare come qualsiasi tipo wrapper.
    for (const val of Object.values(message)) {
        if (val && typeof val === 'object' && val.contextInfo) {
            return val.contextInfo;
        }
    }
    return {};
};

const getQuotedKey = (chatId, contextInfo) => ({
    remoteJid: chatId,
    fromMe   : false,
    id       : contextInfo.stanzaId,
    participant: contextInfo.participant,
});

// ── RIAVVIO AUTOMATICO ─────────────────────────────────────────────────────
// Se start.sh ha segnato una conferma di riavvio, la si invia all'avvio
const RESTART_MSG_FILE = path.join(__dirname, '.restart-msg.json');

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

async function startBot() {
    console.log('[BOT] Avvio in corso...');

    const AUTH_DIR_PATH = path.join(__dirname, 'auth_info_baileys');
    const AUTH_INVALIDATED_FLAG = path.join(__dirname, '.auth_invalidated');

    // Se la sessione precedente è stata invalidata (loggedOut), salta il ripristino da Gist
    if (fs.existsSync(AUTH_INVALIDATED_FLAG)) {
        fs.rmSync(AUTH_INVALIDATED_FLAG, { force: true });
        console.log('[AUTH] Sessione precedente scaduta. Avvio fresco per nuovo QR...');
    } else if (!fs.existsSync(AUTH_DIR_PATH)) {
        const authData = await gistBackup.downloadAuth();
        if (authData) {
            fs.mkdirSync(AUTH_DIR_PATH, { recursive: true });
            for (const [name, content] of Object.entries(authData)) {
                fs.writeFileSync(path.join(AUTH_DIR_PATH, name), content, 'utf-8');
            }
            console.log('[AUTH] Sessione ripristinata da backup.');
        }
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    let waVersion;
    try {
        const ver = await fetchLatestBaileysVersion();
        waVersion = ver.version;
        console.log(`[BOT] Versione WhatsApp Web: ${waVersion.join('.')}`);
    } catch (_) {
        waVersion = [2, 2412, 51];
    }

    const sock = makeWASocket({
        auth                : state,
        printQRInTerminal   : true,
        // Livello info scritto su file (logs/bot.log) tramite sink custom:
        // sul terminale resta silenzioso come prima.
        logger              : pino({ level: 'info' }, botLogger.makeBaileysSink()),
        version             : waVersion,
        connectTimeoutMs    : 120000,
        keepAliveIntervalMs : 30000,
        markOnlineOnConnect : false,
        syncFullHistory     : false,
        generateHighQualityLinkPreview: false,
        browser             : ['ScopaAmico Bot', 'Chrome', '120.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('[BOT] QR CODE generato. Scansiona con WhatsApp.');
            qrcode.generate(qr, { small: true });
            reconnectAttempts = 0;
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const errorMsg = lastDisconnect?.error?.message || 'sconosciuto';
            console.log(`[BOT] Disconnesso (${statusCode || '?'}): ${errorMsg}`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('[BOT] Sessione scaduta. Pulisco auth (locale + Gist) e riavvio per nuovo QR...');
                fs.writeFileSync(AUTH_INVALIDATED_FLAG, 'true', 'utf-8');
                fs.rmSync(AUTH_DIR_PATH, { recursive: true, force: true });
                await gistBackup.clearAuth().catch(() => {});
                reconnectAttempts = 0;
                setTimeout(startBot, 3000);
                return;
            } else if (statusCode === DisconnectReason.restartRequired) {
                console.log('[BOT] Riavvio richiesto da WhatsApp.');
                startBot();
            } else {
                reconnectAttempts++;
                if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                    console.log(`[BOT] Troppi tentativi (${MAX_RECONNECT_ATTEMPTS}). Aspetto 30s prima di riprovare...`);
                    reconnectAttempts = 0;
                    setTimeout(startBot, 30000);
                } else {
                    const delay = Math.min(3000 * reconnectAttempts, 15000);
                    console.log(`[BOT] Riconnessione tra ${delay / 1000}s (tentativo ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                    setTimeout(startBot, delay);
                }
            }
        } else if (connection === 'open') {
            botStartTime = Math.floor(Date.now() / 1000);
            reconnectAttempts = 0;
            console.log('[BOT] Connesso e operativo.');

            // Conferma di riavvio dopo un aggiornamento
            try {
                if (fs.existsSync(RESTART_MSG_FILE)) {
                    const restartData = JSON.parse(fs.readFileSync(RESTART_MSG_FILE, 'utf-8'));
                    fs.rmSync(RESTART_MSG_FILE, { force: true });
                    if (restartData?.from) {
                        const text = restartData.message || '🔄 Bot aggiornato e riavviato correttamente.';
                        await sock.sendMessage(restartData.from, { text }).catch(() => {});
                    }
                }
            } catch (_) {}

            // Backup auth al Gist ogni 5 minuti
            setInterval(async () => {
                if (!fs.existsSync(AUTH_DIR_PATH)) return;
                const authFiles = {};
                const entries = fs.readdirSync(AUTH_DIR_PATH, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isFile()) {
                        authFiles[entry.name] = fs.readFileSync(path.join(AUTH_DIR_PATH, entry.name), 'utf-8');
                    }
                }
                await gistBackup.uploadAuth(authFiles);
            }, 300000);

            // Scrittura periodica del database se ci sono modifiche pendenti
            setInterval(() => {
                if (_dbDirty) {
                    _dbDirty = false;
                    writeDBFile();
                }
            }, 30000);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        // Ignora messaggi vecchi (inviati prima che il bot si connettesse)
        const msgTimestamp = msg.messageTimestamp || 0;
        if (msgTimestamp && msgTimestamp < botStartTime) {
            console.log(`[FILTER] Ignorato messaggio vecchio di ${Math.floor((botStartTime - msgTimestamp) / 60)} min fa`);
            return;
        }

        try {
            if (msg.message?.interactiveResponseMessage || msg.message?.buttonsResponseMessage || msg.message?.templateButtonReplyMessage) {
                console.log('[RECV-FULL]', JSON.stringify(msg.message).slice(0, 2000));
            }
        } catch (_) {}

        const from     = msg.key.remoteJid;
        const isGroup  = from?.endsWith('@g.us') === true;
        const sender   = isGroup ? msg.key.participant : from;
        const pushName = msg.pushName || 'Utente';
        

        const isOwner  = isOwnerJid(sender, sock, db);

        if (isGroup && sender) {
            try {
                const userData = getUser(sender, from);
                userData.msgCount = (userData.msgCount || 0) + 1;
                _dbDirty = true; // scrittura ritardata: si salva ogni 30s max
            } catch (_) {}
        }

        let body = extractBody(msg);

        // [DEBUG PULSANTI] stampa la struttura del messaggio per diagnosticare
        // perché i comandi dai pulsanti non partono.
        if (msg.message?.interactiveResponseMessage || msg.message?.buttonsResponseMessage || msg.message?.templateButtonReplyMessage) {
            try {
                const t = msg.message?.templateButtonReplyMessage;
                const interactive = msg.message?.interactiveResponseMessage;
                console.log('[BTN-DEBUG] keys:', Object.keys(msg.message).join(','));
                console.log('[BTN-DEBUG] templateButtonReplyMessage:', JSON.stringify(t));
                console.log('[BTN-DEBUG] interactiveResponseMessage:', JSON.stringify(interactive));
                console.log('[BTN-DEBUG] body estratto:', JSON.stringify(body));
            } catch (_) {}
        }

        // True quando il comando arriva da un pulsante premuto: i comandi
        // possono usarlo per saltare il cooldown (es. "Scava ancora").
        let fromButton = false;

        // ── RISPOSTA PULSANTI (native flow) ──────────────────────────────
        // Quando l'utente preme un pulsante WhatsApp manda una
        // interactiveResponseMessage. L'id del pulsante arriva dentro
        // paramsJson, ma in FORMATI diversi a seconda della versione/app:
        //  - '{"id":"scava"}'                            → usa l'id
        //  - '{"id":"scava","display_text":"⛏️ Scava ancora"}'
        //  - '{"response":"Scava ancora"}'               → testo etichetta
        //  - 'scava' oppure 'Scava ancora'               → stringa pura
        // Il resolver prova ogni campo e, se contiene un'etichetta di un
        // pulsante appena inviato in questa chat, la mappa al comando vero.
        const btnCmd = (() => {
            try {
                // Risposta ai pulsanti template: WhatsApp la invia come
                // templateButtonReplyMessage con selectedId / selectedDisplayText.
                const tmpl = msg.message?.templateButtonReplyMessage;
                if (tmpl) {
                    const c = tmpl.selectedId || tmpl.selectedDisplayText;
                    if (c) {
                        const entry = buttonRegistry.get(`${from}|${normalizeBtnText(String(c))}`);
                        if (entry && Date.now() - entry.ts < BTN_REGISTER_TTL) return entry.id;
                        return stripEmoji(String(c)).trim() || null;
                    }
                }

                const btnResp = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage;
                if (!btnResp?.paramsJson) return null;
                const norm = String(btnResp.paramsJson).trim();
                if (!norm || norm === '{}') return null;

                let candidates = [];
                if (norm.startsWith('{')) {
                    const parsed = JSON.parse(norm);
                    for (const k of ['id', 'response_id', 'command', 'stringParam', 'display_text', 'response']) {
                        const v = parsed?.[k];
                        if (v) candidates.push(String(v).trim());
                    }
                } else {
                    candidates.push(norm);
                }
                if (!candidates.length) return null;

                // Se il candidato è un'etichetta appena inviata in questa chat,
                // usiamo il comando associato (WhatsApp a volte manda il testo).
                for (const c of candidates) {
                    const entry = buttonRegistry.get(`${from}|${normalizeBtnText(c)}`);
                    if (entry && Date.now() - entry.ts < BTN_REGISTER_TTL) return entry.id;
                }
                // Altrimenti il primo candidato È il comando/id del pulsante.
                // Togliamo emoji/spazi iniziali (es. "⛏️ .dadi" -> ".dadi"),
                // così il comando viene riconosciuto anche senza registry.
                return stripEmoji(String(candidates[0] || '')).trim() || null;
            } catch (_) {
                return null;
            }
        })();

        // ── PULSANTE/ETICHETTA COME TESTO ─────────────────────────────────
        // WhatsApp a volte NON manda la interactiveResponseMessage: inoltra
        // semplicemente l'etichetta del pulsante come testo citando il
        // messaggio del bot, es. "🔛 .accendi" oppure "⛏️ Scava ancora".
        // Togliamo emoji/spazi iniziali e poi:
        //  - se inizia col punto è già un comando (es. ".scava");
        //  - altrimenti cerchiamo l'etichetta nel registro della chat.
        if (btnCmd) {
            fromButton = true;
            body = '.' + stripEmoji(String(btnCmd)).replace(/^\./, '').trim();
        } else if (body && !body.startsWith('.')) {
            const stripped = stripEmoji(body).trim();
            if (stripped) {
                const entry = buttonRegistry.get(`${from}|${normalizeBtnText(stripped)}`);
                if (entry && Date.now() - entry.ts < BTN_REGISTER_TTL) {
                    fromButton = true;
                    body = '.' + String(entry.id).replace(/^\./, '').trim();
                }
                // Nessun fallback: i comandi richiedono sempre il ".".
            }
        }

        if (msg.message?.interactiveResponseMessage || msg.message?.buttonsResponseMessage || msg.message?.templateButtonReplyMessage) {
            console.log('[BTN-DEBUG] body finale:', JSON.stringify(body), '| fromButton:', fromButton);
        }

        // ── MUTE: elimina i messaggi degli utenti silenziati ──────────────
        try {
            const senderData = getUser(sender, from);
            if (senderData.isMuted && isGroup) {
                try { await sock.sendMessage(from, { delete: msg.key }); } catch (_) {}
                return;
            }
        } catch (_) {}

        // ── ANTILINK MIDDLEWARE ───────────────────────────────────────────
        //
        //  Logica:
        //  1. Funziona solo nei gruppi (non in chat private).
        //  2. Legge la config del gruppo corrente (remoteJid = `from`).
        //  3. Per ogni piattaforma con filtro attivo, verifica se il testo
        //     del messaggio (incluso il testo dei sondaggi) contiene un link.
        //  4. Se il mittente NON è admin, elimina il messaggio e dà 1 avviso
        //     progressivo; al 3° avviso viene rimosso con i motivi ricevuti.
        //  5. Gli admin sono esentati: possono postare link liberamente.
        //  6. L'Owner è sempre esente, così come la whitelist antinuke.
        //
        const linkBody = (body || '') + ' ' + extractPollText(msg);
        const anCfg = getAntinukeGroup(db, from);
        const anEnabled = Boolean(anCfg.enabled);
        const anWl = anEnabled && isAntinukeWhitelisted(anCfg, sender);
        let warnedForMsg = false; // evita doppi avvisi sullo stesso messaggio
        if (isGroup && linkBody) {
            try {
                const antilinkConfig = getAntilinkGroup(from);
                // Determina se almeno un filtro è attivo per questo gruppo
                const hasActiveFilter = Object.values(antilinkConfig).some(Boolean);

                if (hasActiveFilter && !anWl) {
                    // Scorri le piattaforme nell'ordine definito in ANTILINK_PLATFORMS
                    for (const [platform, regex] of Object.entries(ANTILINK_PLATFORMS)) {
                        if (!antilinkConfig[platform]) continue; // filtro disattivo: salta
                        if (!regex.test(linkBody)) continue;     // nessun match: salta

                        // Trovato un link vietato — controlla se il mittente è esente
                        const isOwnerCheck = isOwnerJid(sender, sock, db);
                        if (isOwnerCheck) break; // owner: lascia passare tutto

                        // Recupera lo stato admin del mittente per questo gruppo
                        let senderIsAdmin = false;
                        try {
                            const { isSenderAdmin: adminCheck } = await getGroupAdminState(
                                sock, from, [sender]
                            );
                            senderIsAdmin = adminCheck;
                        } catch (_) {}

                        if (senderIsAdmin) break; // admin: esente

                        // Utente normale con link vietato → elimina + 1 avviso progressivo
                        try {
                            await sock.sendMessage(from, { delete: msg.key });
                            if (!warnedForMsg) {
                                warnedForMsg = true;
                                await applyWarn(sock, from, sender, `Link *${platform}* inviato`);
                            }
                        } catch (delErr) {
                            // Se il bot non è admin, non può eliminare — logga senza crashare
                            console.warn(`[ANTILINK] Impossibile eliminare il msg di ${sender}: ${delErr.message}`);
                        }
                        break; // Un solo avviso anche se matchano più piattaforme
                    }
                }
            } catch (antilinkErr) {
                // Errore nel middleware antilink: non bloccare il flusso principale
                console.error('[ANTILINK] Errore middleware:', antilinkErr.message);
            }
        }

        // ── ANTINUKE MIDDLEWARE (messaggi) ─────────────────────────────────
        //
        //  Controlli a livello di messaggio attivi quando db._antinuke[from]
        //  è abilitato. Qui gestiamo:
        //   - antilink:  blocca TUTTI i link (qualsiasi piattaforma)
        //   - antipoll:  elimina qualsiasi sondaggio
        //   - antitagall: elimina @all / tag di massa
        //  Owner, admin e whitelist sono sempre esenti.
        //
        if (isGroup && anEnabled && !anWl) {
            try {
                // Verifica admin del mittente (una sola chiamata per questo blocco)
                let senderIsAdmin = false;
                try {
                    const { isSenderAdmin: adminCheck } = await getGroupAdminState(sock, from, [sender]);
                    senderIsAdmin = adminCheck;
                } catch (_) {}
                const anIsOwner = isOwnerJid(sender, sock, db);
                if (!anIsOwner && !senderIsAdmin) {
                    // 1) ANTILINK antinuke: blocca qualunque link
                    if (anCfg.controls.antilink && linkBody && !warnedForMsg) {
                        for (const [platform, regex] of Object.entries(ANTILINK_PLATFORMS)) {
                            if (regex.test(linkBody)) {
                                try {
                                    await sock.sendMessage(from, { delete: msg.key });
                                    warnedForMsg = true;
                                    await applyWarn(sock, from, sender, `Link *${platform}* (antinuke)`);
                                } catch (delErr) {
                                    console.warn(`[ANTINUKE] Impossibile eliminare il msg di ${sender}: ${delErr.message}`);
                                }
                                break;
                            }
                        }
                    }
                    // 2) ANTIPOLL: elimina qualsiasi sondaggio
                    if (anCfg.controls.antipoll && msg.message?.pollCreationMessage && !warnedForMsg) {
                        try {
                            await sock.sendMessage(from, { delete: msg.key });
                            warnedForMsg = true;
                            await applyWarn(sock, from, sender, 'Sondaggio inviato');
                        } catch (delErr) {
                            console.warn(`[ANTINUKE] Impossibile eliminare il sondaggio di ${sender}: ${delErr.message}`);
                        }
                    }
                    // 3) ANTITAGALL: elimina tag di massa (@all / tanti mention)
                    if (anCfg.controls.antitagall && body && !warnedForMsg) {
                        const lower = body.toLowerCase();
                        const isTagAll = /@all|@everyone|@tutti|@membri|@gruppo/i.test(lower);
                        const contextInfoLocal = getContextInfo(msg.message);
                        const mentionCount = (contextInfoLocal?.mentionedJid || []).length;
                        if (isTagAll || mentionCount >= 5) {
                            try {
                                await sock.sendMessage(from, { delete: msg.key });
                                warnedForMsg = true;
                                await applyWarn(sock, from, sender, 'Tag di massa (@all)');
                            } catch (delErr) {
                                console.warn(`[ANTINUKE] Impossibile eliminare il tagall di ${sender}: ${delErr.message}`);
                            }
                        }
                    }
                }
            } catch (anErr) {
                console.error('[ANTINUKE] Errore middleware messaggi:', anErr.message);
            }
        }

        // ── ANTI-FLOOD ────────────────────────────────────────────────────
        if (isGroup && sender && body && !body.startsWith('.')) {
            try {
                if (checkFlood(sender)) {
                    const uData = getUser(sender, from);
                    uData.isMuted = true;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `⛔ *ANTI-FLOOD*\n\n@${sender.split('@')[0]} troppi messaggi! Sei mutato 1 minuto. Rilassati un attimo 🙄`,
                        mentions: [sender],
                    });
                    setTimeout(() => {
                        const fresh = getUser(sender, from);
                        fresh.isMuted = false;
                        saveDB();
                    }, 60000);
                }
            } catch (_) {}
        }

        // ── BESTEMMIOMETRO (per-gruppo on/off) ──────────────────────────────
        const bestCfg = db._bestemmiometro?.[from];
        if (bestCfg !== false && isGroup && body && !body.startsWith('.') && bestemmiometro.checkText(body)) {
            try {
                await sock.sendMessage(from, {
                    text: `🤬 *BESTEMMIOMETRO* 🚨\n\n@${sender.split('@')[0]}: ${bestemmiometro.getReaction()}`,
                    mentions: [sender],
                });
            } catch (_) {}
        }

        // ── ANTIFLAME ──────────────────────────────────────────────────────
        // Ottimizzazione: groupMetadata (API call) viene fetchato SOLO se
        // antiflame è attivo per questo gruppo (il caso più comune è spento).
        if (db._antiflame?.[from]?.enabled && isGroup && body && !body.startsWith('.') && !isOwner) {
            try {
                const meta = await getCachedGroupMeta(sock, from);
                const admins = (meta?.participants || []).filter(p => ['admin','superadmin'].includes(p.admin));
                const isAdm = admins.some(p => sameJid(p.id || p.jid, sender));
                if (!isAdm) {
                    const FLAME_WORDS = ['ucciditi','ammazzati','fucilati','impiccati','impiccat','sgozzati','sgozzat','suicidati','suicidio','ammazz','fucil','buttati','buttat','lasciati','lasciat','muori','crepa','stermina','stermin'];
                    const lower = body.toLowerCase();
                    const hasFlame = FLAME_WORDS.some(w => {
                        const regex = new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                        return regex.test(lower);
                    });
                    if (hasFlame) {
                        try {
                            await sock.sendMessage(from, { delete: msg.key });
                            await sock.sendMessage(from, {
                                text: `🔥 *ANTIFLAME* 🚨\n\n@${sender.split('@')[0]} messaggio rimosso (contiene parole pesanti).`,
                                mentions: [sender],
                            });
                        } catch (_) {}
                    }
                }
            } catch (_) {}
        }

        // ── BOUNTY SPAWN ──────────────────────────────────────────────────
        // Ottimizzazione: la probabilità di spawn viene verificata PRIMA
        // (senza rete): solo 1 messaggio su 20 circa fa groupMetadata.
        if (isGroup && body && !body.startsWith('.') && from.endsWith('@g.us') && shouldTrySpawnBounty(from)) {
            try {
                const metadata = await getCachedGroupMeta(sock, from);
                const members = metadata?.participants || [];
                if (members.length > 1) {
                    const bounty = trySpawnBounty(from, members);
                    if (bounty) {
                        const targetShort = bounty.target.split('@')[0];
                        await sock.sendMessage(from, {
                            text: `💰 *TAGLIA ATTIVA!* 💰\n\nÈ stata messa una taglia di *${bounty.reward}€* su @${targetShort}!\n\n.usare .colpisci per provare a incassarla! ⚔️`,
                            mentions: [bounty.target],
                        });
                    }
                }
            } catch (_) {}
        }

        // ── ENIGMA: risposte via testo libero ────────────────────────────
        if (!body.startsWith('.') && db[from]?.enigma?.active) {
            try {
                const eg = db[from].enigma;
                const lower = body.toLowerCase().trim();
                const answerNorm = String(eg.answer || '').toLowerCase().trim();
                // accetta anche "il fiume" o "un ago" senza articolo
                const stripped = lower.replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+/, '').trim();
                const strippedAns = answerNorm.replace(/^(il |lo |la |i |gli |le |un |uno |una )/, '').trim();
                if (lower === answerNorm || (stripped && stripped === strippedAns)) {
                    eg.active = false;
                    const reward = 50;
                    const uDB = getUser(sender, from);
                    uDB.money += reward;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `✅ *ENIGMA RISOLTO!* 🧠\n\n@${sender.split('@')[0]} ha risposto:\n*${eg.answer}*\n\n+${reward}€ 💰`,
                        mentions: [sender],
                    });
                }
            } catch (_) {}
        }

        // ── QUIZ: risposte via lettera (A/B/C/D) o testo ────────────────
        if (!body.startsWith('.') && db[from]?.quizGame?.active) {
            try {
                const qg = db[from].quizGame;
                const optLetters = ['A','B','C','D'];
                const bodyUpper = body.toUpperCase().trim();
                const guessedLetter = optLetters.indexOf(bodyUpper);
                const guessedCorrect = guessedLetter !== -1
                    ? guessedLetter === qg.correctIndex
                    : body.toLowerCase().trim() === qg.correctAnswer.toLowerCase();

                if (guessedCorrect) {
                    qg.active = false;
                    const reward = 100;
                    const uDB = getUser(sender, from);
                    uDB.money += reward;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `✅ *RISPOSTA ESATTA!* 🎉\n\n@${sender.split('@')[0]} ha risposto correttamente!\n+${reward}€ 💰`,
                        mentions: [sender],
                    });
                } else if (guessedLetter !== -1) {
                    await sock.sendMessage(from, {
                        text: `❌ @${sender.split('@')[0]}, risposta sbagliata! Riprova.`,
                        mentions: [sender],
                    });
                }
            } catch (_) {}
        }

        // ── BANDIERA: risposte con A/B/C/D ──────────────────────────────
        if (!body.startsWith('.') && db[from]?.flagGame?.active) {
            try {
                const fg = db[from].flagGame;
                const optLetters = ['A','B','C','D'];
                const guessedLetter = optLetters.indexOf(body.toUpperCase().trim());
                if (guessedLetter === -1) {}
                else if (guessedLetter === fg.correctIndex) {
                    fg.active = false;
                    const reward = 150;
                    const uDB = getUser(sender, from);
                    uDB.money += reward;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🏆 *BANDIERA INDOVINATA!* 🌍\n\n@${sender.split('@')[0]} ha riconosciuto la bandiera!\n+${reward}€ 💰`,
                        mentions: [sender],
                    });
                } else {
                    await sock.sendMessage(from, {
                        text: `❌ @${sender.split('@')[0]}, risposta sbagliata!`,
                        mentions: [sender],
                    });
                }
            } catch (_) {}
        }

        // ── REAZIONE: risposte GO ───────────────────────────────────────
        if (!body.startsWith('.') && db[from]?.reactionGame?.active) {
            try {
                const rg = db[from].reactionGame;
                if (rg.phase === 'go' && /^\s*go\s*$/i.test(body)) {
                    rg.active = false;
                    saveDB();
                    if (Date.now() <= rg.deadline) {
                        const uDB = getUser(sender, from);
                        uDB.money += 50;
                        saveDB();
                        await sock.sendMessage(from, {
                            text: `⚡ *VELOCISSIMO!* @${sender.split('@')[0]} ha reagito in tempo!\n+50€ 💰`,
                            mentions: [sender],
                        });
                    } else {
                        await sock.sendMessage(from, {
                            text: `🐌 @${sender.split('@')[0]}, troppo tardi! 😴`,
                            mentions: [sender],
                        });
                    }
                }
            } catch (_) {}
        }

        // ── PAROLA: indovina la parola ──────────────────────────────────
        if (!body.startsWith('.') && db[from]?.wordGame?.active) {
            try {
                const wg = db[from].wordGame;
                if (Date.now() - wg.timestamp > 90000) {
                    wg.active = false;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `⏰ Tempo scaduto! La parola era *${wg.word}*.`,
                    });
                    return;
                }
                const guess = body.trim().toLowerCase().replace(/[^a-z]/g, '');
                if (!guess) return;

                // Indovinata con la parola intera
                if (guess === wg.word) {
                    wg.active = false;
                    saveDB();
                    const uDB = getUser(sender, from);
                    uDB.money += 100;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🎉 *PAROLA INDOVINATA!* @${sender.split('@')[0]} ha trovato la parola *${wg.word}*!\n+100€ 💰`,
                        mentions: [sender],
                    });
                    return;
                }

                if (guess.length === 1) {
                    if (wg.guessed.includes(guess)) return;
                    wg.guessed.push(guess);
                    if (!wg.word.includes(guess)) {
                        wg.wrong++;
                        if (wg.wrong >= 6) {
                            wg.active = false;
                            saveDB();
                            await sock.sendMessage(from, {
                                text: `💀 *GAME OVER!* La parola era *${wg.word}*.`,
                            });
                            return;
                        }
                    }
                    const masked = wg.word.split('').map(ch => wg.guessed.includes(ch) ? ch : ' _ ').join('');
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🧩 ${masked}\n\n❌ Errori: *${wg.wrong}/6*\nLettera scritta: *${guess}*`,
                    });
                }
            } catch (_) {}
        }

        // ── MEMORIA: ripeti la sequenza ──────────────────────────────────
        if (!body.startsWith('.') && db[from]?.memGame?.active) {
            try {
                const mg = db[from].memGame;
                if (Date.now() - mg.timestamp > 60000) {
                    mg.active = false;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `⏰ Tempo scaduto! La sequenza era *${mg.sequence.join(' ')}*.`,
                    });
                    return;
                }
                const clean = body.replace(/\s+/g, '').toUpperCase();
                if (!clean || !/^[RGBY]+$/.test(clean)) return;
                if (clean === mg.sequence.join('')) {
                    mg.active = false;
                    saveDB();
                    const uDB = getUser(sender, from);
                    uDB.money += 75;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🧠 *MEMORIA FERREA!* @${sender.split('@')[0]} ha ripetuto la sequenza ${mg.sequence.join(' ')}!\n+75€ 💰`,
                        mentions: [sender],
                    });
                } else {
                    mg.active = false;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `❌ Sequenza sbagliata! Era *${mg.sequence.join(' ')}*.`,
                    });
                }
            } catch (_) {}
        }

        // ── PENDING MP3: risposte si/no (testo o pulsanti native) ────────
        if (db[from]?.pendingMp3) {
            try {
                const mp3 = db[from].pendingMp3;
                const lower = stripEmoji(body || '').replace(/^\.\s*/, '').toLowerCase().trim();
                if ((lower === 'si' || lower === 'sì') && sameJid(sender, mp3.sender)) {
                    delete db[from].pendingMp3;
                    saveDB();
                    await sock.sendMessage(from, {
                        audio: { url: mp3.previewUrl },
                        mimetype: 'audio/mpeg',
                    });
                } else if ((lower === 'no' || lower === 'n') && sameJid(sender, mp3.sender)) {
                    delete db[from].pendingMp3;
                    saveDB();
                    await sock.sendMessage(from, { text: "Ok, niente mp3! 🎵" }, { quoted: msg }).catch(() => {});
                }
            } catch (_) {}
        }

        // ── AFK ────────────────────────────────────────────────────────────
        // Se chi scrive è in AFK, lo togliamo automaticamente al suo ritorno.
        // Se il messaggio menziona qualcuno in AFK, avvisiamo chi scrive.
        if (isGroup && db.afk) {
            try {
                const myAfk = db.afk[sender];
                const isCmd = body.startsWith('.');
                if (myAfk && !isCmd) {
                    delete db.afk[sender];
                    saveDB();
                    const mins = Math.floor((Date.now() - myAfk.ts) / 60000);
                    await sock.sendMessage(from, {
                        text: `👋 *Bentornato* @${sender.split('@')[0]}!\n\nEri via per _${myAfk.reason || 'nessun motivo'}_\n⏱️ AFK per ${mins > 0 ? mins + ' min' : 'meno di un minuto'}.\n\nStato AFK rimosso. ✅`,
                        mentions: [sender],
                    }, { quoted: msg }).catch(() => {});
                }
                // Avvisa chi menziona un utente in AFK.
                const mentioned = getContextInfo(msg.message)?.mentionedJid || [];
                for (const jid of mentioned) {
                    const afkEntry = db.afk[jid];
                    if (afkEntry) {
                        await sock.sendMessage(from, {
                            text: `🌙 *@${jid.split('@')[0]} è AFK*\n\n📝 Motivo: _${(afkEntry.reason || 'nessun motivo').slice(0, 200)}_\n\nNon aspettarti una risposta immediata.`,
                            mentions: [jid],
                        });
                    }
                }
            } catch (_) {}
        }

        if (!body.startsWith('.')) return;

        // ── MODO ADMIN ────────────────────────────────────────────────────
        // Se il gruppo ha .modoadmin attivo, SOLO gli admin possono usare il
        // bot. Un non-admin che invoca un comando riceve una reazione "X"
        // rossa sul suo messaggio e nessuna risposta. (l'owner è esente)
        if (isGroup && db[from]?._modoadmin && !isOwner) {
            try {
                const { isSenderAdmin: sa } = await getGroupAdminState(sock, from, [sender]);
                if (!sa) {
                    sock.sendMessage(from, { react: { key: msg.key, text: '❌' } }).catch(() => {});
                    return;
                }
            } catch (_) {}
        }

        const args      = body.slice(1).trim().split(/\s+/);
        const command   = (args.shift() || '').toLowerCase();
        if (!command) return;
        const textArgs  = args.join(' ');
        const contextInfo = getContextInfo(msg.message);
        const mentioned = contextInfo.mentionedJid || [];
        const isReply   = !!contextInfo.quotedMessage;
        if (isGroup && db[from]?._muted && !isOwner) return;
        if (!isBotActive && !isOwner && command !== 'accendi') return;
        const targetJid = mentioned[0] || contextInfo.participant || null;

        const reply = async (text) => {
            try {
                const clean = String(text ?? '');
                // Pulsante "Ripeti" automatico per ogni comando (tranne quelli
                // pericolosi). Se il testo è troppo lungo o il comando è in
                // NO_REPLAY_BUTTON, invio un semplice messaggio di testo.
                const wantButton = command && !NO_REPLAY_BUTTON.has(command)
                    && clean.length > 0 && clean.length <= 900;
                if (wantButton) {
                    const replayId = `${command}${textArgs ? ' ' + textArgs : ''}`;
                    await sendButtons(sock, from, clean, [
                        { label: `${COMMAND_EMOJIS[command] || '🔁'} Ripeti`, id: replayId },
                    ], msg);
                } else {
                    await sock.sendMessage(from, { text: clean }, { quoted: msg });
                }
            } catch (e) { console.error(`[reply] Errore invio: ${e.message}`); }
        };

        let isBotAdmin    = false;
        let isSenderAdmin = false;

        if (isGroup && ADMIN_COMMANDS.has(command)) {
            try {
                ({ isBotAdmin, isSenderAdmin } = await getGroupAdminState(sock, from, [sender]));
            } catch (error) {
                console.error('[admin] Impossibile leggere i permessi del gruppo:', error.message);
                if (command === 'godmode') return; // godmode resta invisibile
                return reply("╭────〔 ⚠️ ERRORE 〕────╮\n│ Non riesco a verificare i permessi\n│ del gruppo. Riprova tra poco.\n╰──────────────────────╯");
            }
        }

        try {
            const commandModule = commands.get(command);
            if (!commandModule) return;

            await commandModule.run(sock, msg, args, {
                command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned,
                targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply,
                isButton: fromButton,
                setBotActive: (value) => { isBotActive = Boolean(value); },
                services: {
                    AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE,
                    ANTILINK_PLATFORMS, ARRAYS, COPY, axios,
                    crypto, db, downloadContentFromMessage, downloadMediaMessage,
                    execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup,
                    getContextInfo, getCpuUsage, getProcessCpu, getQuotedKey, getSysInfo, getUser, os, path,
                    projectDir: __dirname, randomChoice, randomInt,
                    sameJid, saveDB, setAntilinkPlatform, loadAntilink, saveAntilink, DEFAULT_ANTILINK_GROUP, sharp, webpmux,
                    getWelcomeGroup, setWelcomeGroup,
                    sleep, claimBounty, getBounty, removeBounty, bestemmiometro,
                    sendButtons, editButtons, clearBotCache, ownerNumber, showProgress,
                    lastfm,
                    getAntinukeGroup, isAntinukeWhitelisted, ANTINUKE_CONTROLS,
                    applyWarn, extractPollText, WARN_LIMIT,
                    setNukeActive, isNukeActive,
                },
            });

            // Reazione emoji sul comando (godmode resta invisibile)
            if (command !== 'godmode') {
                const cmdFirst = command.split(/[\s_]/)[0].toLowerCase();
                const emoji = COMMAND_EMOJIS[command] || COMMAND_EMOJIS[cmdFirst];
                if (emoji) {
                    sock.sendMessage(from, { react: { key: msg.key, text: emoji } }).catch(() => {});
                }
            }
        } catch (error) {
            console.error('[handler] Errore critico:', error.message);
            // rate-overlimit: ignora silenziosamente per non spammare
            if (error.data === 429 || error.message === 'rate-overlimit') return;
            await sock.sendMessage(from, { 
                text: `╭────〔 ⚠️ ERRORE DI SISTEMA 〕────╮\n│ Si è verificato un problema:\n│ _${error.message}_\n╰──────────────────────────────────╯`
            }, { quoted: msg }).catch(() => {});
        }
    });

    // ── GROUP PARTICIPANTS UPDATE (WELCOME / GOODBYE) ──────────────────────
    sock.ev.on('group-participants.update', async (update) => {
        console.log('[group-participants.update] Evento ricevuto:', JSON.stringify(update, null, 2));
        try {
            const { id: groupJid, participants, action, author } = update;
            if (!groupJid || !participants || !action) {
                console.log('[group-participants.update] Dati mancanti, skip');
                return;
            }

            // ── ANTINUKE: CONTROLLI PARTECIPANTI ────────────────────────────
            // Reverte le azioni distruttive fatte da chi NON è owner/whitelist/
            // admin (antiadd, antikick, antiadmin). Self-join e self-leave
            // vengono rispettati (non sono "nuke").
            const anCfg = getAntinukeGroup(db, groupJid);
            if (anCfg.enabled) {
                try {
                    const actorJid = author || null;
                    const targetJids = participants
                        .map(p => p?.id || p?.phoneNumber)
                        .filter(Boolean);

                    let actorAllowed = !actorJid; // nessun autore noto: non bloccare
                    if (actorJid) {
                        if (isOwnerJid(actorJid, sock, db) || isAntinukeWhitelisted(anCfg, actorJid)) {
                            actorAllowed = true;
                        } else {
                            try {
                                const meta2 = await getCachedGroupMeta(sock, groupJid);
                                actorAllowed = (meta2?.participants || [])
                                    .some(p => isAdminParticipant(p, actorJid));
                            } catch (_) { actorAllowed = false; }
                        }
                    }

                    if (!actorAllowed) {
                        // Promo/demote non autorizzati: inverti
                        if ((action === 'promote' || action === 'demote') && anCfg.controls.antiadmin && targetJids.length) {
                            const revertAction = action === 'promote' ? 'demote' : 'promote';
                            for (const t of targetJids) {
                                await sock.groupParticipantsUpdate(groupJid, [t], revertAction).catch(() => {});
                            }
                            await sock.sendMessage(groupJid, {
                                text: `🛡️ *ANTINUKE* — @${(actorJid || '').split('@')[0] || '?'} ha ${action === 'promote' ? 'promosso' : 'retrocesso'} membri senza permesso. Azione annullata.`,
                                mentions: actorJid ? [actorJid] : [],
                            }).catch(() => {});
                            return;
                        }
                    }
                } catch (anErr) {
                    console.error('[ANTINUKE] Errore handler partecipanti:', anErr.message);
                }
            }

            // Ignora promote/demote — non servono welcome/goodbye
            if (action !== 'add' && action !== 'remove') {
                console.log('[group-participants.update] Azione non gestita:', action);
                return;
            }

            const meta = await sock.groupMetadata(groupJid);
            if (!meta) {
                console.log('[group-participants.update] Metadata gruppo non trovate');
                return;
            }
            const groupName = meta.subject || 'Questo gruppo';
            const groupDesc = (meta.desc || '').trim().slice(0, 200) || 'Nessuna descrizione disponibile';
            const participantsList = Array.isArray(meta.participants) ? meta.participants : [];
            const admins = participantsList.filter(p => ['admin', 'superadmin'].includes(p.admin));

            for (const p of participants) {
                // p è un oggetto: { id: '...@lid', phoneNumber: '...@s.whatsapp.net', admin: ... }
                const jid = p?.id || p?.phoneNumber;
                if (!jid) {
                    console.log('[group-participants.update] JID mancante nel participant:', p);
                    continue;
                }
                const short = jid.split('@')[0];

                // Durante un nuke (dedsecregna) non inviamo né welcome né
                // goodbye e non eseguiamo i check d'ingresso: è il bot stesso
                // che sta espellendo i membri.
                if (isNukeActive(groupJid)) continue;

                // Controlla impostazioni welcome/goodbye per questo gruppo
                const welcomeConfig = getWelcomeGroup(groupJid);

                if (action === 'add') {
                    // ── ANTIVOIP CHECK ──
                    const avCfg = db._antivoip?.[groupJid];
                    if (avCfg?.enabled) {
                        const numClean = short.replace(/[^0-9]/g, '');
                        const prefix = numClean.startsWith('39') ? numClean.substring(0, 3) : numClean.length > 3 ? numClean.substring(0, numClean.length - 10) : numClean.substring(0, 1);
                        const isItalian = numClean.startsWith('39');
                        const isWhitelisted = avCfg.whitelist?.some(w => numClean.includes(w));
                        if (!isItalian && !isWhitelisted) {
                            try {
                                await sock.groupParticipantsUpdate(groupJid, [jid], 'remove');
                                console.log(`[ANTIVOIP] Rimosso ${short} (non +39)`);
                            } catch (e) { console.error('[ANTIVOIP] Errore rimozione:', e.message); }
                            continue;
                        }
                    }
                    // ── ANTIWZ BUSINESS CHECK ──
                    const awbCfg = db._antiwzb?.[groupJid];
                    if (awbCfg?.enabled) {
                        const numClean = short.replace(/[^0-9]/g, '');
                        const isWhitelisted = awbCfg.whitelist?.some(w => numClean.includes(w));
                        if (!isWhitelisted) {
                            try {
                                const bizProfile = await sock.getBusinessProfile(jid).catch(() => null);
                                if (bizProfile?.wid) {
                                    await sock.groupParticipantsUpdate(groupJid, [jid], 'remove');
                                    console.log(`[ANTIWZ] Rimosso ${short} (WhatsApp Business)`);
                                    continue;
                                }
                            } catch (e) { console.error('[ANTIWZ] Errore:', e.message); }
                        }
                    }
                    // ── ANTIBOT CHECK ──
                    const abCfg = db._antibot?.[groupJid];
                    if (abCfg?.enabled) {
                        const numClean = short.replace(/[^0-9]/g, '');
                        const isWhitelisted = abCfg.whitelist?.some(w => numClean.includes(w));
                        if (!isWhitelisted) {
                            try {
                                // Check via pushname / short number heuristic
                                const ppUrl = await sock.profilePictureUrl(jid, 'image').catch(() => null);
                                if (!ppUrl && numClean.length < 8) {
                                    await sock.groupParticipantsUpdate(groupJid, [jid], 'remove');
                                    console.log(`[ANTIBOT] Rimosso ${short} (probabile bot)`);
                                    continue;
                                }
                            } catch (e) { console.error('[ANTIBOT] Errore:', e.message); }
                        }
                    }

                    // ── ANTINUKE: CHECK ALL'INGRESSO ──
                    // antibot / antifake gestiti da db._antinuke rispettano la
                    // whitelist antinuke (gli utenti fidati NON vengono mai
                    // toccati, anche se gli altri anti-* separati sono attivi).
                    const anCfg = getAntinukeGroup(db, groupJid);
                    if (anCfg.enabled && !isAntinukeWhitelisted(anCfg, jid)) {
                        const numClean = short.replace(/[^0-9]/g, '');
                        try {
                            // ANTIBOT / ANTIFAKE antinuke: pfp mancante + numero corto
                            if (anCfg.controls.antibot || anCfg.controls.antifake) {
                                const ppUrl = await sock.profilePictureUrl(jid, 'image').catch(() => null);
                                if (!ppUrl && numClean.length < 8) {
                                    await sock.groupParticipantsUpdate(groupJid, [jid], 'remove');
                                    console.log(`[ANTINUKE] Rimosso ${short} (probabile bot/fake)`);
                                    continue;
                                }
                            }
                        } catch (e) {
                            console.error('[ANTINUKE] Errore check ingresso:', e.message);
                        }
                    }

                    if (!welcomeConfig.welcome) continue; // Welcome disattivato per questo gruppo

                    const welcomeText =

`╭─── ☠️ 𝕭𝖊𝖓𝖛𝖊𝖓𝖚𝖙𝖔 ☠️ ───╮
│ 👤 @${short}
│ 📍 *${groupName}*
├─── 📜 𝕱𝖆𝖙𝖙𝖊́ ───┤
│ ✦ _Regolamento in descrizione._
│ ✦ _Altro da lasciare in chat._
│ ✦ _Digita_ *".menu"* _per i comandi._
╰────────────────────────╯`;

                    let pfpUrl;
                    try { pfpUrl = await sock.profilePictureUrl(groupJid, 'image'); } catch (_) { pfpUrl = null; }

                    if (pfpUrl) {
                        await sock.sendMessage(groupJid, {
                            image: { url: pfpUrl },
                            caption: welcomeText,
                            mentions: [jid],
                        });
                    } else {
                        await sock.sendMessage(groupJid, {
                            text: welcomeText,
                            mentions: [jid],
                        });
                    }

                    // Pulsanti rapidi: menu comandi e ping di test.
                    try {
                        await sendButtons(sock, groupJid, '🚀 *Cosa vuoi fare?*\n\nPremi un pulsante per iniziare:', [
                            { label: '.menu', id: 'menu' },
                            { label: '.ping', id: 'ping' },
                        ]);
                    } catch (e) {
                        console.error('[WELCOME] Errore pulsanti:', e.message);
                    }

                } else if (action === 'remove') {
                    if (!welcomeConfig.goodbye) continue; // Goodbye disattivato per questo gruppo
                    
                    const goodbyeText =
`╭━━━━━ 👋 *ARRIVEDERCI* 👋 ━━━━━╮
┃
┃ 👤 @${short} 
┃ ha appena lasciato il gruppo.
┃
┃ 📉 *${groupName}* perde un membro,
┃ ma i ricordi restano. 🫂
┃
┃ _Chissà se tornerà..._ 🌈
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

                    await sock.sendMessage(groupJid, {
                        text: goodbyeText,
                        mentions: [jid],
                    });
                }
            }
        } catch (err) {
            console.error('[group-participants.update] Errore:', err.message);
        }
    });

    // ── GROUPS UPDATE (ANTINUKE ANTIGC) ────────────────────────────────────
    // Quando qualcuno NON autorizzato cambia nome/desc/impostazioni del
    // gruppo, l'antinuke lo ripristina allo snapshot salvato all'attivazione.
    // L'autore dell'azione arriva in update.author (stub system message).
    sock.ev.on('groups.update', async (updates) => {
        const list = Array.isArray(updates) ? updates : [updates];
        for (const u of list) {
            try {
                const gid = u?.id;
                if (!gid || !gid.endsWith('@g.us')) continue;

                const cfg = getAntinukeGroup(db, gid);
                if (!cfg.enabled || !cfg.controls.antigc) continue;

                // Il full-sync iniziale (groupFetchAllParticipating) non ha
                // "author": non è una modifica reale, lo ignoriamo.
                const actor = u?.author;
                if (!actor) continue;

                // Owner, whitelist e admin sono esenti.
                if (isOwnerJid(actor, sock, db) || isAntinukeWhitelisted(cfg, actor)) continue;
                let isAdminActor = false;
                try {
                    const meta = await getCachedGroupMeta(sock, gid);
                    isAdminActor = (meta?.participants || []).some(p => isAdminParticipant(p, actor));
                } catch (_) {}
                if (isAdminActor) continue;

                // Determiniamo cosa è cambiato e se possiamo ripristinarlo.
                const snapshot = cfg.snapshot;
                const changed = [];
                if (typeof u.subject === 'string' && snapshot?.subject !== undefined) changed.push('nome');
                if (typeof u.desc === 'string' && snapshot?.desc !== undefined) changed.push('descrizione');
                if (typeof u.announce === 'boolean') changed.push('impostazioni');
                if (typeof u.restrict === 'boolean') changed.push('impostazioni');
                if (!changed.length) continue;

                const short = actor.split('@')[0];
                try {
                    if (typeof u.subject === 'string' && snapshot?.subject !== undefined) {
                        await sock.groupUpdateSubject(gid, snapshot.subject || '').catch(() => {});
                    }
                    if (typeof u.desc === 'string' && snapshot?.desc !== undefined) {
                        await sock.groupUpdateDescription(gid, snapshot.desc || '').catch(() => {});
                    }
                    if (typeof u.announce === 'boolean') {
                        await sock.groupSettingUpdate(gid, u.announce ? 'not_announcement' : 'announcement').catch(() => {});
                    }
                    if (typeof u.restrict === 'boolean') {
                        await sock.groupSettingUpdate(gid, u.restrict ? 'unlocked' : 'locked').catch(() => {});
                    }
                    await sock.sendMessage(gid, {
                        text: `🛡️ *ANTINUKE* — @${short} ha cambiato *${changed.join(', ')}* senza permesso. Ripristinato.`,
                        mentions: [actor],
                    }).catch(() => {});
                } catch (e) {
                    console.error('[ANTINUKE] Errore revert antigc:', e.message);
                }
            } catch (err) {
                console.error('[ANTINUKE] Errore groups.update:', err.message);
            }
        }
    });
}

startBot();
