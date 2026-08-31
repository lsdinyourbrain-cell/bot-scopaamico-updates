'use strict';

function esc(s){
  return String(s||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,"\\'");
}
function trunc(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function fmt(n){ return Number(n||0).toLocaleString('it-IT'); }
function fmtDuration(sec){
  const s=Number(sec)||0;
  if(s<=0) return '—';
  const h=Math.floor(s/3600);
  const m=Math.floor((s%3600)/60);
  const r=Math.floor(s%60);
  if(h>0) return h+':'+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');
  return m+':'+String(r).padStart(2,'0');
}

function esc(s){
  return String(s||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"').replace(/'/g,"\\'");
}
function trunc(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function fmt(n){ return Number(n||0).toLocaleString('it-IT'); }
function fmtDuration(sec){
  const s=Number(sec)||0;
  if(s<=0) return '—';
  const h=Math.floor(s/3600);
  const m=Math.floor((s%3600)/60);
  const r=Math.floor(s%60);
  if(h>0) return h+':'+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');
  return m+':'+String(r).padStart(2,'0');
}

async function renderCurCard(sharp, opts){
  const { coverBuffer, trackName, trackArtist, trackAlbum, username, isNowPlaying, userPlaycount, globalPlaycount, listeners, durationText } = opts;
  const tName = trunc(trackName||'Sconosciuta', 22);
  const tArtist = trunc(trackArtist||'Sconosciuto', 20);
  const tAlbum = trackAlbum ? trunc(trackAlbum, 20) : '';
  const tUser = trunc(username||'', 18);

  const W=900, H=480, R=38;

  const tNameEsc = esc(tName);
  const tArtistEsc = esc(tArtist);
  const tAlbumEsc = trackAlbum ? esc(tAlbum) : '';
  const tUserEsc = esc(tUser);
  const trackNameEsc = esc(trackName||'');
  const trackArtistEsc = esc(trackArtist||'');
  const trackAlbumEsc = trackAlbum ? esc(trackAlbum) : '';
  const usernameEsc = esc(username||'');
  const durEsc = esc(durationText||'—');
  const firesEsc = esc(String(fires||0));
  const userPlayEsc = esc(fmt(userPlaycount||0));
  const globalPlayEsc = esc(fmt(globalPlaycount||0));
  const listenersEsc = esc(fmt(listeners||0));

  const svg = `
<svg width="900" height="480" viewBox="0 0 900 480" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="c"><rect x="30" y="30" width="220" height="220" rx="24" ry="24"/></clipPath>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18" result="b"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"/></filter>
  </defs>

  <rect x="0" y="0" width="900" height="480" rx="38" fill="rgba(18,18,22,0.62)" stroke="rgba(255,255,255,0.10)" stroke-width="1.2"/>
  <rect x="0.8" y="0.8" width="898.4" height="478.4" rx="37.2" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
  <rect x="0" y="0" width="900" height="70" rx="38" fill="url(#g)" opacity="0.5"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.08)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>

  <circle cx="328" cy="62" r="6" fill="${isNowPlaying ? '#1DB954' : '#888'}" />
  <text x="342" y="67" font-family="Inter, Outfit, sans-serif" font-size="12" fill="${isNowPlaying ? '#1DB954' : '#aaa'}" font-weight="700" letter-spacing="1.6">${isNowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO'}</text>

  <text x="328" y="112" font-family="Inter, Outfit, sans-serif" font-size="40" fill="#FFFFFF" font-weight="900" letter-spacing="-0.8">${tNameEsc}</text>
  <text x="328" y="148" font-family="Inter, sans-serif" font-size="20" fill="rgba(255,255,255,0.78)" font-weight="700" letter-spacing="0.6">${tArtistEsc}</text>
  ${tAlbum ? `<text x="328" y="172" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.45)" font-weight="600">${tAlbumEsc}</text>` : ''}
  ${durationText && durationText!=='—' ? `<text x="328" y="${tAlbum? '190':'172'}" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.35)">⏱ ${esc(durationText)}</text>` : ''}

  <g>
    <rect x="328" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="348" y="236" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">I TUOI ASCOLTI</text>
    <text x="348" y="268" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(userPlaycount||0))}</text>

    <rect x="600" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="620" y="236" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">ASCOLTI GLOBALI</text>
    <text x="620" y="268" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(globalPlaycount||0))}</text>

    <rect x="328" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="348" y="332" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">UTENTE</text>
    <text x="348" y="364" font-family="Inter, sans-serif" font-size="16" fill="#4da3ff" font-weight="800">${tUserEsc}</text>

    <rect x="600" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="620" y="332" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">ASCOLTATORI</text>
    <text x="620" y="364" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(listeners||0))}</text>
  </g>
