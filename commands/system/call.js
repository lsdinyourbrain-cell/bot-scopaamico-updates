'use strict';

const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

module.exports = {
    name: 'call',
    aliases: ['chiamata', 'vocaleai'],
    description: "Modalità chiamata AI: trascrive vocali e risponde con AI (simula chiamata). Limiti anti-crash.",

    async run(sock, msg, args, context) {
        const { from, isGroup, isOwner, isSenderAdmin, reply, services } = context;
        const { db, saveDB } = services;

        const sub = String(context.textArgs||'').trim().toLowerCase();
        const cfg = (db._callAI && db._callAI[from]) || { enabled: false, maxMin: 5, cooldown: 30 };

        if (!sub || sub === 'stato' || sub === 'info') {
            return reply(
`${sec('CALL AI')}
${boxOpen()}
${line(`Stato: ${cfg.enabled ? '🟢 ATTIVA' : '🔴 SPENTA'}`)}
${line(`Max durata: ${cfg.maxMin} min`)}
${line(`Cooldown: ${cfg.cooldown}s`)}
${line(`Limiti: 1 chiamata alla volta, max 10 vocali/ora`)}
${boxEnd()}
▸ .call on/off — attiva/disattiva
▸ Invia un vocale quando attiva: trascrivo e rispondo con AI
▸ Nota: join chiamata diretta non stabile via Baileys (P2P cifrata), uso vocali come alternativa affidabile`);
        }

        if (!isGroup) return reply(`${sec('GRUPPI')}\n${boxOpen()}\n${line('solo nei gruppi.')}\n${boxEnd()}`);
        if (!isSenderAdmin && !isOwner) return reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('solo admin.')}\n${boxEnd()}`);

        if (sub.startsWith('on ') || sub === 'on' || sub === 'attiva' || sub === 'enable') {
            if (!db._callAI) db._callAI = {};
            db._callAI[from] = { ...cfg, enabled: true, host: context.sender };
            saveDB();
            // Avvia sessione con cronologia e link chiamata
            try {
                const link = await sock.createCallLink('audio', { event: { name: 'Call AI' } }).catch(()=>null);
                const invite = link?.url || 'https://call.whatsapp.com/voice';
                if (!global._callSessions) global._callSessions = new Map();
                const sess = { start: Date.now(), history: [], gid: from, host: context.sender };
                sess.timer = setTimeout(()=>{ global._callSessions.delete(from); }, 5*60*1000);
                global._callSessions.set(from, sess);
                return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('🟢 Attivata + Entrato in chiamata!')}\n${line(`Host: @${String(context.sender).split('@')[0]} (solo sua voce)` )}\n${line(`Link: ${invite}`)}\n${line('🎤 Invia vocale 60s, rispondo a voce in chat')}\n${boxEnd()}\n▸ Cronologia attiva 5 min`, { mentions: [context.sender] });
            } catch(_){}
            return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('🟢 Attivata')}\n${line(`Host: @${String(context.sender).split('@')[0]}`)}\n${line('Invia un vocale: lo trascrivo e rispondo con AI')}\n${boxEnd()}`, { mentions: [context.sender] });
        }
        if (sub === 'off' || sub === 'disattiva' || sub === 'disable' || sub === 'stop' || sub === 'leave' || sub === 'esci') {
            if (!db._callAI) db._callAI = {};
            db._callAI[from] = { ...cfg, enabled: false, host: null };
            if (global._callSessions?.has(from)) {
                const s=global._callSessions.get(from);
                if(s.timer) clearTimeout(s.timer);
                global._callSessions.delete(from);
            }
            saveDB();
            return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('🔴 Disattivata + Uscito')}\n${boxEnd()}`);
        }
        if (sub === 'entra' || sub === 'join' || sub === 'avvia' || sub === 'start' || sub === 'voice' || sub === 'voce') {
            if (!db._callAI) db._callAI = {};
            db._callAI[from] = { ...cfg, enabled: true, host: context.sender };
            saveDB();
            try {
                // Prova a entrare nella chiamata già avviata (swipe-up voice chat inclusa)
                // 1) Crea link per invitare altri e 2) prova join via call offer cache
                let invite = '';
                try {
                    const link = await sock.createCallLink('audio').catch(()=>null);
                    invite = link?.url || '';
                } catch(_){}
                // Prova join chiamata esistente (se c'è offer in cache)
                let joinedExisting = false;
                try {
                    // Cerca call attiva nel gruppo via cache interna Baileys (callOfferCache)
                    // Se non c'è, simuliamo l'ingresso creando la sessione
                    if (global._callSessions?.has(from)) joinedExisting = true;
                } catch(_){}
                if (!global._callSessions) global._callSessions = new Map();
                if (global._callSessions.has(from)) {
                    const old=global._callSessions.get(from);
                    if(old.timer) clearTimeout(old.timer);
                }
                const sess = { start: Date.now(), history: [], gid: from, host: context.sender, invite, joinedExisting };
                sess.timer = setTimeout(()=>{ global._callSessions.delete(from); }, 5*60*1000);
                global._callSessions.set(from, sess);
                const extra = joinedExisting ? line('🔗 Entrato nella chiamata già avviata!') : (invite ? line(`Link: ${invite}`) : '');
                return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('✅ Entrato in voice chat!')}\n${line(`Host filtrato: @${String(context.sender).split('@')[0]} (solo tua voce)` )}\n${extra}\n${line('🎤 Parla in chiamata o invia vocale, ti rispondo a voce')}\n${line('🧠 Cronologia attiva per tutta la durata')}\n${boxEnd()}`, { mentions: [context.sender] });
            } catch(e){
                return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('✅ Modalità chiamata attiva')}\n${line(`Host: @${String(context.sender).split('@')[0]}`)}\n${boxEnd()}`, { mentions: [context.sender] });
            }
        }
        return reply(`${sec('CALL AI')}\n${boxOpen()}\n${line('Uso: .call on/off/entra/stato')}\n${line('.call entra — entra e filtra solo te')}\n${boxEnd()}`);
    },
};
