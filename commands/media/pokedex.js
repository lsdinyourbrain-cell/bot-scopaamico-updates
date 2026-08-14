'use strict';

const axios = require('axios');
const sharp = require('sharp');

const TYPES = [
    'Normale', 'Fuoco', 'Acqua', 'Elettro', 'Erba', 'Ghiaccio',
    'Lotta', 'Veleno', 'Terra', 'Volante', 'Psico', 'Coleottero',
    'Roccia', 'Spettro', 'Drago', 'Buio', 'Acciaio', 'Folletto'
];

const TYPE_COLORS = {
    'Normale': '#A8A878', 'Fuoco': '#F08030', 'Acqua': '#6890F0',
    'Elettro': '#F8D030', 'Erba': '#78C850', 'Ghiaccio': '#98D8D8',
    'Lotta': '#C03028', 'Veleno': '#A040A0', 'Terra': '#E0C068',
    'Volante': '#A890F0', 'Psico': '#F85888', 'Coleottero': '#A8B820',
    'Roccia': '#B8A038', 'Spettro': '#705898', 'Drago': '#7038F8',
    'Buio': '#705848', 'Acciaio': '#B8B8D0', 'Folletto': '#EE99AC'
};

const STAT_NAMES = [
    'Pigrizia', 'Sbruffonaggine', 'Visualizzati', 'Meme Power',
    'Caffeina', 'Sonno Arretrato', 'Drama Queen', 'Simpatia'
];