</svg>`;

  const svgBuf = Buffer.from(svg);

  // 1. Create background from cover (blurred) or solid
  let bgBuf;
  try{
    const base = coverBuffer 
      ? await sharp(coverBuffer).resize(960,560,{fit:'cover'}).blur(28).modulate({brightness:0.55, saturation:1.1}).png().toBuffer()
      : await sharp({create:{width:960,height:560,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
    const overlaySvg = `<svg width="960" height="560" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="560" fill="rgba(0,0,0,0.28)"/></svg>`;
    const overlay = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
    bgBuf = await sharp(base).composite([{input: overlay, blend:'over'}]).png().toBuffer();
  }catch(_){
    bgBuf = await sharp({create:{width:960,height:560,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
  }

  // Prepare cover image (220x220, rounded)
  let coverImg = null;
  if(coverBuffer){
    try{
      coverImg = await sharp(coverBuffer).resize(220,220,{fit:'cover'}).png().toBuffer();
      const maskSvg = `<svg width="220" height="220"><rect x="0" y="0" width="220" height="220" rx="24" ry="24" fill="white"/></svg>`;
      const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
      coverImg = await sharp(coverImg).composite([{input: mask, blend:'dest-in'}]).png().toBuffer();
    }catch(_){ coverImg=null; }
  }

  // Composite: background + svg + cover on top
  try{
    let baseBg = bgBuf || await sharp({create:{width:900,height:480,channels:4,background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
    // Draw SVG card on background
    let out = await sharp(baseBg).composite([{input: svgBuf, top:0, left:0}]).png().toBuffer();
    // Composite cover image on top (inside clip area at 30,30)
    if(coverImg){
      out = await sharp(out).composite([{input: coverImg, top:30, left:30}]).png().toBuffer();
    }
    return out;
  }catch(e){
    console.error('[lastfmCard] renderCurCard error:', e.message);
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

  // bg blurred from avatar if available
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
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" fill="rgba(18,18,22,0.64)" stroke="rgba(255,255,255,0.10)"/>
  <rect x="0.7" y="0.7" width="${W-1.4}" height="${H-1.4}" rx="${R-0.7}" fill="none" stroke="rgba(255,255,255,0.07)"/>
  <rect x="0" y="0" width="${W}" height="72" rx="${R}" fill="url(#gh)" opacity="0.6"/>
  <defs><linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.07)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>
  <text x="28" y="28" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.4">LAST.FM • PROFILO</text>

  <text x="220" y="92" font-family="Inter, sans-serif" font-size="30" fill="#fff" font-weight="900">${esc(name)}</text>
  ${rName ? `<text x="220" y="118" font-family="Inter, sans-serif" font-size="14" fill="rgba(255,255,255,0.62)" font-weight="600">${esc(rName)}</text>` : ''}

  <g>
    <rect x="220" y="144" width="170" height="72" rx="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="236" y="166" font-family="Inter, sans-serif" font-size="9" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.1">ASCOLTI TOTALI</text>
    <text x="236" y="198" font-family="Inter, sans-serif" font-size="22" fill="#fff" font-weight="800">${esc(plays)}</text>

    <rect x="410" y="144" width="170" height="72" rx="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="426" y="166" font-family="Inter, sans-serif" font-size="9" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.1">DAL</text>
    <text x="426" y="198" font-family="Inter, sans-serif" font-size="15" fill="#fff" font-weight="700">${esc(reg)}</text>

    <rect x="600" y="144" width="160" height="72" rx="16" fill="rgba(77,163,255,0.14)" stroke="rgba(77,163,255,0.22)"/>
    <text x="616" y="166" font-family="Inter, sans-serif" font-size="9" fill="rgba(160,200,255,0.9)" font-weight="700" letter-spacing="1.1">LINK</text>
    <text x="616" y="198" font-family="Inter, sans-serif" font-size="11" fill="#4da3ff" font-weight="700">${esc(link)}</text>
  </g>

  <text x="28" y="340" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.32)">▸ Usa .cur per vedere cosa ascolti ora</text>
</svg>`;

  try{
    let base = bgBuf ? await sharp(bgBuf).resize(W,H,{fit:'cover'}).png().toBuffer()
                     : await sharp({create:{width:W,height:H,channels:4,background:{r:18,g:18,b:22,alpha:1}}}).png().toBuffer();
    const svgBuf = Buffer.from(svg);
    let out = await sharp(base).composite([{input: svgBuf, top:0, left:0}]).png().toBuffer();

    // avatar circular 150 at 28,48
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
    const bordered = await sharp(rounded).png().toBuffer();
    out = await sharp(out).composite([{input: bordered, top:48, left:28}]).png().toBuffer();
    return out;
  }catch(e){
    console.error('[lastfmCard] profile error', e.message);
    return null;
  }
}

module.exports = { renderCurCard, renderProfileCard };