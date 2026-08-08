'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  COMANDI "POTENZA" — ScopaAmico Bot
//  Flusso a due step:
//    .scopa @utente      → il bot chiede con 3 pulsanti: quale POTENZA?
//    [premi pulsante]    → frase finale in base alla potenza scelta.
//  Il livello di potenza scala da "Gentile" a "Apocalittica": ogni livello ha
//  un proprio pool di frasi dedicate, con tono sempre più sopra le righe.
//  X = chi lancia, Y = la vittima (placeholder sostituiti in esecuzione).
// ─────────────────────────────────────────────────────────────────────────────

// Pool frasi: [comando][livello 1|2|3] = array di frasi.
const PHRASES = {
    scopa: {
        1: [
            "ha scelto la potenza gentile: un tocco lento, mani delicate e zero fretta. Y ha capito che l'eleganza batte sempre la foga.",
            "ha gestito tutto con la precisione di un orologio svizzero: approcci comodi, sguardi complici e il ritmo che sale piano, senza strappi.",
            "ha preferito la delicatezza a tutto il resto: un passo alla volta, come si maneggia una barchetta di carta. Y ha seguito senza paura.",
            "ha aperto le danze in slow motion: occhi negli occhi e il sottofondo perfetto. Il letto non ha neanche cigolato.",
            "ha preso Y per mano e portato tutto a bassa velocità: niente fretta, solo la giusta intesa. Una notte da incorniciare.",
            "ha deciso di abbassare ogni tensione: niente esibizioni, solo un avvicinamento morbido e un finale da applausi a scena aperta.",
            "ha messo la delicatezza da maestri: ogni centimetro di Y affrontato con rispetto. Y ha sorriso e il cuore ha battuto a rallentatore.",
            "ha fatto toccare il cielo a Y senza mai alzare la voce. Risultati di coppia: sorriso, complicita e un cuscino d'ordinanza.",
        ],
        2: [
            "ha alzato la temperatura con Y: ritmo deciso, energia costante e una presa da record. Il letto ha iniziato a fare immersioni.",
            "ha impostato la parola chiave fuoco lento: niente prigionieri, solo la musica di un battito sempre piu veloce. Y ha perso il conto del tempo.",
            "ha trasformato Y in un equilibrio di suoni: un movimento regolare, ma con la giusta marcia. Y ha chiesto il bis.",
            "ha regalato a Y un'esperienza classica eppure mozzafiato: nel momento giusto ha trovato il ritmo giusto, e tutta la stanza tremava.",
            "ha portato Y in settima marcia: gli avvicinamenti sono diventati moto armonici e ogni attimo una masterclass di intensita moderata.",
            "ha scelto il registro medio: storda mai, paura neanche. Y fiducioso, e tra un cambio di posizione e l'altro, un applauso latente.",
            "ha subito la corrente del tramonto di Y: dall'osso al tetto, dai suoi ormoni all'orologio. A meta strada, tutto aristotelico e potente.",
            "ha intrecciato i tempi con Y: la brace resta accesa, le prestazioni sono alte, e al crepuscolo e firmato il piu lungo dei punti di crescita.",
        ],
3: [
            "ha fatto ruotare tutte le regole della fisica con Y: potenza apocalittica, onde combinatorie e un tempo davvero ripido. Il letto ha chiesto asilo politico.",
            "il piccolo meteore a tutta potenza: al primo via, Y è passato dalla delicata all'incanto. Il finale è stato decodificato: più forte di sempre.",
            "ha sfogato dentro Y un moto circolare: nessun confine, nessuna regola. La casa ha tremato e il vicino lo ha preso per un terremoto.",
            "il barile strappato: molle tese e un crescendo che ha l'equilibrio giusto nel tutto o niente. Y è rimasto senza il conto dei numeri.",
            "potenza Massima spiccata: la segnaletica è superata e il segnale ha raggiunto tutte le antenne. Quindici minuti che hanno reso Y il nuovo standard.",
            "ha sganciato sette piattini su Y: col movimento devastante, l'onda è andata oltre il quadro e il tempo si è fermato a guardare.",
            "tutto al massimo: un punto di sutura del paesaggio, la parete travolta, la sedia scardinata e il mondo ha fatto il tag.",
            "il furious classic fast che genera Y: ha schiantato tutto per un potente urlo finale, e alla fine il sassofono ha suonato lui. Stand up.",
        ],
    },
    sborra: {
        1: [
            "ha voluto un gesto discreto: una piccola scarica, un gocciolino timido, e subito dopo un 'ops'. Y ha fatto finta di niente.",
            "ha scelto la potenza da spruzzino da ufficio: si è avvicinato piano, ha premuto con cautela e il risultato è stato un soffio.",
            "modalita soffice: una spruzzata leggera, quasi poetica. Y si è guardato la maglietta e ha tirato un sospiro di sollievo.",
            "ha optato per il getto minimo: poche gocce ben piazzate, da intenditori. Il segnale c'è, l'intensità si allenerà.",
            "ha fatto partire una fontanella da balcone: misurata, educata, con il getto che finisce giusto sul filo. Y applaude con un sorriso.",
            "delicato e controllato: una sorsata d'acqua al massimo del rispetto. I presenti hanno notato il self control. Chapeau.",
            "ha usato la potenza 'coltellino svizzero': piccola, precisa, chirurgica. Il risultato: un sorriso e zero danni collaterali.",
            "ha sparato un micro-spruzzo di cortesia: giusto per far capire che la serata è interessante. Niente eccessi, promesso.",
        ],
        2: [
            "ha caricato la pressione: il getto è partito a mezza potenza e ha colpito in pieno. Y ha fatto un salto indietro e un applauso involontario.",
            "modalita media spruzzata: un getto deciso, ben indirizzato, con tanto di tiro. Y ha capito che non era per scherzo.",
            "ha scelto la potenza media: il flusso è partito come un annaffiatoio ben calibrato, e Y si è ritrovato con una scia.",
            "ha spinto la leva fino a metà: getto costante, pressione piacevole e una nube che ha fatto il giro. La serata ha preso il ritmo.",
            "ha regolato l'ugello al 60%: un getto pieno, con una traiettoria da manuale. Y ha salutato il proprio orgoglio per il bis.",
            "fuoco medio: una scarica corposa ma sotto controllo. I mobili si sono salvati, Y un po' meno. Colonna sonora di risate.",
            "ha innescato il getto 'quasi abbagliante': potente a sufficienza, con una distribuzione da competizione. Y ha applaudito da vero intenditore.",
            "ha usato la modalita mezza fuoco: intensa, regolare, con un finale esplosivo ma dignitoso. Il gruppo ha chiesto il replay.",
        ],
        3: [
            "APOCALISSIS: ha aperto la diga e Y si è ritrovato in mezzo a una cascata. Il soffitto ha chiesto il permesso e la casa è andata in riserva.",
            "il getto definitivo: una scarica da monsone, con una pressione che ha fatto suonare l'allarme del piano di sotto. Y è rimasto a bocca asciutta... per un attimo.",
            "potenza massima: il flusso ha scavato un canale e ha riempito la stanza. I presenti hanno capito che qui non si scherza.",
            "ha azionato la pompa apocalittica: un getto così potente che ha cambiato il colore delle tende. Y ha chiesto asilo in bagno.",
            "la mega-sfuriata: un torrente che ha travolto ogni barriera. I mobili si sono spostati da soli e Y ha invocato il codice arancione.",
            "ha scelto il cataclisma: la pressione ha fatto tremare i vetri e Y ha ringraziato di essere sopravvissuto. Un atto di forza pura.",
            "il vento della mezzanotte: un getto così violento che ha creato l'arcobaleno dentro casa. Il condominio ha chiamato per sapere che succede.",
            "potenza divina: una scarica che ha inzuppato tutto il quartiere. Y ha giurato di non ridere più, ma lo sa che è una bugia.",
        ],
    },
    sega: {
        1: [
            "ha voluto una sega dolcissima: movimenti lenti, poca pressione, e una pausa per guardare Y con tenerezza. Sembra una scena da film.",
            "si è messo all'opera con calma: una mano ferma, l'altra a carezza Y, e il ritmo di un cuore tranquillo. Y si è rilassato in fretta.",
            "ha deciso di andarci piano: come chi sbuccia una mela con cura, ha proceduto senza fretta. Il risultato: Y contento e nessun cedimento.",
            "modalita gentile: pochi giri, tantissima attenzione. Y ha chiuso gli occhi e ha mormorato 'continua pure'.",
            "una sega da boutique: setosa, misurata, con il tocco di un artigiano. Y ha apprezzato la tecnica e chiesto il replay.",
            "ha scelto la marcia bassa: niente fretta, un ritmo cullante e una punta di magia. Y ha dimenticato dove si trovava.",
            "con la dolcezza di una nonna con la torta: gesti lenti, precisi e pieni di affetto. Y ha sorriso e ringraziato.",
            "potenza leggera: una sega timida ma efficace, con la giusta dose di coccole. Il cuore di Y ha battuto al ritmo giusto.",
        ],
        2: [
            "ha acceso il motore: movimenti regolari, pressione crescente e il ritmo che sale. Y ha iniziato a farsi serio.",
            "modalita media: una sega decisa, ben ritmata, con il polso sicuro di chi sa il fatto suo. Y ha perso il filo del discorso.",
            "ha aumentato i giri: il movimento è diventato costante e piacevole, con una presa da manuale. Y ha emesso un sospiro convinto.",
            "una sega energica ma controllata: la marcia giusta, il ritmo giusto, e un finale da applausi. Y ha chiesto il bis.",
            "ha usato la potenza media: un lavoro pulito, intenso, con la giusta dose di varieta. Il risultato: Y soddisfatto e il pubblico in attesa.",
            "ritmo deciso: si è preso cura di Y con l'energia di chi ha capito le esigenze. Ogni movimento era perfetto. Y non ha fatto resistenza.",
            "ha messo la quinta: una sega da competizione, con cambi di ritmo e finale a sorpresa. Y ha battuto le mani.",
            "modalita sprint: movimenti rapidi ma precisi, con la giusta tensione. Y ha finito con un sorriso appagato.",
        ],
        3: [
            "potenza massima: una sega da uragano, con movimenti così veloci che sembravano un frullatore. Y ha visto le stelle senza telescopio.",
            "il trapano definitivo: una sega apocalittica, con un ritmo che ha fatto tremare i muri. Y ha invocato tutti i santi del calendario.",
            "il ciclone: si è scatenato con una velocità impressionante e una pressione da record. Il letto ha chiesto il cambio residenza.",
            "la sega del secolo: potenza pura, movimento implacabile, e un finale che ha fatto cadere il quadro dal muro. Y ha applaudito tra i singhiozzi.",
            "modalita devastante: il polso di Y ha marciato come un motore. La finestra ha tremato e il vicino ha pensato a lavori in corso.",
            "il mostro: una sega così potente che ha staccato la corrente per un secondo. Y ha ringraziato di essere ancora vivo.",
            "apocalisse segatoria: il ritmo ha superato ogni limite umano, e il finale ha fatto esplodere il termometro. Y è entrato nella leggenda.",
            "il maelstrom: una sega da film horror, con il movimento che ha piegato la sedia. Y si è rialzato con una nuova rispettosa paura.",
        ],
    },
    squirt: {
        1: [
            "ha aperto le danze con delicatezza: una piccola onda timida, giusto un assaggio. Y si è guardato e ha sorriso, niente allagamenti.",
            "modalita brezza: un getto leggero e controllato, come l'acqua di un rubinetto alla pressione minima. Tutto sotto controllo.",
            "ha scelto la potenza soffice: poche gocce eleganti, con la classe di chi sa servire un aperitivo. Y ha alzato il bicchiere.",
            "un accenno di getto: quasi poetico, una carezza liquida. I presenti hanno notato la misura e l'eleganza.",
            "la fontanella da terrazzo: un filo d'acqua timido e composto, con la giusta dose di stile. Y ha applaudito con un occhiolino.",
            "potenza acquerello: una spruzzata leggera, delicata, quasi un abbraccio. Il risultato: sorrisi e zero panico.",
            "ha usato la goccia del benvenuto: piccola, precisa, quasi un cenno. Y ha capito che la serata promette bene.",
            "modo 'pioviggine': un getto misuratissimo, giusto per rompere il ghiaccio. Nessuno ha rotto nulla.",
        ],
        2: [
            "ha acceso la pompa a media pressione: il getto è partito deciso e ha colpito in pieno. Y ha fatto un salto indietro per la sorpresa.",
            "modalita media: un flusso pieno e ben indirizzato, con la potenza di un annaffiatoio al massimo. Y ha capito che non era uno scherzo.",
            "ha regolato l'ugello al 70%: un getto costante, con una traiettoria da manuale. La scena è stata ripresa e Y ha chiesto il replay.",
            "potenza media: un'onda piacevole, con la giusta intensita. I presenti hanno applaudito e chiesto un bis.",
            "la spruzzata di mezza stagione: un getto corposo ma controllato, con tanto di arcobaleno improvvisato. Y ha approvato con un pollice in su.",
            "ha sparato a mezza carica: un flusso che ha bagnato ma non travolto. Y ha ridacchiato e ha chiesto di alzare un po'.",
            "una fontana calibrata: getto costante, pressione piacevole e un finale pulito. Il gruppo ha sospirato di soddisfazione.",
            "modo 'doccia estiva': un getto pieno e rinfrescante, con la giusta dose di spinta. Y è rimasto sorpreso e compiaciuto.",
        ],
        3: [
            "APOCALISSIS: ha aperto tutte le valvole e Y è stato travolto da un fiume in piena. Il soffitto ha chiesto il cambio di residenza.",
            "la cascata del secolo: un getto così potente che ha inzuppato ogni angolo della stanza. I mobili si sono spostati da soli per non bagnarsi.",
            "potenza massima: un diluvio che ha fatto tremare i vetri. Il vicino ha chiamato per sapere se fosse caduta una diga.",
            "il cataclisma acquatico: una scarica che ha riempito la casa fino al secondo piano. Y ha navigato fino alla porta.",
            "la marea: un flusso che ha travolto ogni barriera e ha creato una piscina improvvisata. Il condominio ha indetto una riunione.",
            "il monsone: una pressione così violenta che ha staccato un quadro e inzuppato le tende. Y ha giurato vendetta con un sorriso.",
            "potenza divina: un getto che ha cambiato il clima della stanza. Gli specchi si sono appannati e il pavimento ha nuotato.",
            "il diluvio universale: un'onda che ha fatto il giro della stanza tre volte. Y ha alzato le braccia e ha ringraziato per essere sopravvissuto.",
        ],
    },
};

