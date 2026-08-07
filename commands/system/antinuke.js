'use strict';

module.exports = {
    name: 'antinuke',
    aliases: [],
    description: "Attiva/disattiva la protezione anti-nuke del gruppo (whitelist inclusa).",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { db, saveDB, getAntinukeGroup, isAntinukeWhitelisted, ANTINUKE_CONTROLS, sendButtons } = services;

        if (!isGroup) return reply("🛡️ *ANTINUKE*\n\nFunziona solo nei *gruppi*.");

        if (!isOwner) {
            return reply(
`╭────〔 ⛔ *ACCESSO NEGATO* 〕────╮
│ Il comando *.antinuke* è
│ riservato all'*Owner del bot*.
╰────────────────────────────────╯`
            );
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
                    return `│ ${icon} ${key.padEnd(10)} ➔ ${active ? 'ON' : 'OFF'}`;
                })
                .join('\n');

            const wlLines = cfg.whitelist.length
                ? cfg.whitelist.map(w => `│   • @${w.replace(/[^0-9]/g, '')}`).join('\n')
                : '│   (nessuno)';

            const txt =
`╭────〔 🛡️ *ANTINUKE* 〕────╮
│ Stato: ${enabled ? '🟢 *ATTIVO*' : '🔴 *DISATTIVO*'}
│
│ ── *CONTROLLI* ──
${controlsLines}
│
│ ── *WHITELIST* ──
│ Utenti fidati esenti da tutto:
${wlLines}
│
│ 💡 *Uso:*
│  .antinuke on/off
│  .antinuke <controllo> on/off
│  .antinuke all on/off
│  .antinuke whitelist <numero>
│  .antinuke whitelist list
│
│ *Controlli:* ${Object.keys(ANTINUKE_CONTROLS).join(', ')}
╰──────────────────────────────────╯`;

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
`╭────〔 🛡️ *ANTINUKE* 〕────╮
│ Stato: ${cfg.enabled ? '🟢 *ATTIVO*' : '🔴 *DISATTIVO*'}
│
│ ${cfg.enabled
    ? 'Il gruppo è ora protetto. Solo owner\n│ e whitelist hanno i pieni poteri.\n│ Per aggiungere fidati:\n│  .antinuke whitelist <numero>'
    : 'Protezione disattivata. Chiunque può\n│ agire normalmente.'}
╰──────────────────────────────────╯`
            );
        }

        // ── ALL ON/OFF ────────────────────────────────────────────────────
        if (sub === 'all on' || sub === 'all off') {
            const value = sub === 'all on';
            for (const key of Object.keys(ANTINUKE_CONTROLS)) cfg.controls[key] = value;
            saveDB();
            return reply(`🛡️ *ANTINUKE* — tutti i controlli → *${value ? 'ON' : 'OFF'}*`);
        }

        // ── WHITELIST ─────────────────────────────────────────────────────
        if (sub === 'whitelist list' || sub === 'wl list') {
            if (!cfg.whitelist.length) return reply("📋 *Whitelist antinuke:* (vuota)");
            const lines = cfg.whitelist.map(w => `│ ${w.replace(/[^0-9]/g, '')}`).join('\n');
            return reply(`╭── 📋 *WHITELIST ANTINUKE* ──╮\n${lines}\n╰────────────────────────╯`);
        }
        if (/^(whitelist|wl)\s+/.test(sub)) {
            const raw = sub.replace(/^(whitelist|wl)\s+/, '').trim();
            const num = raw.replace(/[^0-9]/g, '');
            if (!num || num.length < 6) return reply("⚠️ Numero non valido.");
            if (cfg.whitelist.some(w => w.replace(/[^0-9]/g, '') === num)) {
                cfg.whitelist = cfg.whitelist.filter(w => w.replace(/[^0-9]/g, '') !== num);
                saveDB();
                return reply(`🗑️ *${num}* rimosso dalla whitelist antinuke.`);
            }
            cfg.whitelist.push(num);
            saveDB();
            return reply(`✅ *${num}* aggiunto alla whitelist antinuke (esente da tutto).`);
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
            return reply(`🛡️ *${key}* → *${value ? 'ON' : 'OFF'}*`);
        }

        return reply(
`╭────〔 ⚠️ *ANTINUKE — ERRORE* 〕────╮
│ Sottocomando non riconosciuto.
│
│ 💡 *Uso:*
│  .antinuke on/off
│  .antinuke <controllo> on/off
│  .antinuke whitelist <numero>
│  .antinuke whitelist list
│  .antinuke all on/off
│
│ *Controlli:* ${Object.keys(ANTINUKE_CONTROLS).join(', ')}
╰──────────────────────────────────────╯`
        );
    },
};
