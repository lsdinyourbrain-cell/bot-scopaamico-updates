'use strict';

// ── State ───────────────────────────────────────────────────────────────
let currentGroupJid = null;
let currentPhraseKey = null;
let currentPhraseLines = [];
let groupsCache = [];
let phrasesCache = [];

// ── Helpers ─────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const toast = (msg, type = 'ok') => {
    const el = $('#toast');
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

// ── Navigation ──────────────────────────────────────────────────────────
function navigate(page){
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $$('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    const titles = {
        overview: ['Overview','Stato del bot e sistema'],
        groups: ['Gruppi','Gestisci impostazioni per gruppo'],
        users: ['Utenti','Economia e moderazione per gruppo'],
        phrases: ['Frasi','Modifica i file phrases/*.txt'],
        owners: ['Owner','Gestisci gli owner del bot'],
        config: ['Config','Impostazioni e file grezzi'],
        logs: ['Logs','Ultime righe di logs/bot.log'],
    };
    const [t, s] = titles[page] || [page, ''];
    $('#pageTitle').textContent = t;
    $('#pageSub').textContent = s;
    // Load on demand
    if (page === 'overview') fetchOverview();
    if (page === 'groups') fetchGroups();
    if (page === 'users') initUsersPage();
    if (page === 'phrases') fetchPhrases();
    if (page === 'owners') fetchOwners();
    if (page === 'config') loadConfig();
    if (page === 'logs') loadLogs();
}
$$('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));
$('#refreshBtn').addEventListener('click', () => {
    const active = $('.page.active')?.id?.replace('page-','') || 'overview';
    navigate(active);
});
setInterval(() => { const el=$('#topTime'); if(el) el.textContent = new Date().toLocaleTimeString('it-IT'); }, 1000);
$('#topTime').textContent = new Date().toLocaleTimeString('it-IT');

// Live dot
setInterval(async () => {
    try { await fetch('/api/overview'); $('#liveDot').classList.remove('off'); } catch { $('#liveDot').classList.add('off'); }
}, 10000);

// ── Overview ────────────────────────────────────────────────────────────
async function fetchOverview(){
    try{
        const { bot, stats, system } = await fetchJSON('/api/overview');
        $('#statGroups').textContent = stats.groups;
        $('#statUsers').textContent = stats.users;
        $('#statPhrases').textContent = stats.phrases;
        $('#statOwners').textContent = stats.owners;
        $('#botInfo').innerHTML = `
            ✦ Nome: <b>${esc(bot.name)}</b><br>
            ✦ Versione: <b>${esc(bot.version)}</b><br>
            ✦ Uptime: <b>${esc(bot.uptime)}</b><br>
            ✦ PID: <b>${bot.pid}</b><br>
            ✦ Node: <b>${esc(bot.node)}</b><br>
            ✦ Piattaforma: <b>${esc(bot.platform)}</b>`;
        $('#sysInfo').innerHTML = `
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
    try{
        const { groups } = await fetchJSON('/api/groups');
        groupsCache = groups;
        $('#groupCount').textContent = `${groups.length} gruppi`;
        renderGroups(groups);
        // Popola anche select utenti
        const sel = $('#userGroupSelect');
        if (sel) {
            const cur = sel.value;
            sel.innerHTML = '<option value="">— Seleziona gruppo —</option>' + groups.map(g => `<option value="${esc(g.jid)}">${esc(g.jid)} — ${g.users} utenti</option>`).join('');
            if (cur) sel.value = cur;
        }
    }catch(e){ toast('Gruppi: '+e.message,'err'); }
}
function renderGroups(list){
    const q = ($('#groupSearch').value || '').toLowerCase();
    const filtered = q ? list.filter(g => g.jid.toLowerCase().includes(q)) : list;
    const el = $('#groupsList');
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun gruppo trovato</div>'; return; }
    el.innerHTML = filtered.map(g => `
        <div class="row-item" onclick="openGroup('${esc(g.jid)}')">
            <div class="left">
                <div class="title mono">${esc(g.jid)}</div>
                <div class="sub">${g.users} utenti · ${g.msgs} messaggi · ${g.hasAntilink ? '◆ antilink attivo' : '▫ antilink off'}</div>
            </div>
            <div class="right">
                <span class="badge ${g.welcome ? 'on' : 'off'}">${g.welcome ? 'welcome on' : 'welcome off'}</span>
                <span class="badge ${g.goodbye ? 'on' : 'off'}">${g.goodbye ? 'goodbye on' : 'goodbye off'}</span>
                <span class="badge">${g.users} ◇</span>
            </div>
        </div>
    `).join('');
}
function filterGroups(){ renderGroups(groupsCache); }

async function openGroup(jid){
    currentGroupJid = jid;
    $('#detailJid').textContent = jid;
    $('#groupDetail').classList.remove('hidden');
    switchGroupTab('welcome');
    // Scroll into view on mobile
    $('#groupDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    try{
        const { config, users } = await fetchJSON(`/api/groups/${encodeURIComponent(jid)}`);
        // Welcome tab
        $('#welcomeOn').checked = !!config.welcome.welcome;
        $('#goodbyeOn').checked = !!config.welcome.goodbye;
        $('#welcomeText').value = config.welcome.welcomeText || '';
        $('#goodbyeText').value = config.welcome.goodbyeText || '';
        // Antilink
        const grid = $('#antilinkGrid');
        const plats = ['whatsapp','instagram','telegram','tiktok','facebook','youtube','twitter','altri'];
        grid.innerHTML = plats.map(p => `
            <label class="check"><input type="checkbox" data-plat="${p}" ${config.antilink[p] ? 'checked' : ''}> ${p}</label>
        `).join('');
        $('#antilinkWl').value = (config.antilink.whitelist || []).join('\n');
        // Settings
        $('#linkOpen').checked = !!config.linkOpen;
        $('#modoadmin').checked = !!config.modoadmin;
        $('#antiflood').checked = config.antiflood !== false;
        // Users tab preview
        const ulist = $('#groupUsersList');
        if (!users.length) ulist.innerHTML = '<div class="muted">Nessun utente tracciato in questo gruppo</div>';
        else ulist.innerHTML = users.slice(0, 30).map(u => `
            <div class="row-item">
                <div class="left"><div class="title mono">${esc(u.jid)}</div><div class="sub">💰 ${u.money ?? 0}€ · ⚠️ ${u.warnings ?? 0} · 💬 ${u.msgCount ?? 0} · ${u.isMuted ? '🔇 mutato' : '✓ attivo'}</div></div>
                <div class="right"><span class="badge">${u.spouse ? '💍 ' + esc(String(u.spouse).split('@')[0]) : 'single'}</span></div>
            </div>
        `).join('') + (users.length > 30 ? `<div class="muted small" style="padding:8px">… e altri ${users.length - 30} utenti</div>` : '');
    }catch(e){ toast('Dettaglio gruppo: '+e.message,'err'); }
}
function switchGroupTab(name){
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `tab-${name}`));
}
async function saveWelcome(){
    if (!currentGroupJid) return;
    const welcome = $('#welcomeOn').checked;
    const goodbye = $('#goodbyeOn').checked;
    const welcomeText = $('#welcomeText').value.trim() || null;
    const goodbyeText = $('#goodbyeText').value.trim() || null;
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
    $('#welcomeText').value = ''; $('#goodbyeText').value = '';
    await saveWelcome();
}
function toggleAllAntilink(on){
    $$('#antilinkGrid input').forEach(cb => cb.checked = on);
}
async function saveAntilink(){
    if (!currentGroupJid) return;
    const body = {};
    $$('#antilinkGrid input').forEach(cb => body[cb.dataset.plat] = cb.checked);
    const wlRaw = $('#antilinkWl').value.trim();
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
    if (!currentGroupJid) return;
    const body = {
        _linkOpen: $('#linkOpen').checked,
        _modoadmin: $('#modoadmin').checked,
        _antiflood: $('#antiflood').checked,
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
        $('#groupDetail').classList.add('hidden');
        currentGroupJid = null;
        fetchGroups();
    }catch(e){ toast(e.message,'err'); }
}

// ── Users ───────────────────────────────────────────────────────────────
function initUsersPage(){
    if (!groupsCache.length) fetchGroups();
}
async function loadUsers(){
    const gid = $('#userGroupSelect').value;
    if (!gid) { $('#usersList').innerHTML = '<div class="muted">Seleziona un gruppo</div>'; $('#userCount').textContent=''; return; }
    try{
        const { users } = await fetchJSON(`/api/users/${encodeURIComponent(gid)}`);
        $('#userCount').textContent = `${users.length} utenti`;
        renderUsers(users);
        // store for filter
        loadUsers._cache = users;
        loadUsers._gid = gid;
    }catch(e){ toast(e.message,'err'); }
}
function renderUsers(list){
    const q = ($('#userSearch').value || '').toLowerCase();
    const filtered = q ? list.filter(u => u.jid.toLowerCase().includes(q) || String(u.nickname||'').toLowerCase().includes(q)) : list;
    const el = $('#usersList');
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun utente</div>'; return; }
    el.innerHTML = filtered.map(u => `
        <div class="row-item">
            <div class="left">
                <div class="title mono">${esc(u.jid)} ${u.nickname ? '— <b>'+esc(u.nickname)+'</b>' : ''}</div>
                <div class="sub">💰 ${u.money ?? 0}€ · ⚠️ ${u.warnings ?? 0} · 💬 ${u.msgCount ?? 0} · ${u.bio ? '📝 '+esc(u.bio.slice(0,40)) : ''} ${u.isMuted ? '· 🔇 mutato' : ''}</div>
            </div>
            <div class="right">
                <button class="btn btn-sm btn-ghost" onclick="editUserPrompt('${esc(u.jid)}')">✎</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${esc(u.jid)}')">🗑</button>
            </div>
        </div>
    `).join('');
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
    try{
        const { phrases } = await fetchJSON('/api/phrases');
        phrasesCache = phrases;
        $('#phraseCount').textContent = `${phrases.length} file`;
        renderPhrases(phrases);
    }catch(e){ toast(e.message,'err'); }
}
function renderPhrases(list){
    const q = ($('#phraseSearch').value || '').toLowerCase();
    const filtered = q ? list.filter(p => p.key.toLowerCase().includes(q)) : list;
    const el = $('#phrasesList');
    if (!filtered.length) { el.innerHTML = '<div class="muted" style="padding:12px">Nessun file</div>'; return; }
    el.innerHTML = filtered.map(p => `
        <div class="row-item" onclick="openPhrase('${esc(p.key)}')">
            <div class="left"><div class="title mono">${esc(p.key)}.txt</div><div class="sub">${p.count} frasi</div></div>
            <div class="right"><span class="badge">${p.count} ✧</span><span class="muted">→</span></div>
        </div>
    `).join('');
}
function filterPhrases(){ renderPhrases(phrasesCache); }

async function openPhrase(key){
    currentPhraseKey = key;
    $('#phraseKey').textContent = key + '.txt';
    $('#phraseEditor').classList.remove('hidden');
    try{
        const { phrases } = await fetchJSON(`/api/phrases/${encodeURIComponent(key)}`);
        currentPhraseLines = [...phrases];
        $('#phraseCount2').textContent = `(${phrases.length} frasi)`;
        renderPhraseLines();
        $('#phraseEditor').scrollIntoView({ behavior: 'smooth' });
    }catch(e){ toast(e.message,'err'); }
}
function renderPhraseLines(){
    const el = $('#phraseLines');
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
function closePhraseEditor(){ $('#phraseEditor').classList.add('hidden'); currentPhraseKey=null; }
async function addPhraseLine(){
    const input = $('#newPhraseInput');
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
        $('#phraseCount2').textContent = `(${currentPhraseLines.length} frasi)`;
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
        $('#phraseCount2').textContent = `(${currentPhraseLines.length} frasi)`;
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
    // Edit = remove + add at same position → per semplicità, salva tutto il file
    currentPhraseLines[idx] = trimmed;
    savePhrases();
}
async function savePhrases(){
    if (!currentPhraseKey) return;
    try{
        await fetchJSON(`/api/phrases/${encodeURIComponent(currentPhraseKey)}`, {
            method: 'PUT',
            body: JSON.stringify({ phrases: currentPhraseLines })
        });
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

// ── Owners ──────────────────────────────────────────────────────────────
async function fetchOwners(){
    try{
        const { owners } = await fetchJSON('/api/owners');
        const el = $('#ownersList');
        if (!owners.length) el.innerHTML = '<div class="muted">Nessun owner — aggiungine uno</div>';
        else el.innerHTML = owners.map((o, i) => {
            const disp = esc(o.jid || o.number || JSON.stringify(o));
            const num = esc(String(o.number || o.jid || '').replace(/[^0-9]/g,'').slice(-12));
            return `<div class="row-item"><div class="left"><div class="title mono">${disp}</div><div class="sub">${num}</div></div><div class="right"><button class="btn btn-sm btn-danger" onclick="removeOwner('${esc(String(o.jid||o.number||''))}')">🗑 Rimuovi</button></div></div>`;
        }).join('');
    }catch(e){ toast(e.message,'err'); }
}
async function addOwner(){
    const val = $('#newOwnerInput').value.trim();
    if (!val) return toast('Inserisci un numero','err');
    try{
        await fetchJSON('/api/owners', { method: 'POST', body: JSON.stringify({ action:'add', number: val }) });
        $('#newOwnerInput').value='';
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
    try{
        const { config, raw } = await fetchJSON('/api/config');
        $('#configView').textContent = raw || JSON.stringify(config, null, 2);
    }catch(e){ toast(e.message,'err'); }
}

// ── Logs ────────────────────────────────────────────────────────────────
async function loadLogs(){
    const lines = $('#logLines').value;
    try{
        const { lines: text, exists } = await fetchJSON(`/api/logs?lines=${lines}`);
        $('#logsView').textContent = exists ? (text || '(vuoto)') : 'File logs/bot.log non trovato';
        $('#logInfo').textContent = exists ? `${lines} righe` : 'non trovato';
    }catch(e){ toast(e.message,'err'); }
}

// ── Init ────────────────────────────────────────────────────────────────
fetchOverview();
