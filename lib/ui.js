'use strict';

/**
 * ui.js — Sistema decorativo Unicode per i messaggi del bot.
 *
 * Stelle + diamanti, compatto e leggibile su WhatsApp.
 * Tutti i caratteri sono stati testati su WhatsApp Android/iOS/Web.
 */

// ── CARATTERI BASE ──────────────────────────────────────────────────────
const S = {
    // Stelle 4 punte
    star:    '✦',  // nera piena
    starW:   '✧',  // vuota, leggera
    // Stelle 5 punte
    star5:   '★',  // nera piena
    star5W:  '☆',  // vuota
    // Diamanti
    dia:     '◆',  // nero pieno
    diaW:    '◇',  // vuoto
    diaSm:   '⬥',  // piccolo pieno
    diaSmW:  '⬦',  // piccolo vuoto
    // Quadratini
    sq:      '▪',  // pieno
    sqW:     '▫',  // vuoto
    // Triangoli
    tri:     '▸',  // destro pieno
    triW:    '▹',  // destro vuoto
    // Rombo
    rombo:   '◈',  // rombo con punto (il preferito per footer)
    // Linee
    line:    '━',  // linea piena
    lineL:   '┈',  // linea punteggiata leggera
    lineD:   '╌',  // linea tratteggiata
    // Croci decorative
    cross:   '✧',  // usata come alternativa
    // Altro
    pipe:    '│',  // barra verticale
    dot:     '·',  // punto medio
};

// ── SEPARATORI COMPATTI ─────────────────────────────────────────────────
const SEP = {
    // Corti (max 18 char) — per separare sezioni
    stars:    `${S.star} ${S.starW} ${S.star}`,
    dots:     `${S.diaSm} ${S.diaSmW} ${S.diaSm}`,
    mixed:    `${S.star} ${S.dia} ${S.star}`,
    line:     `${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}`,
    lineL:    `${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}${S.lineL}`,
    // Medi (per separatori di mezzo)
    starLine: `${S.star} ${S.line}${S.line}${S.line}${S.line}${S.line} ${S.star}`,
    diaLine:  `${S.dia} ${S.line}${S.line}${S.line}${S.line}${S.line} ${S.dia}`,
    // Lunghi (per header/footer)
    full:     `${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}${S.line}`,
};

// ── HEADER / TITOLI ─────────────────────────────────────────────────────
const header = (title) => {
    return `${S.star} ${S.dia} ${S.star}  *${title}*  ${S.star} ${S.dia} ${S.star}`;
};

// Variante compatta per header corti
const headerSm = (title) => {
    return `${S.starW}·${S.star}·${S.starW}  *${title}*  ${S.starW}·${S.star}·${S.starW}`;
};

// Variante con linea
const headerLine = (title) => {
    return `${S.star}${S.line}${S.star}  *${title}*  ${S.star}${S.line}${S.star}`;
};

// ── BULLET POINTS ───────────────────────────────────────────────────────
const bullet = (text) => `${S.star} ${text}`;
const bulletAlt = (text) => `${S.diaSm} ${text}`;
const bulletRombo = (text) => `${S.rombo} ${text}`;
const bulletTri = (text) => `${S.tri} ${text}`;

// ── FOOTER ──────────────────────────────────────────────────────────────
const footer = (botName = 'Vex Bot') => {
    return `${S.star} ${S.starW} ${S.dia} ${S.starW} ${S.star}\n◈ _${botName}_`;
};

// Footer compatto
const footerSm = (botName = 'Vex Bot') => {
    return `${S.star}${S.dia}${S.star} _${botName}_ ${S.star}${S.dia}${S.star}`;
};

// ── BOX / FRAME ─────────────────────────────────────────────────────────
// Box compatto con stelle agli angoli
const box = (title, content) => {
    return [
        `${S.star}${S.line}${S.star}  *${title}*  ${S.star}${S.line}${S.star}`,
        SEP.line,
        content,
        SEP.stars,
    ].join('\n');
};

// Box elaborato
const boxFancy = (title, content) => {
    return [
        `${S.starW} ${S.star} ${S.starW}  *${title}*  ${S.starW} ${S.star} ${S.starW}`,
        SEP.line,
        content,
        SEP.mixed,
        footer(),
    ].join('\n');
};

// ── SEZIONI ─────────────────────────────────────────────────────────────
// Separa due sezioni con un pattern diverso
const section = (label) => {
    return `${S.diaW} ${S.star} ${label} ${S.star} ${S.diaW}`;
};

// Underline di testo con stelle
const underline = (text) => {
    return `${text}\n${S.star}${S.line}${S.star}${S.line}${S.star}`;
};

// ── STILE DECORATIVO 2026 ──────────────────────────────────────────────
// ㅤㅤ⋆｡˚『 ╭ TITLE ╯ 』˚｡⋆
// ╭
// │ ➤『emoji』 .comando
// ╰⭒─ׄ─ׅ─ׄ─⭒

const BORDER = '╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─';
const BORDER_SM = '╰⭒─ׄ─ׅ─ׄ─⭒';

// Header sezione: ㅤㅤ⋆｡˚『 ╭ `TITOLO` ╯ 』˚｡⋆
const sec = (title) => `ㅤㅤ⋆｡˚『 ╭ \`${title}\` ╯ 』˚｡⋆`;

// Apertura box: ╭
const boxOpen = () => '╭';

// Chiusura box: ╰⭒─ׄ─ׅ─ׄ─⭒
const boxEnd = () => BORDER;

// Chiusura corta: ╰⭒─ׄ─ׅ─ׄ─⭒
const boxEndSm = () => BORDER_SM;

// Riga comando: │ ➤『emoji』 .comando
const cmd = (emoji, name) => `│ ➤『${emoji}』 .${name}`;

// Riga testo: │ testo
const line = (text) => `│ ${text}`;

// Riga vuota
const empty = () => '│';

// ── MESSAGGIO COMPLETO ─────────────────────────────────────────────────
// secMsg('TITOLO', ['│ riga1', '│ riga2']) → messaggio pronto
const secMsg = (title, rows) => {
    return `${sec(title)}\n${boxOpen()}\n${rows.join('\n')}\n${BORDER}`;
};

// secMsgEnd con footer custom
const secMsgEnd = (title, rows, footerText) => {
    let out = `${sec(title)}\n${boxOpen()}\n${rows.join('\n')}\n${BORDER}`;
    if (footerText) out += `\n${footerText}`;
    return out;
};

// ── ESPORTAZIONE ────────────────────────────────────────────────────────
module.exports = {
    S,
    SEP,
    header,
    headerSm,
    headerLine,
    bullet,
    bulletAlt,
    bulletRombo,
    bulletTri,
    footer,
    footerSm,
    box,
    boxFancy,
    section,
    underline,
    // Nuovo stile 2026
    BORDER,
    BORDER_SM,
    sec,
    boxOpen,
    boxEnd,
    boxEndSm,
    cmd,
    line,
    empty,
    secMsg,
    secMsgEnd,
};
