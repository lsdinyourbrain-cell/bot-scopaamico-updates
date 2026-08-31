'use strict';

function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function trunc(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function fmt(n){ return Number(n||0).toLocaleString('it-IT'); }
function fmtDate(ts){
  if(!ts) return '—';
  const d=new Date(ts*1000);
  if(isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric'});
}

async function renderCurCard(sharp, opts){
  const {
    coverBuffer,
    trackName,
    trackArtist,
    trackAlbum,
    username,
    isNowPlaying,
    userPlaycount,
    globalPlaycount,
    listeners,
    durationText
  } = opts;

  const W = 900;
  const H = 480;
  const R = 38;

  const tName = trunc(trackName||'Sconosciuta', 22);
  const tArtist = trunc(trackArtist||'Sconosciuto', 20);
  const tUser = trunc(username||'', 18);
  const tAlbum = trackAlbum ? trunc(trackAlbum, 20) : '';

  // background blurred from cover
  let bgBuf;
  try{
    const base = coverBuffer ? await sharp(coverBuffer).resize(960,560,{fit:'cover'}).blur(28).modulate({brightness:0.55, saturation:1.1}).png().toBuffer()
      : await sharp({ create: { width: 960, height:560, channels:4, background:{r:18,g:18,b:24,alpha:1}}}).png().toBuffer();
    // dark overlay for readability
    const overlaySvg = `<svg width="960" height="560" xmlns="http://www.w3.org/2000/svg"><rect width="960" height="560" fill="rgba(0,0,0,0.28)"/></svg>`;
    const overlay = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
    bgBuf = await sharp(base).composite([{input: overlay, blend:'over'}]).png().toBuffer();
  }catch(_){
    bgBuf = null;
  }

  // main card SVG
  const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="c"><rect x="30" y="30" width="220" height="220" rx="24" ry="24"/></clipPath>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18" result="b"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.7 0"/></filter>
  </defs>

  <!-- card outer -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R}" fill="rgba(18,18,22,0.62)" stroke="rgba(255,255,255,0.10)" stroke-width="1.2"/>
  <rect x="0.8" y="0.8" width="${W-1.6}" height="${H-1.6}" rx="${R-0.8}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- subtle inner glow top -->
  <rect x="0" y="0" width="${W}" height="70" rx="${R}" fill="url(#g)" opacity="0.5"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.08)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>

  <!-- status -->
  <circle cx="328" cy="62" r="6" fill="${isNowPlaying ? '#1DB954' : '#888'}" />
  <text x="342" y="67" font-family="Inter, Outfit, sans-serif" font-size="12" fill="${isNowPlaying ? '#1DB954' : '#aaa'}" font-weight="700" letter-spacing="1.6">${esc(isNowPlaying ? 'IN RIPRODUZIONE' : 'ULTIMO ASCOLTO')}</text>

  <!-- title -->
  <text x="328" y="112" font-family="Inter, Outfit, sans-serif" font-size="40" fill="#FFFFFF" font-weight="900" letter-spacing="-0.8">${esc(tName)}</text>
  <text x="328" y="148" font-family="Inter, sans-serif" font-size="20" fill="rgba(255,255,255,0.78)" font-weight="700" letter-spacing="0.6">${esc(tArtist.toUpperCase())}</text>
  ${tAlbum ? `<text x="328" y="172" font-family="Inter, sans-serif" font-size="12" fill="rgba(255,255,255,0.45)" font-weight="600">${esc(tAlbum)}</text>` : ''}
  ${durationText && durationText!=='—' ? `<text x="328" y="${tAlbum? '190':'172'}" font-family="Inter, sans-serif" font-size="11" fill="rgba(255,255,255,0.35)">⏱ ${esc(durationText)}</text>` : ''}

  <!-- stats grid 2x2 -->
  <g>
    <rect x="328" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="348" y="236" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">I TUOI ASCOLTI</text>
    <text x="348" y="268" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(userPlaycount))}</text>

    <rect x="600" y="212" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="620" y="236" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">ASCOLTI GLOBALI</text>
    <text x="620" y="268" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(globalPlaycount))}</text>

    <rect x="328" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="348" y="332" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">UTENTE</text>
    <text x="348" y="364" font-family="Inter, sans-serif" font-size="16" fill="#4da3ff" font-weight="800">${esc('@'+tUser)}</text>

    <rect x="600" y="308" width="250" height="78" rx="18" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.08)"/>
    <text x="620" y="332" font-family="Inter, sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" font-weight="700" letter-spacing="1.2">ASCOLTATORI</text>
    <text x="620" y="364" font-family="Inter, sans-serif" font-size="24" fill="#fff" font-weight="800">${esc(fmt(listeners))}</text>
  </g>
