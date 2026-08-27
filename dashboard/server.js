'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'database.json');
const WELCOME_FILE = path.join(ROOT, 'welcome.json');
const ANTILINK_FILE = path.join(ROOT, 'antilink.json');
const PHRASES_DIR = path.join(ROOT, 'phrases');
const CONFIG_FILE = path.join(ROOT, 'config.js');
const LOG_FILE = path.join(ROOT, 'logs', 'bot.log');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

const PORT = process.env.DASHBOARD_PORT ? Number(process.env.DASHBOARD_PORT) : 3001;
const HOST = process.env.DASHBOARD_HOST || '0.0.0.0';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Helpers ─────────────────────────────────────────────────────────────
const safeReadJSON = (file, fallback = {}) => {
    try {
        if (!fs.existsSync(file)) return fallback;
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) {
        console.error(`[DASH] Read ${path.basename(file)}:`, e.message);
        return fallback;
    }
};

const safeWriteJSON = (file, data) => {
    try {
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmp, file);
        return true;
    } catch (e) {
        console.error(`[DASH] Write ${path.basename(file)}:`, e.message);
        return false;
    }
};

const safeReadText = (file) => {
    try {
        if (!fs.existsSync(file)) return null;
        return fs.readFileSync(file, 'utf-8');
    } catch (_) { return null; }
};

const safeWriteText = (file, text) => {
    try {
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const tmp = file + '.tmp';
        fs.writeFileSync(tmp, text, 'utf-8');
        fs.renameSync(tmp, file);
        return true;
    } catch (e) {
        console.error(`[DASH] Write text ${path.basename(file)}:`, e.message);
        return false;
    }
};

