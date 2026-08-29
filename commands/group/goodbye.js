'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'goodbye',
    aliases: ['arrivederci', 'addio', 'bye'],
    description: "Gestisci il messaggio di arrivederci: on/off e frase custom (admin).",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { getWelcomeGroup, setWelcomeGroup, setWelcomeCustom, getWelcomeCustom } = services;

        if (!isGroup) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Questo comando funziona solo nei gruppi.')}\n${boxEnd()}`);
        if (!isOwner && !isSenderAdmin) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Solo gli admin possono modificare l\'arrivederci.')}\n${boxEnd()}`);

        const config = getWelcomeGroup(from);
        const raw = String(context.textArgs || '').trim();
        const lower = raw.toLowerCase();

        if (lower.startsWith('set ')) {
            const custom = raw.slice(4).trim();
            if (!custom) {
                return reply(
`${sec('GOODBYE — SET')}
${boxOpen()}
${line('Uso: .goodbye set <frase>')}
${line('Placeholder: @user @group')}
${line(`Attuale: ${getWelcomeCustom(from, 'goodbye') ? getWelcomeCustom(from, 'goodbye').slice(0, 80) : 'default'}`)}
${boxEnd()}`
                );
            }
            if (custom.length > 800) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Frase troppo lunga (max 800).')}\n${boxEnd()}`);
            setWelcomeCustom(from, 'goodbye', custom);
            return reply(
`${sec('GOODBYE — CUSTOM')}
${boxOpen()}
${line('✅ Frase di arrivederci impostata!')}
${line(`Testo: ${custom.slice(0, 120)}${custom.length > 120 ? '…' : ''}`)}
${line('Placeholder: @user, @group')}
${boxEnd()}`
            );
        }
        if (lower === 'set') {
            const cur = getWelcomeCustom(from, 'goodbye');
            return reply(
`${sec('GOODBYE — SET')}
${boxOpen()}
${line('Uso: .goodbye set <frase>')}
${line('Placeholder: @user, @group')}
${line(`Attuale: ${cur ? cur.slice(0, 100) : 'default'}`)}
${boxEnd()}`
            );
        }
        if (lower === 'reset' || lower === 'clear' || lower === 'default') {
            setWelcomeCustom(from, 'goodbye', null);
            return reply(`${sec('GOODBYE — RESET')}\n${boxOpen()}\n${line('✅ Frase custom rimossa, tornato al default.')}\n${boxEnd()}`);
        }
        if (lower === 'mostra' || lower === 'show' || lower === 'vedi') {
            const cur = getWelcomeCustom(from, 'goodbye');
            const status = config.goodbye ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            return reply(
`${sec('GOODBYE — CONFIG')}
${boxOpen()}
${line(`Stato: ${status}`)}
${line(`Custom: ${cur ? cur : 'default'}`)}
${line('.goodbye on/off — attiva/disattiva')}
${line('.goodbye set <frase> — frase custom')}
${line('.goodbye reset — torna al default')}
${boxEnd()}`
            );
        }

        if (!lower || (lower !== 'on' && lower !== 'off' && lower !== 'true' && lower !== 'false' && lower !== 'si' && lower !== 'no' && lower !== 'attivo' && lower !== 'disattivo')) {
            const status = config.goodbye ? '🟢 ATTIVO' : '🔴 DISATTIVO';
            const hasCustom = getWelcomeCustom(from, 'goodbye') ? 'custom' : 'default';
            return reply(
`${sec('ARRIVEDERCI GRUPPO')}
${boxOpen()}
${line(`Stato: ${status} (${hasCustom})`)}
${line('.goodbye <on|off>')}
${line('.goodbye set <frase> — frase con @user/@group')}
${line('.goodbye reset — rimuovi custom')}
${line('.goodbye mostra — vedi config')}
${boxEnd()}`
            );
        }

        const enable = ['on', 'true', 'si', 'attivo'].includes(lower);
        setWelcomeGroup(from, 'goodbye', enable);

        await reply(
`${sec(`ARRIVEDERCI ${enable ? 'ATTIVATO' : 'DISATTIVATO'}`)}
${boxOpen()}
${line(enable ? '✅ Attivato' : '❌ Disattivato')}
${line(enable ? 'Verrà inviato' : 'NON verrà più inviato')}
${line('quando qualcuno esce.')}
${boxEnd()}`
        );
    },
};
