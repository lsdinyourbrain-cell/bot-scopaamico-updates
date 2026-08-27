'use strict';

const { S, SEP, footer, bullet } = require('../../lib/ui');

module.exports = {
    name: 'welcome',
    aliases: ['benvenuto'],
    description: "Gestisci il messaggio di benvenuto: on/off e frase custom (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { getWelcomeGroup, setWelcomeGroup, setWelcomeCustom, getWelcomeCustom } = services;

        if (!isGroup) return reply("⚠️ _[uso]:_ questo comando funziona solo nei gruppi.");
        if (!isOwner && !isSenderAdmin) return reply("⚠️ _[uso]:_ solo gli *admin* possono modificare il benvenuto.");

        const config = getWelcomeGroup(from);
        const raw = String(context.textArgs || '').trim();
        const lower = raw.toLowerCase();

        // ── SET CUSTOM ───────────────────────────────────────────────
        if (lower.startsWith('set ')) {
            const custom = raw.slice(4).trim();
            if (!custom) {
                return reply(
`${S.star} ${S.dia}  *WELCOME — SET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('Uso: _.welcome set <frase>_')}
${bullet('Placeholder: `@user` = nuovo membro, `@group` = nome gruppo, `@desc` = descrizione')}
${bullet('Es: _.welcome set Ciao @user benvenuto in @group!_')}
${SEP.lineL}
${bullet(`Frase attuale: ${getWelcomeCustom(from, 'welcome') ? '_' + getWelcomeCustom(from, 'welcome').slice(0, 80) + '_' : '_default_'}`)}
${SEP.stars}
${footer()}`
                );
            }
            if (custom.length > 800) return reply(`❌ Frase troppo lunga (max 800).`);
            setWelcomeCustom(from, 'welcome', custom);
            return reply(
`${S.star} ${S.dia}  *WELCOME — CUSTOM*  ${S.dia} ${S.star}
${SEP.line}
${bullet('✅ Frase di benvenuto impostata!')}
${bullet(`Testo: _${custom.slice(0, 120)}${custom.length > 120 ? '…' : ''}_`)}
${bullet('Placeholder: `@user`, `@group`, `@desc`')}
${SEP.lineL}
${bullet('Prova con _.welcome mostra_ per vedere tutto')}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'set') {
            const cur = getWelcomeCustom(from, 'welcome');
            return reply(
`${S.star} ${S.dia}  *WELCOME — SET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('Uso: _.welcome set <frase>_')}
${bullet('Placeholder: `@user`, `@group`, `@desc`')}
${bullet(`Attuale: ${cur ? '_' + cur.slice(0, 100) + '_' : '_default (hardcoded)_'}`)}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'reset' || lower === 'clear' || lower === 'default') {
            setWelcomeCustom(from, 'welcome', null);
            return reply(
`${S.star} ${S.dia}  *WELCOME — RESET*  ${S.dia} ${S.star}
${SEP.line}
${bullet('✅ Frase custom rimossa, tornato al default.')}
${SEP.stars}
${footer()}`
            );
        }
        if (lower === 'mostra' || lower === 'show' || lower === 'vedi') {
            const cur = getWelcomeCustom(from, 'welcome');
            const status = config.welcome ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            return reply(
`${S.star} ${S.dia}  *WELCOME — CONFIG*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`Stato: ${status}`)}
${bullet(`Custom: ${cur ? '_' + cur + '_' : '_default_'}`)}
${SEP.lineL}
${bullet('Uso:')}
${bullet('`.welcome on/off` — attiva/disattiva')}
${bullet('`.welcome set <frase>` — frase custom')}
${bullet('`.welcome reset` — torna al default')}
${SEP.stars}
${footer()}`
            );
        }

        // ── ON / OFF ─────────────────────────────────────────────────
        if (!lower || (lower !== 'on' && lower !== 'off' && lower !== 'true' && lower !== 'false' && lower !== 'si' && lower !== 'no' && lower !== 'attivo' && lower !== 'disattivo')) {
            const status = config.welcome ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            const hasCustom = getWelcomeCustom(from, 'welcome') ? '✦ custom' : '▫ default';
            return reply(
`${S.star} ${S.dia}  *BENVENUTO GRUPPO*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`Stato: ${status} (${hasCustom})`)}
${bullet('Uso: `.welcome <on|off>`')}
${bullet('`.welcome set <frase>` — frase con @user/@group')}
${bullet('`.welcome reset` — rimuovi custom')}
${bullet('`.welcome mostra` — vedi config')}
${SEP.stars}
${footer()}`
            );
        }

        const enable = ['on', 'true', 'si', 'attivo'].includes(lower);
        setWelcomeGroup(from, 'welcome', enable);

        await reply(
`${S.star} ${S.dia}  *BENVENUTO ${enable ? 'ATTIVATO' : 'DISATTIVATO'}*  ${S.dia} ${S.star}
${SEP.line}
${bullet(`${enable ? '✅ Attivato' : '❌ Disattivato'}`)}
${bullet(`${enable ? 'Verrà inviato' : 'NON verrà più inviato'}`)}
${bullet(`quando qualcuno entra.`)}
${SEP.stars}
${footer()}`
        );
    },
};
