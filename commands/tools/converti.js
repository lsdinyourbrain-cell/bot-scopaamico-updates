'use strict';

// Convertitore di unità. Uso: .converti <valore> <da> in <a>
// Es: .converti 10 km in m, .converti 32 f in c, .converti 5 gb in mb

const FACTORS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, 'in': 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 },
    weight: { g: 1, kg: 1000, mg: 0.001, lb: 453.59237, oz: 28.349523, t: 1000000 },
    data: { b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 },
    speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704 },
    time: { s: 1, min: 60, h: 3600, d: 86400 },
};

const TEMP = { c: 'c', celsius: 'c', '°c': 'c', f: 'f', fahrenheit: 'f', '°f': 'f', k: 'k', kelvin: 'k' };

// Ogni unità → { cat, key } (la chiave normalizzata nella tabella).
const findUnit = (token) => {
    const t = String(token).toLowerCase().replace(/[°\s]/g, '').trim();
    if (t === 'c' || t === 'celsius' || t === 'f' || t === 'fahrenheit' || t === 'k' || t === 'kelvin') {
        return { cat: 'temp', key: TEMP[t] || (t.startsWith('f') ? 'f' : t.startsWith('k') ? 'k' : 'c') };
    }
    for (const [cat, table] of Object.entries(FACTORS)) {
        for (const [key, f] of Object.entries(table)) {
            const norm = key.replace(/[°\s]/g, '');
            if (t === norm || t === key) return { cat, key };
        }
    }
    return null;
};

const toCelsius = (v, from) => (from === 'f' ? (v - 32) * 5 / 9 : from === 'k' ? v - 273.15 : v);

const fromCelsius = (v, to) => (to === 'f' ? v * 9 / 5 + 32 : to === 'k' ? v + 273.15 : v);

const formatNum = (n) => {
    if (!Number.isFinite(n)) return String(n);
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return n.toExponential(4);
    return Number(n.toPrecision(8)).toString();
};

module.exports = {
    name: 'converti',
    aliases: ['convert', 'unit', 'cvt'],
    description: "Converti unità di misura. Uso: .converti <valore> <unità> in <unità> (es. .converti 10 km in m, .converti 32 c in f).",

    async run(sock, msg, args, context) {
        const { textArgs, reply } = context;
        const T = String(textArgs || '').trim();
        const m = T.match(/^(\d+(?:[.,]\d+)?)\s+(\S+)(?:\s+(?:in|to|a|->|=>)\s+|\s+)(\S+)\s*$/i);
        if (!m) {
            return reply("🔄 *Come si usa*\n\n.converti <valore> <unità> in <unità>\n\nEsempi:\n• `.converti 10 km in m`\n• `.converti 32 c in f`\n• `.converti 5 gb in mb`\n• `.converti 1.5 h in min`");
        }

        const value = parseFloat(m[1].replace(',', '.'));
        if (!Number.isFinite(value)) return reply("⚠️ Valore non valido.");

        const from = findUnit(m[2]);
        const to = findUnit(m[3]);
        if (!from) return reply(`⚠️ Unità di partenza *${m[2]}* sconosciuta.`);
        if (!to) return reply(`⚠️ Unità di arrivo *${m[3]}* sconosciuta.`);

        let result;
        if (from.cat === 'temp' && to.cat === 'temp') {
            result = fromCelsius(toCelsius(value, from.key), to.key);
        } else if (from.cat === to.cat && from.cat !== 'temp') {
            const f1 = FACTORS[from.cat][from.key];
            const f2 = FACTORS[to.cat][to.key];
            result = (value * f1) / f2;
        } else {
            return reply(`⚠️ Impossibile convertire *${from.key}* in *${to.key}*: unità non compatibili.`);
        }

        return reply(`🔄 *Conversione*\n\n${String(m[1]).replace('.', ',')} ${from.key}  →  *${formatNum(result)}* ${to.key}`);
    },
};