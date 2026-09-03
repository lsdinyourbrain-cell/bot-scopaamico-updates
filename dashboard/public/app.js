'use strict';

// ── State ───────────────────────────────────────────────────────────────
let currentGroupJid = null;
let currentPhraseKey = null;
let currentPhraseLines = [];
let groupsCache = [];
let phrasesCache = [];
let currentFilePath = '';
let currentFileContent = '';

// ── Helpers ─────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const toast = (msg, type = 'ok') => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
};
// ── Custom modal (sostituisce prompt/confirm/alert nativi) ───────────────
let _customModalResolve = null;
function showCustomModal({ title='Richiesta', text='', placeholder='', hint='', showInput=false, okText='Conferma', cancelText='Annulla', icon='✦' }){
    return new Promise(res=>{
        _customModalResolve = res;
        const m=$('#customModal'), t=$('#customModalTitle'), tx=$('#customModalText'), inp=$('#customModalInput'), hi=$('#customModalHint'), ic=$('#customModalIcon'), ok=$('#customModalOk'), ca=$('#customModalCancel');
        if(t) t.textContent=title;
        if(tx) tx.textContent=text;
        if(ic) ic.textContent=icon;
        if(inp){ inp.style.display=showInput?'block':'none'; inp.value=''; inp.placeholder=placeholder||''; if(showInput) setTimeout(()=>inp.focus(),80); }
        if(hi){ hi.style.display=hint?'block':'none'; hi.textContent=hint||''; }
        if(ok) ok.textContent=okText;
        if(ca) ca.textContent=cancelText;
        if(ca) ca.style.display = (okText==='OK'?'none':'inline-flex');
        if(m){ m.classList.remove('hidden'); m.style.animation='fadeIn .25s ease'; }
        const onKey=(e)=>{ if(e.key==='Enter' && showInput){ confirmCustomModal(); } if(e.key==='Escape'){ closeCustomModal(null); } };
        if(inp) inp.onkeydown=onKey;
        document.addEventListener('keydown', onKey, {once:true});
    });
}
function closeCustomModal(val){
    const m=$('#customModal');
    if(m) m.classList.add('hidden');
    if(_customModalResolve){ const r=_customModalResolve; _customModalResolve=null; r(val); }
}
function confirmCustomModal(){
    const inp=$('#customModalInput');
    const showInput = inp && inp.style.display!=='none';
    const val = showInput ? inp.value : true;
    closeCustomModal(val);
}
function customPrompt(text, defVal='', placeholder=''){
    return showCustomModal({ title:'Inserisci', text, placeholder: placeholder||String(defVal||''), hint:'', showInput:true, okText:'Conferma', cancelText:'Annulla', icon:'✎' }).then(v=> v===null?null:String(v||'').trim()||null);
}
function customConfirm(text, title='Conferma'){
    return showCustomModal({ title, text, showInput:false, okText:'Sì', cancelText:'Annulla', icon:'⚠' }).then(v=> !!v);
}
function customAlert(text, title='Info'){
    return showCustomModal({ title, text, showInput:false, okText:'OK', cancelText:'', icon:'✦' }).then(()=>true);
}
const fetchJSON = async (url, opts = {}) => {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
};
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const fmtBytes = (n) => {
    if (n < 1024) return n + ' B';
    if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
    return (n/1024/1024).toFixed(1) + ' MB';
};

