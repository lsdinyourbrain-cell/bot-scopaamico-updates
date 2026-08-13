'use strict';

module.exports = {
    name: 'famiglia',
    aliases: [],
    description: "Gestisce la tua famiglia nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const subCmd = args[0]?.toLowerCase();
            const target = mentioned[0];
            const uDB    = getUser(sender, from);

            // ── Gestione proposta pendente: il bersaglio risponde con si/no ─
            const proposalId = args[1];
            if ((subCmd === 'si' || subCmd === 'sì' || subCmd === 'no') && proposalId) {
                const proposals = db[from]?.familyProposals || {};
                const prop = proposals[proposalId];
                if (!prop) return reply("❌ Proposta scaduta o non più valida.");
                // Solo la persona designata può accettare/rifiutare.
                if (!sameJid(sender, prop.target)) return reply("❌ Questa proposta non è per te.");
                if (Date.now() - prop.timestamp > 120000) {
                    delete proposals[proposalId];
                    saveDB();
                    return reply("⏰ Proposta scaduta (2 minuti). Rifai la richiesta.");
                }

                const isAccept = subCmd === 'si' || subCmd === 'sì';
                delete proposals[proposalId];
                saveDB();

                if (!isAccept) {
                    await sock.sendMessage(from, {
                        text: `❌ *RIFIUTATO*\n━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} ha rifiutato\nla proposta di @${prop.proposer.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                        mentions: [sender, prop.proposer],
                    });
                    return;
                }

                const proposerDB = getUser(prop.proposer, from);
                const targetDB = getUser(prop.target, from);

                if (prop.type === 'sposa') {
                    if (proposerDB.spouse || targetDB.spouse) {
                        return reply("❌ Uno dei due è già sposato/a: la proposta è annullata.");
                    }
                    proposerDB.spouse = prop.target;
                    targetDB.spouse = prop.proposer;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `💒 *MATRIMONIO*\n━━━━━━━━━━━━━━━━━━\n@${prop.proposer.split('@')[0]} 💞 @${prop.target.split('@')[0]}\n_Vi siete appena sposati!_\n━━━━━━━━━━━━━━━━━━`,
                        mentions: [prop.proposer, prop.target],
                    });
                } else if (prop.type === 'adotta') {
                    if (proposerDB.children.includes(prop.target)) {
                        return reply("❌ Fa già parte della famiglia.");
                    }
                    proposerDB.children.push(prop.target);
                    if (!targetDB.parents.includes(prop.proposer)) targetDB.parents.push(prop.proposer);
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `🍼 *ADOZIONE*\n━━━━━━━━━━━━━━━━━━\n@${prop.proposer.split('@')[0]} ha adottato\n@${prop.target.split('@')[0]}\n━━━━━━━━━━━━━━━━━━`,
                        mentions: [prop.proposer, prop.target],
                    });
                }
                return;
            }

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

                // Creo una proposta: serve il consenso dell'altra persona.
                const proposals = db[from]?.familyProposals || (db[from].familyProposals = {});
                const proposalId = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                proposals[proposalId] = { type: 'sposa', proposer: sender, target, timestamp: Date.now() };
                saveDB();

                return sendButtons(sock, from,
`💍 *PROPOSTA DI MATRIMONIO*
━━━━━━━━━━━━━━━━━━
@${sender.split('@')[0]} ti chiede
di sposarlo/a! 💞

_Accetti?_
(2 minuti di tempo)
━━━━━━━━━━━━━━━━━━`,
                    [
                        { label: '💍 Sì, accetto!', id: `famiglia si ${proposalId}` },
                        { label: '❌ No, grazie', id: `famiglia no ${proposalId}` },
                    ],
                    msg);
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

                // Creo una proposta: serve il consenso dell'altra persona.
                const proposals = db[from]?.familyProposals || (db[from].familyProposals = {});
                const proposalId = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                proposals[proposalId] = { type: 'adotta', proposer: sender, target, timestamp: Date.now() };
                saveDB();

                return sendButtons(sock, from,
`🍼 *PROPOSTA DI ADOZIONE*
━━━━━━━━━━━━━━━━━━
@${sender.split('@')[0]} vuole
adottarti! 👨‍👧

_Accetti?_
(2 minuti di tempo)
━━━━━━━━━━━━━━━━━━`,
                    [
                        { label: '🍼 Sì, accetto!', id: `famiglia si ${proposalId}` },
                        { label: '❌ No, grazie', id: `famiglia no ${proposalId}` },
                    ],
                    msg);
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
