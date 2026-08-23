'use strict';
const crypto = require('crypto');

const SANS_UPPER = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭';
const SANS_LOWER = '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇';
function toSansBold(str) {
    if (!str) return str;
    const _up = Array.from(SANS_UPPER);
    const _lo = Array.from(SANS_LOWER);
    let out = '';
    for (const ch of str) {
        if (ch >= 'A' && ch <= 'Z') out += _up[ch.charCodeAt(0)-65];
        else if (ch >= 'a' && ch <= 'z') out += _lo[ch.charCodeAt(0)-97];
        else out += ch;
    }
    return out;
}
function hashPercent(jid, salt) {
    const h = crypto.createHash('md5').update(String(jid) + '|' + String(salt)).digest('hex');
    const n = parseInt(h.slice(0,8), 16);
    return n % 101;
}
function buildBar(p) {
    const total = 10;
    const filled = Math.round(p / 10);
    const empty = total - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}
function getVerdict(p) {
    if (p >= 90) return '💎💰 PAPERON DE\' PAPERONI! Nuoti nell\'oro! 🏦';
    if (p >= 70) return '💰 Ricco forte! Yacht gia\' prenotato! 🛥️';
    if (p >= 50) return '💵 Benestante, non ti manca nulla.';
    if (p >= 30) return '🪙 Soldini contati.';
    if (p >= 0) return '🥲 Al verde, portafoglio in dieta!';
    return '✨ Risultato unico!';
}

module.exports = {
    name: 'riccometro',
    aliases: [],
    description: 'Misura quanto sei ricco — vibe milionario.',
    async run(sock, msg, args, context) {
        const { from, sender, isGroup, services } = context;
        const { sendButtons, getCachedGroupMeta } = services || {};
        let targetJid = context.targetJid || null;
        if (!targetJid && args && args[0] && isGroup && typeof getCachedGroupMeta === 'function') {
            try {
                const raw = String(args[0]).replace(/[@\s+]/g, '');
                const digits = raw.replace(/\D/g, '');
                if (digits && digits.length >= 5) {
                    const meta = await getCachedGroupMeta(sock, from);
                    for (const p of meta?.participants || []) {
                        const pn = (p.phoneNumber || p.id || '').split('@')[0];
                        const pid = (p.id || '').split('@')[0];
                        if ((pn && (pn === digits || pn.endsWith(digits) || digits.endsWith(pn))) ||
                            (pid && (pid === digits || pid.endsWith(digits) || digits.endsWith(pid)))) {
                            targetJid = p.phoneNumber || p.id;
                            break;
                        }
                    }
                }
            } catch (_) {}
        }
        if (!targetJid) targetJid = sender;
        const percent = hashPercent(targetJid, 'riccometro');
        const bar = buildBar(percent);
        const verdict = getVerdict(percent);
        const tag = '@' + targetJid.split('@')[0];
        const title = toSansBold('RICCOMETRO');
        const emoji = '💰';
        const line = '\u2501'.repeat(18);
        const text = `${emoji}  ${title}  ${emoji}\n${line}\n\u25b8 Utente: ${tag}\n\u25b8 Valore: *${percent}%*\n\u25b8 ${bar} ${percent}%\n${line}\n${verdict}\n${line}\n\u25c8 _Vex Bot_ \u2014 riccometro`;
        const buttons = [
            { label: '\uD83D\uDD04 Ricalcola', id: 'riccometro' },
            { label: '\uD83D\uDC65 Altro utente', id: 'riccometro' }
        ];
        try {
            if (typeof sendButtons === 'function') {
                await sendButtons(sock, from, text, buttons, msg, [targetJid]);
            } else {
                await sock.sendMessage(from, { text, mentions: [targetJid] }, { quoted: msg });
            }
        } catch (e) {
            await sock.sendMessage(from, { text, mentions: [targetJid] }, { quoted: msg });
        }
    }
};
