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
const fetchJSON = async (url, opts = {}) => {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
};
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

// ── Navigation ──────────────────────────────────────────────────────────
function navigate(page){
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    const titles = {
        overview: ['Overview','Stato del bot e sistema'],
        groups: ['Gruppi','Gestisci impostazioni per gruppo'],
        users: ['Utenti','Economia e moderazione per gruppo'],
        phrases: ['Frasi','Modifica i file phrases/*.txt'],
        files: ['File','Esplora e modifica le directory del bot'],
        owners: ['Owner','Gestisci gli owner del bot'],
        config: ['Config','Impostazioni e file grezzi'],
        logs: ['Logs','Ultime righe di logs/bot.log'],
    };
    const [t, s] = titles[page] || [page, ''];
    const pt = $('#pageTitle'), ps = $('#pageSub');
    if (pt) pt.textContent = t;
    if (ps) ps.textContent = s;
    if (page === 'overview') fetchOverview();
    if (page === 'groups') fetchGroups();
    if (page === 'users') initUsersPage();
    if (page === 'phrases') fetchPhrases();
    if (page === 'files') loadFiles('');
    if (page === 'owners') fetchOwners();
    if (page === 'config') loadConfig();
    if (page === 'logs') loadLogs();
}
$$('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));
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
    }catch(e){ toast('Overview: '+e.message,'err'); }
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
    if (photoUrl) {
        const cls = size ? `avatar ${size}` : 'avatar';
        const init = initialsFrom(jid, name);
        return `<div class="${cls}" style="overflow:hidden"><img src="${esc(photoUrl)}" alt="${esc(name||jid)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'"><span class="avatar-fallback" style="display:none;place-items:center;width:100%;height:100%;font-weight:800;background:${avatarColor(jid||name||'x')}">${esc(init)}</span></div>`;
    }
    return avatarHTML(jid, name, size);
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
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:14px;text-align:center">✦ Nessun gruppo trovato per “${esc(q)}”</div>'; return; }
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

async function openGroup(jid){
    currentGroupJid = jid;
    const detail = $('#groupDetail');
    const jidEl = $('#detailJid');
    if (jidEl) jidEl.textContent = jid;
    if (detail) detail.classList.remove('hidden');
    switchGroupTab('welcome');
    if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (!confirm('Resettare welcome/goodbye a default (rimuove custom)?')) return;
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
    if (!confirm(`Eliminare tutti i dati di ${currentGroupJid}?\nVerranno rimossi da database.json, welcome.json e antilink.json.`)) return;
    try{
        await fetchJSON(`/api/groups/${encodeURIComponent(currentGroupJid)}`, { method: 'DELETE' });
        toast('Gruppo eliminato');
        const d = $('#groupDetail'); if (d) d.classList.add('hidden');
        currentGroupJid = null;
        fetchGroups();
    }catch(e){ toast(e.message,'err'); }
}

