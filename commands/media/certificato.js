'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  CERTIFICATO — Vex Bot
//  Genera un certificato personalizzato (immagine) con nome, titolo e data.
//  Uso: .certificato  → per chi invia il comando
//       .certificato @amico  → per il taggato
//       .certificato [titolo/descrizione]
// ─────────────────────────────────────────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

// Sfugge il testo per l'SVG (non deve rompere l'XML).
const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 60);

const fmtDate = () => {
    const d = new Date();
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Render del certificato in SVG poi PNG (900x640, sfondo pergamena).
const buildCert = async (sharp, name, title) => {
    const svg = `
<svg width="900" height="640" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf6e3"/>
      <stop offset="100%" stop-color="#f4e9c3"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c9a227"/>
      <stop offset="50%" stop-color="#f5d76e"/>
      <stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
  </defs>
  <rect width="900" height="640" fill="url(#bg)" rx="16"/>
  <rect x="18" y="18" width="864" height="604" fill="none" stroke="#c9a227" stroke-width="6" rx="10"/>
  <rect x="30" y="30" width="840" height="580" fill="none" stroke="#b08d1f" stroke-width="2" rx="6" stroke-dasharray="10 6"/>

  <text x="450" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="#7a5c00">🏅 CERTIFICATO</text>
  <text x="450" y="150" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#8a6d1f" letter-spacing="4">DI MERITO</text>

  <line x1="180" y1="175" x2="720" y2="175" stroke="url(#gold)" stroke-width="3"/>

  <text x="450" y="225" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#6b4d00">concesso a</text>
  <text x="450" y="295" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#2c1a00">${esc(name)}</text>
  <text x="450" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#6b4d00">per</text>
  <text x="450" y="395" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-style="italic" fill="#b8860b">${esc(title)}</text>

  <text x="450" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#6b4d00">nel giorno del</text>
  <text x="450" y="500" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#2c1a00">${fmtDate()}</text>

  <text x="160" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#8a6d1f">Il Direttore</text>
  <line x1="90" y1="545" x2="230" y2="545" stroke="#c9a227" stroke-width="2"/>
  <text x="740" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="16" font-style="italic" fill="#8a6d1f">Vex Bot</text>
  <line x1="670" y1="545" x2="810" y2="545" stroke="#c9a227" stroke-width="2"/>
</svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
};

module.exports = {
    name: 'certificato',
    aliases: ['cert', 'attestato', 'diploma'],
    description: "Genera un certificato personalizzato (immagine) con nome e titolo. Uso: .certificato [titolo], .certificato @amico [titolo]",

    async run(sock, msg, args, context) {
        const { textArgs, from, sender, pushName, mentioned, reply, services } = context;
        const { sharp, showProgress } = services;

        let name = (pushName || sender.split('@')[0]).slice(0, 40);
        let title = '';

        let t = String(textArgs || '').trim();
        // Rimuovi i tag dall'argomento.
        if (mentioned.length) {
            t = t.replace(/@\S+/g, '').trim();
        }
        // Se c'è un testo dopo il comando ed è breve, è il titolo.
        if (t) title = t;
        if (!title) title = 'Bestemmiare Professionalmente';

        const prog = await showProgress(sock, from, { label: 'STAMPO IL CERTIFICATO', duration: 2500, quoted: msg });
        try {
            const png = await buildCert(sharp, name, title);
            await prog.done('🏅 *_CERTIFICATO_*\n${SEP}\n▸ _Certificato pronto!_\n◈ _Vex Bot_');
            await sock.sendMessage(from, {
                image: png,
                caption: `🏅 *_CERTIFICATO_*\n${SEP}\n▸ *Concesso a:* _${name}_\n▸ *Motivo:* _${title}_\n${SEP}\n◈ _Vex Bot_`,
            }, { quoted: msg });
        } catch (e) {
            console.error('[certificato]', e.message);
            await prog.done('❌ Non riesco a generare il certificato.');
        }
    },
};