'use strict';

const { toStyle, toDecorated } = require('../../lib/font');
const { S, SEP, header, footer, bullet, section, box, sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const NAMES = [
    'Giovanni Batterista', 'Maria Pina', 'Giuseppe', 'Concetta', 'Antonio',
    'Francesca', 'Rocco', 'Assunta', 'Pasquale', 'Teresa',
    'Michele', 'Anna Maria', 'Carmine', 'Lucia', 'Vincenzo',
    'Gennaro', 'Salvatore', 'Rosa', 'Luigi', 'Giuseppina',
];

const SURNAMES = [
    'Rossi', 'Bianchi', 'Esposito', 'Romano', 'Colombo',
    'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo',
    'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano',
    'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana',
];

const FAKE_IPS = [
    '192.168.1.1', '10.0.0.1', '127.0.0.1', '192.168.0.69',
    '172.16.0.42', '8.8.8.8', '1.1.1.1', '255.255.255.255',
    '0.0.0.0', '192.168.69.69',
];

const FAKE_JOBS = [
    'Disoccupato professionista', 'Tassista sotto casa',
    'Addetto al porto in bolla', 'Consulente di niente',
    'Riparatore di asciugamani', 'Dirigente dell\'INPS',
    'Impiegato alla lottery', 'Venditore di bidet usati',
    'Direttore di condominio', 'Consulente blockchain',
];

const FAKE_CRIMES = [
    'Evasione fiscale di 3€', 'Furto di 12 cacciaviti',
    'Peschereccio abusivo', 'Possessione di formaggio non dichiarato',
    'Fuga dalla pigiama party', 'Riciclaggio di monetine',
    'Frode alimentare (pizza con l\'ananas)', 'Furto d\'identità di un fantasma',
    'Speculazione edilizia su cartoni', 'Vendita di calzini a 50€',
];

const FAKE_HISTORY = [
    'Come nascondere il maltolto su Google', 'Come dire "scusa" in tedesco',
    'Ricette per pizza con ananas', 'Come diventare ricchi in 5 minuti',
    'Perché il wi-fi non va', 'Dove nascondere il corpo',
    'Come fingere di lavorare da casa', 'Come spegnere il phone della moglie',
    'Come convincere il gatto ad obbedire', 'Come diventare invisibili',
];

const FAKE_PASSWORDS = [
    'password123', 'ciao123', '12345678', 'nomedicane69',
    'tuttocazzo2024', 'nonvirgilio', 'password1', 'mamma2020',
    'seipallido99', 'fatturare50k',
];

const FAKE_ADS = [
    'Telegram premium (gratuito)', 'OnlyFans del vicino',
    'Corso di "come non farsi beccare"', 'eBook "la verità sul mondo"',
    'Masterclass di caffè alla portiera', 'NFT del bidet',
    'Crypto di nonno', 'Borseggiatore da circolo ACLI',
    'Pigiama party deluxe', 'Mini-campagna di phishing',
];

const FAKE_BLOOD_TYPES = [
    'A+', 'B-', 'AB+', 'O-', 'Z+', 'X-', '网红+', '?-',
    'Non saputo mai fare il gruppo sanguigno', 'Lattice',
];

const FAKE_HEIGHTS = [
    '1.65 (dichiarato)', '1.58 (reale)', '1.80 (con tacchi)',
    '1.70 (con la frusta)', '1.75 (ma solo da seduto)',
    '1.60 (ma la personalità è alta)', '1.90 (ma solo la mano)',
    '1.68 (con la cresta)', '1.55 (ma 2 metri di presunzione)',
    '1.72 (ma 3 metri di presuntuosità)',
];

const FAKE_CITIES = [
    'Napoli (Sud)', 'Roma (Centro)', 'Milano (Nord)',
    'Torino (Polmone d\'Italia)', 'Palermo (Sicilia)',
    'Bari (Puglia)', 'Firenze (Toscana)', 'Genova (Liguria)',
    'Venezia (che affoga)', 'Bologna (la grassa)',
];

const FAKE_PHONES = [
    'Nokia 3310 (ancora in uso)', 'iPhone 4 (trovato per terra)',
    'Huawei della Lavazza', 'Samsung del 2005',
    'Telefono fissa del nonno', 'Nokia 1100 (bomb-proof)',
    'iPhone 15 Pro Max (ma è un clonato)', 'Motorola della polizia',
    'Telecomando del condizionatore', 'Banana phone',
];

const FAKE_STATUS = [
    ' SINGLE (ma non per scelta)', ' In una relazione (col jogo)',
    ' Complicato (con la vita)', ' ВATIONAL GUARD (a parte gli scherzi)',
    ' SINGLE da 99 anni (record locale)',
    ' In "relationship" con il frigo',
    ' SINGLE ma con 3 OnlyFans abbonamenti',
];

const FAKE_ZODIAC = [
    'Pesce (che nuota nel caos)', 'Leone (ma con la cresta)',
    'Vergine (di esperienza)', 'Bilancia (pesa solo panini)',
    'Scorpione (punge solo i vestiti)', 'Gemelli (uno vero, uno falso)',
    'Capricorno (capra internally)', 'Acquario (beve solo birra)',
];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    name: 'dox',
    aliases: ['dosx', 'dos'],
    description: 'Dox ironico: mostra dati personali completamente inventati di una persona.',

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, targetJid, isReply, contextInfo, reply, services } = context;
        const { sameJid } = services;

        const target = targetJid || sender;
        const displayName = target.split('@')[0];

        // Genera dati dox completamente casuali
        const fakeName = `${randomFrom(NAMES)} ${randomFrom(SURNAMES)}`;
        const fakeIP = randomFrom(FAKE_IPS);
        const fakeJob = randomFrom(FAKE_JOBS);
        const fakeCrime = randomFrom(FAKE_CRIMES);
        const fakeHistory = randomFrom(FAKE_HISTORY);
        const fakePassword = randomFrom(FAKE_PASSWORDS);
        const fakeAd = randomFrom(FAKE_ADS);
        const fakeBlood = randomFrom(FAKE_BLOOD_TYPES);
        const fakeHeight = randomFrom(FAKE_HEIGHTS);
        const fakeCity = randomFrom(FAKE_CITIES);
        const fakePhone = randomFrom(FAKE_PHONES);
        const fakeStatus = randomFrom(FAKE_STATUS);
        const fakeZodiac = randomFrom(FAKE_ZODIAC);
        const fakeAge = randomDigits(15, 99);
        const fakeIPPort = randomDigits(1, 65535);
        const fakeWifiPass = randomDigits(1000, 9999);

        const doxText =
