'use strict';

/**
 * font.js — Trasformazione stile "DARK GOTHIC".
 *
 * Converte le lettere latine in caratteri Fraktur Bold
 * (𝕯𝖆𝖗𝖐 𝔾𝕠𝕥𝕙𝕚𝕔) mantenendo intatte emoji, numeri, simboli e
 * markup WhatsApp (* _ ~ `).
 *
 * Attivato tramite proxy su sock.sendMessage in index.js: ogni messaggio
 * del bot — comandi, giochi, antiflood, ecc. — passa in dark style senza
 * toccare i file di comando uno a uno.
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

module.exports = { toDarkFont };
