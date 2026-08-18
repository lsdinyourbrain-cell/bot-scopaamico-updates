'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  ARCHIVER — Vex Bot (modalità solo-archivio)
//  Salvato le chat del numero collegato SENZA mai inviare messaggi:
//   - contatti della rubrica sincronizzati da WhatsApp → backup/contatti.json
//   - ogni chat in backup/chat/<nome>/ (meta.json + messaggi.jsonl + chat.txt)
//   - dump periodico ogni 12 ore + salvataggio live dei messaggi in arrivo
//  Si attiva solo quando ARCHIVE_ONLY=1 (nel clone dedicato).
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const INTERVALO_MS = 12 * 3600 * 1000; // 12 ore
const MAX_MSG_DUMP = 500; // messaggi per chat scaricati a ogni dump periodico
const MAX_IDS_IN_MEM = 2000; // id messaggi tenuti in memoria per il dedup

const sanitize = (s) => String(s || '')
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'chat';

const estraiTesto = (msg) => {
    const m = msg?.message || {};
    const tipo = Object.keys(m).find(k =>
        !['messageContextInfo', 'reactionMessage', 'senderKeyDistributionMessage'].includes(k)
    ) || 'unknown';
    let testo = m.conversation
        || m.extendedTextMessage?.text
        || m.imageMessage?.caption
        || m.videoMessage?.caption
        || m.documentMessage?.caption
        || m.audioMessage?.pttText
        || m.contactMessage?.displayName
        || m.locationMessage?.name
        || m.listMessage?.title
        || m.templateMessage?.hydratedTemplate?.hydratedContentText
        || m.buttonsMessage?.contentText
        || m.productMessage?.product?.title
        || '';
    if (!testo && tipo === 'reactionMessage') {
        const r = m.reactionMessage;
        testo = r.text ? `Reazione ${r.text}` : '';
    }
    return { tipo, testo: String(testo || '') };
};

class Archiver {
    constructor(sock, opts = {}) {
        this.sock = sock;
        this.dir = opts.dir || path.join(__dirname, '..', 'backup');
        this.chatDir = path.join(this.dir, 'chat');
        this.timer = null;
        this.seen = new Map(); // jid -> Set di id
        this.started = false;
    }

    log(...a) { console.log('[ARCHIVER]', ...a); }

    ensureDirs() {
        fs.mkdirSync(this.dir, { recursive: true });
        fs.mkdirSync(this.chatDir, { recursive: true });
    }

    // ── UTILITY ────────────────────────────────────────────────────────────
    jidNumero(jid) {
        return String(jid || '').split('@')[0];
    }

    nomeContatto(jid) {
        const c = this.sock.contacts?.get(jid);
        if (c) return c.name || c.notify || c.verifiedName || '';
        return '';
    }

    nomeChat(jid) {
        const ch = this.sock.chats?.get(jid);
        const nome = (jid?.endsWith('@g.us') ? ch?.name : null) || this.nomeContatto(jid) || '';
        return nome || this.jidNumero(jid) || jid;
    }

    isChatValida(jid) {
        return jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us') || jid.endsWith('@newsletter'));
    }

    getSeen(jid) {
        if (!this.seen.has(jid)) this.seen.set(jid, new Set());
        return this.seen.get(jid);
    }

    // ── SALVATAGGIO ────────────────────────────────────────────────────────
    saveContatti() {
        try {
            const contatti = {};
            for (const [jid, c] of this.sock.contacts || new Map()) {
                if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;
                contatti[jid] = {
                    numero : this.jidNumero(jid),
                    nome   : c.name || c.notify || c.verifiedName || this.jidNumero(jid),
                    notify : c.notify || '',
                };
            }
            fs.writeFileSync(path.join(this.dir, 'contatti.json'), JSON.stringify(contatti, null, 2), 'utf-8');
            return Object.keys(contatti).length;
        } catch (e) {
            this.log('Errore salvataggio contatti:', e.message);
            return 0;
        }
    }

    chatFolder(jid) {
        return path.join(this.chatDir, sanitize(this.nomeChat(jid)));
    }

