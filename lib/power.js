'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  COMANDI "POTENZA" — Vex Bot · v2 Premium
//  Flusso a due step con grafica unicode, barre █░ e percentuali.
//  .scopa @utente → chiede potenza (3 pulsanti)
//  [premi] → frase finale + barre + pulsanti "🔄 Ancora" / "👤 Altra vittima"
// ─────────────────────────────────────────────────────────────────────────────

const PHRASES = {
    scopa: {
        1: [
            "ha scelto la potenza gentile: un tocco lento e preciso. Y ha apprezzato il ritmo calmo.",
            "modalità delicata: movimenti morbidi, sguardi complici. Y ha seguito senza fretta.",
            "ha impostato il soft: carezze leggere e ritmo costante. Y ha sorriso.",
            "approccio lento e curato: ogni passo misurato. Y ha gradito.",
            "ha preferito la dolcezza: gesti semplici, effetto pulito. Y ok.",
            "potenza bassa ma sicura: poche mosse, tanta attenzione. Y soddisfatto.",
            "ha gestito tutto con calma: il tempo giusto, zero forzature. Y tranquillo.",
            "stile leggero: poche scintille, atmosfera distesa. Y approva.",
        ],
        2: [
            "ha alzato il ritmo: energia decisa e presa salda. Y ha retto bene.",
            "modalità media: colpi regolari, intensità crescente. Y ha perso il conto.",
            "ha spinto a metà potenza: ritmo costante e finale pulito. Y applaude.",
            "registro energico: movimenti decisi, nessuna pausa. Y ha chiesto aria.",
            "ha messo la quarta: spinta continua e controllo. Y ha tenuto.",
            "potenza media piena: il letto ha iniziato a vibrare. Y ok, stanco.",
            "ha trovato il tempo giusto: forte ma gestibile. Y ha sorriso a metà.",
            "modalità turbo soft: scatto regolare, chiusura netta. Y soddisfatto.",
        ],
        3: [
            "potenza massima: scossa unica, stanza in vibrazione. Y ha visto le stelle.",
            "ha aperto tutto: colpo secco e onda lunga. Il letto ha chiesto pietà.",
            "modalità apocalisse: ritmo fuori scala, finale da manuale. Y ko.",
            "ha spinto oltre il limite: ogni colpo un boato. Y ha chiesto pausa lunga.",
            "ha scatenato l'uragano: tutto ha tremato. Y è uscito con le ginocchia molli.",
            "potenza 100%: nessun freno, solo spinta. Y ha giurato di non ridere più.",
            "ha chiuso da campione: serie perfetta e chiusura netta. Y leggenda.",
            "ha messo la massima: un colpo, due mondi. Y ha chiesto acqua.",
        ],
    },
    sborra: {
        1: [
            "getto leggero: poche gocce, mira precisa. Y ha fatto spallucce.",
            "modalità spruzzino: un soffio corto. Y ha sorriso.",
            "potenza minima: filo sottile, zero danni. Y tranquillo.",
            "ha scelto il goccio: una perla ben piazzata. Y ok.",
            "erogazione soft: nuvoletta leggera. Y ha riso.",
            "micro-getto: quasi un saluto. Y ha capito l'intenzione.",
        ],
        2: [
            "getto medio: pressione piena, mira stabile. Y ha fatto un passo indietro.",
            "media potenza: flusso costante, copertura ampia. Y ha cambiato maglia.",
            "ha caricato a metà: spruzzo deciso e pulito. Y ha applaudito a distanza.",
            "modalità doccia: getto pieno e regolare. Y rinfrescato.",
            "pressione 65%: arco perfetto, bersaglio centrato. Y ok, bagnato.",
        ],
        3: [
            "APOCALISSE: diga aperta, cascata totale. Y ha chiesto un canotto.",
            "potenza massima: getto da idrante, stanza allagata. Y in ammollo.",
            "ha svuotato il serbatoio: onda anomala. Y ha nuotato fino alla porta.",
            "modalità tsunami: tutto bagnato, tende comprese. Y ha chiesto scusa al vicino.",
            "ha sparato a 100%: diluvio in salotto. Y ha invocato la muta.",
        ],
    },
    sega: {
        1: [
            "mossa soft: tocco leggero, ritmo lento. Y ha chiuso gli occhi.",
            "potenza piuma: gesti misurati, zero fretta. Y rilassato.",
            "ha usato la calma: mano ferma, ritmo cullante. Y ha sorriso.",
            "modalità carezza: ogni passaggio una pausa. Y ok.",
        ],
        2: [
            "ritmo medio: colpi regolari, pressione giusta. Y ha perso il filo.",
            "ha messo la seconda: mano sicura, sequenza pulita. Y ha trattenuto il fiato.",
            "potenza 65%: scatto continuo, finale netto. Y ha chiesto il bis.",
            "modalità sprint soft: accelerazione graduale. Y ha retto.",
        ],
        3: [
            "modalità trapano: ritmo fuori scala, finale secco. Y ha visto le stelle.",
            "potenza massima: mano a pistone, stanza in vibrazione. Y ko.",
            "ha spinto al limite: velocità assurda, chiusura perfetta. Y leggenda.",
            "ha chiuso da manuale: colpo su colpo, senza pause. Y ha chiesto pietà.",
        ],
    },
    ditalino: {
        1: [
            "tocco piuma: un dito, movimento lento. Y ha avuto un brivido.",
            "modalità esplorazione: carezza leggera, ritmo soft. Y ha sorriso.",
            "ha usato la punta: gesti sottili, effetto pulito. Y ok.",
            "potenza bassa: pochi movimenti, tanta precisione. Y tranquillo.",
        ],
        2: [
            "ritmo deciso: dito costante, pressione calibrata. Y ha reagito.",
            "modalità media: tocco pieno, sequenza regolare. Y ha chiesto di continuare.",
            "ha spinto a metà: movimento continuo, chiusura netta. Y soddisfatto.",
            "potenza 65%: dito esperto, tempo perfetto. Y ha applaudito.",
        ],
        3: [
            "un dito, potenza max: vibrazione totale. Y ha trattenuto il fiato.",
            "ha spinto oltre: colpo secco, onda lunga. Y ha chiesto tregua.",
            "modalità uragano: dito a pistone, stanza in silenzio. Y ko.",
            "ha chiuso da campione: precisione estrema, finale netto. Y leggenda.",
        ],
    },
    squirt: {
        1: [
            "onda soft: poche gocce, effetto leggero. Y ha sorriso.",
            "modalità brezza: spruzzo corto, zero allagamenti. Y ok.",
            "getto minimo: filo sottile, bersaglio sfiorato. Y tranquillo.",
            "potenza piuma: nuvoletta leggera. Y ha riso.",
        ],
        2: [
            "getto medio: pressione stabile, copertura ampia. Y ha fatto un salto.",
            "modalità doccia: flusso pieno, ritmo costante. Y bagnato al punto giusto.",
            "ha spinto a 65%: arco pulito, bersaglio centrato. Y ha chiesto asciugamano.",
            "pressione media piena: onda regolare, finale netto. Y soddisfatto.",
        ],
        3: [
            "APOCALISSE: cascata totale, stanza in ammollo. Y ha chiesto un salvagente.",
            "potenza max: diluvio in salotto, vetri appannati. Y ha nuotato.",
            "ha aperto le valvole: onda anomala, pavimento bagnato. Y ko.",
            "modalità tsunami: tutto allagato, vicino in allarme. Y ha chiesto scusa.",
        ],
    },
};

