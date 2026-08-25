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
            "ha fatto lento a X: un colpo per volta, profondo giusto. Y non voleva più smettere.",
            "X ha preso Y piano: ogni spinta fino in fondo, respiro sul collo. Y si è sciolto/a.",
            "ritmo lento e sporco: X dentro Y, senza fretta, sentendo tutto. Y gemito dopo gemito.",
            "X ha aperto le gambe a Y con calma: primo colpo lento, poi sempre più fondo. Y tremava.",
            "modalità soft ma sporca: X incollato/a a Y, movimenti circolari lenti. Y artigli nel dorso.",
            "X ha fatto sentire a Y tutto, centimetro per centimetro. Y pregava di continuare.",
            "lento, intenso, fino alla fine: X e Y appiccicati, sudati. Y ha morduto il cuscino.",
        ],
        2: [
            "X ha scatenato il ritmo su Y: colpi secchi e profondi, il letto che sbatte al muro. Y urlava il nome di X.",
            "potenza 65%: X martellando Y, mani sui fianchi, presa ferrea. Y aveva le ginocchia cedevoli.",
            "X ha impalato Y e non si è fermato più: ritmo da bestia. Y graffiava le lenzuola.",
            "colpo dopo colpo, sempre più forte: X dentro Y come un pistone. Y ha perso il conteggio degli orgasm*.",
            "X ha girato Y come gli/lei serviva e ha spinto forte: schiaffoni, gemiti, sudore. Y chiedeva ancora.",
            "X in piedi, Y piegato/a: ritmo selvaggio e senza pietà. Il vicinato sapeva TUTTO.",
            "X ha fatto vibrare tutto il letto addosso a Y: spinte violente e continue. Y vedeva doppio.",
        ],
        3: [
            "APOCALISSE: X ha distrutto Y — colpi devastanti, profondità assurda, stanza in ginocchio. Y non riusciva più nemmeno a stare in piedi.",
            "X ha sfondato tutto: pistone infernale a tutta velocità dentro Y. Y ha visto le stelle, le costellazioni e l'aldilà.",
            "ritmo demoniaco: X ha scatenato l'inferno su Y, sudore ovunque, lenzuola distrutte. Y ha implorato tregua… poi il bis.",
            "X ha spinto oltre ogni limite umano: Y urlava, il letto crepava, i vicini hanno chiamato la polizia. Leggendario.",
            "100% senza freni: X martellante su Y fino al crollo. Y è crollato/a sul materasso con le gambe che tremavano ancora.",
            "X ha fatto il massacro: ogni colpo un terremoto, Y aggrappato/a alle sbarre del letto. La stanza era un campo di battaglia.",
            "X in modalità animale: niente pietà, solo istinto. Y è uscito/a dalle stanze carponi e sorridente.",
        ],
    },
    sborra: {
        1: [
            "getto controllato: X ha centrato Y con precisione chirurgica. Una perla ben piazzata.",
            "X ha spruzzato Y piano: filo sottile, mira perfetta. Y ha fatto spallucce… bagnate.",
            "carica leggera: X ha segnato Y a mezza distanza. Y asciugarsi non basta più.",
            "X ha firmato Y con una goccia artistica. Il corpo è una tela.",
            "erogazione soft: nuvoletta calda su Y. Y ha riso, poi si è guardato/a la maglia.",
        ],
        2: [
            "pressione piena: X ha allagato metà stanza e centrato Y in pieno faccia. Y ha cambiato identità.",
            "X ha sparato un arco perfetto su Y: copertura ampia, nessuna via di fuga. Y in ammollo totale.",
            "carica media-dura: X ha dipinto Y come un canvas. Modern art, prezzo al museo.",
            "X ha docciato Y a 65%: getto costante, mira oscillante. Y sapeva cosa sarebbe successo ed è rimasto/a lo stesso.",
            "X ha ricaricato e sparato due volte: doppio impatto su Y. Y ha chiesto l'asciugamano grande.",
        ],
        3: [
            "APOCALISSE IDRAULICA: diga aperta — X ha allagato la stanza intera, Y sta navigando su un materasso. Serve una pompa sommersa.",
            "X ha svuotato il serbatoio addosso a Y: onda anomala, tende zuppe, gatto traumatizzato. Y ha invocato Nettuno.",
            "potenza 100%: getto da idrante antincendio. Y è stato/a trovato/a tre stanze dopo, ancora appiccicoso/a.",
            "X ha fatto uno tsunami personale: Y ha fatto surf nel corridoio. I vigili hanno detto 'di nuovo voi?'.",
            "doppio colpo finale: X ha ricaricato all'istante e rifinito Y. Scienziati stanno studiando il caso.",
            "X ha allagato tutto fino al soffitto: Y nuota, la stanza è una piscina. All'assicurazione non ci andiamo.",
        ],
    },
    sega: {
        1: [
            "presa delicata di X su Y: dita intrecciate, ritmo lento e cullante. Y chiudeva gli occhi e respirava forte.",
            "X ha lavorato piano su Y: polso morbido, pressione giusta. Y mordeva il labbro per non gridare troppo presto.",
            "movimento circolare lento: X esperto/a, Y che si scioglieva come burro al sole.",
            "X ha iniziato piano da Y: ogni passaggio una provocazione. Y pregava di accelerare.",
            "carezze lente e sporche: X sa esattamente dove tenere Y. Y aveva già le ginocchia molli.",
        ],
        2: [
            "ritmo medio-forte: X pistone umano su Y, mano sicura e velocità crescente. Y ha perso il filo dei pensieri al terzo secondo.",
            "X ha alzato il ritmo su Y: colpi netti, presa ferrea. Y artigliava il divano e supplicava di non fermarsi.",
            "65% di potenza: X a tutta manovra su Y. Il rumore da solo raccontava la storia.",
            "X ha spinto Y oltre: accelerazione brutale, respiro affannoso. Y ha visto il cielo aperto in salotto.",
            "tecnica mista di X su Y: lenta-veloce-lenta, tortura pura. Y ha implorato il finale.",
        ],
        3: [
            "MODALITÀ TRAPANO: X a velocità supersonica su Y — attrito pericoloso, scintille vere. Y ha visto l'intera galassia e i suoi antenati.",
            "potenza massima: X pistone industriale, Y in cortocircuito totale. La mano di X ha chiesto il sindacato.",
            "X ha fatto il massaggio finale a Y: ritmo fuori scala, zero pietà. Y ha urlato in tre lingue diverse, una inventata sul posto.",
            "X è andato/a oltre i limiti della fisica: Y è crollato/a con le ginocchia a terra e un sorriso idiota. Capolavoro.",
            "finale epico: X ha chiuso Y in stile leggendario. Y camminerà storto per giorni… e felice.",
        ],
    },
    ditalino: {
        1: [
            "tocco piuma di X su Y: un dito, movimento circolare lentissimo. Y ha avuto brividi lungo la schiena.",
            "X ha esplorato Y con delicatezza sporca: punta delle dita esperta, ritmo ipnotico. Y si è arso/a subito.",
            "un dito, pazienza infinita: X ha studiato ogni reazione di Y. Y mordendosi il labbro non voleva risposte… voleva altro.",
            "X ha giocato piano con Y: carezze sottili, pause calcolate. Y tremava a ogni tocco.",
            "dito esperto, ritmo soft: X ha acceso Y come nessun altro. Y ha dimenticato il proprio nome per dieci secondi.",
        ],
        2: [
            "ritmo deciso: X due dita dentro Y, pressione calibrata e curva perfetta. Y si stringeva attorno chiedendo altro.",
            "X ha spinto Y al limite: movimento continuo, polso instancabile. Y aveva le anche fuori controllo.",
            "65% di potenza: X lavorando su Y come una professionista. Y ha affondato le unghie nella spalla di X.",
            "X ha trovato il punto debole di Y e l'ha martellato: gemiti crescenti, respiro rotto. Y pregava di non fermarsi mai.",
            "doppio stimolo di X su Y: dita + palmo sincronizzati. Y ha visto i colori cambiare nella stanza.",
        ],
        3: [
            "URAGANO: X tre dita, velocità folle su Y — schizzi, urlo finale, ginocchia crollate. La stanza sapeva TUTTO.",
            "X ha portato Y in orbita: ritmo demoniaco, precisione chirurgica, zero pietà. Y è crollato/a ridendo e piangendo insieme.",
            "potenza max: X pistone umano su Y fino allo sfondo totale. Y ha afferrato le lenzuola così forte da strapparle.",
            "X ha fatto tremare Y dall'interno: onda dopo onda fino al crollo finale. Y non reggeva più in piedi, solo appeso/a a X.",
            "climax atomico: X ha chiuso Y con un finale secco e profondo. Y ha urlato così forte che il vicino ha applaudit*.",
        ],
    },
    squirt: {
        1: [
            "onda soft: X ha fatto brillare Y di gocce leggere. Y sorrideva già bagnato/a.",
            "brezza calda: piccolo spruzzo, grande effetto. X ha centrato Y al punto giusto.",
            "X ha fatto il primo spruzzo su Y: filo sottile, bersaglio felice. Y voleva già il bis.",
            "getto minimo ma preciso: X firma Y con stile. Y ha detto 'ancora' prima di asciuggarsi.",
        ],
        2: [
            "pressione stabile: X ha docciato Y abbondante. Y è scivolato/a via dal divano, appiccicoso/a e felice.",
            "flusso pieno: X ha innaffiato Y dal petto in giù. Il pavimento ne porterà le cicatrici.",
            "X ha caricato il cannone: spruzzo medio-duro, copertura totale su Y. Y ha chiesto un telo mare.",
            "arco perfetto di X su Y: 65% potenza, zero pietà per i vestiti. Y ha fatto il bagno vestito/a.",
        ],
        3: [
            "TSUNAMI PERSONALE: cascata totale di X — Y in ammollo, mobili galleggianti, gatto arrampicato sulla tenda. Serve una barca.",
            "X ha aperto tutte le valvole: diluvio in salotto, vetri appannati, Y in modalità snorkeling. Il vicino ha chiamato i pompieri.",
            "potenza 100%: X ha svuotato l'oceano su Y. Y ha nuotato fino alla porta e ha aperto chiedendo soccorso… e il bis.",
            "doppia onda anomala: X ricarica istantanea e secondo diluvio su Y. Gli idrografi studiano il caso.",
            "X ha trasformato il soggiorno in piscina olimpionica: Y nuotava a rana verso l'uscita. Medaglia d'oro garantita.",
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
        "Fine trasmissione: torniamo seri. O no.",
        "Archiviato. Prossima scena a breve.",
    ],
    scopa: ["Il letto ha presentato reclamo.", "I vicini hanno chiamato… le autorità del buon gusto.", "Materasso: in terapia intensiva."],
    sborra: ["Contatore acqua: rotto dallo shock.", "Maglietta di Y: dichiarata dispersa.", "L'asciugamano ha chiesto l'asilo."],
    sega: ["Polso di X: ha chiesto ferie retribuite.", "Il vicino pensava a un cantiere. Non era un cantiere."],
    ditalino: ["Dito di X: promosso a chirurgo estetico.", "Y ha prenotato il bis prima di riprendersi."],
    squirt: ["Pavimento: ha chiesto il salvagente.", "Y: in modalità snorkeling fino a domani.", "Assicurazione: 'non copriamo questo'."],
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
