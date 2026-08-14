'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  METEO7 — Vex Bot
//  Estensione di .weather: previsioni su 7 giorni (API gratuita wttr.in),
//  una card al giorno con icona, temp max/min e pioggia.
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

// Emoji per il codice/descrizione meteo di ogni fascia oraria.
const iconFor = (desc, isDay) => {
    const d = String(desc || '').toLowerCase();
    if (d.includes('thunder') || d.includes('tempor')) return '⛈️';
    if (d.includes('rain') || d.includes('piogg')) return '🌧️';
    if (d.includes('drizzle') || d.includes('piovigg')) return '🌦️';
    if (d.includes('snow') || d.includes('neve')) return '❄️';
    if (d.includes('fog') || d.includes('nebbia')) return '🌫️';
    if (d.includes('cloud') || d.includes('nuvolo')) return '☁️';
    if (d.includes('partly') || d.includes('poco nuvol')) return '⛅';
    if (d.includes('clear') || d.includes('sereno') || d.includes('sole')) return isDay ? '☀️' : '🌙';
    return isDay ? '🌤️' : '🌙';
};

const DAY_IT = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

// Renderizza una card giornaliera come immagine (le card del carosello
// WhatsApp DEVONO avere un'immagine, altrimenti il messaggio viene rifiutato).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 60);
const renderDayCard = async (sharp, { icon, dow, dateStr, desc, max, min, rain, precip }) => {
    const svg = `<svg width="360" height="440" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8f4fd"/>
      <stop offset="100%" stop-color="#d4ecfb"/>
    </linearGradient>
  </defs>
  <rect width="360" height="440" fill="url(#bg)" rx="16"/>
  <rect x="14" y="14" width="332" height="412" fill="none" stroke="#5dade2" stroke-width="3" rx="12"/>
  <text x="180" y="95" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="bold" fill="#1a5276">${esc(dow)}</text>
  <text x="180" y="135" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#5d6d7e">${esc(dateStr)}</text>
  <text x="180" y="270" text-anchor="middle" font-family="sans-serif" font-size="96">${icon}</text>
  <text x="180" y="330" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#2c3e50">${esc(desc)}</text>
  <text x="180" y="375" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="bold" fill="#c0392b">${esc(max)}°<tspan fill="#2471a3" font-size="24"> / ${esc(min)}°</tspan></text>
  <text x="180" y="410" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#2c3e50">🌧️ ${rain}% · ${precip}mm</text>
</svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = {
    name: 'meteo7',
    aliases: ['meteosettimana', 'weather7', 'previsioni'],
    description: "Previsioni meteo per 7 giorni (una card al giorno con icona, temp max/min e pioggia). Uso: .meteo7 <città>",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { axios, sendButtons, sendCarousel, sharp } = services;

        const city = String(textArgs || '').trim();
        if (!city) {
            return sendButtons(sock, from,
`⚠️ _[uso]: scrivi una città per le previsioni a 7 giorni._
${SEP}
▸ Esempio: \`.meteo7 Milano\``,
                [{ label: '.meteo7 Roma', id: 'meteo7 Roma' }], msg);
        }

        try {
            const { data } = await axios.get(
                `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
                { timeout: 10000 }
            );
            const area = data.nearest_area?.[0];
            const cityName = area?.areaName?.[0]?.value || city;
            const days = (data.weather || []).slice(0, 7);
            if (!days.length) throw new Error('VUOTO');

            // Consolida ogni giorno: descrizione dominante + pioggia media.
            const consolidated = days.map((day, i) => {
                const hourly = day.hourly || [];
                const totals = hourly.length || 1;
                const rain = hourly.reduce((s, h) => s + (Number(h.chanceofrain) || 0), 0) / totals;
                const precip = hourly.reduce((s, h) => s + (Number(h.precipMM) || 0), 0);
                // Prendi la descrizione a mezzogiorno (14:00) se presente.
                const noon = hourly.find(h => h.time === '900' || h.time === '1200') || hourly[0];
                const desc = noon?.weatherDesc?.[0]?.value || day.weatherDesc?.[0]?.value || '';
                const d = new Date();
                const dow = DAY_IT[(d.getDay() + i) % 7];
                const dateStr = `${dow} ${d.getDate() + i}/${d.getMonth() + 1}`;
                return {
                    dow,
                    dateStr,
                    icon: iconFor(desc, true),
                    desc: desc || 'N/D',
                    max: day.maxtempC || '?',
                    min: day.mintempC || '?',
                    rain: Math.round(rain),
                    precip: precip.toFixed(1),
                };
            });

            const cards = [];
            for (const day of consolidated) {
                try {
                    const img = await renderDayCard(sharp, day);
                    cards.push({
                        title: `${day.icon} ${day.dow}`,
                        subtitle: `${day.dateStr}`,
                        body: `${day.desc}\n🌡️ ${day.max}° / ${day.min}°\n🌧️ ${day.rain}% (${day.precip}mm)`,
                        footer: cityName,
                        imageBuffer: img,
                    });
                } catch (e) {
                    console.error('[meteo7] render card:', e.message);
                }
            }

            const sent = await sendCarousel(sock, from, {
                text: `🌤️ *_PREVISIONI 7 GIORNI_*\n${SEP}\n▸ 📍 _${cityName}_\n${SEP}\n▸ _Scorri per vedere la_\n  _settimana giorno per giorno_ 👇\n${SEP}\n◈ _Vex Bot_`,
                cards,
            }, msg);
            if (!sent) {
                const lines = consolidated.map((day, i) =>
                    `${day.icon} *${day.dow}* (${day.dateStr})\n   ${day.desc} · ${day.max}°/${day.min}° · pioggia ${day.rain}%`
                ).join('\n');
                await reply(`🌤️ *_METEO_* _${cityName} — 7 GIORNI_\n${SEP}\n${lines}\n${SEP}\n◈ _Vex Bot_`);
            }
        } catch (_) {
            await reply('❌ Non trovo il meteo di questa città. Riprova con un nome più preciso.');
        }
    },
};
