'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');

module.exports = {
    name: 'antinuke',
    aliases: [],
    description: "Attiva/disattiva la protezione anti-nuke del gruppo (whitelist inclusa).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, getAntinukeGroup, isAntinukeWhitelisted, ANTINUKE_CONTROLS, sendButtons } = services;

        if (!isGroup) return reply(`🛡️ ${sec('ANTINUKE')}\n━━━━━━━━━━━━━━━━━━\n▸ Funziona solo nei _gruppi_.\n━━━━━━━━━━━━━━━━━━`);

        if (!isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        const cfg = getAntinukeGroup(db, from);
        const sub = (textArgs || '').trim();

        // ── STATO ─────────────────────────────────────────────────────────
        // Stato EFFETTIVO: un controllo è ON solo se antinuke è attivo E il
        // singolo controllo è acceso. Se antinuke è spento → tutto OFF.
        if (!sub) {
            const enabled = Boolean(cfg.enabled);
            const controlsLines = Object.entries(ANTINUKE_CONTROLS)
                .map(([key, label]) => {
                    const active = enabled && cfg.controls[key];
                    const icon = active ? '🟢' : '🔴';
                    return `▸ ${icon} _${key}_: ${active ? 'ON' : 'OFF'}`;
                })
                .join('\n');

            const wlLines = cfg.whitelist.length
                ? cfg.whitelist.map(w => `▸ @${w.replace(/[^0-9]/g, '')}`).join('\n')
                : '▸ _(nessuno)_';

            const txt =
`🛡️ ${sec('ANTINUKE')}
▸ Stato: _${enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO'}_
📋 *Controlli*
${controlsLines}
📋 *Whitelist*
▸ Utenti fidati esenti da tutto:
${wlLines}
💡 *Uso*
▸ .antinuke on/off
▸ .antinuke <controllo> on/off
▸ .antinuke all on/off
▸ .antinuke whitelist <numero>
▸ .antinuke whitelist list
▸ Controlli: ${Object.keys(ANTINUKE_CONTROLS).join(', ')}
`;

            try {
                await sendButtons(sock, from, txt, [
                    { label: '🟢 Attiva', id: 'antinuke on' },
                    { label: '🔴 Disattiva', id: 'antinuke off' },
                    { label: '⚠️ Tutto off', id: 'antinuke all off' },
                ], msg);
            } catch (e) {
                await reply(txt);
            }
            return;
        }

        // ── MASTER ON/OFF ─────────────────────────────────────────────────
        if (sub === 'on' || sub === 'off') {
            cfg.enabled = sub === 'on';
            if (cfg.enabled) {
                // Cattura uno snapshot delle impostazioni per l'antigc
                try {
                    const meta = await sock.groupMetadata(from);
                    cfg.snapshot = {
                        subject: meta?.subject || null,
                        desc: meta?.desc || null,
                    };
                } catch (_) {
                    cfg.snapshot = { subject: null, desc: null };
                }
            }
            saveDB();
            return reply(
`🛡️ ${sec('ANTINUKE')}
▸ Stato: _${cfg.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVO'}_
${cfg.enabled
    ? '▸ Il gruppo è ora protetto.\n  Solo owner e whitelist\n  hanno i pieni poteri.\n▸ Per aggiungere fidati:\n  .antinuke whitelist <numero>'
    : '▸ Protezione disattivata.\n  Chiunque può agire normalmente.'}
`
            );
        }

        // ── ALL ON/OFF ────────────────────────────────────────────────────
        if (sub === 'all on' || sub === 'all off') {
            const value = sub === 'all on';
            for (const key of Object.keys(ANTINUKE_CONTROLS)) cfg.controls[key] = value;
            saveDB();
            return reply(`🛡️ ${sec('ANTINUKE')} — tutti i controlli: _${value ? 'ON' : 'OFF'}_`);
        }

        // ── WHITELIST ─────────────────────────────────────────────────────
        if (sub === 'whitelist list' || sub === 'wl list') {
            if (!cfg.whitelist.length) return reply(`📋 ${sec('WHITELIST ANTINUKE')}\n━━━━━━━━━━━━━━━━━━\n▸ _(vuota)_\n━━━━━━━━━━━━━━━━━━`);
            const lines = cfg.whitelist.map(w => `▸ ${w.replace(/[^0-9]/g, '')}`).join('\n');
            return reply(`📋 ${sec('WHITELIST ANTINUKE')}\n━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━\n`);
        }
        if (/^(whitelist|wl)\s+/.test(sub)) {
            const raw = sub.replace(/^(whitelist|wl)\s+/, '').trim();
            const num = raw.replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply("⚠️ _[uso]:_ numero non valido.\n▸ .antinuke whitelist <numero>");
            if (cfg.whitelist.some(w => w.replace(/[^0-9]/g, '') === num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w.replace(/[^0-9]/g, '') !== num);
                saveDB();
                return reply(`🗑️ _${num}_ rimosso dalla whitelist antinuke.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ _${num}_ aggiunto alla whitelist antinuke (esente da tutto).`);
        }

        // ── CONTROLLO SINGOLO ─────────────────────────────────────────────
        const m = sub.match(/^(\S+)\s+(on|off)$/i);
        if (m && Object.prototype.hasOwnProperty.call(ANTINUKE_CONTROLS, m[1].toLowerCase())) {
            const key = m[1].toLowerCase();
            const value = m[2].toLowerCase() === 'on';
            cfg.controls[key] = value;
            if (key === 'antigc' && value) {
                try {
                    const meta = await sock.groupMetadata(from);
                    cfg.snapshot = {
                        subject: meta?.subject || null,
                        desc: meta?.desc || null,
                    };
                } catch (_) { /* snapshot resta null: l'antigc non ha target di revert */ }
            }
            saveDB();
            return reply(`🛡️ *_${key}:_* _${value ? 'ON' : 'OFF'}_`);
        }

        return reply(
`⚠️ *_ANTINUKE — ERRORE_*
▸ _[uso]:_ sottocomando non riconosciuto.
▸ .antinuke on/off
▸ .antinuke <controllo> on/off
▸ .antinuke whitelist <numero>
▸ .antinuke whitelist list
▸ .antinuke all on/off
▸ Controlli: ${Object.keys(ANTINUKE_CONTROLS).join(', ')}
━━━━━━━━━━━━━━━━━━`
        );
    },
};