// Avatar con PFP reale se disponibile, fallback a iniziali con colore hash
function avatarColor(str){
    let h = 0;
    for (let i = 0; i < String(str).length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue}, 65%, 45%)`;
}
function initialsFrom(jid, fallback){
    const raw = String(jid || fallback || '').split('@')[0].replace(/[^a-zA-Z0-9]/g,'');
    if (!raw) return '?';
    if (raw.length <= 2) return raw.toUpperCase();
    const letters = raw.replace(/[^a-zA-Z]/g,'');
    if (letters.length >= 2) return (letters[0] + letters[1]).toUpperCase();
    return raw.slice(0,2).toUpperCase();
}
function avatarHTML(jid, name, size=''){
    const init = initialsFrom(jid, name);
    const bg = avatarColor(jid || name || 'x');
    const cls = size ? `avatar ${size}` : 'avatar';
    const pfpUrl = `/api/pfp/${encodeURIComponent(jid || '')}`;
    // Prova a caricare PFP reale, se fallisce mostra iniziali
    return `<div class="${cls}" style="background:${bg};overflow:hidden"><img src="${pfpUrl}" alt="${esc(init)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'; this.parentElement.querySelector('.avatar-fallback').style.display='grid'"><span class="avatar-fallback" style="display:none;place-items:center;width:100%;height:100%;font-weight:800">${esc(init)}</span></div>`;
}
function formatDate(iso){
    try { return new Date(iso).toLocaleString('it-IT'); } catch { return String(iso||''); }
}

// ── Pill indicator — robusto con getBoundingClientRect, niente offset padding/gap ─
function updatePillIndicator(page, instant=false){
    const pill = $('#bottomPill'), ind = $('#pillIndicator');
    if (!pill || !ind) return;
    // Usa sempre il bottone realmente attivo
    let btn = pill.querySelector('.pill-btn.active');
    if (!btn) btn = pill.querySelector(`.pill-btn[data-page="${page}"]`);
    if (!btn) return;
    // Aspetta layout completo (font, flex gap)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const pillRect = pill.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            const x = btnRect.left - pillRect.left;
            const w = btnRect.width;
            if (instant) {
                ind.style.transition = 'none';
                ind.style.transform = `translateX(${x}px)`;
                ind.style.width = w + 'px';
                void ind.offsetWidth;
                ind.style.transition = '';
            } else {
                ind.style.transform = `translateX(${x}px)`;
                ind.style.width = w + 'px';
            }
        });
    });
}
window.addEventListener('resize', () => {
    const active = document.querySelector('.pill-btn.active');
    if (active) updatePillIndicator(active.dataset.page, true);
});
// Ricalcola dopo load completo (font Outfit)
window.addEventListener('load', () => {
    const active = document.querySelector('.pill-btn.active');
    if (active) setTimeout(() => updatePillIndicator(active.dataset.page, true), 100);
});

function navigate(page){
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $$('.pill-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    updatePillIndicator(page);
    $$('.page').forEach(p => {
        const isActive = p.id === `page-${page}`;
        p.classList.toggle('active', isActive);
    });
    const titles = {
        overview: ['Overview','Stato del bot e sistema'],
        presentazione: ['Presentazione','Vex Bot — ultra bello, vetro & live'],
        groups: ['Gruppi','Gestisci impostazioni per gruppo'],
        users: ['Utenti','Economia e moderazione per gruppo'],
        reports: ['Report','Segnalazioni native WhatsApp'],
        phrases: ['Frasi','Modifica i file phrases/*.txt'],
        files: ['File','Esplora e modifica le directory del bot'],
        owners: ['Owner','Gestisci gli owner del bot'],
        config: ['Config','Impostazioni e file grezzi'],
        logs: ['Logs','Ultime righe di logs/bot.log'],
        settings: ['Tema','Personalizza vetro e sfondo'],
    };
    const [t, s] = titles[page] || [page, ''];
    const pt = $('#pageTitle'), ps = $('#pageSub');
    if (pt) pt.textContent = t;
    if (ps) ps.textContent = s;
    if (page === 'overview') fetchOverview();
    if (page === 'presentazione') fetchPresentazione();
    if (page === 'groups') fetchGroups();
    if (page === 'users') initUsersPage();
    if (page === 'reports') loadReportHistory();
    if (page === 'phrases') fetchPhrases();
    if (page === 'files') loadFiles('');
    if (page === 'owners') fetchOwners();
    if (page === 'config') loadConfig();
    if (page === 'logs') loadLogs();
}
$$('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));
// Pill indicator al primo load
setTimeout(() => updatePillIndicator('overview', true), 300);
const refreshBtn = $('#refreshBtn');
if (refreshBtn) refreshBtn.addEventListener('click', () => {
    const active = $('.page.active')?.id?.replace('page-','') || 'overview';
    navigate(active);
});
setInterval(() => { const el=$('#topTime'); if(el) el.textContent = new Date().toLocaleTimeString('it-IT'); }, 1000);
const topTimeEl = $('#topTime');
if (topTimeEl) topTimeEl.textContent = new Date().toLocaleTimeString('it-IT');
setInterval(async () => {
    try { await fetch('/api/overview'); const d=$('#liveDot'); if(d) d.classList.remove('off'); } catch { const d=$('#liveDot'); if(d) d.classList.add('off'); }
}, 10000);

// ── Overview ────────────────────────────────────────────────────────────
async function fetchOverview(){
    try{
        const { bot, stats, system } = await fetchJSON('/api/overview');
        const sg = $('#statGroups'), su = $('#statUsers'), sp = $('#statPhrases'), so = $('#statOwners');
        if (sg) sg.textContent = stats.groups;
        if (su) su.textContent = stats.users;
        if (sp) sp.textContent = stats.phrases;
        if (so) so.textContent = stats.owners;
        const bi = $('#botInfo');
        if (bi) bi.innerHTML = `
            ✦ Nome: <b>${esc(bot.name)}</b><br>
            ✦ Versione: <b>${esc(bot.version)}</b><br>
            ✦ Uptime: <b>${esc(bot.uptime)}</b><br>
            ✦ PID: <b>${bot.pid}</b><br>
            ✦ Node: <b>${esc(bot.node)}</b><br>
            ✦ Piattaforma: <b>${esc(bot.platform)}</b>`;
        const si = $('#sysInfo');
        if (si) si.innerHTML = `
            ◆ Host: <b>${esc(system.hostname)}</b><br>
            ◆ CPU: <b>${esc(system.cpuModel)}</b> (${system.cores} core)<br>
            ◆ RAM: <b>${esc(system.ramUsed)} / ${esc(system.ramTotal)} (${system.ramPercent})</b><br>
            ◆ Gruppi in welcome: <b>${stats.welcomeGroups}</b><br>
            ◆ Gruppi antilink: <b>${stats.antilinkGroups}</b><br>
            ◆ DB size: <b>${fmtBytes(stats.dbSize)}</b>`;
        // Podio top utenti
        fetchTopUsers();
        // Sync presentazione live counters if visible (single message, no extra fetch)
        try { syncPresentStats({stats, bot, system}); } catch(_){}
    }catch(e){ toast('Overview: '+e.message,'err'); }
}
// ── Presentazione — hero live stats + owner contact ─────────────────────
function syncPresentStats({stats, bot, system}){
    const gs = $('#pStatGroups'), us = $('#pStatUsers'), ps = $('#pStatPhrases'), os = $('#pStatOwners');
    if (gs) gs.textContent = stats.groups;
    if (us) us.textContent = stats.users;
    if (ps) ps.textContent = stats.phrases;
    if (os) os.textContent = stats.owners;
    const sys = $('#presentSys');
    if (sys) sys.textContent = `⏱ ${bot.uptime} · ${system.ramPercent} RAM · ${system.cores} core · ${bot.platform} · v${bot.version}`;
}
async function fetchPresentazione(){
    try{
        const data = await fetchJSON('/api/overview');
        syncPresentStats(data);
        // also fetch owner card
        fetchPresentOwner();
        // animate hero stats gently
        $$('#presentStats .stat-live').forEach(el=>{ el.style.transform='scale(1.02)'; setTimeout(()=> el.style.transform='', 300); });
    }catch(e){
        const c = $('#presentOwnerCard');
        if (c) c.innerHTML = `<div class="muted">Errore live: ${esc(e.message)}</div>`;
    }
}
async function fetchPresentOwner(){
    const card = $('#presentOwnerCard');
    const waLink = $('#presentWaLink');
    if (!card) return;
    card.innerHTML = '<div class="muted" style="padding:12px;text-align:center">Caricamento owner...</div>';
    try{
        const { owners, main } = await fetchJSON('/api/owners');
        const list = Array.isArray(owners) ? owners : [];
        // main owner: _mainOwner else first
        const mainClean = String(main||'').replace(/[^0-9]/g,'');
        let mainOwner = null;
        if (main) mainOwner = list.find(o => String(o.jid||o.number||o.lid||'').replace(/[^0-9]/g,'').includes(mainClean));
        if (!mainOwner) mainOwner = list[0];
        if (!mainOwner) {
            card.innerHTML = '<div class="muted">Nessun owner configurato — aggiungine uno in Owner</div>';
            if (waLink) waLink.style.display='none';
            return;
        }
        const jid = mainOwner.jid || mainOwner.number || mainOwner.lid || '';
        const name = mainOwner.displayName || mainOwner.name || '';
        const phone = mainOwner.displayPhone || ('+'+String(mainOwner.number||jid).replace(/[^0-9]/g,''));
        const pfp = mainOwner.bestPfp || `/api/pfp/${encodeURIComponent(mainOwner.phoneForPfp||jid)}`;
        const numClean = String(phone).replace(/[^0-9]/g,'');
        const waUrl = `https://wa.me/${numClean}`;
        if (waLink) { waLink.href = waUrl; waLink.style.display='inline-flex'; }
        card.innerHTML = `
            <div style="width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,0.85);box-shadow:0 6px 18px rgba(0,0,0,0.22);background:${avatarColor(jid)};display:grid;place-items:center;flex-shrink:0">
                <img src="${esc(pfp)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;place-items:center;width:100%;height:100%;color:#fff;font-weight:900">${esc(initialsFrom(jid, name||phone))}</span>
            </div>
            <div style="flex:1;min-width:0">
                <div style="font-weight:900;font-size:14px">${name ? esc(name) + ' <span class=muted style=font-weight:600>'+esc(phone)+'</span>' : esc(phone)} <span class="badge on" style="margin-left:6px">★ principale</span></div>
                <div class="muted mono" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(jid)}</div>
                <div class="hint" style="margin-top:4px">Contatto diretto — owner principale da <code>_mainOwner</code>. Scrive il bot, gestisce la dashboard.</div>
            </div>
            <a class="btn" href="${esc(waUrl)}" target="_blank" rel="noopener">💬 WhatsApp</a>
        `;
        // also small list of other owners if many
        if (list.length > 1) {
            const others = list.filter(o=>o!==mainOwner).slice(0,3);
            const extra = document.createElement('div');
            extra.style.cssText='grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
            extra.innerHTML = others.map(o=>{
                const oj = o.jid||o.number||o.lid||'';
                const on = o.displayName||'';
                const op = o.displayPhone||('+'+String(o.number||oj).replace(/[^0-9]/g,'').slice(-12));
                return `<span class="badge" style="border-radius:999px">${on?esc(on)+' · ':''}${esc(op)}</span>`;
            }).join('');
            card.appendChild(extra);
        }
    }catch(e){
        card.innerHTML = `<div class="muted">Errore owner: ${esc(e.message)}</div>`;
    }
}
async function fetchTopUsers(){
    const el = $('#topUsersPodium');
    if (!el) return;
    el.innerHTML = '<div class="muted" style="text-align:center;padding:12px">Caricamento...</div>';
    try{
        const { users } = await fetchJSON('/api/users');
        const sorted = (Array.isArray(users) ? users : []).sort((a,b) => (b.totalMsgs||b.msgCount||0) - (a.totalMsgs||a.msgCount||0)).slice(0,3);
        if (!sorted.length) { el.innerHTML = '<div class="muted" style="text-align:center;padding:12px">Nessun utente</div>'; return; }
        // Ordine podio: 2,1,3
        const order = [1,0,2].map(i => sorted[i]).filter(Boolean);
        const heights = ['10px','16px','6px'];
        const labels = ['2°','1°','3°'];
        const colors = ['silver','gold','bronze'];
        el.innerHTML = `<div style="display:flex;gap:12px;justify-content:center;align-items:end;padding:10px 0">` + order.map((u, idx) => {
            if (!u) return '<div style="flex:1"></div>';
            const realIdx = [1,0,2][idx];
            const name = u.name || u.nickname || u.jid.split('@')[0];
            const phone = u.phoneNumber ? '+'+String(u.phoneNumber).split('@')[0].replace(/[^0-9]/g,'') : '+'+String(u.jid).split('@')[0].replace(/[^0-9]/g,'');
            // Gruppo dove ha più messaggi bot (non il primo a caso)
            let topGroup = '';
            let topMsgs = -1;
            if (u.msgsByGroup) {
                for (const [gid, cnt] of Object.entries(u.msgsByGroup)) {
                    if (cnt > topMsgs) { topMsgs = cnt; const g = (u.groups||[]).find(x=>x.jid===gid); topGroup = g ? (g.name || g.jid) : gid; }
                }
            }
            if (!topGroup) topGroup = (u.groups && u.groups[0]) ? (u.groups[0].name || u.groups[0].jid) : '';
            const size = realIdx===0 ? 72 : 56;
            const border = realIdx===0 ? '3px solid rgba(255,215,0,0.9)' : realIdx===1 ? '2px solid rgba(192,192,192,0.9)' : '2px solid rgba(205,127,50,0.9)';
            return `
            <div style="flex:1;max-width:140px;text-align:center;cursor:pointer" onclick="navigate('users'); setTimeout(()=>openUserDetail('${esc(u.jid)}'),200)">
                <div style="position:relative;display:inline-block">
                    ${realIdx===0 ? '<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:18px">👑</div>' : ''}
                    <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:${border};margin:0 auto;background:${avatarColor(u.jid)};display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
                        <img src="/api/pfp/${encodeURIComponent(u.jid)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;place-items:center;width:100%;height:100%;color:#fff;font-weight:800">${esc(initialsFrom(u.jid, name))}</span>
                    </div>
                </div>
                <div style="font-weight:800;font-size:12px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(name.length>14?name.slice(0,14)+'…':name)}</div>
                <div class="muted mono" style="font-size:10px">${esc(phone)}</div>
                <div class="muted" style="font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📍 ${esc(topGroup.length>14?topGroup.slice(0,14)+'…':topGroup)}</div>
                <div style="font-size:10px;margin-top:4px">💬 ${u.totalMsgs||u.msgCount||0} · 💰 ${u.totalMoney||u.money||0}€</div>
                <div class="podium-height ${colors[idx]}" style="height:${heights[idx]};margin-top:6px"></div>
                <div class="muted" style="font-size:10px">${labels[idx]}</div>
            </div>`;
        }).join('') + `</div>`;
        // Rendi cliccabile l'intero podio
        el.style.cursor = 'pointer';
    }catch(e){ if(el) el.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`; }
}

// ── Groups ──────────────────────────────────────────────────────────────
async function fetchGroups(){
    const listEl = $('#groupsList');
    const countEl = $('#groupCount');
    const sortSel = $('#groupSortSel');
    if (sortSel) sortSel.value = groupSort;
    if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">✦ Caricamento gruppi...</div>';
    try{
        const { groups } = await fetchJSON('/api/groups');
        groupsCache = Array.isArray(groups) ? groups : [];
        if (countEl) countEl.textContent = `${groupsCache.length} gruppi`;
        renderGroups(groupsCache);
        const sel = $('#userGroupSelect');
        if (sel) {
            const cur = sel.value;
            sel.innerHTML = '<option value="">— Seleziona gruppo —</option>' + groupsCache.map(g => {
                const dName = g.name && g.name !== g.jid ? g.name : g.jid;
                return `<option value="${esc(g.jid)}">${esc(dName)} — ${g.users} utenti</option>`;
            }).join('');
            if (cur) sel.value = cur;
        }
    }catch(e){
        if (listEl) listEl.innerHTML = `<div class="muted" style="padding:12px">Errore: ${esc(e.message)}</div>`;
        toast('Gruppi: '+e.message,'err');
    }
}
function pfpHTML(jid, name, photoUrl, size=''){
    // Sempre via /api/pfp per avere URL fresco (photoUrl diretto scade dopo 24h)
    // Se photoUrl è già noto lo passiamo come hint, ma src è sempre /api/pfp per redirect/cache
    const cls = size ? `avatar ${size}` : 'avatar';
    const init = initialsFrom(jid, name);
    const bg = avatarColor(jid || name || 'x');
    const apiSrc = `/api/pfp/${encodeURIComponent(jid || '')}`;
    return `<div class="${cls}" style="overflow:hidden;background:${bg}"><img src="${apiSrc}" alt="${esc(name||jid)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'"><span class="avatar-fallback" style="display:none;place-items:center;width:100%;height:100%;font-weight:800;color:#fff">${esc(init)}</span></div>`;
}
let groupSort = localStorage.getItem('vex_groupSort') || 'name';
function renderGroups(list){
    const q = ($('#groupSearch')?.value || '').toLowerCase().trim();
    let filtered = list.filter(g => g && typeof g === 'object');
    // Filtra
    if (q) {
        filtered = filtered.filter(g => {
            const name = String(g.name || '').toLowerCase();
            const jid = String(g.jid || '').toLowerCase();
            const idNum = jid.split('@')[0];
            return name.includes(q) || jid.includes(q) || idNum.includes(q);
        });
    }
    // Ordina — sempre per nome, mai disordinato
    filtered.sort((a,b) => {
        if (groupSort === 'name') {
            const an = (a.name && a.name !== a.jid ? a.name : a.jid || '').toLowerCase();
            const bn = (b.name && b.name !== b.jid ? b.name : b.jid || '').toLowerCase();
            return an.localeCompare(bn, 'it');
        }
        if (groupSort === 'members') return (b.participantsCount ?? b.users ?? 0) - (a.participantsCount ?? a.users ?? 0);
        if (groupSort === 'msgs') return (b.msgs ?? 0) - (a.msgs ?? 0);
        return 0;
    });
    const el = $('#groupsList');
    if (!el) return;
    if (!filtered.length) { el.innerHTML = `<div class="muted" style="padding:14px;text-align:center">✦ Nessun gruppo trovato per “${esc(q)}”</div>`; return; }
    el.innerHTML = filtered.map(g => {
        const hasRealName = g.name && g.name !== g.jid;
        const displayName = hasRealName ? g.name : g.jid;
        // Evidenzia match
        let titleHtml = esc(displayName);
        if (q && hasRealName && displayName.toLowerCase().includes(q)) {
            const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'ig');
            titleHtml = esc(displayName).replace(re, '<mark style="background:rgba(var(--accent-rgb),0.25);color:var(--text);padding:0 2px;border-radius:4px">$1</mark>');
        }
        return `
        <div class="row-item with-avatar" onclick="openGroup('${esc(g.jid)}')">
            ${pfpHTML(g.jid, g.name || g.jid, g.photoUrl, '')}
            <div class="left">
                <div class="title" style="font-size:14px">${titleHtml} ${hasRealName ? `<span class="muted mono" style="font-size:10px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px">${esc(g.jid)}</span>` : ''}</div>
                <div class="sub" style="margin-top:2px">
                    <span style="background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:6px;border:1px solid var(--border);font-size:11px">👥 ${g?.participantsCount ?? g?.users ?? 0} membri</span>
                    <span style="margin-left:6px">💬 ${g?.msgs ?? 0} msg</span>
                    ${g?.hasAntilink ? '<span style="margin-left:6px;color:var(--accent)">◆ antilink</span>' : '<span style="margin-left:6px" class="muted">▫ antilink off</span>'}
                </div>
            </div>
            <div class="right" style="flex-direction:column;align-items:flex-end;gap:4px">
                <span class="badge ${g?.welcome ? 'on' : 'off'}" title="Welcome">${g?.welcome ? '✦ welcome' : '○ welcome'}</span>
                <span class="badge ${g?.goodbye ? 'on' : 'off'}" title="Goodbye">${g?.goodbye ? '✦ goodbye' : '○ goodbye'}</span>
            </div>
        </div>
    `}).join('');
}
function setGroupSort(v){
    groupSort = v;
    localStorage.setItem('vex_groupSort', v);
    renderGroups(groupsCache);
}
function filterGroups(){ renderGroups(groupsCache); }

function closeGroupDetail(){ const d=$('#groupDetail'); if(d) d.classList.add('hidden'); }
async function openGroup(jid){
    currentGroupJid = jid;
    const detail = $('#groupDetail');
    const jidEl = $('#detailJid');
    if (jidEl) jidEl.textContent = jid;
    if (detail) detail.classList.remove('hidden');
    try{
        const { config, users, name, photoUrl, desc } = await fetchJSON(`/api/groups/${encodeURIComponent(jid)}`);
        // Aggiorna header con nome e foto
        if (jidEl) {
            const displayName = name && name !== jid ? name : jid;
            jidEl.innerHTML = `${photoUrl ? `<img src="${esc(photoUrl)}" alt="" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:6px;object-fit:cover" onerror="this.style.display='none'">` : ''}${esc(displayName)} <span class="muted mono" style="font-size:11px">${esc(jid)}</span>`;
            if (desc) jidEl.title = desc;
        }
        const wOn = $('#welcomeOn'), gOn = $('#goodbyeOn'), wText = $('#welcomeText'), gText = $('#goodbyeText');
        if (wOn) wOn.checked = !!config.welcome.welcome;
        if (gOn) gOn.checked = !!config.welcome.goodbye;
        if (wText) wText.value = config.welcome.welcomeText || '';
        if (gText) gText.value = config.welcome.goodbyeText || '';
        const grid = $('#antilinkGrid');
        if (grid) {
            const plats = ['whatsapp','instagram','telegram','tiktok','facebook','youtube','twitter','altri'];
            grid.innerHTML = plats.map(p => `
                <label class="check"><input type="checkbox" data-plat="${p}" ${config.antilink[p] ? 'checked' : ''}> ${p}</label>
            `).join('');
        }
        const wl = $('#antilinkWl');
        if (wl) wl.value = (config.antilink.whitelist || []).join('\n');
        const lo = $('#linkOpen'), mo = $('#modoadmin'), af = $('#antiflood');
        if (lo) lo.checked = !!config.linkOpen;
        if (mo) mo.checked = !!config.modoadmin;
        if (af) af.checked = config.antiflood !== false;
        const ulist = $('#groupUsersList');
        if (ulist) {
            const safeUsers = (Array.isArray(users) ? users : []).filter(u => u && typeof u === 'object');
            if (!safeUsers.length) ulist.innerHTML = '<div class="muted">Nessun utente tracciato in questo gruppo</div>';
            else ulist.innerHTML = safeUsers.slice(0, 30).map(u => {
                const displayName = u?.name || u?.nickname || '';
                const num = String(u?.jid || '').split('@')[0];
                return `
                <div class="row-item with-avatar">
                    ${pfpHTML(u?.jid, displayName || u?.jid, u?.pfpUrl, 'sm')}
                    <div class="left"><div class="title">${displayName ? `<b>${esc(displayName)}</b> <span class="muted mono" style="font-size:11px">${esc(num)}</span>` : `<span class="mono">${esc(num)}</span>`} ${u?.nickname && u.nickname !== displayName ? '— <i>'+esc(u.nickname)+'</i>' : ''}</div><div class="sub">💰 ${u?.money ?? 0}€ · ⚠️ ${u?.warnings ?? 0} · 💬 ${u?.msgCount ?? 0} ${u?.isMuted ? '· 🔇 mutato' : ''}</div></div>
                    <div class="right"><span class="badge">${u?.spouse ? '💍 ' + esc(String(u.spouse).split('@')[0]) : 'single'}</span></div>
                </div>
            `}).join('') + (safeUsers.length > 30 ? `<div class="muted small" style="padding:8px">… e altri ${safeUsers.length - 30} utenti</div>` : '');
        }
    }catch(e){ toast('Dettaglio gruppo: '+e.message,'err'); }
}
function switchGroupTab(name){
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
}
async function saveWelcome(){
    if (!currentGroupJid) return toast('Seleziona un gruppo','err');
    const welcome = $('#welcomeOn')?.checked;
    const goodbye = $('#goodbyeOn')?.checked;
    const welcomeText = $('#welcomeText')?.value.trim() || null;
    const goodbyeText = $('#goodbyeText')?.value.trim() || null;
    if (welcomeText && welcomeText.length > 800) return toast('Welcome troppo lunga (max 800)','err');
    if (goodbyeText && goodbyeText.length > 800) return toast('Goodbye troppo lunga','err');
    try{
        await fetchJSON(`/api/groups/${encodeURIComponent(currentGroupJid)}/welcome`, {
            method: 'PUT',
            body: JSON.stringify({ welcome, goodbye, welcomeText, goodbyeText })
        });
        toast('Welcome/Goodbye salvato ✦');
        fetchGroups();
    }catch(e){ toast(e.message,'err'); }
}
async function resetWelcome(){
    if (!currentGroupJid) return;
    if (!(await customConfirm('Resettare welcome/goodbye a default (rimuove custom)?','Reset'))) return;
    const w = $('#welcomeText'), g = $('#goodbyeText');
    if (w) w.value = ''; if (g) g.value = '';
    await saveWelcome();
}
function toggleAllAntilink(on){
    $$('#antilinkGrid input').forEach(cb => cb.checked = on);
}
async function saveAntilink(){
    if (!currentGroupJid) return toast('Seleziona gruppo','err');
    const body = {};
    $$('#antilinkGrid input').forEach(cb => body[cb.dataset.plat] = cb.checked);
    const wlRaw = $('#antilinkWl')?.value.trim() || '';
    body.whitelist = wlRaw ? wlRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
    try{
        await fetchJSON(`/api/groups/${encodeURIComponent(currentGroupJid)}/antilink`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        toast('Antilink salvato ◆');
        fetchGroups();
    }catch(e){ toast(e.message,'err'); }
}
async function saveGroupSettings(){
    if (!currentGroupJid) return toast('Seleziona gruppo','err');
    const body = {
        _linkOpen: $('#linkOpen')?.checked,
        _modoadmin: $('#modoadmin')?.checked,
        _antiflood: $('#antiflood')?.checked,
    };
    try{
        await fetchJSON(`/api/groups/${encodeURIComponent(currentGroupJid)}/settings`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        toast('Impostazioni salvate ⬥');
    }catch(e){ toast(e.message,'err'); }
}
async function deleteGroup(){
    if (!currentGroupJid) return;
    if (!(await customConfirm(`Eliminare tutti i dati di ${currentGroupJid}?\nVerranno rimossi da database.json, welcome.json e antilink.json.`, 'Elimina gruppo'))) return;
    try{
        await fetchJSON(`/api/groups/${encodeURIComponent(currentGroupJid)}`, { method: 'DELETE' });
        toast('Gruppo eliminato');
        const d = $('#groupDetail'); if (d) d.classList.add('hidden');
        currentGroupJid = null;
        fetchGroups();
    }catch(e){ toast(e.message,'err'); }
}

// ── Users (globale) ───────────────────────────────────────────────────
let usersGlobalCache = [];
async function initUsersPage(){ await loadUsersGlobal(); }
async function loadUsersGlobal(){
    const listEl = $('#usersList');
    const countEl = $('#userCount');
    if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">◇ Caricamento utenti...</div>';
    try{
        const { users } = await fetchJSON('/api/users');
        usersGlobalCache = Array.isArray(users) ? users : [];
        if (countEl) countEl.textContent = `${usersGlobalCache.length} utenti unici`;
        renderUsers(usersGlobalCache);
    }catch(e){
        if (listEl) listEl.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
async function loadUsers(){ return loadUsersGlobal(); }
function renderUsers(list){
    const q = ($('#userSearch')?.value || '').toLowerCase();
    const filtered = q ? list.filter(u => (u?.jid && u.jid.toLowerCase().includes(q)) || String(u?.nickname||'').toLowerCase().includes(q) || String(u?.name||'').toLowerCase().includes(q) || String(u?.bio||'').toLowerCase().includes(q)) : list;
    const el = $('#usersList');
    if (!el) return;
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun utente</div>'; return; }
    el.innerHTML = filtered.filter(u => u && typeof u === 'object').map(u => {
        const displayName = u?.name || u?.nickname || '';
        const phone = u?.phoneNumber ? String(u.phoneNumber).split('@')[0] : String(u?.jid || '').split('@')[0];
        const displayNum = formatPhone(u?.phoneNumber || u?.jid || '');
        const totalMoney = u?.totalMoney ?? u?.money ?? 0;
        const totalMsgs = u?.totalMsgs ?? u?.msgCount ?? 0;
        const groupsCount = Array.isArray(u?.groups) ? u.groups.length : 0;
        return `
        <div class="row-item with-avatar" onclick="openUserDetail('${esc(u?.jid || '')}')" style="cursor:pointer">
            ${pfpHTML(u?.jid, displayName || u?.jid, u?.pfpUrl)}
            <div class="left">
                <div class="title">${displayName ? `<b>${esc(displayName)}</b> <span class="muted mono" style="font-size:11px">${esc(displayNum)}</span>` : `<span class="mono">${esc(displayNum)}</span>`}</div>
                <div class="sub">💰 ${totalMoney}€ · 💬 ${totalMsgs} · 👥 ${groupsCount} gruppi ${u?.bio ? '· 📝 '+esc(u.bio.slice(0,24)) : ''}</div>
            </div>
            <div class="right"><span class="muted" style="font-size:14px">→</span></div>
        </div>
    `;
    }).join('');
}
function filterUsers(){ renderUsers(usersGlobalCache); }
let currentUserDetailJid = null;
async function openUserDetail(jid){
    const user = usersGlobalCache.find(u => u.jid === jid);
    if (!user) return;
    currentUserDetailJid = jid;
    const detail = $('#userDetail');
    const nameEl = $('#userDetailName');
    const headEl = $('#userDetailHead');
    const groupsEl = $('#userDetailGroups');
    const userPhone = user.phoneNumber ? String(user.phoneNumber).split('@')[0] : jid.split('@')[0];
    const displayPhone = '+' + String(userPhone).replace(/[^0-9]/g,'');
    if (nameEl) nameEl.textContent = (user.name || user.nickname || jid.split('@')[0]) + ' — ' + displayPhone;
    if (headEl) headEl.innerHTML = `
        ${pfpHTML(user.jid, user.name || user.jid, user.pfpUrl, 'lg')}
        <div style="flex:1">
            <div style="font-weight:800;font-size:15px">${esc(user.name || user.nickname || jid.split('@')[0])} <span class="muted mono" style="font-size:12px">${esc(displayPhone)} · ${esc(jid)}</span></div>
            <div class="muted" style="font-size:12px">💰 ${user.totalMoney ?? 0}€ totale · 💬 ${user.totalMsgs ?? 0} msg · ⚠️ ${user.totalWarnings ?? 0} warn · 👥 ${user.groups?.length ?? 0} gruppi</div>
            ${user.bio ? `<div style="margin-top:6px;font-size:12px;background:rgba(255,255,255,0.06);padding:6px 10px;border-radius:8px;border:1px solid var(--border)">📝 ${esc(user.bio)}</div>` : ''}
        </div>
    `;
    if (groupsEl) {
        if (!user.groups || !user.groups.length) groupsEl.innerHTML = '<div class="muted">Nessun gruppo</div>';
        else {
            const rows = await Promise.all(user.groups.map(async g => {
                try {
                    const { users } = await fetchJSON(`/api/users/${encodeURIComponent(g.jid)}`);
                    const u = users.find(x => x.jid === jid) || {};
                    return { g, u };
                } catch { return { g, u: {} }; }
            }));
            groupsEl.innerHTML = rows.map(({g,u}) => `
                <div class="row-item with-avatar">
                    ${pfpHTML(g.jid, g.name || g.jid, g.photoUrl, 'sm')}
                    <div class="left">
                        <div class="title" style="font-size:13px">${esc(g.name || g.jid)} <span class="muted mono" style="font-size:10px">${esc(g.jid)}</span></div>
                        <div class="sub">💰 ${u.money ?? 0}€ · 💬 ${u.msgCount ?? 0} · ⚠️ ${u.warnings ?? 0} ${u.isMuted ? '· 🔇 mutato' : ''} ${u.nickname ? '· 🏷 '+esc(u.nickname) : ''}</div>
                    </div>
                    <div class="right">
                        <button class="btn btn-sm btn-ghost" onclick="editUserInGroup('${esc(jid)}','${esc(g.jid)}')">✎ Modifica</button>
                    </div>
                </div>
            `).join('');
        }
    }
    if (detail) detail.classList.remove('hidden');
}
function closeUserDetail(){ const d=$('#userDetail'); if(d) d.classList.add('hidden'); currentUserDetailJid=null; }

// ── Modale edit utente — tutti i campi insieme, vetro ──────────────────
let _editCtx = null; // { jid, gid, data }
async function editUserInGroup(jid, gid){
    try{
        const { users } = await fetchJSON(`/api/users/${encodeURIComponent(gid)}`);
        const u = users.find(x => x.jid === jid) || { jid, money: 0, warnings: 0, msgCount: 0, isMuted: false, nickname: '', bio: '', spouse: '' };
        _editCtx = { jid, gid, data: u };
        const av = $('#editModalAvatar');
        if (av) av.innerHTML = pfpHTML(jid, u.name || u.nickname || jid, u.pfpUrl, '');
        const t = $('#editModalTitle'), s = $('#editModalSub');
        if (t) t.textContent = (u.name || u.nickname || jid.split('@')[0]) + ' — ' + gid;
        if (s) s.textContent = jid;
        const m = $('#editMoney'), w = $('#editWarnings'), c = $('#editMsgCount'), mu = $('#editMuted'), n = $('#editNickname'), b = $('#editBio'), sp = $('#editSpouse');
        if (m) m.value = u.money ?? 0;
        if (w) w.value = u.warnings ?? 0;
        if (c) c.value = u.msgCount ?? 0;
        if (mu) mu.value = String(!!u.isMuted);
        if (n) n.value = u.nickname || '';
        if (b) b.value = u.bio || '';
        if (sp) sp.value = u.spouse || '';
        const modal = $('#userEditModal');
        if (modal) { modal.classList.remove('hidden'); modal.scrollTop = 0; }
    }catch(e){ toast(e.message,'err'); }
}
function closeUserEditModal(){ const m=$('#userEditModal'); if(m) m.classList.add('hidden'); _editCtx=null; }
async function saveUserEditModal(){
    if (!_editCtx) return;
    const { jid, gid } = _editCtx;
    const body = {
        money: Number($('#editMoney')?.value || 0),
        warnings: Number($('#editWarnings')?.value || 0),
        msgCount: Number($('#editMsgCount')?.value || 0),
        isMuted: $('#editMuted')?.value === 'true',
        nickname: String($('#editNickname')?.value || '').trim().slice(0,32) || null,
        bio: String($('#editBio')?.value || '').trim().slice(0,90) || null,
        spouse: String($('#editSpouse')?.value || '').trim() || null,
    };
    // Pulisci null/empty per non sovrascrivere inutilmente
    Object.keys(body).forEach(k => { if (body[k] === null || body[k] === '') delete body[k]; });
    // Se nickname/bio/spouse sono vuoti, invia null per cancellare
    if (!$('#editNickname')?.value.trim()) body.nickname = null;
    if (!$('#editBio')?.value.trim()) body.bio = null;
    if (!$('#editSpouse')?.value.trim()) body.spouse = null;
    try{
        await fetchJSON(`/api/users/${encodeURIComponent(gid)}/${encodeURIComponent(jid)}`, { method:'PUT', body: JSON.stringify(body) });
        toast('Utente salvato ✦');
        closeUserEditModal();
        await loadUsersGlobal();
        openUserDetail(jid);
        if (currentGroupJid === gid) openGroup(gid);
    }catch(e){ toast(e.message,'err'); }
}
async function editUserPrompt(jid){ openUserDetail(jid); }
async function deleteUser(jid){
    const user = usersGlobalCache.find(u => u.jid === jid);
    if (!user || !user.groups || !user.groups.length) return;
    const groupsList = user.groups.map(g=>g.jid).join('\n');
    const target = await customPrompt(`Eliminare ${jid} da quale gruppo?\nGruppi:\n${groupsList}\n\nScrivi il JID del gruppo o "tutti" per rimuoverlo ovunque:`, '', 'tutti o JID');
    if (!target) return;
    if (target.toLowerCase() === 'tutti') {
        if (!(await customConfirm(`Rimuovere ${jid} da TUTTI i ${user.groups.length} gruppi?`, 'Conferma rimozione'))) return;
        for (const g of user.groups) {
            try{ await fetchJSON(`/api/users/${encodeURIComponent(g.jid)}/${encodeURIComponent(jid)}`, { method:'DELETE' }); }catch{}
        }
        toast('Utente rimosso da tutti i gruppi');
    } else {
        const gid = target.trim();
        if (!(await customConfirm(`Eliminare ${jid} da ${gid}?`, 'Conferma'))) return;
        try{ await fetchJSON(`/api/users/${encodeURIComponent(gid)}/${encodeURIComponent(jid)}`, { method:'DELETE' }); toast('Utente eliminato da '+gid); }catch(e){ toast(e.message,'err'); return; }
    }
    await loadUsersGlobal();
    closeUserDetail();
}

// ── Phrases ─────────────────────────────────────────────────────────────
async function fetchPhrases(){
    const listEl = $('#phrasesList');
    const countEl = $('#phraseCount');
    if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">✧ Caricamento...</div>';
    try{
        const { phrases } = await fetchJSON('/api/phrases');
        phrasesCache = Array.isArray(phrases) ? phrases : [];
        if (countEl) countEl.textContent = `${phrasesCache.length} file`;
        renderPhrases(phrasesCache);
    }catch(e){
        if (listEl) listEl.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
function renderPhrases(list){
    const q = ($('#phraseSearch')?.value || '').toLowerCase();
    const filtered = q ? list.filter(p => p.key.toLowerCase().includes(q)) : list;
    const el = $('#phrasesList');
    if (!el) return;
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun file</div>'; return; }
    el.innerHTML = filtered.map(p => `
        <div class="row-item" onclick="openPhrase('${esc(p.key)}')">
            <div class="left"><div class="title mono">${esc(p.key)}.txt</div><div class="sub">${p.count} frasi</div></div>
            <div class="right"><span class="badge">${p.count} ✧</span><span class="muted">→</span></div>
        </div>
    `).join('');
}
function filterPhrases(){ renderPhrases(phrasesCache); }
function switchPhraseTab(name){
    $$('#phraseEditor .tab').forEach(t => t.classList.toggle('active', t.dataset.ptab === name));
    $$('#phraseEditor .tab-pane').forEach(p => p.classList.toggle('active', p.id === `phraseTab-${name}`));
    if (name === 'bulk' && currentPhraseKey) {
        const bulk = $('#phraseBulk');
        if (bulk) bulk.value = currentPhraseLines.join('\n');
    }
    if (name === 'list' && currentPhraseKey) {
        const bulk = $('#phraseBulk');
        if (bulk && bulk.value.trim()) {
            // Sincronizza bulk → lista se bulk è stato modificato
            const lines = bulk.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
            if (lines.length && lines.join('\n') !== currentPhraseLines.join('\n')) {
                currentPhraseLines = lines;
                renderPhraseLines();
                const c2 = $('#phraseCount2'); if(c2) c2.textContent = `(${currentPhraseLines.length} frasi)`;
            }
        }
    }
}
async function openPhrase(key){
    currentPhraseKey = key;
    const kEl = $('#phraseKey'), ed = $('#phraseEditor');
    if (kEl) kEl.textContent = key + '.txt';
    if (ed) ed.classList.remove('hidden');
    switchPhraseTab('list');
    try{
        const { phrases } = await fetchJSON(`/api/phrases/${encodeURIComponent(key)}`);
        currentPhraseLines = Array.isArray(phrases) ? [...phrases] : [];
        const c2 = $('#phraseCount2'); if(c2) c2.textContent = `(${currentPhraseLines.length} frasi)`;
        renderPhraseLines();
        const bulk = $('#phraseBulk'); if(bulk) bulk.value = currentPhraseLines.join('\n');
        if (ed) ed.scrollIntoView({ behavior: 'smooth' });
    }catch(e){ toast(e.message,'err'); }
}
function renderPhraseLines(){
    const el = $('#phraseLines');
    if (!el) return;
    if (!currentPhraseLines.length) { el.innerHTML = '<div class="muted" style="padding:8px">Nessuna frase — aggiungine una sotto</div>'; return; }
    el.innerHTML = currentPhraseLines.map((line, i) => `
        <div class="phrase-row">
            <span class="num">${String(i+1).padStart(2,'0')}</span>
            <span class="text">${esc(line)}</span>
            <span class="actions">
                <button class="btn btn-sm btn-ghost" onclick="editPhraseLine(${i})">✎</button>
                <button class="btn btn-sm btn-danger" onclick="removePhraseLine(${i})">✕</button>
            </span>
        </div>
    `).join('');
}
function closePhraseEditor(){ const ed=$('#phraseEditor'); if(ed) ed.classList.add('hidden'); currentPhraseKey=null; }
async function addPhraseLine(){
    const input = $('#newPhraseInput');
    if (!input) return;
    const phrase = input.value.trim();
    if (!phrase) return toast('Scrivi una frase','err');
    if (phrase.length > 400) return toast('Max 400 caratteri','err');
    if (!currentPhraseKey) return;
    try{
        await fetchJSON(`/api/phrases/${encodeURIComponent(currentPhraseKey)}/add`, {
            method: 'POST',
            body: JSON.stringify({ phrase })
        });
        input.value = '';
        currentPhraseLines.push(phrase);
        renderPhraseLines();
        const bulk = $('#phraseBulk'); if(bulk) bulk.value = currentPhraseLines.join('\n');
        const c2 = $('#phraseCount2'); if(c2) c2.textContent = `(${currentPhraseLines.length} frasi)`;
        toast('Frase aggiunta ✧');
        fetchPhrases();
    }catch(e){ toast(e.message,'err'); }
}
async function removePhraseLine(idx){
    if (!(await customConfirm(`Rimuovere frase #${idx+1}?`, 'Rimuovi frase'))) return;
    try{
        await fetchJSON(`/api/phrases/${encodeURIComponent(currentPhraseKey)}/${idx}`, { method: 'DELETE' });
        currentPhraseLines.splice(idx, 1);
        renderPhraseLines();
        const bulk = $('#phraseBulk'); if(bulk) bulk.value = currentPhraseLines.join('\n');
        const c2 = $('#phraseCount2'); if(c2) c2.textContent = `(${currentPhraseLines.length} frasi)`;
        toast('Frase rimossa');
        fetchPhrases();
    }catch(e){ toast(e.message,'err'); }
}
async function editPhraseLine(idx){
    const cur = currentPhraseLines[idx];
    const next = await customPrompt(`Modifica frase #${idx+1}:`, cur, 'Nuova frase');
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return toast('Frase vuota','err');
    if (trimmed.length > 400) return toast('Max 400','err');
    currentPhraseLines[idx] = trimmed;
    renderPhraseLines();
    const bulk = $('#phraseBulk'); if(bulk) bulk.value = currentPhraseLines.join('\n');
    // Auto-save per facilità
    savePhrases();
}
async function savePhrases(){
    if (!currentPhraseKey) return;
    // Se bulk è attivo e modificato, usa bulk
    const bulkEl = $('#phraseBulk');
    const activeBulk = $$('#phraseEditor .tab.active').some(t => t.dataset.ptab === 'bulk');
    if (activeBulk && bulkEl) {
        const bulkLines = bulkEl.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
        if (bulkLines.some(l=>l.length>400)) return toast('Una riga supera 400','err');
        currentPhraseLines = bulkLines;
        renderPhraseLines();
    }
    try{
        await fetchJSON(`/api/phrases/${encodeURIComponent(currentPhraseKey)}`, {
            method: 'PUT',
            body: JSON.stringify({ phrases: currentPhraseLines })
        });
        const c2 = $('#phraseCount2'); if(c2) c2.textContent = `(${currentPhraseLines.length} frasi)`;
        toast('File salvato ✦');
        fetchPhrases();
    }catch(e){ toast(e.message,'err'); }
}
async function reloadPhrases(){
    if (!currentPhraseKey) return;
    openPhrase(currentPhraseKey);
}
async function createPhraseFile(){
    const key = await customPrompt('Nome nuovo file (solo a-z0-9_-):', '', 'es. saluti');
    if (!key) return;
    const clean = key.toLowerCase().replace(/[^a-z0-9_-]/g,'');
    if (!clean) return toast('Nome non valido','err');
    try{
        await fetchJSON(`/api/phrases/${encodeURIComponent(clean)}`, {
            method: 'PUT',
            body: JSON.stringify({ phrases: ['Nuova frase di esempio'] })
        });
        toast('File creato');
        fetchPhrases();
        openPhrase(clean);
    }catch(e){ toast(e.message,'err'); }
}

// ── Files ───────────────────────────────────────────────────────────────
async function loadFiles(pathRel=''){
    currentFilePath = pathRel;
    const pathEl = $('#filePath');
    if (pathEl) pathEl.textContent = '/' + (pathRel || '');
    const listEl = $('#filesList');
    if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">⬥ Caricamento...</div>';
    try{
        const { entries, parent } = await fetchJSON(`/api/files/list?path=${encodeURIComponent(pathRel)}`);
        loadFiles._parent = parent;
        if (!entries || !entries.length) {
            if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">Cartella vuota</div>';
            return;
        }
        if (listEl) listEl.innerHTML = entries.map(e => {
            const icon = e.isDir ? '📁' : (e.ext==='.js'?'⬥': e.ext==='.json'?'◆': e.ext==='.txt'?'▸': '⬦');
            const cls = e.isDir ? 'dir' : e.ext.replace('.','');
            const size = e.isDir ? '' : fmtBytes(e.size);
            const click = e.isDir ? `loadFiles('${esc(e.path)}')` : `openFile('${esc(e.path)}')`;
            const del = `deleteFile('${esc(e.path)}', ${e.isDir})`;
            return `
                <div class="row-item file-row">
                    <div class="file-icon ${cls}">${icon}</div>
                    <div class="left" onclick="${click}" style="cursor:pointer">
                        <div class="title mono">${esc(e.name)} ${e.isDir?'<span class="muted">/</span>':''}</div>
                        <div class="sub">${e.isDir?'cartella':esc(e.ext||'file')} ${size? '· '+size:''} ${e.mtime ? '· '+new Date(e.mtime).toLocaleDateString('it-IT') : ''}</div>
                    </div>
                    <div class="right">
                        ${!e.isDir ? `<button class="btn btn-sm btn-ghost" onclick="${click}">✎</button>` : `<button class="btn btn-sm btn-ghost" onclick="${click}">→</button>`}
                        <button class="btn btn-sm btn-danger" onclick="${del}">🗑</button>
                    </div>
                </div>
            `;
        }).join('');
    }catch(e){
        if (listEl) listEl.innerHTML = `<div class="muted" style="padding:12px">Errore: ${esc(e.message)}</div>`;
    }
}
function navUp(){
    const parent = loadFiles._parent;
    if (parent === null || parent === undefined) return;
    loadFiles(parent === '.' ? '' : parent);
}
async function openFile(rel){
    try{
        const { content, size } = await fetchJSON(`/api/files/read?path=${encodeURIComponent(rel)}`);
        currentFilePath = rel;
        currentFileContent = content;
        const nameEl = $('#fileName'), sizeEl = $('#fileSize'), contentEl = $('#fileContent'), editor = $('#fileEditor');
        if (nameEl) nameEl.textContent = rel;
        if (sizeEl) sizeEl.textContent = `(${fmtBytes(size)})`;
        if (contentEl) contentEl.value = content;
        if (editor) editor.classList.remove('hidden');
        if (editor) editor.scrollIntoView({ behavior: 'smooth' });
        // Ctrl+S
        if (contentEl) {
            contentEl.onkeydown = (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
            };
        }
    }catch(e){ toast(e.message,'err'); }
}
function closeFileEditor(){ const ed=$('#fileEditor'); if(ed) ed.classList.add('hidden'); }
async function saveFile(){
    const contentEl = $('#fileContent');
    if (!contentEl || !currentFilePath) return;
    const content = contentEl.value;
    if (content.length > 50 * 1024 * 1024) return toast('File troppo grande (max 50MB)','err');
    try{
        await fetchJSON('/api/files/write', { method:'PUT', body: JSON.stringify({ path: currentFilePath, content }) });
        toast('File salvato ✦');
        loadFiles(currentFilePath.includes('/') ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : '');
    }catch(e){ toast(e.message,'err'); }
}
async function deleteFile(rel, isDir){
    if (!(await customConfirm(`Eliminare ${isDir?'cartella e tutto il contenuto':'file'} "${rel}"?`, 'Elimina'))) return;
    try{
        await fetchJSON(`/api/files?path=${encodeURIComponent(rel)}`, { method: 'DELETE' });
        toast(isDir ? 'Cartella eliminata' : 'File eliminato');
        const parent = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : '';
        loadFiles(parent);
        if (currentFilePath === rel) closeFileEditor();
    }catch(e){ toast(e.message,'err'); }
}
async function createFolderPrompt(){
    const name = await customPrompt('Nome nuova cartella:', '', 'es. nuova/cartella');
    if (!name) return;
    const clean = name.trim().replace(/[\\/]/g,'');
    if (!clean) return toast('Nome non valido','err');
    const rel = (currentFilePath ? currentFilePath + '/' : '') + clean;
    // Se currentFilePath è un file, usa la sua cartella
    let base = currentFilePath;
    // Se siamo in un file, prendi la cartella
    try{
        const stat = await fetchJSON(`/api/files/list?path=${encodeURIComponent(currentFilePath)}`).catch(()=>null);
        if (stat && !stat.entries) base = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
    }catch{}
    const target = (base && !base.includes('.') ? base : (currentFilePath.includes('/') ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : '')) ;
    // Semplice: usa current folder da filePath
    const folder = $('#filePath')?.textContent?.replace(/^\//,'') || '';
    const full = (folder ? folder + '/' : '') + clean;
    try{
        await fetchJSON('/api/files/mkdir', { method:'POST', body: JSON.stringify({ path: full }) });
        toast('Cartella creata');
        loadFiles(folder);
    }catch(e){ toast(e.message,'err'); }
}
async function handleFileUpload(input){
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 20*1024*1024) return toast('Max 50MB','err');
    const folder = $('#filePath')?.textContent?.replace(/^\//,'') || '';
    const full = (folder ? folder + '/' : '') + file.name;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const content = e.target.result;
        // Se è immagine o binario, invia come base64? Per ora solo testo
        if (file.type.startsWith('text/') || file.name.endsWith('.js') || file.name.endsWith('.json') || file.name.endsWith('.txt')) {
            try{
                await fetchJSON('/api/files/write', { method:'PUT', body: JSON.stringify({ path: full, content }) });
                toast('File caricato: ' + file.name);
                loadFiles(folder);
            }catch(err){ toast(err.message,'err'); }
        } else {
            // Per binari, leggi come base64 e invia come testo (il server lo salverà come testo, non ideale ma funziona per piccoli)
            toast('Carico binario come base64...');
            try{
                await fetchJSON('/api/files/write', { method:'PUT', body: JSON.stringify({ path: full, content }) });
                toast('File caricato');
                loadFiles(folder);
            }catch(err){ toast(err.message,'err'); }
        }
    };
    if (file.type.startsWith('text/') || file.name.match(/\.(js|json|txt|css|html|md)$/)) reader.readAsText(file);
    else reader.readAsText(file);
    input.value = '';
}
async function createFilePrompt(){
    const name = await customPrompt('Nome nuovo file (es. note.txt):', '', 'es. note.txt');
    if (!name) return;
    const clean = name.trim();
    if (!clean || clean.includes('/') || clean.includes('\\')) return toast('Nome non valido','err');
    const folder = $('#filePath')?.textContent?.replace(/^\//,'') || '';
    const full = (folder ? folder + '/' : '') + clean;
    try{
        await fetchJSON('/api/files/write', { method:'PUT', body: JSON.stringify({ path: full, content: '' }) });
        toast('File creato');
        loadFiles(folder);
        openFile(full);
    }catch(e){ toast(e.message,'err'); }
}
// Drag & drop per File
setTimeout(() => {
    const drop = $('#fileDrop');
    const list = $('#filesList');
    if (!drop || !list) return;
    ['dragenter','dragover'].forEach(ev => {
        list.addEventListener(ev, (e) => { e.preventDefault(); drop.style.display='block'; });
        drop.addEventListener(ev, (e) => { e.preventDefault(); drop.style.display='block'; });
    });
    ['dragleave','drop'].forEach(ev => {
        drop.addEventListener(ev, (e) => { e.preventDefault(); if(ev==='drop'){ const f=e.dataTransfer.files[0]; if(f){ const inp=$('#fileUpload'); const dt=new DataTransfer(); dt.items.add(f); inp.files=dt.files; handleFileUpload(inp); } } drop.style.display='none'; });
        list.addEventListener(ev, () => { if(ev!=='drop') drop.style.display='none'; });
    });
}, 1000);

// ── Owners ──────────────────────────────────────────────────────────────
async function fetchOwners(){
    const listEl = $('#ownersList');
    if (listEl) listEl.innerHTML = '<div class="muted">Caricamento...</div>';
    try{
        const { owners, main } = await fetchJSON('/api/owners');
        // Podio in scala — foto grande + nome/telefono, corona solo sul vero owner
        const podiumEl = $('#podium');
        if (podiumEl) {
            if (!owners || !owners.length) {
                podiumEl.innerHTML = '<div class="muted" style="grid-column:1/-1;text-align:center;padding:16px">Nessun owner — aggiungine uno</div>';
            } else {
                const mainClean = String(main||'').replace(/[^0-9]/g,'');
                // Ordina: main primo, poi gli altri in ordine originale
                const sorted = [...owners].sort((a,b) => {
                    const aIsMain = mainClean && String(a.jid||a.number||'').replace(/[^0-9]/g,'').includes(mainClean);
                    const bIsMain = mainClean && String(b.jid||b.number||'').replace(/[^0-9]/g,'').includes(mainClean);
                    if (aIsMain && !bIsMain) return -1;
                    if (!aIsMain && bIsMain) return 1;
                    return 0;
                });
                podiumEl.innerHTML = `<div style="display:flex;gap:14px;justify-content:center;align-items:end;flex-wrap:wrap;padding:10px 0">` + sorted.map(o => {
                    const jid = o.jid || o.number || o.lid || '';
                    const displayName = o.displayName || '';
                    const displayPhone = o.displayPhone || ('+' + String(o.number||jid).replace(/[^0-9]/g,'').slice(-12));
                    const pfpJid = o.phoneForPfp || jid;
                    const isMain = (() => {
                        const oNum = String(o.jid||o.number||o.lid||'').replace(/[^0-9]/g,'');
                        const mainNum = String(main||'').replace(/[^0-9]/g,'');
                        return mainNum && (oNum.includes(mainNum) || mainNum.includes(oNum));
                    })();
                    const size = isMain ? 88 : 64;
                    const border = isMain ? '3px solid rgba(255,215,0,0.9)' : '2px solid rgba(255,255,255,0.85)';
                    const shadow = isMain ? '0 6px 20px rgba(255,215,0,0.35), 0 0 0 1px rgba(255,215,0,0.2) inset' : '0 3px 12px rgba(0,0,0,0.3)';
                    const scale = isMain ? 'transform:scale(1.08);' : '';
                    const pfpUrl = o.bestPfp || `/api/pfp/${encodeURIComponent(pfpJid)}`;
                    const showName = displayName && displayName !== jid && displayName.length < 20;
                    return `
                    <div onclick="setMainOwner('${esc(String(o.jid||o.number||o.lid||''))}')" title="${isMain?'★ Owner principale — clicca per cambiare':'Clicca per rendere principale'}" style="text-align:center;cursor:pointer;${scale}transition:.2s">
                        <div style="position:relative;display:inline-block">
                            ${isMain ? '<div style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:22px;filter:drop-shadow(0 2px 6px rgba(255,215,0,0.7));line-height:1">👑</div>' : ''}
                            <div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;border:${border};box-shadow:${shadow};margin:0 auto;background:${avatarColor(jid)};display:grid;place-items:center">
                                <img src="${esc(pfpUrl)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'">
                                <span class="avatar-fallback" style="display:none;place-items:center;width:100%;height:100%;font-weight:900;color:#fff;font-size:${isMain? '22px':'16px'}">${esc(initialsFrom(jid, displayName || displayPhone))}</span>
                            </div>
                        </div>
                        <div style="margin-top:8px;font-weight:800;font-size:${isMain?'13px':'12px'};max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(showName ? displayName : displayPhone)}${showName ? `<br><span class="muted" style="font-size:10px">${esc(displayPhone)}</span>` : ''}</div>
                        <div class="muted mono" style="font-size:9px;max-width:140px;overflow:hidden;text-overflow:ellipsis;opacity:0.7">${esc(jid.length>26? jid.slice(0,26)+'…':jid)}</div>
                        ${isMain ? '<div class="badge on" style="margin:6px auto 0">★ Principale 👑</div>' : '<div class="muted" style="font-size:10px;margin-top:4px">rendi principale</div>'}
                    </div>`;
                }).join('') + `</div>`;
                podiumEl.style.display = 'block';
                podiumEl.style.gridTemplateColumns = '';
            }
        }
        const el = $('#ownersList');
        if (!el) return;
        if (!owners || !owners.length) el.innerHTML = '<div class="muted">Nessun owner — aggiungine uno</div>';
        else {
            const mainClean = String(main||'').replace(/[^0-9]/g,'');
            el.innerHTML = owners.map((o, i) => {
                const rawJid = String(o.jid || o.number || o.lid || '');
                const displayName = o.displayName || '';
                const displayPhone = o.displayPhone || ('+' + String(o.number||rawJid).replace(/[^0-9]/g,'').slice(-12));
                const pfpUrl = o.bestPfp || `/api/pfp/${encodeURIComponent(o.phoneForPfp || rawJid)}`;
                const oNum = String(o.jid||o.number||o.lid||'').replace(/[^0-9]/g,'');
                const isMain = mainClean && (oNum.includes(mainClean) || mainClean.includes(oNum));
                return `<div class="row-item with-avatar" style="${isMain?'border-color:rgba(255,215,0,0.4);background:linear-gradient(135deg, rgba(255,215,0,0.10), var(--panel))':''}">
                    <div class="avatar" style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:1px solid var(--border);background:${avatarColor(rawJid)};display:grid;place-items:center"><img src="${esc(pfpUrl)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none;place-items:center;width:100%;height:100%;font-weight:800;color:#fff">${esc(initialsFrom(rawJid, displayName||displayPhone))}</span></div>
                    <div class="left"><div class="title">${displayName ? `<b>${esc(displayName)}</b> <span class="muted" style="font-size:11px">${esc(displayPhone)}</span>` : esc(displayPhone)} ${isMain?'<span class="badge on">★ Principale 👑</span>':''}<br><span class="muted mono" style="font-size:10px">${esc(rawJid)}</span></div><div class="sub">${esc(displayPhone)} ${isMain?'· 👑 principale':''}</div></div>
                    <div class="right">
                        ${!isMain ? `<button class="btn btn-sm btn-ghost" onclick="setMainOwner('${esc(rawJid)}')">★ Rendi principale</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="removeOwner('${esc(rawJid)}')">🗑 Rimuovi</button>
                    </div>
                </div>`;
            }).join('');
        }
    }catch(e){
        const el=$('#ownersList'); if(el) el.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
async function setMainOwner(jid){
    try{
        await fetchJSON('/api/owners/main', { method:'PUT', body: JSON.stringify(withAntiBotBody({ jid })) });
        toast('Owner principale impostato ★');
        fetchOwners(); fetchPresentOwner();
    }catch(e){ toast(e.message,'err'); }
}
async function addOwner(){
    const input = $('#newOwnerInput');
    const val = input?.value.trim() || '';
    if (!val) return toast('Inserisci un numero','err');
    try{
        await fetchJSON('/api/owners', { method: 'POST', body: JSON.stringify(withAntiBotBody({ action:'add', number: val })) });
        if (input) input.value='';
        toast('Owner aggiunto ★');
        fetchOwners(); fetchOverview(); fetchPresentOwner();
    }catch(e){ toast(e.message,'err'); }
}
async function removeOwner(jid){
    if (!(await customConfirm(`Rimuovere owner ${jid}?`, 'Rimuovi owner'))) return;
    try{
        await fetchJSON('/api/owners', { method: 'POST', body: JSON.stringify(withAntiBotBody({ action:'remove', jid })) });
        toast('Owner rimosso');
        fetchOwners(); fetchOverview(); fetchPresentOwner();
    }catch(e){ toast(e.message,'err'); }
}

// ── Config ──────────────────────────────────────────────────────────────
async function loadConfig(){
    const view = $('#configView');
    if (view) view.textContent = 'Caricamento...';
    try{
        const { raw } = await fetchJSON('/api/config');
        if (view) view.textContent = raw || '(vuoto)';
    }catch(e){ if(view) view.textContent = 'Errore: '+e.message; toast(e.message,'err'); }
}

// ── Logs ────────────────────────────────────────────────────────────────
async function loadLogs(){
    const lines = $('#logLines')?.value || 200;
    const view = $('#logsView'), info = $('#logInfo');
    if (view) view.textContent = 'Caricamento...';
    try{
        const { lines: text, exists } = await fetchJSON(`/api/logs?lines=${lines}`);
        if (view) view.textContent = exists ? (text || '(vuoto)') : 'File logs/bot.log non trovato';
        if (info) info.textContent = exists ? `${lines} righe` : 'non trovato';
    }catch(e){ if(view) view.textContent = 'Errore: '+e.message; toast(e.message,'err'); }
}

// ── Tema vetro — colori modificabili ────────────────────────────────────
function hexToRgb(hex){
    const h = hex.replace('#','');
    const n = parseInt(h,16);
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
}
function toggleLiquidGlass(on){
    document.body.classList.toggle('liquid-glass', !!on);
    try { localStorage.setItem('vex_liquid', on ? '1' : '0'); } catch (_) {}
    updateTheme();
    toast(on ? '✨ Liquid Glass attivato' : 'Liquid Glass disattivato');
}
function toggleAdaptive(on){
    document.body.classList.toggle('adaptive', !!on);
    try { localStorage.setItem('vex_adaptive', on ? '1' : '0'); } catch (_) {}
    if(on){
        // Calcola luminosità sfondo e adatta testi
        try{
            const bg = getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#08080c';
            // Estrai luminanza da --bg o da body
            const hex = $('#colorBg')?.value || '#08080c';
            const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
            const lum = 0.2126*r + 0.7152*g + 0.0722*b;
            document.documentElement.style.setProperty('--adaptive-text', lum > 140 ? '#0a0a0f' : '#f0f0f5');
            document.documentElement.style.setProperty('--adaptive-muted', lum > 140 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)');
        }catch(_){}
    } else {
        document.documentElement.style.removeProperty('--adaptive-text');
        document.documentElement.style.removeProperty('--adaptive-muted');
    }
    updateTheme();
    toast(on ? '🎨 Adattivo attivato — testi ottimizzati' : 'Adattivo disattivato');
}
let _themeSaveTimer = null;
function updateTheme(){
    const accent = $('#colorAccent')?.value || '#7c5cff';
    const accent2 = $('#colorAccent2')?.value || '#ff4ecd';
    const bg = $('#colorBg')?.value || '#08080c';
    const panel = $('#colorPanel')?.value || '#15151d';
    const blur = $('#blurRange')?.value || 22;
    const opacity = $('#opacityRange')?.value || 55;
    const indicator = $('#colorIndicator')?.value || '#ff4ecd';
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent2', accent2);
    root.style.setProperty('--accent-rgb', hexToRgb(accent));
    root.style.setProperty('--accent2-rgb', hexToRgb(accent2));
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--panel', `rgba(${hexToRgb(panel)},${opacity/100})`);
    root.style.setProperty('--blur', blur + 'px');
    root.style.setProperty('--indicator', indicator);
    root.style.setProperty('--indicator-rgb', hexToRgb(indicator));
    const b = $('#blurVal'), o = $('#opacityVal');
    if (b) b.textContent = blur + 'px';
    if (o) o.textContent = opacity + '%';
    const pa = $('#previewAccent'), pa2 = $('#previewAccent2'), pb = $('#previewBg'), pp = $('#previewPanel'), pi = $('#previewIndicator');
    if (pa) pa.style.background = accent;
    if (pa2) pa2.style.background = accent2;
    if (pb) pb.style.background = bg;
    if (pp) pp.style.background = panel;
    if (pi) pi.style.background = indicator;
    if (document.body.classList.contains('liquid-glass')) {
        document.body.style.background = '';
    } else {
        document.body.style.background = `radial-gradient(1200px 600px at 10% -10%, rgba(${hexToRgb(accent)},0.15), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(${hexToRgb(accent2)},0.10), transparent 60%), linear-gradient(180deg, ${bg} 0%, #08080c 100%)`;
    }
    // Auto-salva dopo 400ms — locale + server per persistenza
    clearTimeout(_themeSaveTimer);
    _themeSaveTimer = setTimeout(() => {
        const data = {
            accent: $('#colorAccent')?.value,
            accent2: $('#colorAccent2')?.value,
            bg: $('#colorBg')?.value,
            panel: $('#colorPanel')?.value,
            blur: $('#blurRange')?.value,
            opacity: $('#opacityRange')?.value,
            indicator: $('#colorIndicator')?.value,
            liquid: document.body.classList.contains('liquid-glass'),
            bgPreset: localStorage.getItem('vex_bg') || '',
            bgUrl: localStorage.getItem('vex_bgUrl') || '',
        };
        try { localStorage.setItem('vex_theme', JSON.stringify(data)); } catch (_) {}
        try { fetch('/api/theme', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).catch(()=>{}); } catch(_){}
    }, 400);
}
function saveTheme(){
    const data = {
        accent: $('#colorAccent')?.value,
        accent2: $('#colorAccent2')?.value,
        bg: $('#colorBg')?.value,
        panel: $('#colorPanel')?.value,
        blur: $('#blurRange')?.value,
        opacity: $('#opacityRange')?.value,
        indicator: $('#colorIndicator')?.value,
        liquid: document.body.classList.contains('liquid-glass'),
        adaptive: document.body.classList.contains('adaptive'),
        bgPreset: localStorage.getItem('vex_bg') || '',
        bgUrl: localStorage.getItem('vex_bgUrl') || '',
    };
    localStorage.setItem('vex_theme', JSON.stringify(data));
    try { localStorage.setItem('vex_adaptive', data.adaptive ? '1' : '0'); } catch(_){}
    fetch('/api/theme', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).catch(()=>{});
    toast('Tema salvato ✦');
}
function resetTheme(){
    localStorage.removeItem('vex_theme');
    localStorage.removeItem('vex_liquid');
    localStorage.removeItem('vex_bg');
    localStorage.removeItem('vex_adaptive');
    document.body.classList.remove('liquid-glass');
    document.body.classList.remove('adaptive');
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundAttachment = '';
    const t = $('#liquidToggle'); if (t) t.checked = false;
    const at = $('#adaptiveToggle'); if(at) at.checked=false;
    document.documentElement.style.removeProperty('--adaptive-text');
    document.documentElement.style.removeProperty('--adaptive-muted');
    $('#colorAccent').value='#7c5cff'; $('#colorAccent2').value='#ff4ecd'; $('#colorBg').value='#08080c'; $('#colorPanel').value='#15151d'; $('#colorIndicator').value='#ff4ecd';
    $('#blurRange').value=22; $('#opacityRange').value=55;
    $$('.bg-preset').forEach(p => p.classList.remove('active'));
    updateTheme();
    toast('Tema resettato');
}
// ── Sfondi preset + custom ────────────────────────────────────────────
const BG_PRESETS = {
    default: '',
    vibrant: 'radial-gradient(ellipse at 20% 20%, #7c5cff 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #ff4ecd 0%, transparent 50%), linear-gradient(135deg,#1a0b2e 0%,#2d1b4e 100%)',
    sunset: 'linear-gradient(135deg,#ff6b6b 0%,#feca57 50%,#ff9ff3 100%)',
    ocean: 'linear-gradient(135deg,#667eea 0%,#764ba2 50%,#00d2ff 100%)',
    forest: 'linear-gradient(135deg,#0f9b0f 0%,#3a7d44 50%,#2d6a4f 100%)',
    midnight: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
    aurora: 'radial-gradient(ellipse at 20% 50%, #00f260 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #0575e6 0%, transparent 50%), linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
    neon: 'linear-gradient(135deg,#fc00ff 0%,#00dbde 50%,#ff8a00 100%)',
};
function setPresetBg(key){
    $$('.bg-preset').forEach(p => p.classList.toggle('active', p.dataset.bg === key));
    if (key === 'default') { clearCustomBg(); return; }
    const bg = BG_PRESETS[key];
    if (!bg) return;
    document.body.style.backgroundImage = bg;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    try { localStorage.setItem('vex_bg', JSON.stringify({ type:'preset', key })); } catch(_){}
    toast('Sfondo ' + key + ' applicato');
}
function handleBgUpload(input){
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 20*1024*1024) return toast('Max 50MB','err');
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        document.body.style.backgroundImage = `url("${dataUrl}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        try { localStorage.setItem('vex_bg', JSON.stringify({ type:'custom', dataUrl })); } catch(_){ toast('Immagine troppo grande per localStorage','err'); }
        toast('Sfondo caricato');
    };
    reader.readAsDataURL(file);
}
function setCustomBgUrl(url){
    url = String(url||'').trim();
    if (!url) return toast('URL vuoto','err');
    document.body.style.backgroundImage = `url("${url}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    try { localStorage.setItem('vex_bg', JSON.stringify({ type:'url', url })); } catch(_){}
    toast('Sfondo URL applicato');
}
function clearCustomBg(){
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundAttachment = '';
    $$('.bg-preset').forEach(p => p.classList.remove('active'));
    const def = document.querySelector('.bg-preset[data-bg="default"]');
    if (def) def.classList.add('active');
    try { localStorage.removeItem('vex_bg'); } catch(_){}
    updateTheme();
    toast('Sfondo rimosso');
}
function loadBg(){
    try{
        const raw = localStorage.getItem('vex_bg');
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.type === 'preset' && BG_PRESETS[d.key]) setPresetBg(d.key);
        else if (d.type === 'custom' && d.dataUrl) {
            document.body.style.backgroundImage = `url("${d.dataUrl}")`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else if (d.type === 'url' && d.url) {
            document.body.style.backgroundImage = `url("${d.url}")`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
    }catch(_){}
}
setTimeout(loadBg, 150);
async function doUpdate(){
    if (!(await customConfirm('Aggiornare bot e dashboard dal repo e riavviare?', 'Aggiorna'))) return;
    const btn = $('#updateBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Aggiorno...'; }
    try{
        const r = await fetchJSON('/api/update', { method: 'POST' });
        toast('Aggiornamento: ' + (r.message || 'ok') + ' — riavvio in corso...', 'ok');
        if (btn) btn.textContent = '✅ Fatto — riavvio...';
        setTimeout(() => location.reload(), 8000);
    }catch(e){
        toast('Aggiorna: ' + e.message, 'err');
        if (btn) { btn.disabled = false; btn.textContent = '↻ Aggiorna'; }
    }
}
// ── Report ────────────────────────────────────────────────────────────
function formatPhone(jid){
    // Mai mostrare @lid — converti in numero vero se possibile
    if (!jid) return '';
    const s = String(jid);
    if (s.endsWith('@lid')) {
        // Cerca in cache globale users per mapping lid->phone
        const u = (typeof usersGlobalCache !== 'undefined' ? usersGlobalCache.find(x=>x.jid===s) : null);
        if (u && u.phoneNumber) return '+' + String(u.phoneNumber).replace(/[^0-9]/g,'');
        // Fallback: mostra solo numero senza @lid ma senza badge lid
        return '+' + s.split('@')[0].replace(/[^0-9]/g,'');
    }
    if (s.includes('@')) return '+' + s.split('@')[0].replace(/[^0-9]/g,'');
    return '+' + s.replace(/[^0-9]/g,'');
}
async function sendReports(){
    const numEl = $('#reportNumber'), reasonEl=$('#reportReason'), countEl=$('#reportCount'), statusEl=$('#reportStatus'), statsEl=$('#reportStats');
    const raw = String(numEl?.value||'').replace(/[^0-9]/g,'');
    const reason = reasonEl?.value || 'spam';
    const count = Math.min(50, Math.max(1, Number(countEl?.value||10)));
    if (!raw || raw.length < 7) return toast('Numero non valido','err');
    const jid = raw + '@s.whatsapp.net';
    if (statusEl){ statusEl.classList.remove('hidden'); statusEl.innerHTML = `<div style="display:flex;align-items:center;gap:10px"><span style="width:18px;height:18px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite"></span> Invio ${count} segnalazioni a ${esc(formatPhone(jid))}…</div>`; }
    try{
        const r = await fetchJSON('/api/report', { method:'POST', body: JSON.stringify(withAntiBotBody({ jid, reason, count })) });
        if (statusEl) statusEl.innerHTML = `<div style="color:var(--green)">✅ Inviate ${r.sent||count} segnalazioni a ${esc(formatPhone(jid))} (${esc(reason)})</div><div class="muted" style="margin-top:4px">${esc(r.message||'Fatto')}</div>`;
        if (statsEl) statsEl.textContent = `Ultimo: ${formatPhone(jid)} — ${r.sent||count} report (${reason}) — ${new Date().toLocaleTimeString()}`;
        toast(`Segnalazioni inviate: ${r.sent||count} ⚑`);
        loadReportHistory();
    }catch(e){
        if (statusEl) statusEl.innerHTML = `<div style="color:var(--red)">❌ Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
async function loadReportHistory(){
    const el=$('#reportHistory'), statsEl=$('#reportStats');
    if (!el) return;
    el.innerHTML='<div class="muted" style="padding:8px">Caricamento…</div>';
    try{
        const { history } = await fetchJSON('/api/report/history');
        if (!history || !history.length){ el.innerHTML='<div class="muted" style="padding:8px">Nessuna segnalazione yet</div>'; if(statsEl) statsEl.textContent='Nessuno storico'; return; }
        el.innerHTML = history.slice().reverse().slice(0,30).map(h=>`
            <div class="row-item">
                <div class="left"><div class="title">${esc(formatPhone(h.jid))} <span class="badge">${esc(h.reason||'spam')}</span></div><div class="sub">×${h.count} · ${esc(h.by||'dashboard')} · ${formatDate(h.at)}</div></div>
                <div class="right"><span class="badge on">${h.sent||h.count} inviate</span></div>
            </div>
        `).join('');
        if(statsEl) statsEl.textContent = `${history.length} segnalazioni totali`;
    }catch(e){ el.innerHTML=`<div class="muted">Errore: ${esc(e.message)}</div>`; }
}
async function clearReportHistory(){
    if (!(await customConfirm('Pulire storico segnalazioni?', 'Pulisci'))) return;
    try{ await fetchJSON('/api/report/history', { method:'DELETE' }); toast('Storico pulito'); loadReportHistory(); }catch(e){ toast(e.message,'err'); }
}
function toggleReportSelect(){
    const el=$('#reportReasonSelect');
    if(!el) return;
    el.classList.toggle('open');
}
function selectReportReason(val, label){
    const inp=$('#reportReason'), lab=$('#reportReasonLabel'), sel=$('#reportReasonSelect');
    if(inp) inp.value=val;
    if(lab) lab.textContent=label;
    if(sel){
        sel.classList.remove('open');
        sel.querySelectorAll('.custom-select-option').forEach(o=> o.classList.toggle('active', o.dataset.value===val));
    }
}
document.addEventListener('click', (e)=>{
    const sel=$('#reportReasonSelect');
    if(!sel) return;
    if(!sel.contains(e.target)) sel.classList.remove('open');
});
async function loadTheme(){
    try{
        // Prova server prima (cross-device), fallback a localStorage
        let d=null;
        try {
            const r=await fetch('/api/theme').then(x=>x.json()).catch(()=>null);
            if(r && r.ok && r.theme) d=r.theme;
        } catch(_){}
        if(!d){
            const raw = localStorage.getItem('vex_theme');
            if (raw) d=JSON.parse(raw);
        }
        if (d) {
            if (d.accent) $('#colorAccent').value = d.accent;
            if (d.accent2) $('#colorAccent2').value = d.accent2;
            if (d.bg) $('#colorBg').value = d.bg;
            if (d.panel) $('#colorPanel').value = d.panel;
            if (d.blur) $('#blurRange').value = d.blur;
            if (d.opacity) $('#opacityRange').value = d.opacity;
            if (d.indicator) $('#colorIndicator').value = d.indicator;
            if (d.liquid) {
                document.body.classList.add('liquid-glass');
                const t = $('#liquidToggle'); if (t) t.checked = true;
            }
            if (d.adaptive) {
                document.body.classList.add('adaptive');
                const at = $('#adaptiveToggle'); if(at) at.checked = true;
                toggleAdaptive(true);
            }
            if (d.bgPreset) try{ setPresetBg(d.bgPreset); }catch(_){}
            if (d.bgUrl) try{ setCustomBgUrl(d.bgUrl); }catch(_){}
            if (d.bgData) try{ document.body.style.backgroundImage=`url(${d.bgData})`; document.body.style.backgroundSize='cover'; document.body.style.backgroundAttachment='fixed'; }catch(_){}
        }
        try { if (localStorage.getItem('vex_adaptive')==='1'){ document.body.classList.add('adaptive'); const at=$('#adaptiveToggle'); if(at) at.checked=true; toggleAdaptive(true); } } catch(_){}
        // Fallback per liquid salvato separatamente
        try { if (localStorage.getItem('vex_liquid') === '1') { document.body.classList.add('liquid-glass'); const t=$('#liquidToggle'); if(t) t.checked=true; } } catch(_){}
        updateTheme();
    }catch(_){}
}
// Carica tema salvato all'avvio
setTimeout(loadTheme, 100);

// ── Tilt 3D + glare — fluido, spring, non buggato ─────────────────────
function initTilt(){
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const applyTilt = (el) => {
        if (el.dataset.tiltInit) return;
        el.dataset.tiltInit = '1';
        el.classList.add('tilt');
        el.style.position = 'relative';
        el.style.overflow = 'hidden';
        // Crea glare se non c'è
        let glare = el.querySelector('.tilt-glare');
        if (!glare) {
            glare = document.createElement('div');
            glare.className = 'tilt-glare';
            glare.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .2s;background:radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.10), transparent 40%);';
            el.appendChild(glare);
        }
        let raf = null;
        let targetRx = 0, targetRy = 0, curRx = 0, curRy = 0;

        const animate = () => {
            curRx += (targetRx - curRx) * 0.08;
            curRy += (targetRy - curRy) * 0.08;
            const still = Math.abs(targetRx - curRx) < 0.02 && Math.abs(targetRy - curRy) < 0.02;
            if (!still) raf = requestAnimationFrame(animate);
            else { curRx = targetRx; curRy = targetRy; raf = null; }
            el.style.transform = `perspective(1000px) rotateX(${curRx}deg) rotateY(${curRy}deg) scale3d(1.01,1.01,1.01)`;
        };

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            // Max 7°, più morbido
            targetRx = Math.max(-7, Math.min(7, (y - cy) / 22));
            targetRy = Math.max(-7, Math.min(7, (cx - x) / 22));
            glare.style.setProperty('--mx', (x / rect.width * 100) + '%');
            glare.style.setProperty('--my', (y / rect.height * 100) + '%');
            glare.style.opacity = '1';
            if (!raf) raf = requestAnimationFrame(animate);
        });
        el.addEventListener('mouseleave', () => {
            targetRx = 0; targetRy = 0;
            glare.style.opacity = '0';
            if (!raf) raf = requestAnimationFrame(animate);
            // Reset completo dopo animazione
            setTimeout(() => {
                curRx = 0; curRy = 0;
                el.style.transform = '';
                if (raf) { cancelAnimationFrame(raf); raf = null; }
            }, 300);
        });
        el.style.willChange = 'transform';
    };

    // Solo card e row-item (non panel/btn che sono grandi o hanno già hover)
    document.querySelectorAll('.card, .row-item').forEach(applyTilt);
    const obs = new MutationObserver(() => {
        document.querySelectorAll('.card:not([data-tilt-init]), .row-item:not([data-tilt-init])').forEach(applyTilt);
    });
    obs.observe(document.body, { childList: true, subtree: true });
}
setTimeout(initTilt, 600);

// ── Live update DB — polling 5s + SSE /api/events (WebSocket-like, single message no glitch) ──
let _lastStats = null;
let _pollTimer = null;
let _sse = null;
let _hpTime = Date.now(); // honeypot timestamp (anti-bot: <700ms = bot)

function startPolling5s(){
    if (_pollTimer) clearInterval(_pollTimer);
    (async () => {
        try{ const { stats } = await fetchJSON('/api/overview'); _lastStats = JSON.stringify(stats); syncPresentStats(await fetchJSON('/api/overview').then(d=>d).catch(()=>({stats,bot:{},system:{}}))); }catch(_){}
    })();
    _pollTimer = setInterval(async () => {
        try{
            const payload = await fetchJSON('/api/overview');
            const cur = JSON.stringify(payload.stats);
            // update live dot
            const dot=$('#liveDot'); if(dot) dot.classList.remove('off');
            // single-message check: only re-render if changed to avoid glitches
            if (_lastStats !== cur) {
                // update overview cards silently if on overview/presentazione (no full flicker)
                syncPresentStats(payload);
                const pg = payload.stats.groups, pu = payload.stats.users, pp = payload.stats.phrases, po = payload.stats.owners;
                const sg=$('#statGroups'), su=$('#statUsers'), sp=$('#statPhrases'), so=$('#statOwners');
                if (sg) sg.textContent = pg;
                if (su) su.textContent = pu;
                if (sp) sp.textContent = pp;
                if (so) so.textContent = po;
                const active = document.querySelector('.page.active')?.id;
                if (active === 'page-overview') fetchOverview();
                else if (active === 'page-presentazione') { /* already synced */ }
                else if (active === 'page-groups') fetchGroups();
                else if (active === 'page-users') loadUsersGlobal();
                console.log('[live 5s] update', payload.stats);
            }
            _lastStats = cur;
        }catch(e){
            const dot=$('#liveDot'); if(dot) dot.classList.add('off');
        }
    }, 5000);
}
function startSSE(){
    try{
        if (!window.EventSource) return;
        if (_sse) { try{ _sse.close(); }catch(_){} }
        _sse = new EventSource('/api/events');
        _sse.addEventListener('overview', (e)=>{
            try{
                const payload = JSON.parse(e.data);
                if (!payload || !payload.stats) return;
                const cur = JSON.stringify(payload.stats);
                if (_lastStats === cur) return;
                _lastStats = cur;
                syncPresentStats(payload);
                // single-message, no glitch: just update counters softly
                const sg=$('#statGroups'), su=$('#statUsers'), sp=$('#statPhrases'), so=$('#statOwners');
                if (sg) sg.textContent = payload.stats.groups;
                if (su) su.textContent = payload.stats.users;
                if (sp) sp.textContent = payload.stats.phrases;
                if (so) so.textContent = payload.stats.owners;
                const dot=$('#liveDot'); if(dot) dot.classList.remove('off');
            }catch(_){}
        });
        _sse.onerror = () => {
            const dot=$('#liveDot'); if(dot) dot.classList.add('off');
            // auto-retry in 6s (EventSource does itself, but we handle polling fallback)
            setTimeout(()=>{ try{ _sse.close(); }catch(_){}; startSSE(); }, 6000);
        };
        _sse.onopen = () => { const dot=$('#liveDot'); if(dot) dot.classList.remove('off'); };
    }catch(_){}
}
// Anti-bot helpers: inject honeypot + turnstile placeholder token for writes
function withAntiBotBody(body){
    const out = { ...(body||{}) };
    // honeypot fields stay empty (if filled, server 403)
    out.website = '';
    out._honey = '';
    out._hp_time = _hpTime;
    // Turnstile placeholder: in produzione inserire token reale da Cloudflare widget
    // per ora inviamo placeholder per far passare il check server (token length check)
    out._turnstile = 'placeholder-token-dashboard';
    return out;
}
async function verifyTurnstilePlaceholder(){
    try{
        const r = await fetchJSON('/api/turnstile-verify', { method:'POST', body: JSON.stringify({ token: 'placeholder-token-dashboard-'+Date.now() }) });
        return r.ok;
    }catch(e){ return false; }
}
// attach honeypot time refresh on user interaction (real user will have >700ms)
['mousemove','keydown','touchstart'].forEach(ev=> window.addEventListener(ev, ()=>{ _hpTime = Date.now() - 1000; }, {once:true}));

startPolling5s();
startSSE();

// ── Init ────────────────────────────────────────────────────────────────
fetchOverview();
fetchPresentazione();
// Fix per utenti: se si apre pagina utenti, assicura che gruppi siano caricati
