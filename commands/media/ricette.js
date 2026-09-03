'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

// 
//  RICETTE — Vex Bot
//  10 ricette random dall'API gratuita TheMealDB, una per card del carosello
//  con foto e pulsante 👨🍳 Preparazione (ingredienti + passi).
// 
module.exports = {
    name: 'ricette',
    aliases: ['recipe', 'ricetta', 'cucina'],
    description: "10 ricette casuali con foto (TheMealDB): scorri le card e premi 👨🍳 Preparazione per ingredienti e passi. Uso: .ricette",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { axios, sendButtons, sendCarousel } = services;

        const t = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = t.split(/\s+/);

        // ── PREPARAZIONE (ingredienti + passi) 
        if (w1 === 'prep' || w1 === 'preparazione') {
            const idMeal = (w2 || '').trim();
            if (!idMeal) return reply(`${sec('ERRORE')}
${boxOpen()}
${line('[uso]: *.ricette prep <id>')}
${boxEnd()}`);
            try {
                const { data } = await axios.get(
                    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(idMeal)}`,
                    { timeout: 15000 }
                );
                const meal = data?.meals?.[0];
                if (!meal) throw new Error('NON_TROVATA');

                const ingr = [];
                for (let i = 1; i <= 20; i++) {
                    const name = meal[`strIngredient${i}`]?.trim();
                    const qty = meal[`strMeasure${i}`]?.trim();
                    if (name) ingr.push(`▸ ${qty} ${name}`.trim());
                }

                const steps = String(meal.strInstructions || '')
                    .split(/\r?\n/)
                    .map(s => s.trim())
                    .filter(s => /^[A-Z0-9]/.test(s) && s.length > 3)
                    .slice(0, 12);

                const title = `👨🍳 *_${meal.strMeal}_*`;
                const area = meal.strArea ? ` · 📍 _${meal.strArea}_` : '';
                const head = `${title}${area}\n\n🧂 *_INGREDIENTI_* (_${ingr.length}_):\n${ingr.join('\n')}`;

                if (steps.length) {
                    const chunkSize = 12;
                    const pages = Math.ceil(steps.length / chunkSize);
                    for (let p = 0; p < pages; p++) {
                        const chunk = steps.slice(p * chunkSize, (p + 1) * chunkSize);
                        const body = `${p === 0 ? head + '\n\n' : ''}👨‍🍳 *_PASSI_* (_${chunkSize * p + 1}_-_${chunkSize * p + chunk.length}_):\n${chunk.map((s, i) => `${chunkSize * p + i + 1}. ${s}`).join('\n')}\n\n`;
                        if (p === 0) await reply(body);
                        else await sock.sendMessage(from, { text: body }, { quoted: msg }).catch(() => {});
                    }
                } else {
                    await reply(`${sec('INFO')}\n${boxOpen()}\n${line(`${head}\n\n▸ _Istruzioni non disponibili_\n`)}\n${boxEnd()}`);
                }
            } catch (_) {
                await reply('❌ Non trovo questa ricetta. Riprova.');
            }
            return;
        }

        // ── CAROSELLO 10 RICETTE RANDOM 
        await reply('👨🍳 Cerco 10 ricette casuali...');
        try {
            const results = [];
            const seen = new Set();
            let attempts = 0;
            while (results.length < 10 && attempts < 30) {
                attempts++;
                const { data } = await axios.get(
                    'https://www.themealdb.com/api/json/v1/1/random.php',
                    { timeout: 15000 }
                );
                const meal = data?.meals?.[0];
                if (!meal || seen.has(meal.idMeal)) continue;
                seen.add(meal.idMeal);
                results.push(meal);
            }
            if (!results.length) throw new Error('VUOTO');

            const cards = results.map(meal => ({
                title: `🍽️ ${meal.strMeal}`,
                subtitle: meal.strArea ? `${meal.strArea} · ${meal.strCategory || ''}` : (meal.strCategory || ''),
                body: `${meal.strInstructions?.slice(0, 120) || '...'}…`,
                imageUrl: meal.strMealThumb || '',
                footer: 'TheMealDB',
                buttons: [
                    { label: '👨🍳 Preparazione', id: `ricette prep ${meal.idMeal}` },
                ],
            }));

            const sent = await sendCarousel(sock, from, {
                text: `${sec('RICETTE CASUALI')}\n${boxOpen()}\n${line(``)}\n${line('_10 ricette da tutto il mondo._')}\n${line('_Scorri le card e premi_')}\n${line('*👨🍳 Preparazione* per')}\n${line('_ingredienti e passi!_')}\n${line(``)}\n${boxEnd()}`,
                cards,
            }, msg);
            if (!sent) {
                await sendButtons(sock, from,
`👨🍳 *_RICETTE_*

${results.map((m, i) => `${i + 1}. ${m.strMeal}${m.strArea ? ' (_' + m.strArea + '_)' : ''} — \`.ricette prep ${m.idMeal}\``).join('\n')}

`,
                    [{ label: '🔁 Altre ricette', id: 'ricette' }], msg);
            }
        } catch (e) {
            console.error('[ricette]', e.message);
            await reply('❌ Non riesco a recuperare le ricette. Riprova tra poco.');
        }
    },
};