`✦·✧·✦  *DOX COMPLETO*  ✦·✧·✦
${SEP.line}

👤 *Identità:*
${bullet(`Nome: _${fakeName}_`)}
${bullet(`@${displayName} — _${fakeCity}_`)}
${bullet(`Età: _${fakeAge} anni (dichiarati)_`)}
${bullet(`Altezza: _${fakeHeight}_`)}
${bullet(`Gruppo sanguigno: _${fakeBlood}_`)}

${S.dia} ${S.star}  *DATI TECNICI*  ${S.star} ${S.dia}
${SEP.lineL}

${bullet(`IP Pubblico: \`${fakeIP}:${fakeIPPort}\``)}
${bullet(`WiFi Password: \`WIFI_${fakeWifiPass}\``)}
${bullet(`Telefono: _${fakePhone}_`)}
${bullet(`Lavoro: _${fakeJob}_`)}
${bullet(`Zodiaco: _${fakeZodiac}_`)}
${bullet(`Stato: _${fakeStatus}_`)}

${S.star} ${S.dia}  *ATTIVITÀ ONLINE*  ${S.dia} ${S.star}
${SEP.lineL}

${bullet(`Cerca su Google:`)}
_${fakeHistory}_

${bullet(`Ultimo acquisto online:`)}
_${fakeAd}_


${S.star} ${S.dia} ${S.star}  *RECORD PENALE*  ${S.star} ${S.dia} ${S.star}
${SEP.lineL}

⚖️ _${fakeCrime}_


⚠️ *_TUTTI I DATI SONO COMPLETAMENTE INVENTATI_*
${S.star} ${S.starW} ${S.dia} ${S.starW} ${S.star}
`;

        await sock.sendMessage(from, {
            text: doxText,
            mentions: [target],
        });
    },
};
