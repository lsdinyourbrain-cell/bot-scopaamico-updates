'use strict';

// Codici telefonici internazionali (E.164) -> bandiera del paese.
// Le chiavi più lunghe vengono provate per prime (es. 1809 = Rep. Dominicana
// ha la precedenza sul 1 generico di USA/Canada).
// Per +1 (NANP) le prefazioni 4 cifre restituiscono la bandiera corretta
// dei Caraibi e del Canada; tutto il resto del +1 è USA.

const FLAGS = {
    // ── 1 cifra ──────────────────────────────────────────────
    '1': '🇺🇸',               // USA (vedi NANP sotto) / Canada generico
    '7': '🇷🇺',               // Russia (KZ via prefissi sotto)

    // ── 2 cifre ──────────────────────────────────────────────
    '20': '🇪🇬',              // Egitto
    '27': '🇿🇦',              // Sudafrica
    '30': '🇬🇷',              // Grecia
    '31': '🇳🇱',              // Paesi Bassi
    '32': '🇧🇪',              // Belgio
    '33': '🇫🇷',              // Francia
    '34': '🇪🇸',              // Spagna
    '36': '🇭🇺',              // Ungheria
    '39': '🇮🇹',              // Italia
    '40': '🇷🇴',              // Romania
    '41': '🇨🇭',              // Svizzera
    '43': '🇦🇹',              // Austria
    '44': '🇬🇧',              // Regno Unito
    '45': '🇩🇰',              // Danimarca
    '46': '🇸🇪',              // Svezia
    '47': '🇳🇴',              // Norvegia
    '48': '🇵🇱',              // Polonia
    '49': '🇩🇪',              // Germania
    '51': '🇵🇪',              // Perù
    '52': '🇲🇽',              // Messico
    '53': '🇨🇺',              // Cuba
    '54': '🇦🇷',              // Argentina
    '55': '🇧🇷',              // Brasile
    '56': '🇨🇱',              // Cile
    '57': '🇨🇴',              // Colombia
    '58': '🇻🇪',              // Venezuela
    '60': '🇲🇾',              // Malaysia
    '61': '🇦🇺',              // Australia
    '62': '🇮🇩',              // Indonesia
    '63': '🇵🇭',              // Filippine
    '64': '🇳🇿',              // Nuova Zelanda
    '65': '🇸🇬',              // Singapore
    '66': '🇹🇭',              // Thailandia
    '81': '🇯🇵',              // Giappone
    '82': '🇰🇷',              // Corea del Sud
    '84': '🇻🇳',              // Vietnam
    '86': '🇨🇳',              // Cina
    '90': '🇹🇷',              // Turchia
    '91': '🇮🇳',              // India
    '92': '🇵🇰',              // Pakistan
    '93': '🇦🇫',              // Afghanistan
    '94': '🇱🇰',              // Sri Lanka
    '95': '🇲🇲',              // Myanmar
    '98': '🇮🇷',              // Iran

    // ── 3 cifre: Africa ──────────────────────────────────────
    '211': '🇸🇸',             // Sud Sudan
    '212': '🇲🇦',             // Marocco
    '213': '🇩🇿',             // Algeria
    '216': '🇹🇳',             // Tunisia
    '218': '🇱🇾',             // Libia
    '220': '🇬🇲',             // Gambia
    '221': '🇸🇳',             // Senegal
    '222': '🇲🇷',             // Mauritania
    '223': '🇲🇱',             // Mali
    '224': '🇬🇳',             // Guinea
    '225': '🇨🇮',             // Costa d'Avorio
    '226': '🇧🇫',             // Burkina Faso
    '227': '🇳🇪',             // Niger
    '228': '🇹🇬',             // Togo
    '229': '🇧🇯',             // Benin
    '230': '🇲🇺',             // Mauritius
    '231': '🇱🇷',             // Liberia
    '232': '🇸🇱',             // Sierra Leone
    '233': '🇬🇭',             // Ghana
    '234': '🇳🇬',             // Nigeria
    '235': '🇹🇩',             // Ciad
    '236': '🇨🇫',             // Rep. Centrafricana
    '237': '🇨🇲',             // Camerun
    '238': '🇨🇻',             // Capo Verde
    '239': '🇸🇹',             // São Tomé e Príncipe
    '240': '🇬🇶',             // Guinea Equatoriale
    '241': '🇬🇦',             // Gabon
    '242': '🇨🇬',             // Congo
    '243': '🇨🇩',             // RD Congo
    '244': '🇦🇴',             // Angola
    '245': '🇬🇼',             // Guinea-Bissau
    '246': '🇮🇴',             // Territorio Britannico Oceano Indiano
    '247': '🇦🇨',             // Ascensione
    '248': '🇸🇨',             // Seychelles
    '249': '🇸🇩',             // Sudan
    '250': '🇷🇼',             // Ruanda
    '251': '🇪🇹',             // Etiopia
    '252': '🇸🇴',             // Somalia
    '253': '🇩🇯',             // Gibuti
    '254': '🇰🇪',             // Kenya
    '255': '🇹🇿',             // Tanzania
    '256': '🇺🇬',             // Uganda
    '257': '🇧🇮',             // Burundi
    '258': '🇲🇿',             // Mozambico
    '260': '🇿🇲',             // Zambia
    '261': '🇲🇬',             // Madagascar
    '262': '🇷🇪',             // Riunione (e Mayotte)
    '263': '🇿🇼',             // Zimbabwe
    '264': '🇳🇦',             // Namibia
    '265': '🇲🇼',             // Malawi
    '266': '🇱🇸',             // Lesotho
    '267': '🇧🇼',             // Botswana
    '268': '🇸🇿',             // eSwatini
    '269': '🇰🇲',             // Comore
    '290': '🇸🇭',             // Sant'Elena
    '291': '🇪🇷',             // Eritrea

    // ── 3 cifre: Europa ──────────────────────────────────────
    '350': '🇬🇮',             // Gibilterra
    '351': '🇵🇹',             // Portogallo
    '352': '🇱🇺',             // Lussemburgo
    '353': '🇮🇪',             // Irlanda
    '354': '🇮🇸',             // Islanda
    '355': '🇦🇱',             // Albania
    '356': '🇲🇹',             // Malta
    '357': '🇨🇾',             // Cipro
    '358': '🇫🇮',             // Finlandia
    '359': '🇧🇬',             // Bulgaria
    '370': '🇱🇹',             // Lituania
    '371': '🇱🇻',             // Lettonia
    '372': '🇪🇪',             // Estonia
    '373': '🇲🇩',             // Moldavia
    '374': '🇦🇲',             // Armenia
    '375': '🇧🇾',             // Bielorussia
    '376': '🇦🇩',             // Andorra
    '377': '🇲🇨',             // Monaco
    '378': '🇸🇲',             // San Marino
    '379': '🇻🇦',             // Città del Vaticano
    '380': '🇺🇦',             // Ucraina
    '381': '🇷🇸',             // Serbia
    '382': '🇲🇪',             // Montenegro
    '383': '🇽🇰',             // Kosovo
    '385': '🇭🇷',             // Croazia
    '386': '🇸🇮',             // Slovenia
    '387': '🇧🇦',             // Bosnia ed Erzegovina
    '389': '🇲🇰',             // Macedonia del Nord
    '420': '🇨🇿',             // Cechia
    '421': '🇸🇰',             // Slovacchia
    '423': '🇱🇮',             // Liechtenstein

    // ── 3 cifre: Americhe e Caraibi ──────────────────────────
    '500': '🇫🇰',             // Isole Falkland
    '501': '🇧🇿',             // Belize
    '502': '🇬🇹',             // Guatemala
    '503': '🇸🇻',             // El Salvador
    '504': '🇭🇳',             // Honduras
    '505': '🇳🇮',             // Nicaragua
    '506': '🇨🇷',             // Costa Rica
    '507': '🇵🇦',             // Panama
    '508': '🇵🇲',             // Saint-Pierre e Miquelon
    '509': '🇭🇹',             // Haiti
    '590': '🇬🇵',             // Guadalupa
    '591': '🇧🇴',             // Bolivia
    '592': '🇬🇾',             // Guyana
    '593': '🇪🇨',             // Ecuador
    '594': '🇬🇫',             // Guyana Francese
    '595': '🇵🇾',             // Paraguay
    '596': '🇲🇶',             // Martinica
    '597': '🇸🇷',             // Suriname
    '598': '🇺🇾',             // Uruguay
    '599': '🇨🇼',             // Curaçao (e Bonaire)
    '670': '🇹🇱',             // Timor Est
    '672': '🇳🇫',             // Norfolk (e Antartide)
    '673': '🇧🇳',             // Brunei
    '674': '🇳🇷',             // Nauru
    '675': '🇵🇬',             // Papua Nuova Guinea
    '676': '🇹🇴',             // Tonga
    '677': '🇸🇧',             // Isole Salomone
    '678': '🇻🇺',             // Vanuatu
    '679': '🇫🇯',             // Figi
    '680': '🇵🇼',             // Palau
    '681': '🇼🇫',             // Wallis e Futuna
    '682': '🇨🇰',             // Isole Cook
    '683': '🇳🇺',             // Niue
    '685': '🇼🇸',             // Samoa
    '686': '🇰🇮',             // Kiribati
    '687': '🇳🇨',             // Nuova Caledonia
    '688': '🇹🇻',             // Tuvalu
    '689': '🇵🇫',             // Polinesia Francese
    '690': '🇹🇰',             // Tokelau
    '691': '🇫🇲',             // Micronesia
    '692': '🇲🇭',             // Isole Marshall

    // ── 3 cifre: Asia ────────────────────────────────────────
    '850': '🇰🇵',             // Corea del Nord
    '852': '🇭🇰',             // Hong Kong
    '853': '🇲🇴',             // Macao
    '855': '🇰🇭',             // Cambogia
    '856': '🇱🇦',             // Laos
    '880': '🇧🇩',             // Bangladesh
    '886': '🇹🇼',             // Taiwan
    '960': '🇲🇻',             // Maldive
    '961': '🇱🇧',             // Libano
    '962': '🇯🇴',             // Giordania
    '963': '🇸🇾',             // Siria
    '964': '🇮🇶',             // Iraq
    '965': '🇰🇼',             // Kuwait
    '966': '🇸🇦',             // Arabia Saudita
    '967': '🇾🇪',             // Yemen
    '968': '🇴🇲',             // Oman
    '970': '🇵🇸',             // Palestina
    '971': '🇦🇪',             // Emirati Arabi Uniti
    '972': '🇮🇱',             // Israele
    '973': '🇧🇭',             // Bahrein
    '974': '🇶🇦',             // Qatar
    '975': '🇧🇹',             // Bhutan
    '976': '🇲🇳',             // Mongolia
    '977': '🇳🇵',             // Nepal
    '992': '🇹🇯',             // Tagikistan
    '993': '🇹🇲',             // Turkmenistan
    '994': '🇦🇿',             // Azerbaigian
    '995': '🇬🇪',             // Georgia
    '996': '🇰🇬',             // Kirghizistan
    '998': '🇺🇿',             // Uzbekistan

    // ── +7: prefissi del Kazakistan ──────────────────────────
    '701': '🇰🇿', '702': '🇰🇿', '705': '🇰🇿', '707': '🇰🇿', '708': '🇰🇿',
    '771': '🇰🇿', '772': '🇰🇿', '773': '🇰🇿', '774': '🇰🇿', '775': '🇰🇿',
    '776': '🇰🇿', '777': '🇰🇿', '778': '🇰🇿',

    // ── +1 NANP: Caraibi e Canada ────────────────────────────
    '1242': '🇧🇸',             // Bahamas
    '1246': '🇧🇧',             // Barbados
    '1264': '🇦🇮',             // Anguilla
    '1268': '🇦🇬',             // Antigua e Barbuda
    '1284': '🇻🇬',             // Isole Vergini Britanniche
    '1345': '🇰🇾',             // Isole Cayman
    '1441': '🇧🇲',             // Bermuda
    '1473': '🇬🇩',             // Grenada
    '1649': '🇹🇨',             // Turks e Caicos
    '1664': '🇲🇸',             // Montserrat
    '1721': '🇸🇽',             // Sint Maarten
    '1758': '🇱🇨',             // Santa Lucia
    '1767': '🇩🇲',             // Dominica
    '1784': '🇻🇨',             // Saint Vincent
    '1787': '🇵🇷',             // Portorico
    '1939': '🇵🇷',             // Portorico
    '1809': '🇩🇴',             // Rep. Dominicana
    '1829': '🇩🇴',             // Rep. Dominicana
    '1849': '🇩🇴',             // Rep. Dominicana
    '1868': '🇹🇹',             // Trinidad e Tobago
    '1876': '🇯🇲',             // Giamaica
    '1204': '🇨🇦', '1226': '🇨🇦', '1236': '🇨🇦', '1249': '🇨🇦', '1250': '🇨🇦',
    '1289': '🇨🇦', '1306': '🇨🇦', '1343': '🇨🇦', '1365': '🇨🇦', '1367': '🇨🇦',
    '1382': '🇨🇦', '1387': '🇨🇦', '1403': '🇨🇦', '1416': '🇨🇦', '1418': '🇨🇦',
    '1428': '🇨🇦', '1431': '🇨🇦', '1437': '🇨🇦', '1438': '🇨🇦', '1450': '🇨🇦',
    '1468': '🇨🇦', '1474': '🇨🇦', '1506': '🇨🇦', '1514': '🇨🇦', '1519': '🇨🇦',
    '1548': '🇨🇦', '1579': '🇨🇦', '1581': '🇨🇦', '1584': '🇨🇦', '1587': '🇨🇦',
    '1604': '🇨🇦', '1613': '🇨🇦', '1639': '🇨🇦', '1647': '🇨🇦', '1672': '🇨🇦',
    '1683': '🇨🇦', '1705': '🇨🇦', '1709': '🇨🇦', '1742': '🇨🇦', '1753': '🇨🇦',
    '1778': '🇨🇦', '1780': '🇨🇦', '1782': '🇨🇦', '1807': '🇨🇦', '1819': '🇨🇦',
    '1825': '🇨🇦', '1837': '🇨🇦', '1867': '🇨🇦', '1873': '🇨🇦', '1879': '🇨🇦',
    '1902': '🇨🇦', '1905': '🇨🇦',
};

// Da un numero completo (es. "393471234567" o "+39 347...") restituisce
// la bandiera; altrimenti la bandiera neutra per sconosciuti.
const flagForNumber = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (!digits) return '🌍';
    for (let len = 4; len >= 1; len--) {
        const prefix = digits.slice(0, len);
        if (FLAGS[prefix]) return FLAGS[prefix];
    }
    return '🌍';
};

// Da un jid WhatsApp (es. "393471234567@s.whatsapp.net") restituisce la bandiera.
const flagForJid = (jid) => flagForNumber(String(jid || '').split('@')[0]);

module.exports = { FLAGS, flagForNumber, flagForJid };