const POWER_META = {
    1: { emoji: '🪶', label: 'GENTILE', tag: 'Bassa' },
    2: { emoji: '🔥', label: 'ENERGICA', tag: 'Media' },
    3: { emoji: '🌋', label: 'APOCALIPTICA', tag: 'Massima' },
};

// Esegue il flusso power per un comando. cfg = { command, emoji, title }.
const runPower = async (sock, msg, args, context, cfg) => {
    const { command, textArgs, from, sender, targetJid, isButton, reply, services } = context;
    const { db, saveDB, sendButtons, sameJid, randomChoice } = services;

    const pendingTTL = 60 * 1000;
    const key = 'pending_power';

    // Stato in attesa separato per mittente: due utenti nella stessa chat
    // non si sovrascrivono a vicenda.
    const pendKey = `${sender}|${cfg.command}`;
    const pending = db[from]?.[key]?.[pendKey];

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
        const rnd = randomChoice(pool.length ? pool : ['ha scatenato il totale caos su Y. Fine dei dettagli, siamo in chat 😭']);
        const frase = rnd
            .replace(/X/g, `@${sender.split('@')[0]}`)
            .replace(/Y/g, target ? `@${target.split('@')[0]}` : '@nessuno');

        delete db[from][key][pendKey];
        if (!Object.keys(db[from][key]).length) delete db[from][key];
        saveDB();

        const meta = POWER_META[level];
        const targetName = target ? target.split('@')[0] : 'nessuno';
        const text = `╭━━━ 〈 ${cfg.emoji} *${cfg.title}* 〉 ━━━╮\n\n⚡ @${sender.split('@')[0]} ha sbloccato la potenza *${meta.label}* (${meta.tag})\n\n💢 @${targetName}\n\n_💬 ${frase}_\n\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
        await sock.sendMessage(from, {
            text,
            mentions: target ? [sender, target] : [sender],
        });
        return;
    }

    if (!targetJid) return reply(`Tagga chi vuoi colpire. Esempio: .${command} @nome`);
    if (!db[from]) db[from] = {};
    if (!db[from][key]) db[from][key] = {};
    db[from][key][pendKey] = { sender, target: targetJid, command: cfg.command, ts: Date.now() };
    saveDB();

    await sendButtons(sock, from,
        `⚡ ${cfg.emoji} *${cfg.title}* con @${targetJid.split('@')[0]}\n\nScegli la POTENZA della tua azione 👇`,
        [
            { label: '🪶 Gentile', id: `${command} 1` },
            { label: '🔥 Energica', id: `${command} 2` },
            { label: '🌋 Massima', id: `${command} 3` },
        ],
        msg);

    setTimeout(() => {
        if (db[from]?.[key]?.[pendKey]) {
            delete db[from][key][pendKey];
            if (!Object.keys(db[from][key]).length) delete db[from][key];
            saveDB();
        }
    }, pendingTTL);
};

module.exports = { runPower, PHRASES, POWER_META };