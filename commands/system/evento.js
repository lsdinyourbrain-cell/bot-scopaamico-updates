'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { toDecorated } = require('../../lib/font');
const EV = require('../../lib/events');

module.exports = {
    name: 'evento',
    aliases: ['events', 'eventi'],
    description: "Eventi temporanei per la chat: .evento (stato) | .evento random | .evento start <tipo> [min] | .evento stop <tipo> | .evento boss | .evento raccogli | .evento apri",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, saveDB, getUser, sendButtons, randomChoice } = services;

        const sub = String(textArgs || '').trim().toLowerCase().split(/\s+/)[0];
        const canManage = isOwner || (isGroup && isSenderAdmin);

        // ── EVENTO BOSS: spara al boss 
        if (sub === 'boss') {
            const shot = EV.bossShot(db, from, sender);
            if (shot.error === 'noboss') {
                return reply("👀 Non c'è nessun boss da colpire ora.\n▸ Per evocarlo: _.evento start boss_ (owner/admin).");
            }
            if (shot.error === 'cd') {
                return reply(`⏳ Ricarica... puoi sparare tra _${shot.remain}s_.`);
            }
            if (shot.killed) {
                const u = getUser(sender, from);
                u.money = (u.money || 0) + shot.reward;
                if (!Array.isArray(u.pregi)) u.pregi = [];
                u.pregi.push({ rank: '🐉 Cacciatore di Boss', lv: u.level || 1, ts: Date.now() });
                if (u.pregi.length > 12) u.pregi = u.pregi.slice(-12);
                saveDB();
                return reply(
`${sec('BOSS ABBATTUTO')}\n${boxOpen()}\n${line('💥 *BOSS ABBATTUTO!* 💥')}\n${line(`@${dispOf(sender)} ha dato il colpo`)}\n${line(`finale: _${shot.dmg} danno_!`)}\n${line(`🏆 Bottino: _+${shot.reward}€_`)}\n${line('🐉 Pregio: *Cacciatore di Boss*')}\n${boxEnd()}`);
            }
            const pct = Math.max(0, Math.min(100, Math.round((shot.hp / shot.maxHp) * 100)));
            return reply(
`${sec('INFO')}\n${boxOpen()}\n${line(`💥 *BOSS: ${shot.hp}/${shot.maxHp} HP* (${pct}%)`)}\n${line(`⚔️ Colpo: _${shot.dmg} danno_`)}\n${line('🔥 Continua a sparare!')}\n${line('Chi dà il colpo finale')}\n${line('vince tutto il bottino.')}\n${boxEnd()}`);
        }

        // ── EVENTO RACCOGLI: pioggia di soldi 
        if (sub === 'raccogli') {
            const rain = EV.takeRain(db, from);
            if (!rain) return reply("🌤️ Nessuna pioggia di soldi da raccogliere ora.");
            const u = getUser(sender, from);
            u.money = (u.money || 0) + rain.amount;
            saveDB();
            return reply(`${sec('PIOGGIA RACCOLTA')}\n${boxOpen()}\n${line(`🌧️ *PIOGGIA RACCOLTA!* 🌧️\n\n▸ @${dispOf(sender)} ha preso _+${rain.amount}€_\n▸ Saldo: _${u.money}€_\n\n`)}\n${boxEnd()}`);
        }

        // ── EVENTO APRI: cassa misteriosa 
        if (sub === 'apri' || sub === 'cassa') {
            const res = EV.openCassa(db, from, sender);
            if (res.error === 'off') {
                return reply("🎁 La cassa misteriosa non è attiva ora.\n▸ Per attivarla: _.evento start cassa_ (owner/admin).");
            }
            if (res.error === 'cd') {
                return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`🎁 Cassa già aperta di recente.\n▸ Riprova tra _${res.remain} min_.`)}\n${boxEnd()}`);
            }
            const u = getUser(sender, from);
            if (res.badge) {
                if (!Array.isArray(u.pregi)) u.pregi = [];
                u.pregi.push({ rank: '🎁 Fortunato della Cassa', lv: u.level || 1, ts: Date.now() });
                if (u.pregi.length > 12) u.pregi = u.pregi.slice(-12);
            }
            u.money = (u.money || 0) + res.money;
            saveDB();
            const badgeLine = res.badge ? '\n▸ 🏅 Pregio: *Fortunato della Cassa*' : '';
            return reply(`${sec('CASSA MISTERIOSA')}\n${boxOpen()}\n${line(`🎁 *CASSA MISTERIOSA* 🎁\n\n▸ @${dispOf(sender)} ha trovato\n  _+${res.money}€_${badgeLine}\n▸ Saldo: _${u.money}€_\n▸ Prossima cassa: _60 min_\n\n`)}\n${boxEnd()}`);
        }

        // ── GESTIONE (solo owner/admin) 
        if (sub === 'start' || sub === 'stop' || sub === 'random' || sub === 'casuale') {
            if (!canManage) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('⛔ Solo gli admin possono avviare o fermare gli eventi.')}
${boxEnd()}`);

            // EVENTO CASUALE: sceglie un tipo e una durata a caso.
            if (sub === 'random' || sub === 'casuale') {
                const res = EV.startRandom(db, from);
                const tipo = Object.keys(EV.EVENT_TYPES).find(t => EV.isActive(db, from, t));

                let extra = '';
                if (tipo === 'boss') {
                    const boss = EV.spawnBoss(db, from);
                    extra = `\n▸ 💥 *${boss.maxHp} HP* di boss evocati!`;
                }
                if (tipo === 'pioggia') {
                    EV.startRain(db, from);
                    extra = `\n▸ 🌧️ La prima pioggia sta per cadere!`;
                }
                if (tipo === 'raduno') {
                    const r = EV.radunoReward(db, from);
                    extra = `\n▸ 👥 Ogni partecipante riceve _+${r.amount}€_!\n▸ Basta mandare un messaggio in chat!`;
                }
                saveDB();

                const meta = res.meta;
                return reply(
`${sec('EVENTO CASUALE')}\n${boxOpen()}\n${line(`${meta.emoji} _${meta.label}_`)}\n${line(`⏱️ Durata: _${res.dur} minuti_`)}\n${line(`📋 ${meta.desc}${extra}`)}\n${boxEnd()}`);
            }

            if (sub === 'stop') {
                const tipo = String(textArgs).trim().split(/\s+/)[1] || '';
                const ok = EV.stop(db, from, tipo);
                saveDB();
                return reply(ok
                    ? `⏹️ Evento _${tipo}_ fermato.`
                    : `⚠️ Evento _${tipo}_ non trovato.`);
            }

            // start <tipo> [minuti]
            const parts = String(textArgs).trim().split(/\s+/).filter(Boolean);
            const tipo = (parts[1] || '').toLowerCase();
            const dur = Number.parseInt(parts[2], 10);
            const res = EV.start(db, from, tipo, Number.isInteger(dur) && dur > 0 ? dur : undefined);

            if (!res.ok) {
                return reply(
`⚠️ _[uso]:_ \`.evento start <tipo> [minuti]\`
▸ Tipi: ${Object.keys(EV.EVENT_TYPES).join(', ')}`);
            }

            // Eventi con side-effect all'avvio
            let extra = '';
            if (tipo === 'boss') {
                const boss = EV.spawnBoss(db, from);
                extra = `\n▸ 💥 *${boss.maxHp} HP* di boss evocati!`;
            }
            if (tipo === 'pioggia') {
                EV.startRain(db, from);
                extra = `\n▸ 🌧️ La prima pioggia sta per cadere!`;
            }
            if (tipo === 'raduno') {
                const r = EV.radunoReward(db, from);
                extra = `\n▸ 👥 Ogni partecipante riceve _+${r.amount}€_!\n▸ Basta mandare un messaggio in chat!`;
            }
            saveDB();

            const meta = res.meta;
            return reply(
`${sec('EVENTO ATTIVATO')}\n${boxOpen()}\n${line(`${meta.emoji} *EVENTO ATTIVATO!*`)}\n${line(`${meta.emoji} _${meta.label}_`)}\n${line(`⏱️ Durata: _${res.dur} minuti_`)}\n${line(`📋 ${meta.desc}${extra}`)}\n${boxEnd()}`);
        }

        // ── STATO EVENTI 
        const attivi = EV.activeList(db, from);
        const nowLines = attivi.length
            ? attivi.map(t => {
                const m = EV.EVENT_TYPES[t];
                return `▸ ${m.emoji} _${m.label}_ — ⏱️ ${EV.remainingMin(db, from, t)} min`;
            }).join('\n')
            : '▸ _Nessun evento attivo._';

        const bossLine = db?._boss?.[from]
            ? `\n▸ 💥 *BOSS attivo:* ${db._boss[from].hp}/${db._boss[from].maxHp} HP — usa _.evento boss_`
            : '';

        const rainLine = db?._rain?.[from]
            ? `\n▸ 🌧️ *Pioggia in arrivo!* usa _.evento raccogli_`
            : '';

        const radunoLine = EV.isActive(db, from, 'raduno')
            ? `\n▸ 👥 *Raduno:* _+${EV.radunoReward(db, from).amount}€_ per chi partecipa!`
            : '';

        const disponibili = Object.entries(EV.EVENT_TYPES)
            .map(([t, m]) => `▸ ${m.emoji} _${t}_ — ${m.desc}`)
            .join('\n');

        const text =
`⚡ ${sec('EVENTI')}
▸ 📡 *Attivi ora:*
${nowLines}${bossLine}${rainLine}${radunoLine}
📋 *Disponibili:*
${disponibili}
💡 *Uso:*
▸ .evento start <tipo> [min]
▸ .evento random (casuale!)
▸ .evento stop <tipo>
▸ .evento boss (spara!)
▸ .evento raccogli (pioggia)
▸ .evento apri (cassa)
▸ _gestione riservata_
  _agli admin_
`;

        try {
            await sendButtons(sock, from, text, [
                { label: '👀 Aggiorna', id: 'evento' },
            ], msg);
        } catch (_) {
            await reply(text);
        }
    },
};