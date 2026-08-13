'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  METEO7 — ScopaAmico Bot
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

module.exports = {
    name: 'meteo7',
    aliases: ['meteosettimana', 'weather7', 'previsioni'],
    description: "Previsioni meteo per 7 giorni (una card al giorno con icona, temp max/min e pioggia). Uso: .meteo7 <città>",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { axios, sendButtons, sendCarousel } = services;

        const city = String(textArgs || '').trim();
        if (!city) {
            return sendButtons(sock, from,
`🌤️ *Manca la città!*
${SEP}
Esempio: \`.meteo7 Milano\``,
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

            const cards = consolidated.map(day => ({
                title: `${day.icon} ${day.dow}`,
                subtitle: `${day.dateStr}`,
                body: `${day.desc}\n🌡️ ${day.max}° / ${day.min}°\n🌧️ ${day.rain}% (${day.precip}mm)`,
                footer: cityName,
            }));

            const sent = await sendCarousel(sock, from, {
                text: `🌤️ *PREVISIONI 7 GIORNI*\n${SEP}\n📍 ${cityName}\n${SEP}\nScorri per vedere la\nsettimana giorno per giorno 👇\n${SEP}`,
                cards,
            }, msg);
            if (!sent) {
                const lines = consolidated.map((day, i) =>
                    `${day.icon} *${day.dow}* (${day.dateStr})\n   ${day.desc} · ${day.max}°/${day.min}° · pioggia ${day.rain}%`
                ).join('\n');
                await reply(`🌤️ *METEO ${cityName} — 7 GIORNI*\n${SEP}\n${lines}\n${SEP}`);
            }
        } catch (_) {
            await reply('Non trovo il meteo di questa città. Riprova con un nome più preciso.');
        }
    },
};
