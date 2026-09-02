'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const { dispOf, resolveJid } = require('../../lib/jid');
const { toStyle } = require('../../lib/font');

// Titoli in corsivo elegante (Script Bold): leggibile e compatibile
const T = (s) => toStyle(s.toUpperCase(), 'scriptBold');
// Separatore corto: niente linee ASCII lunghe che si rompono
const SEP = '✦ ✦ ✦';

module.exports = {
    name: 'famiglia',
    aliases: [],
    description: "Gestisce la tua famiglia nel gruppo.",

    async run(sock, msg, args, context) {
        const { command, textArgs, from, sender, pushName, isGroup, isOwner, mentioned, targetJid, isReply, contextInfo, isBotAdmin, isSenderAdmin, reply, setBotActive, services } = context;
        const { AI_API_KEY, AI_API_URL, AI_MODEL, MAX_FILE_SIZE, ARRAYS, COPY, axios, checkTrisWinner, crypto, db, downloadContentFromMessage, downloadMediaMessage, execFileAsync, ffmpeg, formatMoney, fs, getAntilinkGroup, getCachedGroupMeta, getCpuUsage, getQuotedKey, getSysInfo, getUser, os, path, projectDir, randomChoice, randomInt, renderTrisBoard, sameJid, saveDB, setAntilinkPlatform, sharp, webpmux, ANTILINK_PLATFORMS, sendButtons } = services;


            const subCmd = args[0]?.toLowerCase();
            const target = mentioned[0];
            const uDB    = getUser(sender, from);
            let meta = null;
            try { meta = await getCachedGroupMeta(sock, from); } catch (_) {}
            const disp = (jid) => dispOf(jid, resolveJid(jid, meta));

            // ── Gestione proposta pendente: il bersaglio risponde con si/no ─
            const proposalId = args[1];
            if ((subCmd === 'si' || subCmd === 'sì' || subCmd === 'no') && proposalId) {
                const proposals = db[from]?.familyProposals || {};
                const prop = proposals[proposalId];
                if (!prop) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❌ ${T('Proposta scaduta')}\n${SEP}\n▸ Questa proposta non è\n  più valida.`)}\n${boxEnd()}`);
                // Solo la persona designata può accettare/rifiutare.
                if (!sameJid(sender, prop.target)) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❌ ${T('Errore')}\n${SEP}\n▸ Questa proposta non è per te.`)}\n${boxEnd()}`);
                if (Date.now() - prop.timestamp > 120000) {
                    delete proposals[proposalId];
                    saveDB();
                    return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`⏰ ${T('Tempo scaduto')}\n${SEP}\n▸ La proposta è durata\n  2 minuti.\n▸ Rifai la richiesta.`)}\n${boxEnd()}`);
                }

                const isAccept = subCmd === 'si' || subCmd === 'sì';
                delete proposals[proposalId];
                saveDB();

                if (!isAccept) {
                    await sock.sendMessage(from, {
                        text: `${sec('NO')}\n${boxOpen()}\n${line(`💔 ${T('Rifiuto')}\n${SEP}\n▸ @${disp(sender)} ha detto *no*\n▸ alla proposta di @${disp(prop.proposer)}\n\n`)}\n${boxEnd()}`,
                        mentions: [sender, prop.proposer],
                    });
                    return;
                }

                const proposerDB = getUser(prop.proposer, from);
                const targetDB = getUser(prop.target, from);

                if (prop.type === 'sposa') {
                    if (proposerDB.spouse || targetDB.spouse) {
                        return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❌ ${T('Annullato')}\n${SEP}\n▸ Uno dei due risulta\n  già sposato/a.`)}\n${boxEnd()}`);
                    }
                    proposerDB.spouse = prop.target;
                    targetDB.spouse = prop.proposer;
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `${sec('INFO')}\n${boxOpen()}\n${line(`💒 ${T('Matrimonio')}\n${SEP}\n▸ @${disp(prop.proposer)}\n▸ 　💞 💞 💞\n▸ @${disp(prop.target)}\n\n🎊 _Ora siete marito e moglie!_\n💍 _Che il bot benedica questa unione._\n\n`)}\n${boxEnd()}`,
                        mentions: [prop.proposer, prop.target],
                    });
                } else if (prop.type === 'adotta') {
                    if (proposerDB.children.includes(prop.target)) {
                        return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❌ ${T('Errore')}\n${SEP}\n▸ Fa già parte della famiglia.`)}\n${boxEnd()}`);
                    }
                    proposerDB.children.push(prop.target);
                    if (!targetDB.parents.includes(prop.proposer)) targetDB.parents.push(prop.proposer);
                    saveDB();
                    await sock.sendMessage(from, {
                        text: `${sec('INFO')}\n${boxOpen()}\n${line(`🍼 ${T('Adozione')}\n${SEP}\n▸ @${disp(prop.proposer)} ha adottato\n▸ @${disp(prop.target)}\n\n🎈 _Benvenuto nella famiglia!_\n\n`)}\n${boxEnd()}`,
                        mentions: [prop.proposer, prop.target],
                    });
                }
                return;
            }

            if (!subCmd) {
                let familyMentions = [];
                let partnerLine, parentsLine, childrenLine;

                if (uDB.spouse) {
                    partnerLine = `💍 Coniuge → @${disp(uDB.spouse)}`;
                    familyMentions.push(uDB.spouse);
                } else {
                    partnerLine = `💍 Coniuge → _single di ferro_`;
                }

                if (uDB.parents.length > 0) {
                    parentsLine = uDB.parents.map(p => `🧑 @${disp(p)}`).join('\n');
                    familyMentions.push(...uDB.parents);
                } else {
                    parentsLine = '_nessuno_';
                }

                if (uDB.children.length > 0) {
                    childrenLine = uDB.children.map(c => `🧒 @${disp(c)}`).join('\n');
                    familyMentions.push(...uDB.children);
                } else {
                    childrenLine = '_nessuno_';
                }

                const albero =
`${sec('TFAMIGLIA')}\n${boxOpen()}\n${line(`${T('Famiglia')} 🌳`)}\n${line(`${SEP}`)}\n${line(`👤 *${pushName.slice(0, 20)}*`)}\n${line(`${T('coniuge')} 💍`)}\n${line(`${partnerLine}`)}\n${line(`${T('genitori')} 👴`)}\n${line(`${parentsLine}`)}\n${line(`${T('figli')} 🍼`)}\n${line(`${childrenLine}`)}\n${boxEnd()}`;

                await sock.sendMessage(from, { text: albero, mentions: familyMentions });
            }
            else if (subCmd === 'sposa' && target) {
                if (sameJid(target, sender)) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`😅 ${T('Impossibile')}\n${SEP}\n▸ Non puoi sposare\n  te stesso/a.`)}\n${boxEnd()}`);
                const tDB = getUser(target, from);
                if (uDB.spouse) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`💔 ${T('Già sposato/a')}\n${SEP}\n▸ In questo gruppo hai già\n  una moglie/un marito.\n▸ Prima: _.famiglia divorzia_`)}\n${boxEnd()}`);
                if (tDB.spouse) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`💔 ${T('Occupato/a')}\n${SEP}\n▸ Questo utente è già\n  sposato/a con qualcun altro.`)}\n${boxEnd()}`);

                // Creo una proposta: serve il consenso dell'altra persona.
                const proposals = db[from]?.familyProposals || (db[from].familyProposals = {});
                const proposalId = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                proposals[proposalId] = { type: 'sposa', proposer: sender, target, timestamp: Date.now() };
                saveDB();

                return sendButtons(sock, from,
`💍 ${T('Proposta di matrimonio')}
${SEP}
▸ @${disp(sender)} ti chiede
▸ di sposarlo/a 🥺
▸ ⏳ _2 minuti di tempo_
${SEP}`,
                    [
                        { label: '💍 Sì, accetto!', id: `famiglia si ${proposalId}` },
                        { label: '❌ No, grazie', id: `famiglia no ${proposalId}` },
                    ],
                    msg);
            }
            else if (subCmd === 'divorzia') {
                if (!uDB.spouse) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`💔 ${T('Single')}\n${SEP}\n▸ Non sei sposato/a\n  con nessuno qui.`)}\n${boxEnd()}`);
                const ex = uDB.spouse;
                const exDB = getUser(ex, from);
                uDB.spouse = null;
                exDB.spouse = null;
                saveDB();
                await sock.sendMessage(from, {
                    text: `${sec('INFO')}\n${boxOpen()}\n${line(`🧾 ${T('Divorzio')}\n${SEP}\n▸ @${disp(sender)} ha divorziato\n▸ da @${disp(ex)}\n\n💸 _L'avvocato ringrazia,_\n_la metà dei soldi resta dove sta._\n\n`)}\n${boxEnd()}`,
                    mentions: [sender, ex],
                });
            }
            else if (subCmd === 'adotta') {
                if (!target) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`🍼 ${T('Adotta')}\n${SEP}\n▸ Tagga la persona da\n  adottare: _.famiglia adotta @utente_`)}\n${boxEnd()}`);
                if (sameJid(target, sender)) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`😅 ${T('Impossibile')}\n${SEP}\n▸ Non puoi adottare\n  te stesso/a, dai.`)}\n${boxEnd()}`);
                if (uDB.children.includes(target)) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❌ ${T('Già in famiglia')}\n${SEP}\n▸ Questa persona fa già\n  parte della tua famiglia.`)}\n${boxEnd()}`);

                // Creo una proposta: serve il consenso dell'altra persona.
                const proposals = db[from]?.familyProposals || (db[from].familyProposals = {});
                const proposalId = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
                proposals[proposalId] = { type: 'adotta', proposer: sender, target, timestamp: Date.now() };
                saveDB();

                return sendButtons(sock, from,
`🍼 ${T('Proposta di adozione')}
${SEP}
▸ @${disp(sender)} vuole adottarti 👨‍👧
▸ ⏳ _2 minuti di tempo_
${SEP}`,
                    [
                        { label: '🍼 Sì, accetto!', id: `famiglia si ${proposalId}` },
                        { label: '❌ No, grazie', id: `famiglia no ${proposalId}` },
                    ],
                    msg);
            }
            else if (subCmd === 'caccia') {
                if (!target) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`🚪 ${T('Caccia')}\n${SEP}\n▸ Tagga la persona da\n  rimuovere dalla famiglia.`)}\n${boxEnd()}`);
                if (!uDB.children.includes(target)) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❓ ${T('Non trovato')}\n${SEP}\n▸ Questa persona non è\n  tra i tuoi figli nel bot.`)}\n${boxEnd()}`);

                const tDB = getUser(target, from);
                uDB.children = uDB.children.filter(child => child !== target);
                tDB.parents = tDB.parents.filter(parent => parent !== sender);
                saveDB();
                await sock.sendMessage(from, {
                    text: `${sec('INFO')}\n${boxOpen()}\n${line(`🚪 ${T('Cacciato/a')}\n${SEP}\n▸ @${disp(target)} non è più\n▸ nella famiglia di @${disp(sender)}\n\n🧳 _Fatti le valigie._\n\n`)}\n${boxEnd()}`,
                    mentions: [sender, target],
                });
            }
            else if (subCmd === 'abbandona') {
                if (uDB.parents.length === 0) return reply(`${sec('INFO')}\n${boxOpen()}\n${line(`🚶 ${T('Impossibile')}\n${SEP}\n▸ Non hai genitori\n  registrati nel bot.`)}\n${boxEnd()}`);
                const parents = [...uDB.parents];
                for (const parent of parents) {
                    const parentDB = getUser(parent, from);
                    parentDB.children = parentDB.children.filter(child => child !== sender);
                }
                uDB.parents = [];
                saveDB();
                await sock.sendMessage(from, {
                    text: `${sec('INFO')}\n${boxOpen()}\n${line(`🚶 ${T('Abbandono')}\n${SEP}\n▸ @${disp(sender)} ha lasciato\n▸ la famiglia per la sua strada\n\n🌙 _In bocca al lupo._\n\n`)}\n${boxEnd()}`,
                    mentions: [sender],
                });
            }
            else if (subCmd === 'sposa' || subCmd === 'adotta' || subCmd === 'caccia') {
                await reply(`${sec('INFO')}\n${boxOpen()}\n${line(`❓ ${T('Manca il tag')}\n${SEP}\n▸ Tagga qualcuno:\n▸ _.famiglia ${subCmd} @utente_`)}\n${boxEnd()}`);
            }
            else {
                await reply(
`${sec('TGUIDA FAMIGLIA')}\n${boxOpen()}\n${line(`📖 ${T('Guida famiglia')}`)}\n${line(`${SEP}`)}\n${line('_.famiglia_ — il tuo albero')}\n${line('_.famiglia sposa @utente_ — proposta 💍')}\n${line('_.famiglia adotta @utente_ — adozione 🍼')}\n${line('_.famiglia divorzia_ — fine matrimonio 💔')}\n${line('_.famiglia caccia @utente_ — caccia figlio 🚪')}\n${line('_.famiglia abbandona_ — lascia i genitori 🚶')}\n${line(`${SEP}`)}\n${boxEnd()}`);
            }
    },
};
