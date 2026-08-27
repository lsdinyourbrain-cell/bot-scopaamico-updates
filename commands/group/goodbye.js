'use strict';

const { S, SEP, footer, bullet } = require('../../lib/ui');

module.exports = {
    name: 'goodbye',
    aliases: ['arrivederci', 'addio', 'bye'],
    description: "Gestisci il messaggio di arrivederci: on/off e frase custom (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { getWelcomeGroup, setWelcomeGroup, setWelcomeCustom, getWelcomeCustom } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isOwner && !isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli *admin* possono modificare l'arrivederci.");

        const config = getWelcomeGroup(from);
        const raw = String(context.textArgs || '').trim();
        const lower = raw.toLowerCase();

        // ── SET CUSTOM ───────────────────────────────────────────────
        if (lower.startsWith('set ')) {
            const custom = raw.slice(4).trim();
            if (!custom) {
                return reply(
`${S.star} ${S.dia}  *GOODBYE — SET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('Uso: _.goodbye set <frase>_')}
${bullet('Placeholder: `@user` = chi esce, `@group` = nome gruppo')}
${bullet('Es: _.goodbye set Ciao @user ci mancherai in @group!_')}
${SEP.lineL}
${bullet(`Frase attuale: ${getWelcomeCustom(from, 'goodbye') ? '_' + getWelcomeCustom(from, 'goodbye').slice(0, 80) + '_' : '_default_'}`)}
${SEP.stars}
${footer()}`
                );
            }
            if (custom.length > 800) return reply(`❌ Frase troppo lunga (max 800).`);
            setWelcomeCustom(from, 'goodbye', custom);
            return reply(
`${S.star} ${S.dia}  *GOODBYE — CUSTOM*  ${S.dia} ${S.star}
${SEP.line}
${bullet('✅ Frase di arrivederci impostata!')}
${bullet(`Testo: _${custom.slice(0, 120)}${custom.length > 120 ? '…' : ''}_`)}
${bullet('Placeholder: `@user`, `@group`')}
${SEP.lineL}
${bullet('Prova con _.goodbye mostra_ per vedere tutto')}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'set') {
            const cur = getWelcomeCustom(from, 'goodbye');
            return reply(
`${S.star} ${S.dia}  *GOODBYE — SET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('Uso: _.goodbye set <frase>_')}
${bullet('Placeholder: `@user`, `@group`')}
${bullet(`Attuale: ${cur ? '_' + cur.slice(0, 100) + '_' : '_default (hardcoded)_'}`)}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'reset' || lower === 'clear' || lower === 'default') {
            setWelcomeCustom(from, 'goodbye', null);
            return reply(
`${S.star} ${S.dia}  *GOODBYE — RESET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('✅ Frase custom rimossa, tornato al default.')}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'mostra' || lower === 'show' || lower === 'vedi') {
            const cur = getWelcomeCustom(from, 'goodbye');
            const status = config.goodbye ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            return reply(
`${S.star} ${S.dia}  *GOODBYE — CONFIG*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`Stato: ${status}`)}
${bullet(`Custom: ${cur ? '_' + cur + '_' : '_default_'}`)}
${SEP.lineL}
${bullet('Uso:')}
${bullet('`.goodbye on/off` — attiva/disattiva')}
${bullet('`.goodbye set <frase>` — frase custom')}
${bullet('`.goodbye reset` — torna al default')}
${SEP.stars}
${footer()}`
            );
        }

        // ── ON / OFF ─────────────────────────────────────────────────
        if (!lower || (lower !== 'on' && lower !== 'off' && lower !== 'true' && lower !== 'false' && lower !== 'si' && lower !== 'no' && lower !== 'attivo' && lower !== 'disattivo')) {
            const status = config.goodbye ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            const hasCustom = getWelcomeCustom(from, 'goodbye') ? '✦ custom' : '▫ default';
            return reply(
`${S.star} ${S.dia}  *ARRIVEDERCI GRUPPO*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`Stato: ${status} (${hasCustom})`)}
${bullet('Uso: `.goodbye <on|off>`')}
${bullet('`.goodbye set <frase>` — frase con @user/@group')}
${bullet('`.goodbye reset` — rimuovi custom')}
${bullet('`.goodbye mostra` — vedi config')}
${SEP.stars}
${footer()}`
            );
        }

        const enable = ['on', 'true', 'si', 'attivo'].includes(lower);
        setWelcomeGroup(from, 'goodbye', enable);

        await reply(
`${S.star} ${S.dia}  *ARRIVEDERCI ${enable ? 'ATTIVATO' : 'DISATTIVATO'}*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`${enable ? '✅ Attivato' : '❌ Disattivato'}`)}
${bullet(`${enable ? 'Verrà inviato' : 'NON verrà più inviato'}`)}
${bullet(`quando qualcuno esce.`)}
${SEP.stars}
${footer()}`
        );
    },
};