</svg>`;

  const svgBuf = Buffer.from(svg);

  // composite cover + svg over bg
  try{
    let baseBg;
    if(bgBuf){
      // crop bg to W x H centered
      baseBg = await sharp(bgBuf).resize(W, H, {fit:'cover', position:'centre'}).png().toBuffer();
    } else {
      baseBg = await sharp({create:{width:W,height:H,channels:4,background:{r:18,g:18,b:22,alpha:1}}}).png().toBuffer();
    }
    // prepare cover image clipped
    let coverImg = null;
    if(coverBuffer){
      try{
        coverImg = await sharp(coverBuffer).resize(220,220,{fit:'cover'}).png().toBuffer();
      }catch(_){}
    }
    const composites = [];
    // first overlay card svg
    composites.push({ input: svgBuf, top:0, left:0 });
    let out = await sharp(baseBg).composite(composites).png().toBuffer();
    // then composite cover inside clip (need to place cover at 30,30)
    if(coverImg){
      out = await sharp(out).composite([{ input: coverImg, top:30, left:30 }]).png().toBuffer();
      // add subtle border around cover to match clip
      // already svg has clip, but we placed cover without clip; to clip we need to useDest with SVG mask? Simpler: just re-overlay SVG again to get rounded clipping effect via SVG rect with clip? 
      // Instead we composite again the SVG to ensure rounded corners mask covers edges
      out = await sharp(out).composite([{ input: svgBuf, top:0, left:0 }]).png().toBuffer();
      // This double overlay ensures cover is under card but visible through transparent? Actually our SVG card has transparent where cover should be? In SVG we drew a clipPath but didn't use it to mask cover; we just placed rect for card. The cover we placed at 30,30 will be under the SVG's card rect which is at 0,0 with fill rgba(18,18,22,0.62) — so it would be covered. Need to make card hole for cover.
      // Fix: In SVG we need to not draw card rect over cover area, or make cover area transparent. Our current card rect covers whole 900x480, so cover will be hidden under it.
      // To fix, we need to redraw: we should cut hole. Easier: don't draw full card rect as opaque, but composite cover first then svg with hole.
      // For now, we workaround: create version where svg has no full bg, but bg is already baseBg, and svg only draws text and boxes, not full card bg. We already have full card bg in svg, so we need to make that bg have a transparent hole for cover.
      // Simpler to regenerate: instead of using baseBg + svg, we will use a different approach: create card bg as part of bgBuf already blurred, and svg only draws text. But we already did.
      // Quick fix: re-create without full card bg covering cover — we will make cover visible by compositing cover AFTER svg, with rounded mask
    }
    // If cover was hidden, try alternative: composite cover on top with rounded corners via sharp
    if(coverImg){
      // create rounded cover via sharp
      const roundedCover = await sharp(coverImg).png().toBuffer(); // already 220x220, need rounded
      // create mask
      const maskSvg = `<svg width="220" height="220"><rect x="0" y="0" width="220" height="220" rx="24" ry="24" fill="white"/></svg>`;
      const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
      try{
        const withMask = await sharp(roundedCover).composite([{input: mask, blend:'dest-in'}]).png().toBuffer();
        out = await sharp(out).composite([{input: withMask, top:30, left:30}]).png().toBuffer();
      }catch(_){
        out = await sharp(out).composite([{input: roundedCover, top:30, left:30}]).png().toBuffer();
      }
    }
    return out;
  }catch(e){
    console.error('[lastfmCard] renderCur error', e.message);
    // fallback simple
    try{
      return await sharp({create:{width:W,height:H,channels:4,background:{r:18,g:18,b:22,alpha:1}}}).png().toBuffer();
    }catch(_){ return null; }
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
      bgBuf = await sharp(bgBuf).composite([{input:ov}]).png().toBuffer();
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
      // generate initials avatar
      const init = (username||'?').slice(0,2).toUpperCase();
      const avSvg = `<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" rx="28" fill="#2a2a34"/><text x="75" y="88" font-family="Inter, sans-serif" font-size="54" fill="#fff" text-anchor="middle" font-weight="900">${esc(init)}</text></svg>`;
      avBuf = await sharp(Buffer.from(avSvg)).png().toBuffer();
    } else {
      avBuf = await sharp(avBuf).resize(150,150,{fit:'cover'}).png().toBuffer();
    }
    // make avatar rounded
    const maskSvg = `<svg width="150" height="150"><rect x="0" y="0" width="150" height="150" rx="28" fill="white"/></svg>`;
    const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
    const rounded = await sharp(avBuf).composite([{input: mask, blend:'dest-in'}]).png().toBuffer();
    // add border
    const bordered = await sharp(rounded).png().toBuffer();
    out = await sharp(out).composite([{input: bordered, top:48, left:28}]).png().toBuffer();
    return out;
  }catch(e){
    console.error('[lastfmCard] profile error', e.message);
    return null;
  }
}

module.exports = { renderCurCard, renderProfileCard };
