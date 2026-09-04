'use strict';

const { dispOf, resolveJid } = require('./jid');
const content = require('./content');

function createInteractionCommand({ name, emoji, phrases, aliases = [], targetFirst = false, suffix = '' }) {
    return {
        name,
        aliases,
        async execute(ctx) {
            if (!ctx.targetJid) return ctx.reply('Tagga qualcuno oppure rispondi a un suo messaggio.');
            const phrase = ctx.randomChoice(content[phrases]);
            const text = targetFirst
                ? `${emoji} @${dispOf(ctx.targetJid)}:\n*«${phrase}»*`
                : `${emoji} @${dispOf(ctx.sender)} ${phrase} @${dispOf(ctx.targetJid)}${suffix}`;
            await ctx.sock.sendMessage(ctx.from, { text, mentions: [ctx.sender, ctx.targetJid] }, { quoted: ctx.msg });
        },
    };
}

module.exports = { createInteractionCommand };
