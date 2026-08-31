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

        // Conta solo gruppi dove il bot è realmente dentro (da _groupInfo), mai chat private
        const groupInfo = db._groupInfo || {};
        const groupKeys = Object.keys(groupInfo).length
            ? Object.keys(groupInfo).filter(k => k.endsWith('@g.us'))
            : Object.keys(db).filter(k => k.endsWith('@g.us') && db[k] && typeof db[k] === 'object' && !k.includes('@s.whatsapp.net') && !k.includes('@lid'));
        const userCount = groupKeys.reduce((acc, gid) => {
            const chat = db[gid] || {};
            return acc + Object.keys(chat).filter(k => k.includes('@') && chat[k] && typeof chat[k] === 'object').length;
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
        const mainJid = db._mainOwner || (owners[0] ? (owners[0].jid || owners[0].number || owners[0].lid) : null);

        // Arricchisci con nome/telefono/pfp reali dal DB utenti (se disponibili)
        const enriched = owners.map(o => {
            const rawJid = String(o.jid || o.number || o.lid || '').trim();
            const rawNum = String(o.number || o.jid || o.lid || '').split(':')[0].replace(/[^0-9]/g,'');
            const isLid = rawJid.endsWith('@lid') || (o.lid && String(o.lid).endsWith('@lid'));
            // Cerca nei gruppi un utente con questo jid/lid/numero per prendere nome e telefono veri
            let bestName = null, bestPhone = null, bestPfp = null;
            // Cerca per lid o jid esatto
            for (const gid of Object.keys(db)) {
                if (!gid.endsWith('@g.us')) continue;
                const chat = db[gid];
                if (!chat || typeof chat !== 'object') continue;
                // Prova lid, jid, number
                for (const key of [rawJid, o.lid, o.number].filter(Boolean)) {
                    const cleanKey = String(key).split('@')[0].replace(/[^0-9]/g,'');
                    // Cerca per chiave esatta o per numero contenuto
                    for (const [ujid, udata] of Object.entries(chat)) {
                        if (!udata || typeof udata !== 'object') continue;
                        const uNum = String(udata.phoneNumber || '').replace(/[^0-9]/g,'');
                        const uJidNum = String(ujid).replace(/[^0-9]/g,'');
                        const oNum = rawNum;
                        // Match per lid esatto o per telefono
                        if (ujid === key || ujid === rawJid || (uNum && oNum && (uNum === oNum || uNum.includes(oNum) || oNum.includes(uNum))) || (uJidNum === cleanKey)) {
                            if (!bestName && (udata.name || udata.nickname)) bestName = udata.name || udata.nickname;
                            if (!bestPhone && udata.phoneNumber) bestPhone = udata.phoneNumber;
                            if (!bestPfp && udata.pfpUrl) bestPfp = udata.pfpUrl;
                            if (bestName && bestPhone && bestPfp) break;
                        }
                    }
                    if (bestName && bestPhone && bestPfp) break;
                }
                if (bestName && bestPhone && bestPfp) break;
            }
            // Fallback: se è un lid senza phone, prova a cercare in _groupInfo o in altri owner con stesso lid
            if (!bestPhone && isLid) {
                // Cerca un altro owner con stesso lid che ha phone
                const other = owners.find(x => String(x.lid||'').replace(/[^0-9]/g,'') === String(o.lid||'').replace(/[^0-9]/g,'') && x.number && String(x.number).includes('@s.whatsapp.net'));
                if (other) bestPhone = other.number;
            }
            // Per display, usa sempre +telefono se disponibile, altrimenti JID
            const displayPhone = bestPhone ? `+${String(bestPhone).split(':')[0].replace(/[^0-9]/g,'')}` : (rawNum.length >= 7 ? `+${rawNum}` : rawJid);
            const phoneForPfp = bestPhone ? String(bestPhone).split(':')[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net' : rawJid;
            return {
                ...o,
                displayName: bestName || null,
                displayPhone,
                phoneForPfp,
                bestPfp,
                rawNum,
                isLid,
            };
        });

        res.json({ ok: true, owners: enriched, main: mainJid });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.put('/api/owners/main', (req, res) => {
    try {
        const { jid, number } = req.body || {};
        const target = String(jid || number || '').trim();
        if (!target) return res.status(400).json({ ok: false, error: 'jid/number mancante' });
        const clean = target.replace(/[^0-9]/g, '');
        if (clean.length < 5) return res.status(400).json({ ok: false, error: 'Numero troppo corto' });

        const db = safeReadJSON(DB_FILE, {});
        db._owners = Array.isArray(db._owners) ? db._owners : [];
        // Verifica che sia già owner, altrimenti aggiungilo
        let found = db._owners.find(o => String(o.jid||o.number||'').replace(/[^0-9]/g,'').includes(clean));
        let jidFull;
        if (found) {
            jidFull = found.jid || found.number;
        } else {
            jidFull = clean.includes('@') ? target : `${clean}@s.whatsapp.net`;
            db._owners.push({ jid: jidFull, number: clean });
        }
        db._mainOwner = jidFull;
        // Sposta il main in testa alla lista per priorità
        db._owners = [found || { jid: jidFull, number: clean }, ...db._owners.filter(o => String(o.jid||o.number||'').replace(/[^0-9]/g,'') !== clean)];
        if (!safeWriteJSON(DB_FILE, db)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, owners: db._owners, main: jidFull });
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

        // Solo gruppi dove il bot è realmente dentro (da _groupInfo, popolato all'avvio)
        const groupInfo = db._groupInfo || {};
        let groupIds;
        if (Object.keys(groupInfo).length) {
            groupIds = new Set(Object.keys(groupInfo));
        } else {
            // Fallback prima che il bot abbia popolato _groupInfo
            groupIds = new Set([
                ...Object.keys(db).filter(k => k.endsWith('@g.us')),
                ...Object.keys(welcome),
                ...Object.keys(antilink),
            ]);
        }

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

// ── API: Users (globale) ───────────────────────────────────────────────
app.get('/api/users', (req, res) => {
    try {
        const db = safeReadJSON(DB_FILE, {});
        const groupInfo = db._groupInfo || {};
        const allGroups = Object.keys(db).filter(k => k.endsWith('@g.us'));
        // Se _groupInfo ha dati, usa solo quelli per "dove sta il bot"
        const targetGroups = Object.keys(groupInfo).length ? Object.keys(groupInfo) : allGroups;

        const userMap = new Map(); // jid -> { jid, name, pfpUrl, groups: [], totalMoney, totalMsgs, ... }
        for (const gid of targetGroups) {
            const chat = db[gid] || {};
            for (const [jid, data] of Object.entries(chat)) {
                if (!jid.includes('@') || !data || typeof data !== 'object') continue;
                if (!userMap.has(jid)) {
                    userMap.set(jid, {
                        jid,
                        name: data.name || data.nickname || null,
                        nickname: data.nickname || null,
                        pfpUrl: data.pfpUrl || null,
                        bio: data.bio || null,
                        groups: [],
                        totalMoney: 0,
                        totalMsgs: 0,
                        totalWarnings: 0,
                        moneyByGroup: {},
                        msgsByGroup: {},
                    });
                }
                const u = userMap.get(jid);
                // Aggiorna nome/pfp se mancanti e ora disponibili
                if (!u.name && (data.name || data.nickname)) u.name = data.name || data.nickname;
                if (!u.pfpUrl && data.pfpUrl) u.pfpUrl = data.pfpUrl;
                if (!u.bio && data.bio) u.bio = data.bio;
                const gName = (groupInfo[gid]?.name) || gid;
                if (!u.groups.some(g => g.jid === gid)) {
                    u.groups.push({ jid: gid, name: gName, photoUrl: groupInfo[gid]?.photoUrl || null });
                }
                u.totalMoney += Number(data.money) || 0;
                u.totalMsgs += Number(data.msgCount) || 0;
                u.totalWarnings += Number(data.warnings) || 0;
                u.moneyByGroup[gid] = Number(data.money) || 0;
                u.msgsByGroup[gid] = Number(data.msgCount) || 0;
            }
        }
        const users = [...userMap.values()].sort((a,b) => b.totalMsgs - a.totalMsgs);
        res.json({ ok: true, users, count: users.length });
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
        if (!db[gid]) db[gid] = {};
        if (!db[gid][jid]) {
            db[gid][jid] = { money: 100, warnings: 0, warnLog: [], isMuted: false, msgCount: 0, spouse: null, children: [], parents: [], inventory: [] };
        }

        const allowed = ['money', 'warnings', 'isMuted', 'msgCount', 'spouse', 'bio', 'nickname', 'name', 'pfpUrl', 'phoneNumber', 'lid'];
        for (const k of allowed) {
            if (k in patch) db[gid][jid][k] = patch[k];
        }
        // Assicura tipi
        if ('isMuted' in db[gid][jid]) db[gid][jid].isMuted = Boolean(db[gid][jid].isMuted);
        if ('money' in db[gid][jid]) db[gid][jid].money = Number(db[gid][jid].money) || 0;
        if ('warnings' in db[gid][jid]) db[gid][jid].warnings = Number(db[gid][jid].warnings) || 0;
        if ('msgCount' in db[gid][jid]) db[gid][jid].msgCount = Number(db[gid][jid].msgCount) || 0;

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
            // Cerca in tutti i gruppi per utenti — gestisce lid <-> phoneNumber
            const cleanJid = String(jid).split('@')[0].replace(/[^0-9]/g,'');
            for (const gid of Object.keys(db)) {
                if (!gid.endsWith('@g.us')) continue;
                const chat = db[gid];
                if (!chat || typeof chat !== 'object') continue;
                // Prova match esatto prima
                if (chat[jid] && chat[jid].pfpUrl) {
                    pfpCache.set(jid, { url: chat[jid].pfpUrl, ts: Date.now() });
                    return res.json({ ok: true, url: chat[jid].pfpUrl, real: true });
                }
                // Prova per numero (lid <-> pn)
                for (const [ujid, udata] of Object.entries(chat)) {
                    if (!udata || typeof udata !== 'object' || !udata.pfpUrl) continue;
                    const uNum = String(udata.phoneNumber||'').replace(/[^0-9]/g,'') || String(ujid).replace(/[^0-9]/g,'');
                    const uLidNum = String(udata.lid||'').replace(/[^0-9]/g,'');
                    const jNum = cleanJid;
                    if (uNum && jNum && (uNum===jNum || uNum.includes(jNum) || jNum.includes(uNum) || uLidNum===jNum || jNum===uLidNum)) {
                        // Se URL ha più di 20h, potrebbe essere scaduto — ritorna comunque ma marca come staled
                        const age = Date.now() - (udata.pfpUpdated||0);
                        if (age < 20*60*60*1000) {
                            pfpCache.set(jid, { url: udata.pfpUrl, ts: Date.now() });
                            return res.json({ ok: true, url: udata.pfpUrl, real: true });
                        }
                    }
                }
            }
        } catch (_) {}

        // Se è una richiesta immagine (img src), fai redirect diretto — accetta anche */* ma non application/json
        const accept = String(req.headers.accept || '');
        const isImageReq = (!accept.includes('application/json') && (accept.includes('image') || accept.includes('*/*') || req.headers['sec-fetch-dest'] === 'image')) || req.query.redirect === '1';
        // Cerca placeholder
        const initials = jid.split('@')[0].slice(-4).replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'VX';
        let bg = '7c5cff';
        try {
            let h = 0;
            for (let i = 0; i < jid.length; i++) h = (h * 31 + jid.charCodeAt(i)) >>> 0;
            const colors = ['7c5cff','ff4ecd','22c55e','f59e0b','3b82f6','ef4444','06b6d4','8b5cf6'];
            bg = colors[h % colors.length];
        } catch (_) {}
        const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=fff&size=128&bold=true&format=svg`;
        if (isImageReq) {
            let realUrl = null;
            try {
                const db2 = safeReadJSON(DB_FILE, {});
                if (jid.endsWith('@g.us') && db2._groupInfo?.[jid]?.photoUrl) realUrl = db2._groupInfo[jid].photoUrl;
                else {
                    const cleanJid2 = String(jid).split('@')[0].replace(/[^0-9]/g,'');
                    for (const gid of Object.keys(db2)) {
                        if (!gid.endsWith('@g.us')) continue;
                        const chat2 = db2[gid];
                        if (!chat2 || typeof chat2 !== 'object') continue;
                        const direct = chat2[jid];
                        if (direct?.pfpUrl && (!direct.pfpUpdated || Date.now() - direct.pfpUpdated < 20*60*60*1000)) { realUrl = direct.pfpUrl; break; }
                        for (const [ujid2, udata2] of Object.entries(chat2)) {
                            if (!udata2?.pfpUrl) continue;
                            if (udata2.pfpUpdated && Date.now() - udata2.pfpUpdated >= 20*60*60*1000) continue;
                            const uNum2 = String(udata2.phoneNumber||'').replace(/[^0-9]/g,'') || String(ujid2).replace(/[^0-9]/g,'');
                            const uLidNum2 = String(udata2.lid||'').replace(/[^0-9]/g,'');
                            if (uNum2===cleanJid2 || uLidNum2===cleanJid2 || (uNum2 && cleanJid2 && (uNum2.includes(cleanJid2) || cleanJid2.includes(uNum2)))) { realUrl = udata2.pfpUrl; break; }
                        }
                        if (realUrl) break;
                    }
                }
            } catch (_) {}
            const target = realUrl || placeholder;
            if (target.startsWith('http')) {
                // Prova a fare proxy dell'immagine per evitare problemi CORS/scadenza
                // Se è placeholder ui-avatars, fai redirect diretto
                if (target.includes('ui-avatars.com')) return res.redirect(target);
                // Per URL WhatsApp (pps.whatsapp.net), prova a fare fetch e stream
                try {
                    const https = require('https');
                    const http = require('http');
                    const lib = target.startsWith('https') ? https : http;
                    const u = new URL(target);
                    // Imposta timeout e headers per fetch
                    const fetchPromise = new Promise((resolve, reject) => {
                        const req = lib.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'GET', timeout: 4000, headers: { 'User-Agent': 'VexBot/1.0' } }, (r) => {
                            if (r.statusCode >= 200 && r.statusCode < 300) {
                                res.setHeader('Content-Type', r.headers['content-type'] || 'image/jpeg');
                                res.setHeader('Cache-Control', 'public, max-age=3600');
                                r.pipe(res);
                                resolve(true);
                            } else {
                                reject(new Error('status '+r.statusCode));
                            }
                        });
                        req.on('error', reject);
                        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                        req.end();
                    });
                    const ok = await Promise.race([fetchPromise, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),4500))]).catch(()=>false);
                    if (ok) return;
                } catch(_){}
                return res.redirect(target);
            }
            return res.json({ ok: true, url: target });
        }

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

app.post('/api/update', async (req, res) => {
    try {
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);
        const projectDir = ROOT;
        // git pull
        try {
            await execFileAsync('git', ['fetch', 'origin', 'master'], { cwd: projectDir, timeout: 60000 });
            const { stdout: localHead } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: projectDir });
            const { stdout: remoteHead } = await execFileAsync('git', ['rev-parse', 'FETCH_HEAD'], { cwd: projectDir });
            if (localHead.trim() === remoteHead.trim()) {
                return res.json({ ok: true, message: 'Già aggiornato', updated: false });
            }
            await execFileAsync('git', ['reset', '--hard', remoteHead.trim()], { cwd: projectDir });
            await execFileAsync('git', ['clean', '-fd', '-e', 'node_modules', '-e', '.env', '-e', 'auth_info_baileys', '-e', 'data', '-e', 'temp', '-e', 'logs'], { cwd: projectDir });
            // Segnala al bot di riavviarsi (il bot watcherà .restart-msg.json o .bot.pid)
            try { fs.writeFileSync(path.join(projectDir, '.restart-msg.json'), JSON.stringify({ from: null, message: '🔄 Aggiornamento da dashboard completato.' }), 'utf-8'); } catch (_) {}
            // Prova a riavviare il bot se ha PID
            try {
                const botPidFile = path.join(projectDir, '.bot.pid');
                if (fs.existsSync(botPidFile)) {
                    const pid = Number(String(fs.readFileSync(botPidFile, 'utf-8')).trim());
                    if (pid) try { process.kill(pid, 'SIGTERM'); } catch (_) {}
                }
            } catch (_) {}
            // Non sterzare la dashboard qui — il frontend farà reload e prenderà i nuovi file statici.
            // Se serve riavvio server per nuove API, l'utente può fare .aggiorna dal bot (che già riavvia dashboard via .restart)
            res.json({ ok: true, message: `Aggiornato a ${remoteHead.trim().slice(0,7)} — ricarica la pagina tra 3s. Per riavvio completo fai .aggiorna su WhatsApp.`, updated: true });
        } catch (e) {
            res.status(500).json({ ok: false, error: e.message });
        }
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ── API: Theme (persistenza colori/sfondo) ──────────────────────────────
const THEME_FILE = path.join(__dirname, 'theme.json');
app.get('/api/theme', (req, res) => {
    try {
        const t = safeReadJSON(THEME_FILE, null);
        res.json({ ok: true, theme: t });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
app.put('/api/theme', (req, res) => {
    try {
        const body = req.body || {};
        // Salva solo campi noti
        const allowed = ['accent','accent2','bg','panel','blur','opacity','indicator','liquid','bgPreset','bgUrl','bgData'];
        const out = {};
        for (const k of allowed) if (body[k] !== undefined) out[k] = body[k];
        if (!safeWriteJSON(THEME_FILE, out)) return res.status(500).json({ ok: false, error: 'Scrittura fallita' });
        res.json({ ok: true, theme: out });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Static ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── PID e watcher per restart da .aggiorna ─────────────────────────────
const PID_FILE = path.join(__dirname, '.pid');
const RESTART_FILE = path.join(__dirname, '.restart');
try { fs.writeFileSync(PID_FILE, String(process.pid), 'utf-8'); } catch (_) {}
const cleanPid = () => { try { fs.unlinkSync(PID_FILE); } catch (_) {} };
process.on('exit', cleanPid);
process.on('SIGINT', () => { cleanPid(); process.exit(0); });
process.on('SIGTERM', () => { cleanPid(); process.exit(0); });
try {
    if (fs.existsSync(RESTART_FILE)) fs.unlinkSync(RESTART_FILE);
    fs.watch(__dirname, (event, filename) => {
        if (filename === '.restart') {
            console.log('[DASH] Segnale .aggiorna ricevuto — riavvio...');
            cleanPid();
            setTimeout(() => process.exit(0), 800);
        }
    });
} catch (_) {}

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