const POWER_META = {
    1: { emoji: '🪶', label: 'GENTILE', tag: '30%', pct: 30, bar: '███░░░░░░░' },
    2: { emoji: '🔥', label: 'ENERGICA', tag: '65%', pct: 65, bar: '██████░░░░' },
    3: { emoji: '🌋', label: 'APOCALITTICA', tag: '100%', pct: 100, bar: '██████████' },
};

const toBold = (s) => '*' + String(s||'').trim() + '*';
const OUTRO = {
    main: [
        "Scena chiusa: il resto resta fuori campo.",
        "Sipario: il gruppo ha già capito abbastanza.",
        "Fine trasmissione: torniamo seri.",
        "Archiviato. Prossima scena a breve.",
    ],
    scopa: ["Il letto ha chiesto manutenzione.", "I vicini hanno sentito vibrare il pavimento."],
    sborra: ["Contatore acqua: ha fatto un balzo.", "Maglietta di Y: da lavare."],
    sega: ["Polso: ha chiesto ferie.", "Il vicino pensava a un cantiere."],
    ditalino: ["Dito: promosso a specialista.", "Y: ha chiesto un attestato."],
    squirt: ["Pavimento: ha chiesto un asciugamano.", "Y: in modalità snorkeling."],
};

const runPower = async (sock, msg, args, context, cfg) => {
    const { textArgs, from, sender, senderAlt, targetJid, isButton, reply, services } = context;
    const { db, saveDB, sendButtons, sameJid, randomChoice, sleep } = services;

    const pendingTTL = 60 * 1000;
    const key = 'pending_power';
    const pendKey = `${sender}|${cfg.command}`;
    const pending = db[from]?.[key]?.[pendKey];

    const disp = (jid, alt) => String(alt || jid || '').split('@')[0];
    const senderShow = disp(sender, senderAlt);
    const senderMention = senderAlt || sender;

    const SEP = '━━━━━━━━━━━━━━━━━━━━';
    const DOT = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈';

    if (isButton) {
        if (!pending) return;
        const level = parseInt(textArgs, 10);
        if (![1, 2, 3].includes(level)) return;
        if (!sameJid(sender, pending.sender)) return;
        if (Date.now() - pending.ts > pendingTTL) {
            delete db[from][key][pendKey];
            saveDB();
            return reply("⏳ Tempo scaduto! Ripeti il comando e scegli subito la potenza.");
        }
        const target = pending.target;
        const pool = PHRASES[cfg.command]?.[level] || PHRASES[cfg.command]?.[1] || [];
        const rnd = randomChoice(pool.length ? pool : ['ha completato la mossa su Y.']);
        const frase = rnd.replace(/X/g, `@${senderShow}`).replace(/Y/g, target ? `@${disp(target)}` : '@nessuno');

        delete db[from][key][pendKey];
        if (!Object.keys(db[from][key]).length) delete db[from][key];
        saveDB();

        const meta = POWER_META[level];
        const targetName = target ? disp(target) : 'nessuno';
        const pctBar = `${meta.bar}  ${meta.pct}%`;

        const intro =
`${cfg.emoji}  ${toBold(cfg.title)}  ·  ${toBold(meta.label)}
${SEP}
⚡  @${senderShow}  →  @${targetName}
💢  ${toBold(meta.label)}  ·  ${pctBar}
${DOT}
${toBold('Preparazione')} █████░░░░░ 50%
${SEP}
◈ Vex Bot`;

        const phraseMsg =
`💬  ${frase}
${DOT}
${meta.emoji}  ${pctBar}  ·  ${toBold(meta.label)}`;

        const outroPool = (OUTRO[cfg.command] && OUTRO[cfg.command].length ? OUTRO[cfg.command] : OUTRO.main);
        const outro = randomChoice(outroPool);

        await sock.sendMessage(from, { text: intro, mentions: target ? [senderMention, target] : [senderMention] });
        if (typeof sleep === 'function') await sleep(750);
        await sock.sendMessage(from, { text: phraseMsg, mentions: target ? [senderMention, target] : [senderMention] });
        if (typeof sleep === 'function') await sleep(900);
        await sock.sendMessage(from, { text: `_${outro}_`, mentions: [senderMention] });

        // Pulsanti finali: Ancora + Altra vittima + Menu (tag reale)
        const targetTag = target ? `@${disp(target)}` : '';
        const ancoraId = target ? `${cfg.command} ${targetTag}` : `${cfg.command}`;
        const btns = [
            { label: '🔄 Ancora', id: ancoraId.trim() },
            { label: '👤 Altra vittima', id: `${cfg.command}` },
            { label: '🏠 Menu', id: 'menu' },
        ];
        const afterText =
`${toBold('ANCORA?')}  ·  ${cfg.emoji} ${toBold(cfg.title)}
${SEP}
▸  @${senderShow} ha chiuso su @${targetName}
▸  ${pctBar}  ·  ${toBold(meta.label)}
${DOT}
Scegli sotto per continuare
${SEP}
◈ Vex Bot`;
        const mentionsAfter = target ? [senderMention, target] : [senderMention];
        await sendButtons(sock, from, afterText, btns, msg, mentionsAfter, { headerTitle: `${cfg.emoji} ${toBold(cfg.title)}`, footerText: '⬇️ Ancora o nuova vittima' });
        return;
    }

    if (!targetJid) return reply(`Tagga chi vuoi colpire. Esempio: ${toBold('.' + cfg.command + ' @nome')}`);

    if (!db[from]) db[from] = {};
    if (!db[from][key]) db[from][key] = {};
    db[from][key][pendKey] = { sender, target: targetJid, command: cfg.command, ts: Date.now() };
    saveDB();

    const targetDisp = disp(targetJid);
    const selText =
`◈  ${toBold(cfg.title)}  ◈
${SEP}
👤  @${senderShow}  →  @${targetDisp}
${DOT}
⚡  ${toBold('SCEGLI POTENZA')}  👇
${DOT}
🪶  ${toBold('GENTILE')}       ·  30%  ███░░░░░░░
🔥  ${toBold('ENERGICA')}      ·  65%  ██████░░░░
🌋  ${toBold('APOCALITTICA')}  · 100%  ██████████
${SEP}
Premi un pulsante qui sotto
◈ Vex Bot`;

    await sendButtons(sock, from, selText, [
            { label: '🪶 Gentile 30%', id: `${cfg.command} 1` },
            { label: '🔥 Energica 65%', id: `${cfg.command} 2` },
            { label: '🌋 Massima 100%', id: `${cfg.command} 3` },
        ], msg, [senderMention, targetJid], { headerTitle: `${cfg.emoji} ${toBold(cfg.title)}`, footerText: '⬇️ Scegli la potenza' });

    setTimeout(() => {
        if (db[from]?.[key]?.[pendKey]) {
            delete db[from][key][pendKey];
            if (!Object.keys(db[from][key]).length) delete db[from][key];
            saveDB();
        }
    }, pendingTTL);
};

module.exports = { runPower, PHRASES, POWER_META };
