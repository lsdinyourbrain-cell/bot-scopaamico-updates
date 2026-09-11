'use strict';

const fs = require('fs');
const path = require('path');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const SB = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D5D4 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D5EE + cc - 97);
    if (cc >= 48 && cc <= 57) return String.fromCodePoint(0x1D7E2 + cc - 48);
    return c;
}).join('');

const BF = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D56C + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D586 + cc - 97);
    return c;
}).join('');

const MS = (s) => s.split('').map(c => {
    const cc = c.charCodeAt(0);
    if (cc >= 65 && cc <= 90) return String.fromCodePoint(0x1D670 + cc - 65);
    if (cc >= 97 && cc <= 122) return String.fromCodePoint(0x1D68A + cc - 97);
    return c;
}).join('');

// Formatta i numeri di telefono per la visualizzazione quando non si tagga
const formatPhoneNumber = (numStr) => {
    if (!numStr) return 'Sconosciuto';
    const clean = String(numStr).replace(/\D/g, '');
    if (clean === '15483147193') return '+1 (548) 314-7193';
    if (clean.length === 11 && clean.startsWith('1')) {
        return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
    }
    return `+${clean}`;
};

module.exports = {
    name: 'infobot',
    aliases: ['botinfo', 'about'],
    description: "Mostra informazioni sul bot, owner e co-owner.",

    async run(sock, msg, args, context) {
        const { from, pushName, isGroup, services } = context;
        const { db, sameJid, ownerNumber, sendButtons, projectDir } = services;

        const mentions = [];

        // Owner/main SEMPRE freschi da disco: il sito scrive database.json e il
        // merge in memoria può arrivare in ritardo — .infobot non deve mai mostrare dati vecchi.
        let diskOwners = null, diskMain = null;
        try {
            const dbPath = projectDir
                ? path.join(projectDir, 'database.json')
                : path.join(__dirname, '..', '..', 'database.json');
            const fresh = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
            if (Array.isArray(fresh._owners)) diskOwners = fresh._owners;
            if (fresh._mainOwner) diskMain = fresh._mainOwner;
        } catch (_) {}

        // Owner principale DINAMICO (dal sito via db._mainOwner, fallback storico)
        const MAIN_OWNER_NUM_FALLBACK = '15483147193';
        const _mainRaw = diskMain || db._mainOwner || `${MAIN_OWNER_NUM_FALLBACK}@s.whatsapp.net`;
        const _mainStr = String((typeof _mainRaw === 'object' ? (_mainRaw.jid || _mainRaw.number || '') : _mainRaw) || '');
        const MAIN_OWNER_NUM = (_mainStr.replace(/\D/g, '') || MAIN_OWNER_NUM_FALLBACK);
        const MAIN_OWNER_JID = _mainStr.includes('@') ? _mainStr.split(':')[0].trim() : `${MAIN_OWNER_NUM}@s.whatsapp.net`;
        const MAIN_OWNER_FORMATTED = formatPhoneNumber(MAIN_OWNER_NUM);

        // JID che rappresentano l'owner principale (da non contare tra i co-owner)
        const mainOwnerJids = [MAIN_OWNER_JID, ownerNumber, sock?.user?.id, sock?.user?.lid].filter(Boolean);

        // Co-Owner reali: priorità al file su disco (appena aggiornato dal sito),
        // poi memoria (db._owners da .cowner/.addowner), poi legacy.
        const _ownerSrc = diskOwners || db._owners;
        let coOwnerList = [];
        if (Array.isArray(_ownerSrc)) coOwnerList = _ownerSrc;
        else if (Array.isArray(db._cowner)) coOwnerList = db._cowner;
        else if (Array.isArray(db.coowners)) coOwnerList = db.coowners;
        else if (Array.isArray(db._coowners)) coOwnerList = db._coowners;
        else if (db._cowner) coOwnerList = [db._cowner];

        // Ottiene i partecipanti se il comando è lanciato in un gruppo
        let groupParticipants = [];
        if (isGroup) {
            try {
                const groupMeta = await sock.groupMetadata(from);
                groupParticipants = groupMeta?.participants || [];
            } catch (_) {
                groupParticipants = [];
            }
        }

        // Converte eventuali LID o oggetti nel JID numero reale (PN) ed elimina i prefissi @lid
        const resolveToPnJid = async (rawJid) => {
            if (!rawJid) return null;
            let s = String(typeof rawJid === 'object' ? (rawJid.number || rawJid.jid || rawJid.lid) : rawJid).split(':')[0].trim();
            
            if (s.includes('@lid')) {
                try {
                    const pn = await sock?.signalRepository?.lidMapping?.getPNForLID(s);
                    if (pn) s = pn.split(':')[0];
                } catch (_) {}
            }

            if (!s.includes('@')) {
                s = s + '@s.whatsapp.net';
            }

            // Se è rimasto un LID non risolvibile, si estrae solo la parte numerica per evitare che appaia "@lid"
            if (s.includes('@lid')) {
                const cleanNum = s.split('@')[0];
                return `${cleanNum}@s.whatsapp.net`;
            }
            return s;
        };

        // Verifica se un utente è presente nel gruppo attuale
        const isUserInGroup = (jid) => {
            if (!isGroup || !jid || !groupParticipants.length) return false;
            const targetNum = jid.split('@')[0];
            return groupParticipants.some(p => {
                const pNum = p.id.split(':')[0].split('@')[0];
                return pNum === targetNum || (p.lid && p.lid.split('@')[0] === targetNum);
            });
        };

        // Gestione Owner Principale (dinamico: risolve LID->PN per display pulito)
        const mainPnJid = (await resolveToPnJid(MAIN_OWNER_JID)) || MAIN_OWNER_JID;
        const mainShowNum = mainPnJid.split('@')[0];
        const mainOwnerInGroup = isUserInGroup(mainPnJid);
        let mainOwnerDisplay = '';
        if (mainOwnerInGroup) {
            mainOwnerDisplay = `@${mainShowNum}`;
            mentions.push(mainPnJid);
        } else {
            mainOwnerDisplay = formatPhoneNumber(mainShowNum);
        }

        // Gestione Co-Owner
        const processedCoOwners = [];
        for (const item of coOwnerList) {
            const pnJid = await resolveToPnJid(item);
            if (!pnJid) continue;

            const numOnly = pnJid.split('@')[0];

            // Esclude l'owner principale se presente nella lista dei co-owner
            const isMain = numOnly === MAIN_OWNER_NUM ||
                (sameJid && mainOwnerJids.some(j => sameJid(pnJid, j)));
            if (isMain) continue;

            const inGroup = isUserInGroup(pnJid);
            if (inGroup) {
                mentions.push(pnJid);
                processedCoOwners.push({ text: `@${numOnly}` });
            } else {
                processedCoOwners.push({ text: formatPhoneNumber(numOnly) });
            }
        }

        // Frasi casuali
        const phrases = [
            "✨ VEX BOT —\nsta sempre sul pezzo, fra 🫶",
            "🔥 Nato per gestire e\nanimare i tuoi gruppi 💪",
            "⚡ Mod, comandi e giochi:\ndentro c'è un po' di tutto, raga",
            "🍝 Sempre attivo e\npronto all'uso, tranquillo",
            "🛡️ Protegge il gruppo\ne ti fa divertire, gg",
            "🚀 Versione 11.0 —\ncorre e non si stanca mai"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        const now = new Date();
        const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const totalUsers = Object.keys(db).filter(k => k.endsWith('@g.us') || k.endsWith('@s.whatsapp.net')).length;
        const dbSize = (JSON.stringify(db).length / 1024).toFixed(1);

        // Layout grafico elegante e pulito
        let txt = `🤖 *_INFO SYSTEM BOT_*\n`;
        txt += `\n`;
        txt += `▸ 💬 ${randomPhrase}\n`;
        txt += `▸ 📅 Data: _${dateStr}_ │ 🕒 _${timeStr}_\n`;
        txt += `▸ 👤 Richiesto da: _${pushName || 'Utente'}_\n`;
        txt += `\n`;
        txt += `👑 *Staff & Creatori*\n`;
        txt += `▸ 👑 Owner: ${mainOwnerDisplay}\n`;

        if (processedCoOwners.length > 0) {
            txt += `▸ ⚔️ Co-owner (_${processedCoOwners.length}_):\n`;
            for (const co of processedCoOwners) {
                txt += `  ◦ ${co.text}\n`;
            }
        } else {
            txt += `▸ ⚔️ Co-owner: _Nessuno impostato_\n`;
        }

        txt += `\n`;
        txt += `📊 *Statistiche*\n`;
        txt += `▸ 👥 Chat attive: _${totalUsers}_\n`;
        txt += `▸ 💾 Database: _${dbSize} KB_\n`;
        txt += `\n`;
        txt += `🚀 *Comandi*\n`;
        txt += `▸ Scrivi .menu per\n  la lista completa!\n`;
        txt += `\n`;

        await sendButtons(sock, from, txt, [
            { label: '📊 Status', id: 'status' },
            { label: '⚡ Ping', id: 'ping' },
            { label: '🏠 Menu', id: 'menu' },
        ], msg, mentions);
    },
};