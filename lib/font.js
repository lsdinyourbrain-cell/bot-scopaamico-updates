'use strict';

/**
 * font.js — Trasformazione stile "DARK GOTHIC" + stili Unicode extra.
 *
 * Converte le lettere latine in caratteri speciali Unicode (Fraktur Bold,
 * Script, Doppio Tratto, Monospaziato, ecc.) mantenendo intatte emoji,
 * numeri, simboli e markup WhatsApp (* _ ~ `).
 *
 * toDarkFont()  → Fraktur Bold (𝕯𝖆𝖗𝖐 𝔾𝕠𝕥𝕙𝕚𝕔) — usato dai comandi economy.
 * toStyle()     → stile a scelta fra quelli in STYLES.
 * toDecorated() → stile + decorazioni attorno (es. ❖ 𝕯𝕬𝕽𝕶 ❖).
 */

// Fraktur Bold MAIUSCOLO: A=U+1D56C ... Z=U+1D585
const UPPER_LO = 0x1D56C;
// Fraktur Bold minuscolo: a=U+1D586 ... z=U+1D59F
const LOWER_LO = 0x1D586;

const toDarkFont = (text) => {
    if (typeof text !== 'string' || !text) return text;
    let out = '';
    for (const ch of text) {
        if (ch >= 'A' && ch <= 'Z') {
            out += String.fromCodePoint(UPPER_LO + (ch.charCodeAt(0) - 0x41));
        } else if (ch >= 'a' && ch <= 'z') {
            out += String.fromCodePoint(LOWER_LO + (ch.charCodeAt(0) - 0x61));
        } else {
            // emoji, numeri, simboli, spazi, markup WhatsApp → invariati
            out += ch;
        }
    }
    return out;
};

// ── STILI UNICODE ──────────────────────────────────────────────────────────
// Ogni stile è una coppia di stringhe (maiuscole/minuscole) lunghe 26.
const STYLES = {
    // Fraktur (Gotico) normale — 𝔄𝔅ℭ𝔇... (U+1D504 / U+1D51E)
    fraktur: {
        upper: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ',
        lower: '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
    },
    // Fraktur Bold (Gotico grassetto) — 𝕬𝕭𝕮... (U+1D56C / U+1D586)
    gothic: {
        upper: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',
        lower: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟',
    },
    // Script (Corsivo) — 𝒜ℬ𝒞𝒟... (U+1D49C / U+1D4B6)
    script: {
        upper: '𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵',
        lower: '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏',
    },
    // Script Bold (Corsivo grassetto) — 𝓐𝓑𝓒𝓓... (U+1D4D0 / U+1D4EA)
    scriptBold: {
        upper: '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩',
        lower: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃',
    },
    // Doppio tratto (Outline) — 𝔸𝔹ℂ𝔻... (U+1D538 / U+1D552)
    outline: {
        upper: '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ',
        lower: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫',
    },
    // Serif Bold — 𝐀𝐁𝐂𝐃... (U+1D400 / U+1D41A)
    serifBold: {
        upper: '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙',
        lower: '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳',
    },
    // Sans-Serif Bold — 𝗔𝗕𝗖𝗗... (U+1D5D4 / U+1D5EE)
    sansBold: {
        upper: '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭',
        lower: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇',
    },
    // Monospaziato — 𝙰𝙱𝙲𝙳... (U+1D670 / U+1D68A)
    mono: {
        upper: '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',
        lower: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
    },
    // Maiuscoletto (Small Caps)
    smallcaps: {
        upper: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ',
        lower: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ',
    },
    // Fullwidth (Vaporwave) — ＡＢＣＤ... (U+FF21 / U+FF41)
    fullwidth: {
        upper: 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ',
        lower: 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ',
    },
    // Cerchiato (Enclosed) — ⒶⒷⒸⒹ... (U+24B6 / U+24D0)
    circled: {
        upper: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',
        lower: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
    },
};

const toStyle = (text, style = 'gothic') => {
    if (typeof text !== 'string' || !text) return text;
    const st = STYLES[style] || STYLES.gothic;
    const up = Array.from(st.upper); // code point per code point (caratteri astrali!)
    const lo = Array.from(st.lower);
    let out = '';
    for (const ch of text) {
        if (ch >= 'A' && ch <= 'Z') out += up[ch.charCodeAt(0) - 0x41];
        else if (ch >= 'a' && ch <= 'z') out += lo[ch.charCodeAt(0) - 0x61];
        else out += ch; // emoji, numeri, simboli, spazi, markup → invariati
    }
    return out;
};

// Con decorazioni attorno, es. toDecorated('DARK', 'gothic', '❖') → ❖ 𝕯𝕬𝕽𝕶 ❖
const toDecorated = (text, style = 'gothic', deco = '❖') => {
    const styled = toStyle(text, style);
    return deco ? `${deco} ${styled} ${deco}` : styled;
};

module.exports = { toDarkFont, toStyle, toDecorated, STYLES };