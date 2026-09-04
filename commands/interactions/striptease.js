'use strict';

const { dispOf, resolveJid } = require('../../lib/jid');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  STRIPTEASE — Vex Bot
//  Show a 3 atti sul bersaglio taggato: musica, luce, finale con voto.
//  Grafica unicode pulita, niente linee ASCII lunghe.
// 

const { toStyle } = require('../../lib/font');

const T = (s) => toStyle(String(s).toUpperCase(), 'scriptBold');
const ATTI = [
    {
        icon: '🎵',
        testo: [
            "la musica parte lenta… la cintura scivola a terra 🎶",
            "luci abbassate, primo indumento via… il pubblico urla",
            "la giacca vola nel primo fila: chi la prende la conserva",
        ],
    },
    {
        icon: '💃',
        testo: [
            "girata ipnotica… la maglia finisce sulla lampada 💡",
            "movimento del bacino brevettato: tre persone sono già svenute",
            "il ritmo sale… qualcuno ha tirato le banconote troppo presto",
        ],
    },
    {
        icon: '🔥',
        testo: [
            "atto finale… il resto va a finire nel ventilatore 🌪️",
            "ultimo capo lanciato verso il gruppo: mira perfetta",
            "blackout totale… quando tornano le luci è tutto finito (e meglio così)",
        ],
    },
];

module.exports = {
    name: 'striptease',
    aliases: ['strip'],
    description: "Show a tema in 3 atti sul bersaglio taggato. Tagga qualcuno di coraggioso.",

    async run(sock, msg, args, context) {
        const { from, targetJid, senderAlt, reply, services } = context;
        const { getCachedGroupMeta, sendButtons, randomChoice, randomInt, sleep } = services;

        // Bersaglio: tag diretto, risposta a un messaggio, oppure numero
        // scritto a mano (.striptease 39333...) per l'encore dai pulsanti.
        let target = targetJid;
        const numArg = String(args[0] || '').replace(/[^0-9]/g, '');
        if (!target && numArg.length >= 7) target = `${numArg}@s.whatsapp.net`;
        if (!target) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`💃 *${T('Striptease')}*\n\n▸ Tagga lo spogliarellista:\n▸ _.striptease @utente_`)}\n${boxEnd()}`);

        const targetShow = `@${dispOf(target)}`;
        const mentions = [target];

        // Atto 1
        await sock.sendMessage(from, {
            text: `${sec('INFO')}\n${boxOpen()}\n${line(`${T('Lo show comincia')} 🎬\n\n▸ ${targetShow} sale sul palco\n▸ _${randomChoice(ATTI[0].testo)}_\n\n`)}\n${boxEnd()}`,
            mentions,
        });
        await sleep(2200);

        // Atto 2
        await sock.sendMessage(from, {
            text: `${sec('INFO')}\n${boxOpen()}\n${line(`${T('Atto secondo')} ${ATTI[1].icon}\n\n▸ _${randomChoice(ATTI[1].testo)}_\n\n💸 _La platea impazzisce…_\n\n`)}\n${boxEnd()}`,
            mentions,
        });
        await sleep(2200);

        // Atto 3 + voto
        const voto = randomInt(70, 100);
        const bar = '█'.repeat(Math.round(voto / 10)) + '░'.repeat(10 - Math.round(voto / 10));
        await sock.sendMessage(from, {
            text: `${sec('INFO')}\n${boxOpen()}\n${line(`${T('Finale')} 🔥\n\n▸ _${randomChoice(ATTI[2].testo)}_\n\n\n🏆 *${votoLabel(voto)}*\n${bar} *${voto}%*\n\n`)}\n${boxEnd()}`,
            mentions,
        });

        await sendButtons(sock, from,
`${T('Rivuoi?')} 😏

▸ Vuoi un encore da
▸ ${targetShow}?`,
            [
                { label: '🔁 Encore!', id: `striptease ${String(target).split('@')[0]}` },
                { label: '🏠 Menu', id: 'menu' },
            ], msg, mentions);
    },
};

function votoLabel(v) {
    return v >= 95 ? 'LEGGENDA DEL PALCO' : v >= 85 ? 'SHOW DEVASTANTE' : 'BELLO E BOLLENTE';
}