// ── Users ───────────────────────────────────────────────────────────────
async function initUsersPage(){
    if (!groupsCache.length) {
        await fetchGroups().catch(()=>{});
    }
    // Se ancora vuoto, mostra hint
    const sel = $('#userGroupSelect');
    if (sel && sel.options.length <= 1 && groupsCache.length) {
        sel.innerHTML = '<option value="">— Seleziona gruppo —</option>' + groupsCache.map(g => `<option value="${esc(g.jid)}">${esc(g.jid)} — ${g.users} utenti</option>`).join('');
    }
}
async function loadUsers(){
    const gid = $('#userGroupSelect')?.value;
    const listEl = $('#usersList');
    const countEl = $('#userCount');
    if (!gid) { if(listEl) listEl.innerHTML = '<div class="muted">Seleziona un gruppo</div>'; if(countEl) countEl.textContent=''; return; }
    if (listEl) listEl.innerHTML = '<div class="muted" style="padding:12px">◇ Caricamento utenti...</div>';
    try{
        const { users } = await fetchJSON(`/api/users/${encodeURIComponent(gid)}`);
        if (countEl) countEl.textContent = `${users.length} utenti`;
        loadUsers._cache = users;
        loadUsers._gid = gid;
        renderUsers(users);
    }catch(e){
        if (listEl) listEl.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
function renderUsers(list){
    const q = ($('#userSearch')?.value || '').toLowerCase();
    const filtered = q ? list.filter(u => (u?.jid && u.jid.toLowerCase().includes(q)) || String(u?.nickname||'').toLowerCase().includes(q) || String(u?.name||'').toLowerCase().includes(q) || String(u?.bio||'').toLowerCase().includes(q)) : list;
    const el = $('#usersList');
    if (!el) return;
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun utente</div>'; return; }
    el.innerHTML = filtered.filter(u => u && typeof u === 'object').map(u => {
        const displayName = u?.name || u?.nickname || '';
        const num = String(u?.jid || '').split('@')[0];
        return `
        <div class="row-item with-avatar">
            ${pfpHTML(u?.jid, displayName || u?.jid, u?.pfpUrl)}
            <div class="left">
                <div class="title">${displayName ? `<b>${esc(displayName)}</b> <span class="muted mono" style="font-size:11px">${esc(num)}</span>` : `<span class="mono">${esc(num)}</span>`} ${u?.nickname && u.nickname !== displayName ? '— <i>'+esc(u.nickname)+'</i>' : ''}</div>
                <div class="sub">💰 ${u?.money ?? 0}€ · ⚠️ ${u?.warnings ?? 0} · 💬 ${u?.msgCount ?? 0} ${u?.bio ? '· 📝 '+esc(u.bio.slice(0,30)) : ''} ${u?.isMuted ? '· 🔇 mutato' : ''} ${u?.spouse ? '· 💍 '+esc(String(u.spouse).split('@')[0]) : ''}</div>
            </div>
            <div class="right">
                <button class="btn btn-sm btn-ghost" onclick="editUserPrompt('${esc(u?.jid || '')}')">✎</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${esc(u?.jid || '')}')">🗑</button>
            </div>
        </div>
    `}).join('');
}
function filterUsers(){
    if (loadUsers._cache) renderUsers(loadUsers._cache);
}
async function editUserPrompt(jid){
    const gid = loadUsers._gid;
    if (!gid) return;
    const field = prompt('Campo da modificare? (money, warnings, isMuted, msgCount, bio, nickname)\nEsempio: money');
    if (!field) return;
    if (!['money','warnings','isMuted','msgCount','bio','nickname'].includes(field)) return toast('Campo non valido','err');
    const valRaw = prompt(`Nuovo valore per ${field}:`);
    if (valRaw === null) return;
    let val = valRaw;
    if (field === 'money' || field === 'warnings' || field === 'msgCount') val = Number(valRaw);
    if (field === 'isMuted') val = valRaw.toLowerCase() === 'true' || valRaw === '1';
    try{
        await fetchJSON(`/api/users/${encodeURIComponent(gid)}/${encodeURIComponent(jid)}`, {
            method: 'PUT',
            body: JSON.stringify({ [field]: val })
        });
        toast('Utente aggiornato');
        loadUsers();
        if (currentGroupJid === gid) openGroup(gid);
    }catch(e){ toast(e.message,'err'); }
}
async function deleteUser(jid){
    const gid = loadUsers._gid;
    if (!gid) return;
    if (!confirm(`Eliminare ${jid} da ${gid}?`)) return;
    try{
        await fetchJSON(`/api/users/${encodeURIComponent(gid)}/${encodeURIComponent(jid)}`, { method: 'DELETE' });
        toast('Utente eliminato');
        loadUsers();
        if (currentGroupJid === gid) openGroup(gid);
    }catch(e){ toast(e.message,'err'); }
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
    if (!confirm(`Rimuovere frase #${idx+1}?`)) return;
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
function editPhraseLine(idx){
    const cur = currentPhraseLines[idx];
    const next = prompt(`Modifica frase #${idx+1}:`, cur);
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
    const key = prompt('Nome nuovo file (solo a-z0-9_-):');
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
    if (content.length > 500000) return toast('File troppo grande (max 500KB)','err');
    try{
        await fetchJSON('/api/files/write', { method:'PUT', body: JSON.stringify({ path: currentFilePath, content }) });
        toast('File salvato ✦');
        loadFiles(currentFilePath.includes('/') ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : '');
    }catch(e){ toast(e.message,'err'); }
}
async function deleteFile(rel, isDir){
    if (!confirm(`Eliminare ${isDir?'cartella e tutto il contenuto':'file'} "${rel}"?`)) return;
    try{
        await fetchJSON(`/api/files?path=${encodeURIComponent(rel)}`, { method: 'DELETE' });
        toast(isDir ? 'Cartella eliminata' : 'File eliminato');
        const parent = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : '';
        loadFiles(parent);
        if (currentFilePath === rel) closeFileEditor();
    }catch(e){ toast(e.message,'err'); }
}
async function createFolderPrompt(){
    const name = prompt('Nome nuova cartella:');
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
async function createFilePrompt(){
    const name = prompt('Nome nuovo file (es. note.txt):');
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

// ── Owners ──────────────────────────────────────────────────────────────
async function fetchOwners(){
    const listEl = $('#ownersList');
    if (listEl) listEl.innerHTML = '<div class="muted">Caricamento...</div>';
    try{
        const { owners } = await fetchJSON('/api/owners');
        const el = $('#ownersList');
        if (!el) return;
        if (!owners || !owners.length) el.innerHTML = '<div class="muted">Nessun owner — aggiungine uno</div>';
        else el.innerHTML = owners.map((o, i) => {
            const disp = esc(o.jid || o.number || JSON.stringify(o));
            const num = esc(String(o.number || o.jid || '').replace(/[^0-9]/g,'').slice(-12));
            return `<div class="row-item with-avatar">
                ${avatarHTML(o.jid || o.number, disp)}
                <div class="left"><div class="title mono">${disp}</div><div class="sub">${num}</div></div>
                <div class="right"><button class="btn btn-sm btn-danger" onclick="removeOwner('${esc(String(o.jid||o.number||''))}')">🗑 Rimuovi</button></div>
            </div>`;
        }).join('');
    }catch(e){
        const el=$('#ownersList'); if(el) el.innerHTML = `<div class="muted">Errore: ${esc(e.message)}</div>`;
        toast(e.message,'err');
    }
}
async function addOwner(){
    const input = $('#newOwnerInput');
    const val = input?.value.trim() || '';
    if (!val) return toast('Inserisci un numero','err');
    try{
        await fetchJSON('/api/owners', { method: 'POST', body: JSON.stringify({ action:'add', number: val }) });
        if (input) input.value='';
        toast('Owner aggiunto ★');
        fetchOwners(); fetchOverview();
    }catch(e){ toast(e.message,'err'); }
}
async function removeOwner(jid){
    if (!confirm(`Rimuovere owner ${jid}?`)) return;
    try{
        await fetchJSON('/api/owners', { method: 'POST', body: JSON.stringify({ action:'remove', jid }) });
        toast('Owner rimosso');
        fetchOwners(); fetchOverview();
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
function updateTheme(){
    const accent = $('#colorAccent')?.value || '#7c5cff';
    const accent2 = $('#colorAccent2')?.value || '#ff4ecd';
    const bg = $('#colorBg')?.value || '#08080c';
    const panel = $('#colorPanel')?.value || '#15151d';
    const blur = $('#blurRange')?.value || 20;
    const opacity = $('#opacityRange')?.value || 55;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent2', accent2);
    root.style.setProperty('--accent-rgb', hexToRgb(accent));
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--panel', `rgba(${hexToRgb(panel)},${opacity/100})`);
    root.style.setProperty('--blur', blur + 'px');
    const b = $('#blurVal'), o = $('#opacityVal');
    if (b) b.textContent = blur + 'px';
    if (o) o.textContent = opacity + '%';
    const pa = $('#previewAccent'), pa2 = $('#previewAccent2'), pb = $('#previewBg'), pp = $('#previewPanel');
    if (pa) pa.style.background = accent;
    if (pa2) pa2.style.background = accent2;
    if (pb) pb.style.background = bg;
    if (pp) pp.style.background = panel;
    document.body.style.background = `radial-gradient(1200px 600px at 10% -10%, rgba(${hexToRgb(accent)},0.15), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(${hexToRgb(accent2)},0.10), transparent 60%), linear-gradient(180deg, ${bg} 0%, #08080c 100%)`;
}
function saveTheme(){
    const data = {
        accent: $('#colorAccent')?.value,
        accent2: $('#colorAccent2')?.value,
        bg: $('#colorBg')?.value,
        panel: $('#colorPanel')?.value,
        blur: $('#blurRange')?.value,
        opacity: $('#opacityRange')?.value,
    };
    localStorage.setItem('vex_theme', JSON.stringify(data));
    toast('Tema salvato ✦');
}
function resetTheme(){
    localStorage.removeItem('vex_theme');
    $('#colorAccent').value='#7c5cff'; $('#colorAccent2').value='#ff4ecd'; $('#colorBg').value='#08080c'; $('#colorPanel').value='#15151d';
    $('#blurRange').value=20; $('#opacityRange').value=55;
    updateTheme();
    toast('Tema resettato');
}
function loadTheme(){
    try{
        const raw = localStorage.getItem('vex_theme');
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.accent) $('#colorAccent').value = d.accent;
        if (d.accent2) $('#colorAccent2').value = d.accent2;
        if (d.bg) $('#colorBg').value = d.bg;
        if (d.panel) $('#colorPanel').value = d.panel;
        if (d.blur) $('#blurRange').value = d.blur;
        if (d.opacity) $('#opacityRange').value = d.opacity;
        updateTheme();
    }catch(_){}
}
// Carica tema salvato all'avvio
setTimeout(loadTheme, 100);

// ── Init ────────────────────────────────────────────────────────────────
fetchOverview();
// Fix per utenti: se si apre pagina utenti, assicura che gruppi siano caricati
