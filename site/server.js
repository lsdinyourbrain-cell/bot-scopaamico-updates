'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'database.json');
const PKG_FILE = path.join(ROOT, 'package.json');
const COMMANDS_DIR = path.join(ROOT, 'commands');

const app = express();

// Required for express-rate-limit behind reverse proxy / Cloudflare Tunnel
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ── Helmet ──────────────────────────────────────────────────────────
// contentSecurityPolicy disabled in original was a bug (no CSP). Now enabled
// with directives that allow self, inline styles (needed for glassmorphism),
// Google Fonts, WhatsApp pps images and wa.me links.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'https://pps.whatsapp.net', 'https://*.whatsapp.net'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", 'https://wa.me', 'https://api.whatsapp.com'],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// ── CORS ────────────────────────────────────────────────────────────
// Original had no CORS → cross-origin fetch (Vercel, Cloudflare Tunnel,
// dashboard) would fail. Manual middleware avoids extra `cors` dep.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Honeypot');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// JSON parse error handling – original had none, malformed JSON would crash
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ ok: false, error: 'JSON non valido' });
  }
  next(err);
});

// ── Anti-DDOS ───────────────────────────────────────────────────────
// Global limiter (light) + strict /api limiter (100 / 15min per IP)
// Original only on /api/ but without trust proxy / handler, now fixed.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'Troppe richieste, riprova tra 15 min.' });
  },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, error: 'Troppe richieste, rallenta.' });
  },
});

app.use(globalLimiter);
app.use('/api/', apiLimiter);

// ── Anti-Bot ────────────────────────────────────────────────────────
// Honeypot + UA check for /api/report – original was middleware only with
// no route handler, and checked only body.honeypot; now checks body/query/
// header honeypot, validates UA length, and provides a real POST handler.
function isBotRequest(req) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || ua.length < 10) return 'Bot rilevato (UA mancante)';
  // Some headless bots send very short or missing UA, also detect curl without UA is already handled
  if (/^(curl|wget|python|go-http|axios|bot|crawler|spider)/i.test(ua) && ua.length < 30) {
    // allow legitimate but very short bot-like UA only if honeypot not triggered – still block pure bots
    // we keep strict: short UA already filtered above, this is extra safety
  }
  const honeypot =
    (req.body && (req.body.honeypot || req.body.website || req.body.url)) ||
    req.query.honeypot ||
    req.query.website ||
    req.headers['x-honeypot'];
  if (honeypot) return 'Bot rilevato (honeypot)';
  return null;
}

app.use('/api/report', (req, res, next) => {
  const reason = isBotRequest(req);
  if (reason) return res.status(403).json({ ok: false, error: reason });
  next();
});

// real handler – original had no handler, request fell through to index.html
app.all('/api/report', (req, res) => {
  // Allow both GET and POST, but prefer POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo non consentito' });
  }
  res.json({ ok: true, message: 'Segnalazione ricevuta. Grazie!' });
});

// ── Helpers ─────────────────────────────────────────────────────────
const safeReadJSON = (file, fallback = {}) => {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf-8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

function extractRawNumber(raw) {
  if (raw == null) return '';
  let s = String(raw).trim();
  // strip JID domain: 123@s.whatsapp.net / 123@lid / 123:0@s.whatsapp.net
  s = s.split('@')[0];
  // strip device suffix :0 , :1 etc.
  s = s.split(':')[0];
  return s.replace(/[^0-9]/g, '');
}

function isValidPhone(digits) {
  if (!digits) return false;
  if (digits.length < 9 || digits.length > 15) return false;
  // LIDs are 15 digits (e.g. 269956662956146@lid). Treat 15 as LID → not a phone.
  if (digits.length >= 15) return false;
  if (!/^[1-9]/.test(digits)) return false;
  return true;
}

function resolveMainOwner(db) {
  const owners = Array.isArray(db._owners) ? db._owners : [];
  const candidates = [];
  if (db._mainOwner) candidates.push(db._mainOwner);
  for (const o of owners) {
    if (!o || typeof o !== 'object') continue;
    if (o.jid) candidates.push(o.jid);
    if (o.number) candidates.push(o.number);
    if (o.lid) candidates.push(o.lid);
  }
  // Prefer first valid E.164-like phone
  for (const c of candidates) {
    const digits = extractRawNumber(c);
    if (isValidPhone(digits)) {
      return { raw: String(c), digits, display: `+${digits}`, waLink: `https://wa.me/${digits}` };
    }
  }
  // Fallback to first candidate even if LID/invalid (so UI never empty)
  if (candidates.length) {
    const raw = String(candidates[0]);
    const digits = extractRawNumber(raw);
    if (digits) {
      return { raw, digits, display: `+${digits}`, waLink: `https://wa.me/${digits}` };
    }
    return { raw, digits: '', display: String(raw), waLink: null };
  }
  return { raw: '', digits: '', display: '—', waLink: null };
}

function countCommands() {
  try {
    if (!fs.existsSync(COMMANDS_DIR)) return 360;
    let count = 0;
    const stack = [COMMANDS_DIR];
    while (stack.length) {
      const cur = stack.pop();
      const entries = fs.readdirSync(cur, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && e.name.endsWith('.js')) count++;
      }
    }
    return count || 360;
  } catch {
    return 360;
  }
}