const MOVES = [
    { name: 'Lasciare in Visualizzato', type: 'Buio', power: 95, pp: 5, desc: 'Il nemico aspetta risposta per ore' },
    { name: 'Meme a Caso', type: 'Normale', power: 60, pp: 20, desc: 'Invia meme non correlato alla chat' },
    { name: 'Caffè Triplo', type: 'Fuoco', power: 80, pp: 10, desc: 'Recupera energia, +ansia' },
    { name: 'Sonno Profondo', type: 'Psico', power: 70, pp: 5, desc: 'Scompare dalla chat 12h' },
    { name: 'Drama Queen', type: 'Folletto', power: 85, pp: 10, desc: 'Trasforma banalità in tragedia' },
    { name: 'Audio 5 Minuti', type: 'Drago', power: 100, pp: 3, desc: 'Attacco devastante, nessuno lo ascolta' },
    { name: 'Foto Profilo 2015', type: 'Roccia', power: 55, pp: 15, desc: 'Difesa basata su foto vecchia' },
    { name: 'Ghosting', type: 'Spettro', power: 90, pp: 5, desc: 'Scompare senza lasciare traccia' },
    { name: 'Reply "Ok"', type: 'Normale', power: 40, pp: 25, desc: 'Uccide la conversazione' },
    { name: 'Vocale Mentre Guida', type: 'Volante', power: 75, pp: 10, desc: 'Audio con rumore motore' },
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

module.exports = {
    name: 'pokedex',
    aliases: ['pokemon', 'scheda', 'dex'],
    description: 'Genera scheda Pokédex divertente per un utente.',

    async run(sock, msg, args, context) {
        const { from, sender, isGroup, reply, targetJid, isReply, contextInfo, mentioned, textArgs, services } = context;
        const { showProgress } = services;

        try {
            let target = targetJid;
            
            if (!target && mentioned.length > 0) {
                target = mentioned[0];
            } else if (!target && isReply && contextInfo.participant) {
                target = contextInfo.participant;
            }
            
            if (!target) {
                target = sender;
            }

            const prog = await showProgress(sock, from, { label: 'POKÉDEX', duration: 2500, quoted: msg });

            const isSelf = target === sender;
            const displayName = isSelf ? (msg.pushName || 'Tu') : target.split('@')[0];

            // Genera dati Pokédex
            const type1 = randomChoice(TYPES);
            const type2 = randomChoice(TYPES.filter(t => t !== type1));
            const level = randomInt(5, 100);
            const id = randomInt(1, 999);
            
            const stats = {};
            STAT_NAMES.forEach(s => stats[s] = randomInt(1, 100));
            
            // Scegli 4 mosse uniche
            const moves = shuffle(MOVES).slice(0, 4);
            
            const hp = 30 + Math.floor(level * 1.5) + stats['Sonno Arretrato'];
            const atk = 20 + Math.floor(level * 1.2) + stats['Sbruffonaggine'];
            const def = 15 + Math.floor(level * 0.8) + stats['Pigrizia'];
            const spd = 25 + Math.floor(level * 1.3) + stats['Visualizzati'];

            let pfpBuffer = null;
            try {
                const pfpUrl = await sock.profilePictureUrl(target, 'image');
                const response = await axios.get(pfpUrl, { responseType: 'arraybuffer', timeout: 10000 });
                pfpBuffer = Buffer.from(response.data);
            } catch (_) {}

            // Crea la card Pokédex
            const type1Color = TYPE_COLORS[type1] || '#A8A878';
            const type2Color = TYPE_COLORS[type2] || '#A8A878';

            let avatarBase64 = '';
            if (pfpBuffer) {
                const avatar = await sharp(pfpBuffer)
                    .resize(180, 180, { fit: 'cover' })
                    .png()
                    .toBuffer();
                avatarBase64 = avatar.toString('base64');
            }

            const statsHtml = Object.entries(stats).map(([name, val]) => `
                <g transform="translate(280, ${195 + STAT_NAMES.indexOf(name) * 24})">
                    <text x="0" y="14" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#fff">${name}</text>
                    <rect x="110" y="4" width="180" height="12" rx="6" fill="#333"/>
                    <rect x="110" y="4" width="${Math.min(180, val * 1.8)}" height="12" rx="6" fill="${type1Color}"/>
                    <text x="300" y="14" font-family="Arial, sans-serif" font-size="11" fill="#ccc" text-anchor="end">${val}</text>
                </g>
            `).join('');

            const movesHtml = moves.map((move, i) => `
                <g transform="translate(280, ${385 + i * 22})">
                    <rect x="0" y="0" width="240" height="20" rx="4" fill="#1a1a2e" opacity="0.8"/>
                    <rect x="2" y="2" width="20" height="16" rx="2" fill="${TYPE_COLORS[move.type] || '#A8A878'}"/>
                    <text x="28" y="13" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#fff">${move.name}</text>
                    <text x="230" y="13" font-family="Arial, sans-serif" font-size="10" fill="#888" text-anchor="end">${move.type}</text>
                </g>
            `).join('');

            const cardSvg = `
                <svg width="540" height="480" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#1a1a2e"/>
                            <stop offset="100%" stop-color="#16213e"/>
                        </linearGradient>
                        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#0f3460"/>
                            <stop offset="100%" stop-color="#1a1a2e"/>
                        </linearGradient>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="4" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
                        </filter>
                        <filter id="innerGlow">
                            <feGaussianBlur stdDeviation="3" result="blur"/>
                            <feMerge>
                                <feMergeNode in="blur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <!-- Background -->
                    <rect width="540" height="480" fill="url(#bgGrad)" rx="20"/>
                    <rect x="10" y="10" width="520" height="460" fill="rgba(0,0,0,0.3)" rx="15" filter="url(#shadow)"/>
                    
                    <!-- Header -->
                    <rect x="20" y="20" width="500" height="55" fill="url(#headerGrad)" rx="10"/>
                    <text x="40" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffd700">📋 POKÉDEX ENTRY #${String(id).padStart(3, '0')}</text>
                    
                    <!-- Avatar -->
                    ${pfpBuffer ? `
                    <circle cx="90" cy="170" r="75" fill="#0f0f1a" filter="url(#shadow)"/>
                    <image href="data:image/png;base64,${avatarBase64}" x="15" y="95" width="150" height="150" clip-path="circle(75px at 90px 170px)"/>
                    ` : `
                    <circle cx="90" cy="170" r="75" fill="#0f0f1a"/>
                    <text x="90" y="180" font-family="Arial, sans-serif" font-size="60" fill="#444" text-anchor="middle">❓</text>
                    `}
                    
                    <!-- Name & Level -->
                    <text x="270" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fff">${displayName}</text>
                    <text x="270" y="125" font-family="Arial, sans-serif" font-size="14" fill="#aaa">Livello ${level}  •  ${type1}/${type2}</text>
                    
                    <!-- Type Badges -->
                    <rect x="270" y="135" width="85" height="26" rx="13" fill="${type1Color}"/>
                    <text x="312" y="154" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">${type1}</text>
                    <rect x="365" y="135" width="85" height="26" rx="13" fill="${type2Color}"/>
                    <text x="407" y="154" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">${type2}</text>
                    
                    <!-- Base Stats Title -->
                    <text x="270" y="190" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffd700">STATISTICHE BASE</text>
                    
                    ${statsHtml}
                    
                    <!-- Moves Title -->
                    <text x="270" y="380" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffd700">MOSSE</text>
                    
                    ${movesHtml}
                    
                    <!-- Footer -->
                    <text x="270" y="460" font-family="Arial, sans-serif" font-size="10" fill="#555" text-anchor="middle">Pokédex Vex Bot • Dati generati casualmente per divertimento</text>
                </svg>
            `;

            const cardBuffer = await sharp(Buffer.from(cardSvg))
                .png()
                .toBuffer();

            await sock.sendMessage(from, {
                image: cardBuffer,
                caption: `📋 *Scheda Pokédex per ${displayName}*\n\n#${String(id).padStart(3, '0')}  •  Liv.${level}  •  ${type1}/${type2}\n\n*Per uso ludico - non ufficiale* 😄`
            }, { quoted: msg });
            await prog.done('📋 *Scheda Pokédex generata!* ✅');

        } catch (e) {
            console.error('[pokedex]', e);
            await reply('❌ Errore durante la generazione della scheda Pokédex.');
        }
    },
};