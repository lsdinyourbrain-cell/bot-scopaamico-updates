'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'welcome',
    aliases: ['benvenuto'],
    description: "Gestisci il messaggio di benvenuto: on/off e frase custom (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { getWelcomeGroup, setWelcomeGroup, setWelcomeCustom, getWelcomeCustom } = services;

        if (!isGroup) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Questo comando funziona solo nei gruppi.')}\n${boxEnd()}`);
        if (!isOwner && !isSenderAdmin) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gli admin possono modificare il benvenuto.')}\n${boxEnd()}`);

        const config = getWelcomeGroup(from);
        const raw = String(context.textArgs || '').trim();
        const lower = raw.toLowerCase();

        if (lower.startsWith('set ')) {
            const custom = raw.slice(4).trim();
            if (!custom) {
                return reply(
`${sec('WELCOME — SET')}
${boxOpen()}
${line('Uso: .welcome set <frase>')}
${line('Placeholder: @user @group @desc')}
${line(`Attuale: ${getWelcomeCustom(from, 'welcome') ? getWelcomeCustom(from, 'welcome').slice(0, 80) : 'default'}`)}
${boxEnd()}`
                );
            }
            if (custom.length > 800) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Frase troppo lunga (max 800).')}\n${boxEnd()}`);
            setWelcomeCustom(from, 'welcome', custom);
            return reply(
`${sec('WELCOME — CUSTOM')}
${boxOpen()}
${line('✅ Frase di benvenuto impostata!')}
${line(`Testo: ${custom.slice(0, 120)}${custom.length > 120 ? '…' : ''}`)}
${line('Placeholder: @user, @group, @desc')}
${boxEnd()}`
            );
        }
        if (lower === 'set') {
            const cur = getWelcomeCustom(from, 'welcome');
            return reply(
`${sec('WELCOME — SET')}
${boxOpen()}
${line('Uso: .welcome set <frase>')}
${line('Placeholder: @user, @group, @desc')}
${line(`Attuale: ${cur ? cur.slice(0, 100) : 'default'}`)}
${boxEnd()}`
            );
        }
        if (lower === 'reset' || lower === 'clear' || lower === 'default') {
            setWelcomeCustom(from, 'welcome', null);
            return reply(`${sec('WELCOME — RESET')}\n${boxOpen()}\n${line('✅ Frase custom rimossa, tornato al default.')}\n${boxEnd()}`);
        }
        if (lower === 'mostra' || lower === 'show' || lower === 'vedi') {
            const cur = getWelcomeCustom(from, 'welcome');
            const status = config.welcome ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            return reply(
`${sec('WELCOME — CONFIG')}
${boxOpen()}
${line(`Stato: ${status}`)}
${line(`Custom: ${cur ? cur : 'default'}`)}
${line('.welcome on/off — attiva/disattiva')}
${line('.welcome set <frase> — frase custom')}
${line('.welcome reset — torna al default')}
${boxEnd()}`
            );
        }

        if (!lower || (lower !== 'on' && lower !== 'off' && lower !== 'true' && lower !== 'false' && lower !== 'si' && lower !== 'no' && lower !== 'attivo' && lower !== 'disattivo')) {
            const status = config.welcome ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            const hasCustom = getWelcomeCustom(from, 'welcome') ? 'custom' : 'default';
            return reply(
`${sec('BENVENUTO GRUPPO')}
${boxOpen()}
${line(`Stato: ${status} (${hasCustom})`)}
${line('.welcome <on|off>')}
${line('.welcome set <frase> — frase con @user/@group')}
${line('.welcome reset — rimuovi custom')}
${line('.welcome mostra — vedi config')}
${boxEnd()}`
            );
        }

        const enable = ['on', 'true', 'si', 'attivo'].includes(lower);
        setWelcomeGroup(from, 'welcome', enable);

        await reply(
`${sec(`BENVENUTO ${enable ? 'ATTIVATO' : 'DISATTIVATO'}`)}
${boxOpen()}
${line(enable ? '✅ Attivato' : '❌ Disattivato')}
${line(enable ? 'Verrà inviato' : 'NON verrà più inviato')}
${line('quando qualcuno entra.')}
${boxEnd()}`
        );
    },
};