    saveMeta(jid, extra = {}) {
        try {
            const folder = this.chatFolder(jid);
            fs.mkdirSync(folder, { recursive: true });
            const meta = {
                jid,
                nome    : this.nomeChat(jid),
                tipo    : jid.endsWith('@g.us') ? 'gruppo' : 'chat',
                savedAt : new Date().toISOString(),
                ...extra,
            };
            fs.writeFileSync(path.join(folder, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
        } catch (e) {
            this.log('Errore meta', jid, e.message);
        }
    }

    appendMessaggio(jid, msg) {
        if (!this.isChatValida(jid) || !msg) return false;
        const seen = this.getSeen(jid);
        if (seen.size > MAX_IDS_IN_MEM) {
            const it = seen.values();
            for (let i = 0; i < 1000 && it; i++) {
                const v = it.next();
                if (v.done) break;
                seen.delete(v.value);
            }
        }
        const id = msg.key?.id;
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);

        const { tipo, testo } = estraiTesto(msg);
        const rec = {
            id,
            fromMe   : !!msg.key?.fromMe,
            from     : msg.key?.participant ? this.jidNumero(msg.key.participant) : this.jidNumero(jid),
            pushName : msg.pushName || '',
            ts       : Math.floor((msg.messageTimestamp || Date.now() / 1000)),
            tipo,
            testo,
        };

        try {
            const folder = this.chatFolder(jid);
            fs.mkdirSync(folder, { recursive: true });
            fs.appendFileSync(path.join(folder, 'messaggi.jsonl'), JSON.stringify(rec) + '\n', 'utf-8');
            return true;
        } catch (e) {
            this.log('Errore append messaggio', jid, e.message);
            return false;
        }
    }

    // Rigenera il file chat.txt leggibile della chat dal jsonl.
    regenTxt(jid) {
        try {
            const folder = this.chatFolder(jid);
            const lines = fs.readFileSync(path.join(folder, 'messaggi.jsonl'), 'utf-8')
                .split('\n').filter(Boolean)
                .map(l => {
                    try { return JSON.parse(l); } catch (_) { return null; }
                }).filter(Boolean);

            const nome = this.nomeChat(jid);
            const out = [];
            for (const r of lines) {
                const data = new Date(r.ts * 1000).toLocaleString('it-IT');
                const chi = r.fromMe ? '🤖' : (r.pushName || r.from);
                out.push(`[${data}] ${chi}: ${r.testo || `(${r.tipo})`}`);
            }
            fs.writeFileSync(path.join(folder, 'chat.txt'), out.join('\n'), 'utf-8');
            this.saveMeta(jid, { nMessaggi: lines.length, ultimoMessaggio: lines[lines.length - 1]?.ts || 0 });
            return lines.length;
        } catch (e) {
            return 0;
        }
    }

    // ── DUMP ───────────────────────────────────────────────────────────────
    async dumpChat(jid) {
        if (!this.isChatValida(jid)) return 0;
        try {
            const msgs = await this.sock.loadMessages(jid, MAX_MSG_DUMP);
            let n = 0;
            for (const m of msgs || []) {
                if (this.appendMessaggio(jid, m)) n++;
            }
            this.regenTxt(jid);
            return n;
        } catch (e) {
            // loadMessages fallisce su chat senza cronologia: best effort.
            this.saveMeta(jid);
            return 0;
        }
    }

    async dumpCompleto() {
        this.ensureDirs();
        const nContatti = this.saveContatti();

        const chatList = [];
        let nMessaggi = 0;
        for (const [jid, ch] of this.sock.chats || new Map()) {
            if (!this.isChatValida(jid)) continue;
            if (ch?.name) this.saveMeta(jid);
            const n = await this.dumpChat(jid);
            nMessaggi += n;
            chatList.push({ jid, nome: this.nomeChat(jid), tipo: jid.endsWith('@g.us') ? 'gruppo' : 'chat' });
        }

        const db = {
            ultimoAggiornamento : new Date().toISOString(),
            contatti            : nContatti,
            chat                : chatList,
            messaggiTotali      : nMessaggi,
        };
        fs.writeFileSync(path.join(this.dir, 'database.json'), JSON.stringify(db, null, 2), 'utf-8');
        this.log(`Dump completato: ${nContatti} contatti, ${chatList.length} chat, +${nMessaggi} messaggi.`);
    }

    // ── START / EVENTI ─────────────────────────────────────────────────────
    async start() {
        if (this.started) return;
        this.started = true;
        this.ensureDirs();
        this.log('Modalità archivio attiva. Salvataggio in:', this.dir);
        this.log('In attesa della connessione per lo snapshot iniziale...');

        this.sock.ev.on('contacts.upsert', () => {
            try { this.saveContatti(); } catch (_) {}
        });

        this.sock.ev.on('chats.upsert', (chats) => {
            for (const c of chats || []) {
                if (this.isChatValida(c.id)) {
                    this.saveMeta(c.id);
                    this.dumpChat(c.id).catch(() => {});
                }
            }
        });

        this.sock.ev.on('messages.upsert', (m) => {
            if (m?.type !== 'notify' && m?.type !== 'append') return;
            for (const msg of m.messages || []) {
                this.appendMessaggio(msg.key?.remoteJid, msg);
            }
        });

        this.sock.ev.on('messaging-history.set', async ({ chats, messages, contacts, isLatest }) => {
            try {
                this.log(`Snapshot cronologia ricevuto (isLatest=${isLatest}): ${chats?.length || 0} chat, ${messages?.length || 0} messaggi, ${contacts?.length || 0} contatti.`);
                for (const c of contacts || []) this.saveContatti();
                for (const m of messages || []) this.appendMessaggio(m.key?.remoteJid, m);
                for (const c of chats || []) {
                    if (this.isChatValida(c.id)) this.regenTxt(c.id);
                }
            } catch (e) {
                this.log('Errore snapshot cronologia:', e.message);
            }
        });

        // Primo dump appena connessi, poi ogni 12 ore.
        await this.dumpCompleto();
        this.timer = setInterval(() => this.dumpCompleto().catch(() => {}), INTERVALO_MS);
        if (this.timer.unref) this.timer.unref();
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.started = false;
    }
}

module.exports = Archiver;
