'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');
const crypto = require('crypto');

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
    if (p >= 90) return '🔥 TROIA SUPREMA! Regini della notte! 👑';
    if (p >= 70) return '😈 Troiaggine alta, scintille ovunque!';
    if (p >= 50) return '😏 Media, sai il fatto tuo.';
    if (p >= 30) return '😇 Bassa, quasi timido/a.';
    if (p >= 0) return '🕊 Purezza totale!';
    return '✨ Risultato unico!';
}

module.exports = {
    name: 'troiometro',
    aliases: [],
    description: 'Misura piccante ironica, tono leggero.',
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
        const percent = hashPercent(targetJid, 'troiometro');
        const bar = buildBar(percent);
        const verdict = getVerdict(percent);
        const tag = '@' + targetJid.split('@')[0];
        const title = sec('TROIOMETRO');
        const emoji = '🔥';
        const line = '\u2501'.repeat(18);
        const text = `${emoji}  ${title}  ${emoji}\n${line}\n\u25b8 Utente: ${tag}\n\u25b8 Valore: *${percent}%*\n\u25b8 ${bar} ${percent}%\n${line}\n${verdict}\n${line}\n\u25c8 _Vex Bot_ \u2014 troiometro`;
        const buttons = [
            { label: '\uD83D\uDD04 Ricalcola', id: 'troiometro' },
            { label: '\uD83D\uDC65 Altro utente', id: 'troiometro' }
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
