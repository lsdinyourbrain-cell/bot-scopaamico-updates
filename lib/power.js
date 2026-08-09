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
            "ha usato il manuale dell'amore lento: un capitolo alla volta, con la calma di chi sa godersi ogni pagina. Y ha sottolineato ogni riga.",
            "ha impostato il pilota automatico sulla dolcezza: nessuna curva azzardata, solo rettilinei morbidi. Y si è addormentato soddisfatto.",
            "ha scelto il registro da balletto classico: movimenti studiati, respiri sincronizzati e un finale che sembrava scritto dal destino.",
            "ha accolto Y come si accoglie l'alba: senza rumore, con la giusta luce e una carezza al posto del buongiorno. Perfetto.",
            "ha messo la modalita coccole: un ritmo da ninna nanna, una mano tra i capelli e Y che ha dimenticato persino di aver fretta.",
            "ha trattato Y come un violino di Stradivari: con il tocco giusto, nel punto giusto, e una musica che ha incantato la stanza.",
            "ha dato il meglio con la calma zen: ogni movimento una meditazione, ogni pausa un respiro. Y ha raggiunto la pace dei sensi.",
            "ha scelto la lentezza delle domeniche mattina: niente sveglia, niente fretta, solo la dolcezza di esserci. Y ha ringraziato a modo suo.",
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
            "ha scelto la marcia energica: un ritmo che si è fatto sentire dal primo istante, con la giusta dose di sfida. Y ha accettato la sfida.",
            "ha acceso il motore di Y: la frizione giusta, l'accelerazione calibrata e una corsa che è finita in trionfo. Il motore di Y: ancora fumante.",
            "ha interpretato Y come una partitura jazz: improvvisazione, ritmo e un crescendo che ha fatto tremare il lampadario.",
            "ha optato per il registro rock: distorsioni, ritmo serrato e un finale da stadio. Y ha cantato pure lui, ma solo l'ultima nota.",
            "ha messo Y in modalita 'non ne posso piu': ritmo alto, presa salda e una resistenza che ha lasciato tutti a bocca aperta.",
            "ha dato a Y l'ora solare: un'ora piena di energia, con cambi di ritmo e una luna piena da incorniciare. Appuntamento alla prossima.",
            "ha sfoderato la tecnica del falco: colpi precisi, ritmo crescente e un finale piazzato al momento perfetto. Il pubblico ha applaudito.",
            "ha acceso l'atmosfera come un falò: caldo, intenso, con scintille che volavano ovunque. Y si è scaldato più del previsto.",
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
            "ha scatenato l'uragano perfetto su Y: vento a 200 all'ora, onde anomale e un barometro impazzito. Il gruppo ha decretato lo stato di emergenza.",
            "ha spinto Y oltre l'atmosfera: traiettoria apocalittica, rientro verticale e un'astronave che ha salutato gli alieni. Y: 'non me lo aspettavo'.",
            "ha usato la modalita cataclisma: ogni colpo una scossa, ogni scossa un boato. Il condominio ha pensato a un cantiere, ma era solo X.",
            "ha regalato a Y un finale da film d'azione: esplosioni, rallenty e un'inquadratura che è passata alla storia. Tutto in un'ora.",
            "ha attivato il protocollo 'zero freni': nessun limite, nessuna pietà, solo potenza pura. Y è uscito dal campo con le ginocchia di gelatina.",
            "ha firmato il capolavoro del secolo su Y: ogni movimento una pennellata, e un finale che il Louvre ha già messo sotto vetro.",
            "ha dato a Y un'assolo da concerto rock: batteria sfrenata, assolo di chitarra e un finale che ha fatto urlare il pubblico. Bis a scena aperta.",
            "ha portato Y al confine dell'universo: velocita luce, buchi neri e un big bang personale. Y, rientrato, ha chiesto solo un bicchiere d'acqua.",
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
            "ha scelto la modalita pioggerella: due gocce timide, quasi un saluto. Y ha ringraziato per la discrezione. Serata salva.",
            "ha usato l'erogatore alla potenza 'olio essenziale': una spruzzata leggera, profumata, con la classe di un rituale zen.",
            "ha dato a Y un piccolo assaggio: un goccino che non macchia ma che fa capire le intenzioni. Y ha capito al volo.",
            "ha scelto il getto da antibiotico: un filo sottile, misuratissimo, che arriva esattamente dove deve. Precisione da farmacia.",
            "ha optato per il micro-nebulizzatore: una nuvoletta leggera che si dissolve in un attimo. Y ha starnutito per l'emozione.",
            "ha premuto con il dito di una mano sola: un goccio contenuto, elegante, quasi un gesto di saluto. Il pubblico applaude.",
            "ha scelto la scarica 'contagocce': una goccia alla volta, con la pazienza di un orologiaio. Y ha contato fino a tre.",
            "ha usato la potenza 'soffio di vento': nulla di eclatante, ma un'intenzione chiara. Y ha capito che le cose serie iniziano così.",
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
            "ha caricato a metà serbatoio: un getto generoso, con una pressione che ha fatto sobbalzare Y. Il gruppo ha notato l'andamento.",
            "ha scelto l'ugello largo: una copertura uniforme e una scia da capogiro. Y ha dovuto asciugarsi, ma con un sorriso.",
            "ha usato la potenza 'doccia estiva': un getto fresco, abbondante e inarrestabile. Y è uscito rinfrescato, quasi ringraziando.",
            "ha acceso la pompa al 70%: un getto potente e preciso, con un finale che ha bagnato la parete. Il dipinto ha cambiato colore.",
            "ha scelto la modalita irroratrice: spruzzi decisi, ben distribuiti e un arcobaleno improvvisato. Y ha scattato una foto.",
            "ha innescato il getto da giardiniere: abbondante, calibrato e con la giusta pressione. Il prato di Y è rinato.",
            "ha dato a Y una mezza scarica da piscina: un tuffo improvviso, un tuffo ben assestato, e un finale da olimpiadi.",
            "ha usato la potenza del montante: un getto che sale, scende e colpisce. Y ha dovuto cambiare maglietta, ma ha riso.",
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
            "ha aperto tutte le valvole del serbatoio: un diluvio che ha trasformato il salotto in piscina. Il salvagente ora è obbligatorio.",
            "ha scelto la modalita tsunami: un'onda anomala che ha colpito tutto ciò che trovava. Y ha cercato un'isola, ma era troppo tardi.",
            "ha azionato il cannone ad acqua: un getto che ha abbattuto un muro e bagnato il vicino. Y ha cambiato identità per il pudore.",
            "potenza nubifragio: una scarica che ha fatto suonare tutti gli allarmi del palazzo. I pompieri hanno fatto un sopralluogo.",
            "ha scelto il cataclisma finale: una pressione che ha piegato il pavimento e fatto piangere i rubinetti. Y ha chiesto un referendum.",
            "il diluvio universale: un getto che ha riempito ogni contenitore, ogni tazza, ogni scarpa. Y è stato salvato solo dai suoi stivali.",
            "ha azionato la super pompa del creatore: una scarica che ha riempito l'intero condominio. Le bollette dell'acqua sono aumentate di colpo.",
            "potenza biblica: una scarica che ha fatto arretrare il mare. Y ha chiesto di firmare l'arca, ma ormai era tutto allagato.",
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
            "ha usato la tecnica del velluto: ogni movimento una carezza, ogni pausa un respiro. Y ha dimenticato il resto del mondo.",
            "ha scelto la lentezza del mercante d'arte: tocca, guarda, valuta, ricomincia. Y ha capito di essere un capolavoro.",
            "una sega da salotto: elegante, misurata, con il garbo di chi sa intrattenere. Y ha applaudito tra un sospiro e l'altro.",
            "ha impostato il ritmo della ninna nanna: lento, cullante, avvolgente. Y ha rischiato di addormentarsi per la tranquillità.",
            "ha scelto la modalita massaggio: dita leggere, pressione calibrata e una carezza finale. Y ha chiesto la suite.",
            "ha usato la delicatezza del giardiniere con una rosa: attenzione, rispetto e il gesto giusto. La rosa di Y è sbocciata.",
            "ha dato a Y un tocco da pianista: dita morbide, ritmo delicato e un finale da standing ovation. Y ha firmato l'autografo.",
            "ha scelto la potenza 'piuma': un movimento leggero come una piuma, ma con l'intensità giusta. Y ha sorriso di piacere.",
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
            "ha scelto la marcia turistica: costante, affidabile, con qualche sorpasso improvviso. Y ha aggiornato il navigatore.",
            "ha usato il polso da chirurgo: precisione millimetrica, ritmo calibrato e un finale pulito. Y ha chiesto l'intervento di richiamo.",
            "ha impostato la modalita power walk: energia in aumento, poche pause e una meta raggiunta. Y ha tagliato il traguardo trafelato.",
            "ha acceso il turbo: la potenza è salita di colpo e Y ha dovuto aggrapparsi. Il letto ha iniziato a scricchiolare.",
            "ha scelto il ritmo del percussionista: preciso, potente, con un assolo finale da applausi. Y ha suonato insieme a lui.",
            "ha usato la tecnica dell'arciere: mira, tensione e un rilascio perfetto. Y ha colpito il bersaglio della soddisfazione.",
            "ha dato a Y una mezza maratona: ritmo costante, sudore e un traguardo glorioso. Y ha chiesto la medaglia.",
            "ha scelto la modalita pilota: guida decisa, curve nette e un traguardo in pole position. Y ha fatto il pit stop più felice della sua vita.",
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
            "ha scelto la modalita frullatore industriale: una velocità che ha sfiorato il muro del suono. Y ha chiesto il silenziatore.",
            "ha azionato il martello pneumatico: colpi secchi, potenti e inarrestabili. Il pavimento ha chiesto i danni.",
            "potenza reattore: una sega che ha generato energia per tutto il condominio. Y ha chiesto di pagare la bolletta.",
            "ha scelto il trapano ad alta frequenza: un ritmo che ha fatto vibrare i vetri e tremare i denti. Y ha cercato il tappo per le orecchie.",
            "la sega dei record: un movimento così veloce che gli osservatori hanno visto solo un'ombra. Y è diventato un testimonial.",
            "ha dato a Y un finale da gara di Formula 1: giri veloci, sorpassi e una bandiera a scacchi. Y ha alzato il trofeo.",
            "il turbo definitivo: una sega con accelerazione da missile, una scia e un boom sonico. Y ha chiesto il paracadute.",
            "apocalisse senza freni: nessun limite di velocità, solo un urlo finale. Il letto ha chiesto un'assicurazione contro i danni.",
        ],
    },
    ditalino: {
        1: [
            "ha usato il dito indice con estrema dolcezza: un tocco timido, una carezza leggera, e Y che si ricorda solo che è stato piacevole.",
            "ha proceduto con calma: movimento lento, quasi un gioco. Y si è rilassato e ha scoperto di gradirne la delicatezza.",
            "un dito esploratore gentile: pochi movimenti, tanto rispetto. Y sorride e chiede: 'ma è tutto qui?' Senza fretta, promesso.",
            "ha usato il dito come si usa un pennello: morbido, sfumato, senza pressione. Y ha chiuso gli occhi e ha sospirato. Un inizio perfetto.",
            "molto cortese: un tocco leggero, quasi un cenno. Y ha riso e ha detto che la tecnica va costruita con calma. Già, il viaggio è più bello.",
            "ha iniziato piano piano, con delicatezza da orologiaio: un piccolo movimento alla volta. Y ha apprezzato la lentezza come un bicchiere d'acqua fresca.",
            "un dito che sa parlare sommessamente: movimenti lenti e precisi, come una carezza. Sola attenzione, niente fretta.",
            "ha scelto la modalita piuma: un tocco quasi impercettibile, ma con l'intenzione giusta. Y ha avuto un brivido che ha detto tutto.",
            "ha usato il dito come un'esca: lento, curioso, alla scoperta di ogni reazione. Y ha abboccato al primo movimento.",
            "ha dato a Y una carezza esplorativa: un dito che va piano, che impara la strada, che non si perde. Y ha fatto da guida.",
            "ha scelto il ritmo della pioggia leggera: tocchi sottili, continui, rasserenanti. Y si è addormentato felice.",
            "un dito da maestro di cerimonie: misurato, elegante, con il gesto giusto al momento giusto. Y ha applaudito con gli occhi.",
            "ha usato la delicatezza del sismografo: percepisce ogni piccolo movimento e risponde con calma. Y ha registrato tutto.",
            "ha iniziato come chi apre un regalo prezioso: con cura, con curiosità, senza strappare la carta. Y ha aspettato con il fiato sospeso.",
            "ha scelto la lentezza del miele: un movimento fluido, dolce, che non si ferma mai. Y è rimasto incollato alla sensazione.",
            "un dito che sorride: ogni tocco una promessa, ogni pausa un'aspettativa. Y ha capito che le cose belle arrivano piano.",
        ],
        2: [
            "ha impiegato la marcia media: il dito si è mosso con decisione e Y ha iniziato a capire che non scherzava.",
            "un tocco più deciso: ritmo costante, bene calibrato, e la reazione di Y è diventata evidente. Il Gruppo resta in silenzio con simpatia.",
            "modalità mezza: un dito che fa centro, cambi di velocità e un finale convincente. Y ha chiesto di non fermarsi, ma c'è codice da scrivere. 😏",
            "ha alzato l'intensità: il dito si è fatto sentire, ritmo comodo e guance rosse. Y ha ringraziato e han fatto finta di niente.",
            "una mezza marcia perfetta: con due dita ha trovato il ritmo, gradualità e colpo finale azzeccato. Il pubblico indisturbato approva.",
            "ha usato il dito dominante: movimenti pieni, senza risparmio di delicatezza. Y accusa il colpo con un sorriso divertito.",
            "ritmo regolare ed energia giusta: il dito ha fatto centro 'nel bene e nel male'. Y ha commentato solo 'buona resistenza'. Colonna sonora da applausi.",
            "un lavoro medio pulito: dito ben piazzato, sequenza bilanciata e un epilogo da incontro ravvicinato. Tra i migliori del reparto.",
            "ha scelto la marcia del camionista: potente, costante, con qualche scossone. Y ha allacciato la cintura di sicurezza.",
            "ha usato il dito da pianista esperto: tocchi rapidi e precisi, con un assolo finale. Y ha chiesto il bis a scena aperta.",
            "ha impostato il pilota automatico su 'energy': ritmo vivace, poche pause e una meta raggiunta. Y ha chiesto di ripetere il giro.",
            "ha scelto la tecnica del battito: tre tocchi, una pausa, tre tocchi. Y ha seguito il ritmo come una canzone che non riesce a togliersi dalla testa.",
            "un dito da velocista: scatta, corre, arriva. Y ha battuto il record personale di sospensioni.",
            "ha usato il dito come un direttore d'orchestra: guidava il ritmo, e Y seguiva ogni movimento. Il finale ha avuto una standing ovation.",
            "ha scelto la modalita spazzola: ritmo continuo, superficie ampia, effetto garantito. Y ha chiesto una replica.",
            "ha dato a Y un'esperienza da montagna russa: salite, discese e un giro finale mozzafiato. Y è sceso con le gambe di gelatina.",
        ],
        3: [
            "potenza MASSIMA con un solo dito: una combinazione che ha fatto tremare le fondamenta. Y ha visto le stelle e ha chiesto subito il replay.",
            "il dito torna a casa: velocità e magia, ritmo apocalittico. Y invoca tutti i santi e il letto chiede la registrazione dei danni.",
            "un dito da uragano: movimenti fulminei e precisione assoluta. I vetri tremano, Y trattiene il fiato e ringrazia che sia finita.",
            "il mignolo scatenato: la combo di fine giornata. Y perde il filo del discorso e il gruppo lo nota. Potente, artistico e tutto da ridere.",
            "l'indice del destino: percorsi vorticosi, pressione notevole e un finale andato benissimo. Y, esausto, ride ancora.",
            "il dito più radioattivo della sala: movimento inarrestabile, temperatura alle stelle e tutto il condominio pensa a una motosega.",
            "apocalisse digitale: un solo dito, reazione a catena. Il cuscino fuori uso e un sospiro lungo un minuto. Record battuti.",
            "ha scelto la potenza 'dito del destino': ogni tocco un evento, ogni movimento un terremoto. Y ha chiesto asilo.",
            "il dito atomico: un'esplosione di energia che ha fatto tremare il lampadario. Y ha dovuto cambiare numero di telefono.",
            "ha usato il dito come una motosega: velocità, potenza e un rumore che ha svegliato il vicino. Y ha firmato per il rimborso.",
            "il dito del turbine: un vortice di movimenti che ha spazzato via ogni resistenza. Y ha chiesto scusa ai mobili.",
            "potenza dito-divina: un solo dito capace di piegare la realtà. Y ha visto l'universo e ha chiesto il replay.",
            "il dito impazzito: un ritmo che non conosce limiti, una pressione che non conosce freni. Y ha perso il conto.",
            "ha scelto il dito da motore di Formula 1: giri altissimi, cambi di ritmo e un finale da pole position. Y ha alzato il trofeo.",
            "il dito del vulcano: un eruzione di potenza che ha fatto tremare il pavimento. Y ha chiesto un paracqua.",
            "apocalisse da un dito: il singolo movimento più potente del decennio. Y, a terra, ha chiesto solo un'ambulanza e un applauso.",
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
            "ha scelto la modalita rugiada: una spruzzata leggera come la brina del mattino. Y si è svegliato e ha sorriso.",
            "ha usato l'ugello fine: un filo d'acqua sottile, quasi un soffio. Il risultato: un brivido e nessun danno.",
            "potenza perlage: goccioline fini che sembrano perle. Y le ha contate una a una, quasi perdersi.",
            "ha dato a Y una carezza liquida: un getto leggero e costante, come una melodia. Y ha chiuso gli occhi.",
            "ha scelto la modalita spruzzino: pochi spruzzi, molta eleganza. Il gruppo ha commentato: 'che stile'.",
            "ha usato il getto a bassa pressione: una spruzzata delicata, misurata, da vero intenditore. Y ha approvato.",
            "potenza microbolla: un getto così leggero che sembra una nuvola. Y ha respirato e si è rilassato.",
            "ha scelto la modalita nebulizzata: una nube fine, quasi invisibile. Y ha avuto un brivido e un sorriso.",
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
            "ha scelto la modalita idromassaggio: un getto deciso e continuo che ha fatto rilassare Y. Il gruppo ha chiesto un massaggio.",
            "ha usato la potenza annaffiatoio: un flusso abbondante, ben distribuito e rinfrescante. Il prato di Y è rinato.",
            "ha regolato l'ugello medio: un getto che ha colpito il bersaglio con precisione. Y ha chiesto il bis.",
            "ha scelto la modalita pompa: una pressione crescente, un ritmo costante e un finale da piscina. Y ha indossato gli occhialini.",
            "ha usato la potenza 'fontana del villaggio': un getto generoso che ha bagnato tutti. Il gruppo ha applaudito all'unisono.",
            "ha acceso il getto da giardino: abbondante, deciso, con una scia da capogiro. Y ha chiesto l'ombrello.",
            "ha scelto la modalita getto medio: potente ma controllato, con un finale a sorpresa. Y ha chiesto il replay.",
            "ha usato la potenza 'doccia a getto': un flusso pieno, regolare e inarrestabile. Y è uscito rinfrescato.",
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
            "ha azionato la pompa del creatore: un getto così potente che ha creato un nuovo lago. Y ha chiesto di fondare una marina.",
            "il tsunami: un'onda anomala che ha travolto ogni cosa. Y ha cercato un albero a cui aggrapparsi, ma era tutto allagato.",
            "la cascata di Niagara: un flusso che ha fatto suonare tutti gli allarmi. Y ha chiesto una muta da sub.",
            "ha scelto la modalita monsone: una pressione che ha fatto cambiare colore al muro. Y ha chiesto un battello.",
            "il getto del secolo: un flusso che ha riempito la stanza e ha fatto risalire il livello. Y ha nuotato fino al divano.",
            "ha azionato la super pompa: una scarica che ha inzuppato il quartiere. Il comune ha inviato un'idrovora.",
            "potenza biblica: un diluvio che ha fatto ricordare a tutti l'arca di Noè. Y ha chiesto due animali di ogni specie.",
            "la fine del mondo acquatica: un getto che ha allagato ogni stanza e fatto suonare l'allarme. Y, in canotto, ha chiesto un remo.",
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
