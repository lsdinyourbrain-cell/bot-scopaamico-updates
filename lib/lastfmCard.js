'use strict';
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function trunc(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function fmt(n){ return Number(n||0).toLocaleString('it-IT'); }
function fmtDate(ts){
  if(!ts) return '—';
  const d=new Date(ts*1000);
  if(isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric'});
}

async function renderCurCard(sharp, opts){
  const { coverBuffer, trackName, trackArtist, username, isNowPlaying, userPlaycount, globalPlaycount, listeners } = opts;
  const tName = trunc(trackName||'Sconosciuta', 22);
  const tArtist = trunc(trackArtist||'Sconosciuto', 20);
  const tUser = trunc(username||'', 18);
  const W=900, H=480, R=38;
  let bgBuf;
  try{
    const base = coverBuffer ? await sharp(coverBuffer).resize(960,560,{fit:'cover'}).blur(28).modulate({brightness:0.55, saturation:1.1}).png().toBuffer()
      : await sharp({create:{width:960,height:560,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
    const overlaySvg = `<svg width="960" height="560" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="560" fill="rgba(0,0,0,0.28)"/></svg>`;
    const overlay = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
    bgBuf = await sharp(base).composite([{input: overlay, blend:'over'}]).png().toBuffer();
  }catch(_){
    bgBuf = await sharp({create:{width:960,height:560,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
  }
  let coverImg = null;
  if(coverBuffer){
    try{
      coverImg = await sharp(coverBuffer).resize(220,220,{fit:'cover'}).png().toBuffer();
      const maskSvg = `<svg width="220" height="220"><rect x="0" y="0" width="220" height="220" rx="24" ry="24" fill="white"/></svg>`;
      const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
      coverImg = await sharp(coverImg).composite([{input: mask, blend:'dest-in'}]).png().toBuffer();
    }catch(_){ coverImg=null; }
  }
  const svg = `
<svg width="900" height="480" viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="900" height="480" rx="38" fill="rgba(18,18,22,0.82)" stroke="rgba(255,255,255,0.14)" stroke-width="1.4"/>
  <rect x="0.8" y="0.8" width="898.4" height="478.4" rx="37.2" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>
  <circle cx="328" cy="62" r="6" fill="${isNowPlaying ? '#1DB954' : '#888'}" />
  <text x="342" y="67" font-family="sans-serif" font-size="13" fill="${isNowPlaying ? '#1DB954' : '#aaa'}" font-weight="bold">${esc(isNowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO')}</text>
  <text x="328" y="112" font-family="sans-serif" font-size="42" fill="#FFFFFF" font-weight="bold">${esc(tName)}</text>
  <text x="328" y="148" font-family="sans-serif" font-size="20" fill="#FFFFFF" font-weight="bold">${esc(tArtist.toUpperCase())}</text>
  <g>
    <rect x="328" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)"/>
    <text x="348" y="236" font-family="sans-serif" font-size="11" fill="#FFFFFF" font-weight="bold">I TUOI ASCOLTI</text>
    <text x="348" y="268" font-family="sans-serif" font-size="26" fill="#FFFFFF" font-weight="bold">${esc(fmt(userPlaycount))}</text>
    <rect x="600" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)"/>
    <text x="620" y="236" font-family="sans-serif" font-size="11" fill="#FFFFFF" font-weight="bold">ASCOLTI GLOBALI</text>
    <text x="620" y="268" font-family="sans-serif" font-size="26" fill="#FFFFFF" font-weight="bold">${esc(fmt(globalPlaycount))}</text>
    <rect x="328" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)"/>
    <text x="348" y="332" font-family="sans-serif" font-size="11" fill="#FFFFFF" font-weight="bold">UTENTE</text>
    <text x="348" y="364" font-family="sans-serif" font-size="17" fill="#4da3ff" font-weight="bold">${esc('@'+tUser)}</text>
    <rect x="600" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.14)"/>
    <text x="620" y="332" font-family="sans-serif" font-size="11" fill="#FFFFFF" font-weight="bold">ASCOLTATORI</text>
    <text x="620" y="364" font-family="sans-serif" font-size="26" fill="#FFFFFF" font-weight="bold">${esc(fmt(listeners))}</text>
  </g>
</svg>`;
  const svgBuf = Buffer.from(svg);
  try{
    let baseBg = bgBuf || await sharp({create:{width:900,height:480,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
    let out = await sharp(baseBg).resize(900,480,{fit:'cover'}).composite([{input: svgBuf, top:0, left:0}]).png().toBuffer();
    if(coverImg){
      out = await sharp(out).composite([{input: coverImg, top:30, left:30}]).png().toBuffer();
    }
    return out;
  }catch(e){
    console.error('[lastfmCard] renderCur error:', e.message);
    return await sharp({create:{width:900,height:480,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
  }
}

async function renderProfileCard(sharp, opts){
  const { username, realName, playcount, registered, url, avatarBuffer } = opts;
  const W=800, H=380, R=32;
  const name = trunc(username||'—', 18);
  const rName = trunc(realName||'', 22);
  const plays = fmt(playcount);
  const reg = fmtDate(registered);
  const link = trunc(url||`https://last.fm/user/${username}`, 36);
  let bgBuf;
  try{
    if(avatarBuffer){
      bgBuf = await sharp(avatarBuffer).resize(860,420,{fit:'cover'}).blur(26).modulate({brightness:0.55}).png().toBuffer();
      const ov = await sharp(Buffer.from(`<svg width="860" height="420" xmlns="http://www.w3.org/2000/svg"><rect width="860" height="420" fill="rgba(0,0,0,0.32)"/></svg>`)).png().toBuffer();
      bgBuf = await sharp(bgBuf).composite([{input: ov}]).png().toBuffer();
    } else {
      bgBuf = await sharp({create:{width:860,height:420,channels:4,background:{r:16,g:16,b:20,alpha:1}}}).png().toBuffer();
    }
  }catch(_){ bgBuf=null; }
  const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" fill="rgba(18,18,22,0.88)" stroke="rgba(255,255,255,0.14)"/>
  <rect x="0.7" y="0.7" width="${W-1.4}" height="${H-1.4}" rx="${R-0.7}" fill="none" stroke="rgba(255,255,255,0.09)"/>
  <text x="28" y="28" font-family="sans-serif" font-size="12" fill="#FFFFFF" font-weight="bold">LAST.FM — PROFILO</text>
  <text x="220" y="92" font-family="sans-serif" font-size="32" fill="#FFFFFF" font-weight="bold">${esc(name)}</text>
  ${rName ? `<text x="220" y="118" font-family="sans-serif" font-size="15" fill="#FFFFFF" font-weight="bold">${esc(rName)}</text>` : ''}
  <g>
    <rect x="220" y="144" width="170" height="72" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.14)"/>
    <text x="236" y="166" font-family="sans-serif" font-size="10" fill="#FFFFFF" font-weight="bold">ASCOLTI TOTALI</text>
    <text x="236" y="198" font-family="sans-serif" font-size="24" fill="#FFFFFF" font-weight="bold">${esc(plays)}</text>
    <rect x="410" y="144" width="170" height="72" rx="16" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.14)"/>
    <text x="426" y="166" font-family="sans-serif" font-size="10" fill="#FFFFFF" font-weight="bold">DAL</text>
    <text x="426" y="198" font-family="sans-serif" font-size="15" fill="#FFFFFF" font-weight="bold">${esc(reg)}</text>
    <rect x="600" y="144" width="160" height="72" rx="16" fill="rgba(77,163,255,0.20)" stroke="rgba(77,163,255,0.28)"/>
    <text x="616" y="166" font-family="sans-serif" font-size="10" fill="#FFFFFF" font-weight="bold">LINK</text>
    <text x="616" y="198" font-family="sans-serif" font-size="11" fill="#4da3ff" font-weight="bold">${esc(link)}</text>
  </g>
  <text x="28" y="340" font-family="sans-serif" font-size="11" fill="#FFFFFF">▸ Usa .cur per vedere cosa ascolti ora</text>
</svg>`;
  try{
    let base = bgBuf ? await sharp(bgBuf).resize(W,H,{fit:'cover'}).png().toBuffer()
                     : await sharp({create:{width:W,height:H,channels:4,background:{r:18,g:18,b:22,alpha:1}}}).png().toBuffer();
    const svgBuf = Buffer.from(svg);
    let out = await sharp(base).composite([{input: svgBuf, top:0, left:0}]).png().toBuffer();
    let avBuf = avatarBuffer;
    if(!avBuf){
      const init = (username||'?').slice(0,2).toUpperCase();
      const avSvg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" rx="28" fill="#2a2a34"/><text x="75" y="88" font-family="Inter, sans-serif" font-size="54" fill="#fff" text-anchor="middle" font-weight="900">${esc(init)}</text></svg>`;
      avBuf = await sharp(Buffer.from(avSvg)).png().toBuffer();
    } else {
      avBuf = await sharp(avBuf).resize(150,150,{fit:'cover'}).png().toBuffer();
    }
    const maskSvg = `<svg width="150" height="150"><rect x="0" y="0" width="150" height="150" rx="28" fill="white"/></svg>`;
    const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
    const rounded = await sharp(avBuf).composite([{input: mask, blend:'dest-in'}]).png().toBuffer();
    out = await sharp(out).composite([{input: rounded, top:48, left:28}]).png().toBuffer();
    return out;
  }catch(e){
    console.error('[lastfmCard] profile error', e.message);
    return null;
  }
}

module.exports = { renderCurCard, renderProfileCard };
