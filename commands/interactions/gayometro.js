'use strict';
const crypto = require('crypto');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

function toSansBold(str) { return '*' + String(str||'').trim() + '*'; }
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
    if (p >= 90) return '🌈 LEGGENDA ARCOBALENO! Sei piu\' colorato di un Pride intero! 🏳️‍🌈✨';
    if (p >= 70) return '💅 Molto gay, hai glitter ovunque! ✨';
    if (p >= 50) return '😎 Sei chill, un po\' e un po\' — equilibrato!';
    if (p >= 30) return '😐 Poco gay, ma il cuore e\' arcobaleno dentro.';
    if (p >= 0) return '🪨 Etero come un muro di cemento armato! 🧱';
    return '✨ Risultato unico!';
}

module.exports = {
    name: 'gayometro',
    aliases: [],
    description: 'Misura il livello rainbow in modo ironico e colorato.',
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
        const percent = hashPercent(targetJid, 'gayometro');
        const bar = buildBar(percent);
        const verdict = getVerdict(percent);
        const tag = '@' + targetJid.split('@')[0];
        const text = `   *GAYOMETRO*   \n\n${line(`👤 Utente: ${tag}`)}\n${line(`📊 *Valore:* _*${percent}%*_`)}\n${line(`${bar} ${percent}%`)}\n\n${line(verdict)}\n\n`;
        const buttons = [
            { label: '\uD83D\uDD04 Ricalcola', id: 'gayometro' },
            { label: '\uD83D\uDC65 Altro utente', id: 'gayometro' }
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
