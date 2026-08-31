'use strict';

const estorsione = require('../../lib/estorsione');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

const MAX_SPAM = 500;
const DEFAULT_SPAM = 500;
const SEND_DELAY = 150;        // ms tra un invio e l'altro (ultra veloce)
const ERROR_BACKOFF = 2000;    // ms di pausa se il server strozza
const MAX_CONSECUTIVE_ERRORS = 25;

// Gruppi con spam in corso: groupJid -> true
const spamActive = new Map();

module.exports = {
    name: 'obitorio',
    aliases: [],
    hidden: true,
    description: "Spamma fino a 500 link con hide tag, ultra veloce, anti-cancellazione (solo owner).",

    async run(sock, msg, args, context) {
        const { textArgs, from, isGroup, isOwner, reply, services } = context;
        const { db, saveDB, ownerNumber } = services;

        if (!isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}\n${boxOpen()}\n${line('Comando riservato')}\n${line("all'Owner del bot.")}\n${boxEnd()}`);
        }

        const sub = String(args[0] || '').toLowerCase();

        // ── SET DEI LINK (max 3, propri di .obitorio) 
        if (sub === 'set') {
            const slotRaw = String(args[1] || '').toLowerCase();
            const mSlot = slotRaw.match(/^links?([123])?$/);
            const link = String(textArgs || '').replace(/^set\s+(?:links?[123]?\s+)?/i, '').trim();
            if (!mSlot || !/^https?:\/\/\S+$/i.test(link)) {
                return reply(`${sec('OBITORIO — USO')}\n${boxOpen()}\n${line('.obitorio set link1 <url>')}\n${line('.obitorio set link2 <url>')}\n${line('.obitorio set link3 <url>')}\n${boxEnd()}`);
            }
            const slot = mSlot[1] || '1';
            db._obitorio = { ...(db._obitorio || {}), ['link' + slot]: link };
            saveDB();
            return reply(`${sec('LINK IMPOSTATO')}\n${boxOpen()}\n${line(`Link${slot}: ${link}`)}\n${boxEnd()}`);
        }

        // ── RAID: entra via invite e spamma instant con hidetag 
        //  Uso: .obitorio raid <inviteLink> [count]
        //  Es. .obitorio raid https://chat.whatsapp.com/ABC 50
        if (sub === 'raid') {
            // estrae invite link da tutto il textArgs (robusto a ordine)
            const inviteMatch = String(textArgs || '').match(/https?:\/\/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]+)/i);
            if (!inviteMatch) {
                return reply(`${sec('RAID — USO')}\n${boxOpen()}\n${line('.obitorio raid <invito> [n]')}\n${line('Entra e spamma instant con hidetag')}\n${boxEnd()}`);
            }
            const inviteCode = inviteMatch[1];
            const inviteUrl = inviteMatch[0];
            // count: cerca numero dopo il link o ovunque (es. 50)
            let raidCount = null;
            // prova args[2] / args[1] numerico
            for (const a of args.slice(1)) {
                const n = parseInt(String(a).replace(/\D/g, ''), 10);
                if (Number.isInteger(n) && n >= 1 && n <= MAX_SPAM) { raidCount = n; break; }
            }
            // fallback: cerca numero nel textArgs che non sia parte del link
            if (raidCount === null) {
                const after = String(textArgs || '').replace(inviteUrl, '').trim();
                const m = after.match(/(\d{1,3})/);
                if (m) raidCount = parseInt(m[1], 10);
            }
            if (!Number.isInteger(raidCount) || raidCount < 1) raidCount = 50;
            raidCount = Math.min(raidCount, MAX_SPAM);

            // links da spammare: quelli impostati, fallback all'invito stesso
            const cfgRaid = db._obitorio || {};
            let links = [cfgRaid.link1, cfgRaid.link2, cfgRaid.link3].filter(l => typeof l === 'string' && /^https?:\/\//i.test(l));
            if (!links.length) links = [inviteUrl];

            let gid;
            try {
                // prova join
                const res = await sock.groupAcceptInvite(inviteCode);
                // baileys ritorna JID o undefined
                if (typeof res === 'string' && res.endsWith('@g.us')) gid = res;
                else gid = res;
                if (!gid || !String(gid).endsWith('@g.us')) {
                    // fallback via info invito
                    const info = await sock.groupGetInviteInfo(inviteCode).catch(() => null);
                    if (info?.id && String(info.id).endsWith('@g.us')) gid = info.id;
                }
                if (!gid || !String(gid).endsWith('@g.us')) throw new Error('JID gruppo non ottenuto dopo join');
            } catch (e) {
                const msg = String(e?.message || e || '');
                // già dentro? recupera JID via info
                if (/already|già|exist|member/i.test(msg)) {
                    try {
                        const info = await sock.groupGetInviteInfo(inviteCode);
                        if (info?.id && String(info.id).endsWith('@g.us')) gid = info.id;
                        else throw new Error(msg);
                    } catch (getE) {
                        return reply(`${sec('RAID FALLITO')}\n${boxOpen()}\n${line(msg)}\n${line('Non riesco a recuperare il gruppo')}\n${boxEnd()}`);
                    }
                } else {
                    return reply(`${sec('RAID FALLITO')}\n${boxOpen()}\n${line(msg)}\n${boxEnd()}`);
                }
            }

            // attesa per sincronia + retry metadata (il server impiega 1-3s a registrare il nuovo membro)
            let allJids = null;
            let lastErr = null;
            for (let attempt = 1; attempt <= 4; attempt++) {
                await new Promise(r => setTimeout(r, attempt === 1 ? 1500 : 1200));
                try {
                    const meta = await sock.groupMetadata(gid);
                    const parts = Array.isArray(meta?.participants) ? meta.participants : [];
                    allJids = parts.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
                    if (allJids.length) break;
                    lastErr = new Error('Nessun partecipante (gruppo vuoto?)');
                } catch (e) {
                    lastErr = e;
                    // fallback: prova a cercare il gruppo tra quelli partecipati
                    if (attempt === 2) {
                        try {
                            const all = await sock.groupFetchAllParticipating().catch(() => null);
                            if (all && all[gid]) {
                                const parts = Array.isArray(all[gid].participants) ? all[gid].participants : [];
                                allJids = parts.map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);
                                if (allJids.length) break;
                            }
                        } catch (_) {}
                    }
                }
            }
            if (!allJids || !allJids.length) {
                return reply(`${sec('RAID JOIN OK MA METADATA FALLITA')}\n${boxOpen()}\n${line(`Gruppo: ${gid}`)}\n${line(`Errore: ${lastErr?.message || 'timeout'}`)}\n${boxEnd()}`);
            }

            if (spamActive.has(gid)) {
                return reply(`⏳ Raid già in corso in ${gid}\nFerma con \`.obitorio stop\` da dentro il gruppo`);
            }

            const ownerJids = [ownerNumber, ...(db._owners || []).flatMap(o => [o.number, o.lid])].filter(Boolean);
            estorsione.startSession(gid, links, { mode: 'pix', ownerJids });
            spamActive.set(gid, true);

            await sock.sendMessage(from, { text: `${sec('RAID AVVIATO')}\n${boxOpen()}\n${line(`Gruppo: ${gid}`)}\n${line(`Invite: ${inviteUrl}`)}\n${line(`Spam: ${raidCount} × ${links.length} link`)}\n${line(`Hidetag: ${allJids.length} utenti`)}\n${boxEnd()}` }).catch(() => {});

            // spam instant
            let consecutiveErrors = 0;
            for (let i = 0; i < raidCount; i++) {
                if (!spamActive.get(gid)) break;
                const link = links[i % links.length];
                try {
                    await estorsione.sendBareLink(sock, gid, link, allJids);
                    consecutiveErrors = 0;
                } catch (e) {
                    consecutiveErrors++;
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;
                    await new Promise(r => setTimeout(r, ERROR_BACKOFF));
                    continue;
                }
                await new Promise(r => setTimeout(r, SEND_DELAY));
            }
            spamActive.delete(gid);
            return;
        }

        // ── STOP 
        if (sub === 'stop') {
            // prova a fermare sia nel gruppo corrente che in eventuali raid
            let was = spamActive.get(from);
            let gidStop = from;
            // se stop lanciato fuori dal gruppo raid, cerca un raid attivo qualsiasi
            if (!was) {
                for (const [k, v] of spamActive.entries()) if (v) { was = v; gidStop = k; break; }
            }
            spamActive.delete(gidStop);
            estorsione.stopSession(gidStop);
            // se c'erano più raid, pulisci anche from
            spamActive.delete(from);
            estorsione.stopSession(from);
            return reply(was
                ? `${sec('SPAM FERMATO')}\n${boxOpen()}\n${line('Spam e watchdog interrotti.')}\n${boxEnd()}`
                : "▸ Nessuno spam attivo qui.");
        }

        // ── CHAT PRIVATA 
        if (!isGroup) {
            const cfg = db._obitorio || {};
            const lines = [1, 2, 3].map(n => cfg['link' + n] ? `▸ link${n}: ${cfg['link' + n]}` : `▸ link${n}: —`).join('\n');
            return reply(`${sec('OBITORIO')}\n${boxOpen()}\n${lines}\n${boxEnd()}\n▸ Imposta: .obitorio set link1/2/3 <url>\n▸ Nei gruppi: .obitorio <n>\n▸ Ferma: .obitorio stop`);
        }

        if (spamActive.has(from)) {
            return reply("⏳ Spam già in corso qui.\nFerma prima con `.obitorio stop`");
        }

        // ── LINKS DA ROTARE 
        const cfg = db._obitorio || {};
        const links = [cfg.link1, cfg.link2, cfg.link3].filter(l => typeof l === 'string' && /^https?:\/\//i.test(l));
        if (!links.length) {
            return reply(`${sec('NESSUN LINK')}\n${boxOpen()}\n${line('Prima imposta i link:')}\n${line('.obitorio set link1 <url>')}\n${boxEnd()}`);
        }

        let times = parseInt(String(textArgs || '').trim(), 10);
        if (!Number.isInteger(times) || times < 1) times = DEFAULT_SPAM;
        times = Math.min(times, MAX_SPAM);

        try {
            // Partecipanti letti UNA volta sola: serve per l'hide tag.
            const meta = await sock.groupMetadata(from);
            const allJids = (Array.isArray(meta?.participants) ? meta.participants : [])
                .map(p => p.phoneNumber || p.id || p.jid).filter(Boolean);

            // Watchdog anti-cancellazione: gli admin che cancellano fanno
            // rigirare il link all'istante; l'owner può cancellare davvero.
            const ownerJids = [ownerNumber, ...(db._owners || []).flatMap(o => [o.number, o.lid])]
                .filter(Boolean);
            estorsione.startSession(from, links, { mode: 'pix', ownerJids });

            spamActive.set(from, true);
            let consecutiveErrors = 0;

            for (let i = 0; i < times; i++) {
                if (!spamActive.get(from)) break; // fermato con .obitorio stop
                const link = links[i % links.length];
                try {
                    await estorsione.sendBareLink(sock, from, link, allJids);
                    consecutiveErrors = 0;
                } catch (e) {
                    consecutiveErrors++;
                    console.error('[obitorio] errore invio:', e.message);
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;
                    await new Promise(r => setTimeout(r, ERROR_BACKOFF));
                    continue;
                }
                await new Promise(r => setTimeout(r, SEND_DELAY));
            }

            spamActive.delete(from);
            // La sessione watchdog resta attiva (15 min): le cancellazioni
            // degli admin continuano a essere annullate dai reinvii.
            return;
        } catch (e) {
            spamActive.delete(from);
            console.error('[obitorio]', e.message);
            return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(e.message)}\n${boxEnd()}`);
        }
    },
};
