'use strict';

module.exports = {
    name: 'famiglia',
    aliases: [],
    description: "Gestisce la tua famiglia nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS } = services;


            const subCmd = args[0]?.toLowerCase();
            const target = mentioned[0];
            const uDB    = getUser(sender, from);

            if (!subCmd) {
                let familyMentions = [];
                let partnerLine, parentsLine, childrenLine;

                if (uDB.spouse) {
                    partnerLine = `💍 *Coniuge:* @${uDB.spouse.split('@')[0]}`;
                    familyMentions.push(uDB.spouse);
                } else {
                    partnerLine = '💍 *Coniuge:* _Nessuno_';
                }

                if (uDB.parents.length > 0) {
                    parentsLine = `👴 *Genitori:*\n${uDB.parents.map(p => `🧑 @${p.split('@')[0]}`).join('\n')}`;
                    familyMentions.push(...uDB.parents);
                } else {
                    parentsLine = '👴 *Genitori:* _Nessuno_';
                }

                if (uDB.children.length > 0) {
                    childrenLine = `🍼 *Figli:*\n${uDB.children.map(c => `🧑 @${c.split('@')[0]}`).join('\n')}`;
                    familyMentions.push(...uDB.children);
                } else {
                    childrenLine = '🍼 *Figli:* _Nessuno_';
                }

                const albero =
`🌳 *FAMIGLIA*
━━━━━━━━━━━━━━━━━━
👤 *${pushName.slice(0, 20)}*

${partnerLine}
${parentsLine}
${childrenLine}
━━━━━━━━━━━━━━━━━━`;

                await sock.sendMessage(from, { text: albero, mentions: familyMentions });
            }
            else if (subCmd === 'sposa' && target) {
                if (sameJid(target, sender)) return reply("❌ Non puoi sposarti da solo.");
                const tDB = getUser(target, from);
                if (uDB.spouse) return reply("❌ Sei già sposato/a in questo gruppo.");
                if (tDB.spouse) return reply("❌ Questo utente è già sposato/a.");

                uDB.spouse = target;
                tDB.spouse = sender;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💒 *MATRIMONIO*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} 💞 @${target.split('@')[0]}\n_Vi siete appena sposati!_\n━━━━━━━━━━━━━━━━━━`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'divorzia') {
                if (!uDB.spouse) return reply("❌ Non sei sposato/a.");
                const ex = uDB.spouse;
                const exDB = getUser(ex, from);
                uDB.spouse = null;
                exDB.spouse = null;
                saveDB();
                await sock.sendMessage(from, {
                    text: `💔 *DIVORZIO*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha divorziato\nda @${ex.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                    mentions: [sender, ex],
                });
            }
            else if (subCmd === 'adotta') {
                if (!target) return reply("Tagga la persona che vuoi adottare.");
                if (sameJid(target, sender)) return reply("Non puoi adottare te stesso/a, dai.");
                if (uDB.children.includes(target)) return reply("Questa persona fa già parte della tua famiglia.");

                const tDB = getUser(target, from);
                uDB.children.push(target);
                if (!tDB.parents.includes(sender)) tDB.parents.push(sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🍼 *ADOZIONE*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha adottato\n@${target.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'caccia') {
                if (!target) return reply("Tagga la persona da rimuovere dalla famiglia.");
                if (!uDB.children.includes(target)) return reply("Questa persona non è tra i tuoi figli nel bot.");

                const tDB = getUser(target, from);
                uDB.children = uDB.children.filter(child => child !== target);
                tDB.parents = tDB.parents.filter(parent => parent !== sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚪 *CACCIATA*\n━━━━━━━━━━━━━━━━━━\n@${target.split('@')[0]} non è più\nnella famiglia di @${sender.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'abbandona') {
                if (uDB.parents.length === 0) return reply("Non hai genitori registrati nel bot.");
                const parents = [...uDB.parents];
                for (const parent of parents) {
                    const parentDB = getUser(parent, from);
                    parentDB.children = parentDB.children.filter(child => child !== sender);
                }
                uDB.parents = [];
                saveDB();
                await sock.sendMessage(from, {
                    text: `🚶 *ABBANDONO*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha scelto\ndi andare per la sua strada\n━━━━━━━━━━━━━━━━━━`,
                    mentions: [sender],
                });
            }
            else {
                await reply("❓ *AIUTO FAMIGLIA*\n━━━━━━━━━━━━━━━━━━\n.famiglia\n.famiglia sposa @u\n.famiglia adotta @u\n.famiglia divorzia\n.famiglia caccia @u\n.famiglia abbandona\n━━━━━━━━━━━━━━━━━━");
            }
    },
};
