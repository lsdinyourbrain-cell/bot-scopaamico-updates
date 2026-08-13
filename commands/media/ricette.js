'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  RICETTE — ScopaAmico Bot
//  10 ricette random dall'API gratuita TheMealDB, una per card del carosello
//  con foto e pulsante 👨🍳 Preparazione (ingredienti + passi).
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

module.exports = {
    name: 'ricette',
    aliases: ['recipe', 'ricetta', 'cucina'],
    description: "10 ricette casuali con foto (TheMealDB): scorri le card e premi 👨🍳 Preparazione per ingredienti e passi. Uso: .ricette",

    async run(sock, msg, args, context) {
        const { textArgs, from, reply, services } = context;
        const { axios, sendButtons, sendCarousel } = services;

        const t = String(textArgs || '').trim().toLowerCase();
        const [w1, w2] = t.split(/\s+/);

        // ── PREPARAZIONE (ingredienti + passi) ───────────────────────────
        if (w1 === 'prep' || w1 === 'preparazione') {
            const idMeal = (w2 || '').trim();
            if (!idMeal) return reply('ℹ️ Usa: `.ricette prep <id>`');
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
                    if (name) ingr.push(`• ${qty} ${name}`.trim());
                }

                const steps = String(meal.strInstructions || '')
                    .split(/\r?\n/)
                    .map(s => s.trim())
                    .filter(s => /^[A-Z0-9]/.test(s) && s.length > 3)
                    .slice(0, 12);

                const title = `👨🍳 *${meal.strMeal}*`;
                const area = meal.strArea ? ` 📍 ${meal.strArea}` : '';
                const head = `${title}${area}\n${SEP}\n🧂 *INGREDIENTI* (${ingr.length}):\n${ingr.join('\n')}`;

                if (steps.length) {
                    const chunkSize = 12;
                    const pages = Math.ceil(steps.length / chunkSize);
                    for (let p = 0; p < pages; p++) {
                        const chunk = steps.slice(p * chunkSize, (p + 1) * chunkSize);
                        const body = `${p === 0 ? head + '\n\n' : ''}👨‍🍳 *PASSI* (${chunkSize * p + 1}-${chunkSize * p + chunk.length}):\n${chunk.map((s, i) => `${chunkSize * p + i + 1}. ${s}`).join('\n')}\n${SEP}`;
                        if (p === 0) await reply(body);
                        else await sock.sendMessage(from, { text: body }, { quoted: msg }).catch(() => {});
                    }
                } else {
                    await reply(`${head}\n${SEP}\n(istruzioni non disponibili)`);
                }
            } catch (_) {
                await reply('❌ Non trovo questa ricetta. Riprova.');
            }
            return;
        }

        // ── CAROSELLO 10 RICETTE RANDOM ─────────────────────────────────
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
                text: `👨🍳 *RICETTE CASUALI*
${SEP}
10 ricette da tutto il mondo.
Scorri le card e premi
*👨🍳 Preparazione* per
ingredienti e passi!
${SEP}`,
                cards,
            }, msg);
            if (!sent) {
                await sendButtons(sock, from,
`👨🍳 *RICETTE*
${SEP}
${results.map((m, i) => `${i + 1}. ${m.strMeal}${m.strArea ? ' (' + m.strArea + ')' : ''} — \`.ricette prep ${m.idMeal}\``).join('\n')}
${SEP}`,
                    [{ label: '🔁 Altre ricette', id: 'ricette' }], msg);
            }
        } catch (e) {
            console.error('[ricette]', e.message);
            await reply('❌ Non riesco a recuperare le ricette. Riprova tra poco.');
        }
    },
};