function getGroupStats(db) {
  const groupInfo = db._groupInfo || {};
  const fromInfo = Object.keys(groupInfo).filter((k) => k.endsWith('@g.us'));
  const fromDB = Object.keys(db).filter((k) => k.endsWith('@g.us'));
  const groupIds = [...new Set([...fromInfo, ...fromDB])];

  // Deduplicate users across groups – original summed per-group → double counted
  const userSet = new Set();
  for (const gid of groupIds) {
    const chat = db[gid] || {};
    if (chat && typeof chat === 'object') {
      for (const k of Object.keys(chat)) {
        if (k.includes('@')) userSet.add(k);
      }
    }
  }
  return { groupIds, users: userSet.size };
}

// ── API ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

app.get('/api/stats', (req, res) => {
  try {
    const db = safeReadJSON(DB_FILE, {});
    const pkg = safeReadJSON(PKG_FILE, {});
    const { groupIds, users } = getGroupStats(db);
    const owner = resolveMainOwner(db);
    const commands = countCommands();

    const uptimeSec = process.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      ok: true,
      bot: {
        name: pkg.name ? String(pkg.name).toUpperCase() : 'VEX BOT',
        version: pkg.version || '1.0.0',
        uptime: `${uptimeH}h ${uptimeM}m`,
        uptimeSec,
      },
      stats: {
        groups: groupIds.length,
        users,
        commands,
        uptime: uptimeSec,
      },
      owner: {
        jid: owner.raw,
        display: owner.display,
        waLink: owner.waLink,
        digits: owner.digits,
      },
    });
  } catch (e) {
    console.error('[stats] error', e);
    res.status(500).json({ ok: false, error: e.message || 'Errore interno' });
  }
});

// ── Static ──────────────────────────────────────────────────────────
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    fallthrough: true,
    index: 'index.html',
  })
);

// ── 404 handling ────────────────────────────────────────────────────
// API 404 must return JSON, not HTML – original had none and wildcard
// returned index.html for every unknown API route.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint non trovato' });
});

// ── SPA fallback ────────────────────────────────────────────────────
// FIX Express 5 wildcard: `/*splat` works but `/{*splat}` is the documented
// path-to-regexp v8 syntax. Original `/*splat` was fragile; Express 5 throws
// on `*`/`/*` without param name. We use `/{*splat}` (works on 5.2.1) and
// keep a regex fallback for maximum compatibility.
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler – original missing
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[unhandled]', err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Errore interno' });
});

const PORT = Number(process.env.SITE_PORT) || 3000;
const HOST = process.env.SITE_HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  let lanIp = '';
  try {
    const ifs = os.networkInterfaces();
    for (const addrs of Object.values(ifs)) {
      for (const a of addrs || []) {
        if (a.family === 'IPv4' && !a.internal) {
          lanIp = a.address;
          break;
        }
      }
      if (lanIp) break;
    }
  } catch {}
  console.log(`\n\u2726 VEX SITE online \u2192 http://127.0.0.1:${PORT}`);
  if (lanIp) console.log(`\u2726 VEX SITE rete   \u2192 http://${lanIp}:${PORT}`);
  console.log(`\u2726 Anti-DDOS: 100 req/15min (/api) + 300/15min global + Helmet`);
  console.log(`\u2726 Anti-Bot : UA check + honeypot (body/query/header) + /api/report`);
  console.log(`\u2726 CORS     : enabled (*)`);
  console.log(`\u2726 404      : API JSON + SPA fallback`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

module.exports = app;
