'use strict';

// Saluti automatici "carini": quando qualcuno scrive buongiorno (o una delle
// sue varianti) nella fascia oraria del mattino, o buonanotte la sera/notte,
// il bot risponde in modo simpatico e ironico con un insultino leggero.
//
// Uso da index.js:
//   const { detectGreeting, pickGreeting, isMorningGreetingTime, isNightGreetingTime } = require('./lib/greetings');

const MORNING_RE = /\b(?:buongiorno\s*a?\s*tutt[io]?|buon\s*giorno|bongiorno|buon?d[iì]|buon\s*d[iì]|bg|b\s*\.\s*g)\b/i;
const NIGHT_RE = /\b(?:buonanotte\s*a?\s*tutt[io]?|buona\s*notte|buon?nott|buon\s*notte|bn|b\s*\.\s*n|nanna|notte)\b/i;

// Fasce orarie (ora locale del dispositivo dove gira il bot, es. Italia).
// Mattina: dalle 5:00 alle 12:59. Sera/notte: dalle 18:00 alle 4:59.
const isMorningGreetingTime = (h) => h >= 5 && h < 13;
const isNightGreetingTime = (h) => h >= 18 || h < 5;

// Individua il tipo di saluto nel testo (mattino o sera/notte), solo se siamo
// nella fascia oraria giusta. Ritorna 'morning' | 'night' | null.
const detectGreeting = (text) => {
    const t = String(text || '').trim();
    if (!t) return null;
    const h = new Date().getHours();
    if (isMorningGreetingTime(h) && MORNING_RE.test(t)) return 'morning';
    if (isNightGreetingTime(h) && NIGHT_RE.test(t)) return 'night';
    return null;
};

const MORNING_POOL = [
    'Buongiorno %NAME%! 🐣 Ma guarda chi si è svegliato… il campione mondiale di snooze! Almeno stavolta hai trovato la forza di salutarci. ☀️',
    'Buongiornissimo %NAME%! 🌞 Dormi ancora? Il sole è già su da ore, ma il tuo impegno con la sveglia è una relazione tossica. Va bene, perdonato!',
    'Buongiorno %NAME%! 🔆 Eh be’, si vede che sei un leone… che però deve ancora trovare il coraggio di andare a fare colazione. Spero per te. 🥐',
    'Buongiorno %NAME%! ☕ Sei sveglio davvero o è il caffè che ti tiene in vita? Poco importa: la tua efficienza oggi è già promettente. Promettente zero. 😂',
    'Buongiorno campione %NAME%! 🏆 La tua sveglia si è arresa di nuovo, eh? Tranquillo, pure noi non ci aspettavamo miracoli alle 6:00 del mattino. 💀',
    'Buongiorno %NAME%! 🧠 Wow, un’altra alba che riesci a goderti. Non male per uno che ieri ha promesso di dormire presto e poi ha visto le 3:00 di notte. 🙃',
    'Buongiorno %NAME%! 🌅 Il mondo si è svegliato e tu lecchi ancora il cuscino. Risveglia quel cervello, che oggi abbiamo una giornata da topo di fogna. 😼',
    'Buongiorno %NAME%! 💤 Eh be’, almeno tu la notte la fai. Io sto seduto a guardarti russare. In bocca al lupo per le 5 cose da fare oggi (inizia da colazione). 🐺',
    'Buongiorno %NAME%! 🎉 Nuovo giorno, nuove scuse: ma stavolta niente “non ho dormito”, eh? Su, svegliati che la giornata è bella e pure il wifi! 📶',
    'Buongiorno %NAME%! 😎 Trattienimi: stamattina sei pure contento di essere vivo. Chissà quanto durerà prima che ti serva altro caffè. Comunque: buongiorno! ☕',
];

const NIGHT_POOL = [
    'Buonanotte %NAME%! 🌙 Dopo una giornata così impegnativa (sì, anche solo ricordarsi come si accende il telefono), ti meriti il letto. Sogni d’oro, campione. 😴',
    'Buonanotte %NAME%! 🛌 La tua enorme produttività oggi ci ha distrutti. Ricordati che anche il tuo io pigro si merita un riposo. A domani! 🌙',
    'Buonanotte %NAME%! ✨ Vai a dormire: domani c’è un’altra giornata piena per non fare niente. E stavolta fallo impegnandoti, eh. Ciuccio! 😴',
    'Buonanotte %NAME%! 🌜 Per stasera hai già dato il meglio (due messaggi in diciassette ore, record personale). Riposa e ricarica le batterie. 💤',
    'Buonanotte %NAME%! 🔥 Anche i supereroi dormono. Tu dormi come un eroe: con la faccia sul cuscino e il telefono in mano. Domani si ricomincia! 🌠',
    'Buonanotte %NAME%! 🦉 Non fissare lo schermo fino alle 3:00 stavolta, eh? Il mondo non ti scoprirà da solo. Sogni d’oro, nottambulo. 🌙',
    'Buonanotte %NAME%! 🌃 Sono le ore piccole e tu sei ancora qui a leggermi… patetico, ma che tenero. Vai a letto, anche lo zero assoluto si riposa. 🥶',
    'Buonanotte %NAME%! 🛏️ Che la tribù dei dormiglioni ti accolga stavolta. Se domani scrivi “buongiorno” prima delle 10, prometto di non dire niente. 🤫',
    'Buonanotte %NAME%! 😴 Il cuscino ti aspetta e pure l’app del meteo è pronta a ricordarti che domani piove. Felice che si dorma bene almeno tu. 🌧️',
    'Buonanotte %NAME%! 💤 Nanna, nanna. E non venirmi a dire che hai ancora “una cosa da guardare”: io ti conosco. Sogni d’oro, birbante. 🌛',
];

const pickGreeting = (type, name) => {
    const pool = type === 'morning' ? MORNING_POOL : NIGHT_POOL;
    const safe = String(name || 'amico').slice(0, 30);
    return pool[Math.floor(Math.random() * pool.length)].replace(/%NAME%/g, `@${safe.replace(/\s+/g, ' ')}`);
};

module.exports = { MORNING_RE, NIGHT_RE, isMorningGreetingTime, isNightGreetingTime, detectGreeting, pickGreeting };