// ── API: Overview ───────────────────────────────────────────────────────
app.get('/api/overview', (req, res) => {
    try {
        const db = safeReadJSON(DB_FILE, {});
        const welcome = safeReadJSON(WELCOME_FILE, {});
        const antilink = safeReadJSON(ANTILINK_FILE, {});
        const pkg = safeReadJSON(PACKAGE_FILE, {});

        // Conta gruppi e utenti
        const groupKeys = Object.keys(db).filter(k => k.endsWith('@g.us'));
        const userCount = groupKeys.reduce((acc, gid) => {
            const chat = db[gid] || {};
            return acc + Object.keys(chat).filter(k => k.includes('@')).length;
        }, 0);

        // Uptime e sistema
        const uptimeSec = process.uptime();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // Phrases count
        let phrasesCount = 0;
        try {
            if (fs.existsSync(PHRASES_DIR)) phrasesCount = fs.readdirSync(PHRASES_DIR).filter(f => f.endsWith('.txt')).length;
        } catch (_) {}

        // DB size
        let dbSize = 0;
        try { dbSize = fs.statSync(DB_FILE).size; } catch (_) {}

        // Owners
        const owners = Array.isArray(db._owners) ? db._owners : [];

        res.json({
            ok: true,
            bot: {
                version: pkg.version || '1.0.0',
                name: pkg.name || 'vex-bot',
                uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
                uptimeSec: Math.floor(uptimeSec),
                platform: `${os.platform()} ${os.arch()}`,
                node: process.version,
                pid: process.pid,
            },
            stats: {
                groups: groupKeys.length,
                users: userCount,
                phrases: phrasesCount,
                dbSize,
                welcomeGroups: Object.keys(welcome).length,
                antilinkGroups: Object.keys(antilink).length,
                owners: owners.length,
            },
            system: {
                ramUsed: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                ramTotal: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                ramPercent: ((usedMem / totalMem) * 100).toFixed(1) + '%',
                cpuModel: (os.cpus()[0]?.model || 'Unknown').trim(),
                cores: os.cpus().length,
                hostname: os.hostname(),
            }
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Config ─────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
    try {
        const raw = safeReadText(CONFIG_FILE) || '';
        // Estrai valori senza eseguire il file (sicuro)
        const botIdentity = (raw.match(/BOT_IDENTITY\s*=\s*['\"`]([^'\"`]+)['\"`]/) || [])[1] || '';
        const sponsorLink = (raw.match(/SPONSOR_LINK\s*=\s*['\"`]([^'\"`]+)['\"`]/) || [])[1] || '';
        const lastfmKey = (raw.match(/LASTFM_API_KEY[^'\"`]*['\"`]([^'\"`]+)['\"`]/) || [])[1] || '';

        res.json({
            ok: true,
            config: {
                BOT_IDENTITY: botIdentity,
                SPONSOR_LINK: sponsorLink,
                LASTFM_API_KEY: lastfmKey,
            },
            raw,
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Owners ─────────────────────────────────────────────────────────
app.get('/api/owners', (req, res) => {
    try {
        const db = safeReadJSON(DB_FILE, {});
        const owners = Array.isArray(db._owners) ? db._owners : [];
        // Anche config hardcode? Mostra entrambi
        res.json({ ok: true, owners });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/api/owners', (req, res) => {
    try {
        const { action, jid, number } = req.body || {};
        if (!action) return res.status(400).json({ ok: false, error: 'action mancante (add/remove)' });

        const db = safeReadJSON(DB_FILE, {});
        db._owners = Array.isArray(db._owners) ? db._owners : [];

        const norm = (jid || number || '').toString().trim();
        if (!norm) return res.status(400).json({ ok: false, error: 'jid/number mancante' });

        // Normalizza a jid
        let clean = norm.replace(/[^0-9]/g, '');
        if (clean.length < 5) return res.status(400).json({ ok: false, error: 'Numero troppo corto' });
        const jidFull = clean.includes('@') ? norm : `${clean}@s.whatsapp.net`;

        if (action === 'add') {
            if (db._owners.some(o => String(o.jid || o.number || '').includes(clean) || String(o.number || '').includes(clean))) {
                return res.status(400).json({ ok: false, error: 'Owner già presente' });
            }
            db._owners.push({ jid: jidFull, number: clean });
            if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
            return res.json({ ok: true, owners: db._owners });
        }

        if (action === 'remove') {
            const before = db._owners.length;
            db._owners = db._owners.filter(o => {
                const oNum = String(o.jid || o.number || '').replace(/[^0-9]/g, '');
                return !oNum.includes(clean) && clean !== oNum;
            });
            if (db._owners.length === before) return res.status(404).json({ ok: false, error: 'Owner non trovato' });
            if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
            return res.json({ ok: true, owners: db._owners });
        }

        return res.status(400).json({ ok: false, error: 'action deve essere add o remove' });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Groups ─────────────────────────────────────────────────────────
app.get('/api/groups', (req, res) => {
    try {
        const db = safeReadJSON(DB_FILE, {});
        const welcome = safeReadJSON(WELCOME_FILE, {});
        const antilink = safeReadJSON(ANTILINK_FILE, {});

        const groupIds = new Set([
            ...Object.keys(db).filter(k => k.endsWith('@g.us')),
            ...Object.keys(welcome),
            ...Object.keys(antilink),
        ]);

        const groupInfo = db._groupInfo || {};
        const groups = [...groupIds].map(gid => {
            const w = welcome[gid] || { welcome: true, goodbye: true, welcomeText: null, goodbyeText: null };
            const al = antilink[gid] || {};
            const chat = db[gid] || {};
            const userKeys = Object.keys(chat).filter(k => k.includes('@') && chat[k] && typeof chat[k] === 'object');
            const msgs = Object.values(chat).reduce((acc, u) => acc + (Number(u?.msgCount) || 0), 0);
            const info = groupInfo[gid] || {};

            return {
                jid: gid,
                name: info.name || gid,
                photoUrl: info.photoUrl || null,
                desc: info.desc || null,
                participantsCount: info.participantsCount || userKeys.length,
                welcome: w.welcome !== false,
                goodbye: w.goodbye !== false,
                welcomeText: w.welcomeText || null,
                goodbyeText: w.goodbyeText || null,
                antilink: al,
                users: userKeys.length,
                msgs,
                hasAntilink: Object.entries(al).some(([k, v]) => k !== 'whitelist' && v),
            };
        }).sort((a,b) => {
            const an = (a.name && a.name !== a.jid ? a.name : a.jid || '').toLowerCase();
            const bn = (b.name && b.name !== b.jid ? b.name : b.jid || '').toLowerCase();
            return an.localeCompare(bn, 'it');
        });

        res.json({ ok: true, groups });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.get('/api/groups/:jid', (req, res) => {
    try {
        const gid = req.params.jid;
        if (!gid || !gid.endsWith('@g.us')) return res.status(400).json({ ok: false, error: 'JID gruppo non valido' });

        const db = safeReadJSON(DB_FILE, {});
        const welcome = safeReadJSON(WELCOME_FILE, {});
        const antilink = safeReadJSON(ANTILINK_FILE, {});

        const w = welcome[gid] || { welcome: true, goodbye: true, welcomeText: null, goodbyeText: null };
        const al = antilink[gid] || {};
        const chat = db[gid] || {};

        // Estrai anche altre config per-gruppo
        const groupCfg = {
            welcome: w,
            antilink: al,
            linkOpen: db[gid]?._linkOpen ?? null,
            modoadmin: db[gid]?._modoadmin ?? null,
            antiflood: db[gid]?._antiflood ?? true,
            _antibot: db._antibot?.[gid] ?? null,
            _antinuke: db._antinuke?.[gid] ?? null,
            _antivoip: db._antivoip?.[gid] ?? null,
            _antiwzb: db._antiwzb?.[gid] ?? null,
            _bestemmiometro: db._bestemmiometro?.[gid] ?? null,
            _groupguard: db._groupguard?.[gid] ?? null,
        };

        const users = Object.entries(chat)
            .filter(([k, v]) => k.includes('@') && v && typeof v === 'object')
            .map(([jid, data]) => ({
                jid,
                ...(data || {}),
            }))
            .sort((a, b) => ((b?.msgCount) || 0) - ((a?.msgCount) || 0));

        const groupInfo = (db._groupInfo && db._groupInfo[gid]) || {};

        res.json({ ok: true, jid: gid, name: groupInfo.name || gid, photoUrl: groupInfo.photoUrl || null, desc: groupInfo.desc || null, config: groupCfg, users });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/groups/:jid/welcome', (req, res) => {
    try {
        const gid = req.params.jid;
        if (!gid.endsWith('@g.us')) return res.status(400).json({ ok: false, error: 'JID non valido' });

        const { welcome, goodbye, welcomeText, goodbyeText } = req.body || {};
        const data = safeReadJSON(WELCOME_FILE, {});
        if (!data[gid]) data[gid] = { welcome: true, goodbye: true, welcomeText: null, goodbyeText: null };

        if (typeof welcome === 'boolean') data[gid].welcome = welcome;
        if (typeof goodbye === 'boolean') data[gid].goodbye = goodbye;
        if (welcomeText !== undefined) {
            if (welcomeText !== null && String(welcomeText).length > 800) return res.status(400).json({ ok: false, error: 'welcomeText troppo lunga (max 800)' });
            data[gid].welcomeText = welcomeText ? String(welcomeText) : null;
        }
        if (goodbyeText !== undefined) {
            if (goodbyeText !== null && String(goodbyeText).length > 800) return res.status(400).json({ ok: false, error: 'goodbyeText troppo lunga' });
            data[gid].goodbyeText = goodbyeText ? String(goodbyeText) : null;
        }

        if (!safeWriteJSON(WELCOME_FILE, data)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, config: data[gid] });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/groups/:jid/antilink', (req, res) => {
    try {
        const gid = req.params.jid;
        if (!gid.endsWith('@g.us')) return res.status(400).json({ ok: false, error: 'JID non valido' });

        const body = req.body || {};
        const allowed = ['whatsapp', 'instagram', 'telegram', 'tiktok', 'facebook', 'youtube', 'twitter', 'altri', 'whitelist'];

        const data = safeReadJSON(ANTILINK_FILE, {});
        if (!data[gid]) data[gid] = { whatsapp: false, instagram: false, telegram: false, tiktok: false, facebook: false, youtube: false, twitter: false, altri: false };

        for (const k of allowed) {
            if (k in body) {
                if (k === 'whitelist') {
                    if (!Array.isArray(body[k])) return res.status(400).json({ ok: false, error: 'whitelist deve essere array' });
                    data[gid][k] = body[k];
                } else {
                    data[gid][k] = Boolean(body[k]);
                }
            }
        }

        if (!safeWriteJSON(ANTILINK_FILE, data)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, config: data[gid] });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/groups/:jid/settings', (req, res) => {
    try {
        const gid = req.params.jid;
        if (!gid.endsWith('@g.us')) return res.status(400).json({ ok: false, error: 'JID non valido' });

        const db = safeReadJSON(DB_FILE, {});
        if (!db[gid]) db[gid] = {};

        const { _linkOpen, _modoadmin, _antiflood } = req.body || {};
        if (_linkOpen !== undefined) db[gid]._linkOpen = Boolean(_linkOpen);
        if (_modoadmin !== undefined) db[gid]._modoadmin = Boolean(_modoadmin);
        if (_antiflood !== undefined) db[gid]._antiflood = Boolean(_antiflood);

        if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.delete('/api/groups/:jid', (req, res) => {
    try {
        const gid = req.params.jid;
        const db = safeReadJSON(DB_FILE, {});
        const welcome = safeReadJSON(WELCOME_FILE, {});
        const antilink = safeReadJSON(ANTILINK_FILE, {});

        let changed = false;
        if (db[gid]) { delete db[gid]; changed = true; safeWriteJSON(DB_FILE, db); }
        if (welcome[gid]) { delete welcome[gid]; changed = true; safeWriteJSON(WELCOME_FILE, welcome); }
        if (antilink[gid]) { delete antilink[gid]; changed = true; safeWriteJSON(ANTILINK_FILE, antilink); }

        res.json({ ok: true, deleted: changed });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Phrases ────────────────────────────────────────────────────────
app.get('/api/phrases', (req, res) => {
    try {
        if (!fs.existsSync(PHRASES_DIR)) return res.json({ ok: true, phrases: [] });
        const files = fs.readdirSync(PHRASES_DIR).filter(f => f.endsWith('.txt'));
        const list = files.map(f => {
            const key = f.replace(/\.txt$/, '');
            const content = safeReadText(path.join(PHRASES_DIR, f)) || '';
            const lines = content.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
            return { key, file: f, count: lines.length };
        }).sort((a, b) => a.key.localeCompare(b.key));
        res.json({ ok: true, phrases: list });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.get('/api/phrases/:key', (req, res) => {
    try {
        const key = String(req.params.key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!key) return res.status(400).json({ ok: false, error: 'key non valida' });
        const file = path.join(PHRASES_DIR, `${key}.txt`);
        const raw = safeReadText(file);
        if (raw === null) return res.status(404).json({ ok: false, error: 'File non trovato' });
        const lines = raw.split(/\r?\n/);
        const phrases = lines.filter(l => l.trim() && !l.trim().startsWith('#'));
        res.json({ ok: true, key, raw, phrases, count: phrases.length });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/phrases/:key', (req, res) => {
    try {
        const key = String(req.params.key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!key) return res.status(400).json({ ok: false, error: 'key non valida' });
        const { content, phrases } = req.body || {};
        let text = '';
        if (Array.isArray(phrases)) {
            text = phrases.join('\n') + '\n';
        } else if (typeof content === 'string') {
            text = content;
            if (!text.endsWith('\n')) text += '\n';
        } else {
            return res.status(400).json({ ok: false, error: 'Fornisci content o phrases[]' });
        }
        if (text.length > 50000) return res.status(400).json({ ok: false, error: 'File troppo grande (max 50k)' });
        const file = path.join(PHRASES_DIR, `${key}.txt`);
        if (!safeWriteText(file, text)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });

        // Aggiorna ARRAYS/COPY in memoria se il bot è in esecuzione (best-effort: tocca i file, al riavvio ricaricherà)
        res.json({ ok: true, key });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/api/phrases/:key/add', (req, res) => {
    try {
        const key = String(req.params.key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const { phrase } = req.body || {};
        if (!phrase || !String(phrase).trim()) return res.status(400).json({ ok: false, error: 'phrase mancante' });
        if (String(phrase).length > 400) return res.status(400).json({ ok: false, error: 'Frase troppo lunga (max 400)' });

        const file = path.join(PHRASES_DIR, `${key}.txt`);
        let lines = [];
        const raw = safeReadText(file);
        if (raw !== null) lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));
        lines.push(String(phrase).trim());
        if (!safeWriteText(file, lines.join('\n') + '\n')) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, key, count: lines.length });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.delete('/api/phrases/:key/:index', (req, res) => {
    try {
        const key = String(req.params.key || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const idx = Number(req.params.index);
        if (!Number.isInteger(idx) || idx < 0) return res.status(400).json({ ok: false, error: 'index non valido' });

        const file = path.join(PHRASES_DIR, `${key}.txt`);
        const raw = safeReadText(file);
        if (raw === null) return res.status(404).json({ ok: false, error: 'File non trovato' });

        const allLines = raw.split(/\r?\n/);
        // Mappa indici: solo righe reali (non vuote/commenti) sono indicizzate per l'utente
        const phrases = allLines.filter(l => l.trim() && !l.trim().startsWith('#'));
        if (idx >= phrases.length) return res.status(400).json({ ok: false, error: 'Indice fuori range' });

        // Rimuovi la n-esima frase reale, preservando commenti/vuoti
        let seen = -1;
        const nextLines = [];
        for (const line of allLines) {
            const isPhrase = line.trim() && !line.trim().startsWith('#');
            if (isPhrase) seen++;
            if (isPhrase && seen === idx) continue; // skip
            nextLines.push(line);
        }
        // Ricostruisci pulito
        const filtered = nextLines.filter(l => l.trim() && !l.trim().startsWith('#'));
        const out = filtered.join('\n') + (filtered.length ? '\n' : '');
        if (!safeWriteText(file, out)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, key, count: filtered.length });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Users (per gruppo) ─────────────────────────────────────────────
app.get('/api/users/:gid', (req, res) => {
    try {
        const gid = req.params.gid;
        const db = safeReadJSON(DB_FILE, {});
        const chat = db[gid] || {};
        const users = Object.entries(chat)
            .filter(([k, v]) => k.includes('@') && v && typeof v === 'object')
            .map(([jid, data]) => ({ jid, ...(data || {}) }))
            .sort((a, b) => ((b?.msgCount) || 0) - ((a?.msgCount) || 0));
        res.json({ ok: true, jid: gid, users, count: users.length });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/users/:gid/:jid', (req, res) => {
    try {
        const gid = req.params.gid;
        const jid = req.params.jid;
        const patch = req.body || {};
        const db = safeReadJSON(DB_FILE, {});
        if (!db[gid] || !db[gid][jid]) return res.status(404).json({ ok: false, error: 'Utente non trovato' });

        const allowed = ['money', 'warnings', 'isMuted', 'msgCount', 'spouse', 'bio', 'nickname'];
        for (const k of allowed) {
            if (k in patch) db[gid][jid][k] = patch[k];
        }
        if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, user: db[gid][jid] });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.delete('/api/users/:gid/:jid', (req, res) => {
    try {
        const gid = req.params.gid;
        const jid = req.params.jid;
        const db = safeReadJSON(DB_FILE, {});
        if (!db[gid] || !db[gid][jid]) return res.status(404).json({ ok: false, error: 'Utente non trovato' });
        delete db[gid][jid];
        if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: PFP ────────────────────────────────────────────────────────────
const pfpCache = new Map(); // jid -> { url, ts }
const PFP_TTL = 1000 * 60 * 60; // 1h

app.get('/api/pfp/:jid', async (req, res) => {
    try {
        const jid = String(req.params.jid || '').trim();
        if (!jid || !jid.includes('@')) return res.status(400).json({ ok: false, error: 'JID non valido' });

        // Cache
        const cached = pfpCache.get(jid);
        if (cached && Date.now() - cached.ts < PFP_TTL) return res.json({ ok: true, url: cached.url, cached: true });

        // Prova a trovare PFP reale salvata dal bot in database.json
        try {
            const db = safeReadJSON(DB_FILE, {});
            // Cerca in _groupInfo per gruppi
            if (jid.endsWith('@g.us') && db._groupInfo && db._groupInfo[jid]?.photoUrl) {
                const real = db._groupInfo[jid].photoUrl;
                pfpCache.set(jid, { url: real, ts: Date.now() });
                return res.json({ ok: true, url: real, real: true });
            }
            // Cerca in tutti i gruppi per utenti
            for (const gid of Object.keys(db)) {
                if (!gid.endsWith('@g.us')) continue;
                const u = db[gid] && db[gid][jid];
                if (u && u.pfpUrl) {
                    pfpCache.set(jid, { url: u.pfpUrl, ts: Date.now() });
                    return res.json({ ok: true, url: u.pfpUrl, real: true });
                }
            }
        } catch (_) {}

        // Fallback: usa ui-avatars come placeholder realistico
        const initials = jid.split('@')[0].slice(-4).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'VX';
        let bg = '7c5cff';
        try {
            let h = 0;
            for (let i = 0; i < jid.length; i++) h = (h * 31 + jid.charCodeAt(i)) >>> 0;
            const hue = h % 360;
            // Converti HSL a hex approssimato per ui-avatars
            bg = `hsl(${hue},65%,45%)`.replace(/[^0-9,]/g, '').split(',')[0] || '7c5cff';
            // ui-avatars vuole esadecimale, usiamo hash per colore
            const colors = ['7c5cff','ff4ecd','22c55e','f59e0b','3b82f6','ef4444','06b6d4','8b5cf6'];
            bg = colors[h % colors.length];
        } catch (_) {}

        // Placeholder realistico via ui-avatars (sembra una vera PFP)
        const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=fff&size=128&bold=true&format=svg`;

        // Se il bot è in esecuzione, potremmo provare a usare Baileys per fetch reale,
        // ma per ora restituiamo placeholder con cache. Il frontend proverà a caricare
        // la vera PFP via WhatsApp se disponibile, altrimenti placeholder.
        pfpCache.set(jid, { url: placeholder, ts: Date.now() });
        res.json({ ok: true, url: placeholder, placeholder: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Logs ───────────────────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
    try {
        const maxLines = Math.min(Number(req.query.lines) || 200, 2000);
        let text = '';
        if (fs.existsSync(LOG_FILE)) text = fs.readFileSync(LOG_FILE, 'utf-8');
        const lines = text.split(/\r?\n/).slice(-maxLines).join('\n');
        res.json({ ok: true, lines, file: LOG_FILE, exists: fs.existsSync(LOG_FILE) });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Files / Directory ────────────────────────────────────────────
const ALLOWED_ROOTS = [ROOT];
const isPathAllowed = (p) => {
    const resolved = path.resolve(p);
    return ALLOWED_ROOTS.some(r => resolved === r || resolved.startsWith(r + path.sep));
};
const BLOCKED_NAMES = new Set(['node_modules', '.git', 'auth_info_baileys', '.env']);

app.get('/api/files/list', (req, res) => {
    try {
        const rel = String(req.query.path || '').replace(/\\/g, '/');
        const target = path.resolve(ROOT, rel);
        if (!isPathAllowed(target)) return res.status(403).json({ ok: false, error: 'Percorso non consentito' });
        if (!fs.existsSync(target)) return res.status(404).json({ ok: false, error: 'Non trovato' });
        const stat = fs.statSync(target);
        if (!stat.isDirectory()) return res.status(400).json({ ok: false, error: 'Non è una directory' });

        const entries = fs.readdirSync(target, { withFileTypes: true })
            .filter(e => !BLOCKED_NAMES.has(e.name) && !e.name.startsWith('.'))
            .map(e => {
                const full = path.join(target, e.name);
                let size = 0, mtime = null;
                try { const s = fs.statSync(full); size = s.size; mtime = s.mtime; } catch (_) {}
                return {
                    name: e.name,
                    path: path.relative(ROOT, full).replace(/\\/g, '/'),
                    isDir: e.isDirectory(),
                    size,
                    mtime,
                    ext: path.extname(e.name).toLowerCase(),
                };
            })
            .sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));

        const relRoot = path.relative(ROOT, target).replace(/\\/g, '/');
        res.json({ ok: true, path: relRoot, entries, parent: relRoot ? path.dirname(relRoot).replace(/\\/g, '/') : null });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/files/read', (req, res) => {
    try {
        const rel = String(req.query.path || '');
        if (!rel) return res.status(400).json({ ok: false, error: 'path mancante' });
        const target = path.resolve(ROOT, rel);
        if (!isPathAllowed(target)) return res.status(403).json({ ok: false, error: 'Non consentito' });
        if (!fs.existsSync(target)) return res.status(404).json({ ok: false, error: 'Non trovato' });
        const stat = fs.statSync(target);
        if (stat.isDirectory()) return res.status(400).json({ ok: false, error: 'È una directory' });
        if (stat.size > 500000) return res.status(400).json({ ok: false, error: 'File troppo grande (max 500KB)' });
        const content = fs.readFileSync(target, 'utf-8');
        res.json({ ok: true, path: rel, content, size: stat.size });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.put('/api/files/write', (req, res) => {
    try {
        const { path: rel, content } = req.body || {};
        if (!rel) return res.status(400).json({ ok: false, error: 'path mancante' });
        if (typeof content !== 'string') return res.status(400).json({ ok: false, error: 'content deve essere stringa' });
        if (content.length > 500000) return res.status(400).json({ ok: false, error: 'Contenuto troppo grande (max 500KB)' });
        const target = path.resolve(ROOT, rel);
        if (!isPathAllowed(target)) return res.status(403).json({ ok: false, error: 'Non consentito' });
        if (BLOCKED_NAMES.has(path.basename(target))) return res.status(403).json({ ok: false, error: 'File bloccato' });
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!safeWriteText(target, content)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, path: rel });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/files', (req, res) => {
    try {
        const rel = String(req.query.path || '');
        if (!rel) return res.status(400).json({ ok: false, error: 'path mancante' });
        const target = path.resolve(ROOT, rel);
        if (!isPathAllowed(target)) return res.status(403).json({ ok: false, error: 'Non consentito' });
        if (BLOCKED_NAMES.has(path.basename(target)) || target === ROOT) return res.status(403).json({ ok: false, error: 'Non consentito' });
        if (!fs.existsSync(target)) return res.status(404).json({ ok: false, error: 'Non trovato' });
        const stat = fs.statSync(target);
        if (stat.isDirectory()) fs.rmSync(target, { recursive: true, force: true });
        else fs.unlinkSync(target);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/files/mkdir', (req, res) => {
    try {
        const { path: rel } = req.body || {};
        if (!rel) return res.status(400).json({ ok: false, error: 'path mancante' });
        const target = path.resolve(ROOT, rel);
        if (!isPathAllowed(target)) return res.status(403).json({ ok: false, error: 'Non consentito' });
        fs.mkdirSync(target, { recursive: true });
        res.json({ ok: true, path: rel });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── API: Raw DB (solo lettura) ─────────────────────────────────────────
app.get('/api/db', (req, res) => {
    try {
        const db = safeReadJSON(DB_FILE, {});
        res.json({ ok: true, db });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── Static ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────
const tryListen = (port) => {
    const server = app.listen(port, HOST, () => {
        // Mostra IP LAN per accesso da PC quando host è sul tel
        let lanIp = '';
        try {
            const ifs = os.networkInterfaces();
            for (const addrs of Object.values(ifs)) {
                for (const a of addrs || []) {
                    if (a.family === 'IPv4' && !a.internal) { lanIp = a.address; break; }
                }
                if (lanIp) break;
            }
        } catch (_) {}
        console.log(`\n✦ ◆ ✦  VEX DASHBOARD  ✦ ◆ ✦`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✦ Locale:  http://127.0.0.1:${port}  (su questo dispositivo)`);
        if (lanIp) console.log(`✦ Rete:    http://${lanIp}:${port}  (da PC sulla stessa WiFi)`);
        console.log(`✦ Cartella: ${ROOT}`);
        console.log(`✦ Non esposto su internet — solo WiFi locale`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`[DASH] Porta ${port} occupata, provo ${port + 1}...`);
            tryListen(port + 1);
        } else {
            console.error('[DASH] Errore avvio:', err.message);
            process.exit(1);
        }
    });
};
tryListen(PORT);
