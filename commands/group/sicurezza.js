'use strict';
const fs = require('fs');
const path = require('path');
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'sicurezza',
    aliases: ['security','secur','protezione'],
    description: 'Mostra tutte le impostazioni di sicurezza del gruppo.',
    async run(sock, msg, args, context) {
        const { from, isGroup, sender, services } = context;
        const { db, sendButtons, getAntilinkGroup, getAntinukeGroup, getWelcomeGroup } = services || {};

        if (!isGroup) {
            const txt = `${sec('SICUREZZA')}\n${boxOpen()}\n${line('Funziona solo nei gruppi.')}\n${line('In privato non ci sono protezioni da gestire.')}\n${boxEnd()}`;
            if (typeof sendButtons === 'function') return sendButtons(sock, from, txt, [{ label: '🏠 Menu', id: 'menu' }], msg);
            return sock.sendMessage(from, { text: txt }, { quoted: msg });
        }

        let antilinkCfg = null;
        let antilinkActiveList = [];
        let antilinkCountActive = 0;
        try {
            if (typeof getAntilinkGroup === 'function') {
                antilinkCfg = getAntilinkGroup(from);
            } else {
                const p = path.join(__dirname, '..', '..', 'antilink.json');
                if (fs.existsSync(p)) {
                    const all = JSON.parse(fs.readFileSync(p, 'utf-8'));
                    antilinkCfg = all[from] || null;
                }
            }
        } catch (_) { antilinkCfg = null; }
        if (antilinkCfg && typeof antilinkCfg === 'object') {
            for (const [k,v] of Object.entries(antilinkCfg)) {
                if (v) { antilinkActiveList.push(k); antilinkCountActive++; }
            }
        }
        const antilinkOn = antilinkCountActive > 0;
        const antilinkDetail = antilinkCfg ? Object.entries(antilinkCfg).map(([k,v]) => `${v?'✅':'❌'} ${k}`).join('  ') : '❌ non configurato';

        let antinukeCfg = null;
        try {
            if (typeof getAntinukeGroup === 'function' && db) antinukeCfg = getAntinukeGroup(db, from);
            else if (db && db._antinuke && db._antinuke[from]) antinukeCfg = db._antinuke[from];
        } catch (_) {}
        const antinukeOn = !!(antinukeCfg && antinukeCfg.enabled);
        let antinukeControlsTxt = '';
        if (antinukeCfg && antinukeCfg.controls) {
            const onCtrls = Object.entries(antinukeCfg.controls).filter(([,v])=>v).map(([k])=>k).join(', ');
            antinukeControlsTxt = `Controlli: ${onCtrls || 'nessuno'}`;
        } else {
            antinukeControlsTxt = 'Non configurato';
        }
        const antinukeWl = antinukeCfg && Array.isArray(antinukeCfg.whitelist) ? antinukeCfg.whitelist.length : 0;

        const antifloodOn = db && db[from] ? db[from]._antiflood !== false : true;
        const antibotOn = !!(db && db._antibot && db._antibot[from] && db._antibot[from].enabled);
        const antibotWl = db && db._antibot && db._antibot[from] && Array.isArray(db._antibot[from].whitelist) ? db._antibot[from].whitelist.length : 0;
        const antiflameOn = !!(db && db._antiflame && db._antiflame[from] && db._antiflame[from].enabled);
        const bestOn = !(db && db._bestemmiometro && db._bestemmiometro[from] === false);
        const modoAdminOn = !!(db && db[from] && db[from]._modoadmin);
        let welcomeOn = true, goodbyeOn = true;
        try {
            if (typeof getWelcomeGroup === 'function') {
                const w = getWelcomeGroup(from);
                welcomeOn = !!w.welcome;
                goodbyeOn = !!w.goodbye;
            } else {
                const p2 = path.join(__dirname, '..', '..', 'welcome.json');
                if (fs.existsSync(p2)) {
                    const allW = JSON.parse(fs.readFileSync(p2, 'utf-8'));
                    if (allW[from]) { welcomeOn = !!allW[from].welcome; goodbyeOn = !!allW[from].goodbye; }
                }
            }
        } catch (_) {}

        const ok = (b) => b ? '✅ ATTIVO' : '❌ SPENTO';

        const text =
`${sec('SICUREZZA')}
${boxOpen()}
${line(`${ok(antilinkOn)} ANTILINK`)}
${line(`Filtri: ${antilinkCountActive}/8`)}
${line(antilinkDetail)}
${line(`${ok(antinukeOn)} ANTINUKE`)}
${line(antinukeControlsTxt)}
${line(`Whitelist: ${antinukeWl} utenti`)}
${line(`${ok(antifloodOn)} ANTIFLOOD`)}
${line(`${ok(antibotOn)} ANTIBOT ${antibotWl ? `(${antibotWl} wl)` : ''}`)}
${line(`${ok(antiflameOn)} ANTIFLAME`)}
${line(`${ok(bestOn)} BESTEMMIOMETRO`)}
${line(`${ok(modoAdminOn)} MODOADMIN`)}
${line(`WELCOME: ${welcomeOn?'✅':'❌'}  GOODBYE: ${goodbyeOn?'✅':'❌'}`)}
${boxEnd()}
▸ Gestisci con i pulsanti sotto`;

        const buttons = [
            { label: '🔗 Antilink', id: 'antilink' },
            { label: '🛡️ Antinuke', id: 'antinuke' },
            { label: '🤖 Antibot', id: 'antibot' }
        ];

        try {
            if (typeof sendButtons === 'function') {
                await sendButtons(sock, from, text, buttons, msg);
            } else {
                await sock.sendMessage(from, { text }, { quoted: msg });
            }
        } catch (e) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
    }
};
