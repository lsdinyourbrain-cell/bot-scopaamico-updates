'use strict';
const { sec, boxOpen, boxEnd, line } = require('../../lib/ui');

function trunc(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function fmtDuration(sec){
  const s=Number(sec)||0;
  if(s<=0) return '—';
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), r=Math.floor(s%60);
  return h>0 ? h+':'+String(m).padStart(2,'0')+':'+String(r).padStart(2,'0') : m+':'+String(r).padStart(2,'0');
}
function mapErr(e){
  const m=String(e?.message||'');
  if(m==='UTENTE_NON_TROVATO' || /404|not found/i.test(m)) return '⚠️ Utente Last.fm non trovato.';
  if(m==='API_KEY_INVALIDA' || /403|invalid.*key/i.test(m)) return '⚠️ API key non valida.';
  if(/429|rate.?limit/i.test(m)) return '⚠️ Troppe richieste, riprova.';
  if(m==='API_KEY_MANCA') return '⚠️ Last.fm non configurato.';
  if(/timeout|ECONN|ENOTFOUND/i.test(m)) return '⚠️ Errore di rete Last.fm.';
  return '⚠️ Errore: '+(m||String(e));
}
async function fetchCover(axios, sharp, track){
  let dur=0;
  try{
    const term=((track.name||'')+' '+(track.artist||'')).trim().slice(0,120);
    const r=await axios.get('https://itunes.apple.com/search',{params:{term,entity:'song',limit:1},timeout:8000});
    const it=r.data?.results?.[0];
    if(it?.trackTimeMillis) dur=Math.round(it.trackTimeMillis/1000);
    const art=it?.artworkUrl100;
    if(art){
      const hi=art.replace(/100x100(bb)?/i,'600x600bb');
      const resp=await axios.get(hi,{responseType:'arraybuffer',timeout:10000});
      const buf=await sharp(Buffer.from(resp.data)).resize(500,500,{fit:'cover'}).png().toBuffer();
      if(buf.length>1000) return {cover:buf, duration:dur};
    }
  }catch(e){ console.error('[cur] itunes',e.message); }
  if(track.cover && !/2a96cbd8b46e442fc41c2b86b821562f|blank/i.test(track.cover)){
    try{
      const resp=await axios.get(track.cover,{responseType:'arraybuffer',timeout:8000});
      const buf=await sharp(Buffer.from(resp.data)).resize(500,500,{fit:'cover'}).png().toBuffer();
      if(buf.length>1000) return {cover:buf, duration:dur};
    }catch(e){ console.error('[cur] lastfm cover',e.message); }
  }
  return {cover:null, duration:dur};
}
module.exports={
  name:'cur',
  aliases:['np','nowplaying','current'],
  description:'Mostra la riproduzione Last.fm con card traslucida.',
  async run(sock, msg, args, context){
    const reply = context.reply;
    const from = context.from;
    const sender = context.sender;
    const textArgs = context.textArgs || '';
    const mentioned = context.mentioned || [];
    let services = context.services || {};
    let db = services.db || {};
    let lastfm = services.lastfm;
    let axios = services.axios;
    let sharp = services.sharp;
    let sendButtons = services.sendButtons;
    let saveDB = services.saveDB || (()=>{});
    console.log(`[cur] run from ${sender} in ${from} textArgs="${textArgs}" lastfmCfg=${!!lastfm?.isConfigured?.()}`);
    try{
      if(!lastfm || !lastfm.isConfigured || !lastfm.isConfigured()){
        console.log('[cur] not configured');
        return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Last.fm non configurato.')}\n${boxEnd()}`);
      }
      const sub = String(textArgs||'').trim().toLowerCase();
      if(['fuoco','fire','🔥','fuochi'].includes(sub)){
        let key=null, artist=null, title=null;
        if(db._lastCur && db._lastCur[sender]?.key){
          key=db._lastCur[sender].key; artist=db._lastCur[sender].artist; title=db._lastCur[sender].title;
        } else {
          const uname=(db && db._lastfm && db._lastfm[sender])||null;
          if(!uname) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Collega Last.fm con .lastfm <nome>')}\n${boxEnd()}`);
          let d; try{ d=await lastfm.getNowPlaying(uname);}catch(e){ return await reply(mapErr(e)); }
          if(!d.track) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Nessun brano.')}\n${boxEnd()}`);
          key=`${d.track.artist} — ${d.track.name}`.toLowerCase().slice(0,120); artist=d.track.artist; title=d.track.name;
        }
        if(!db._curFires) db._curFires={};
        if(!db._curFires[key]) db._curFires[key]={count:0, users:{}};
        const rec=db._curFires[key];
        if(rec.users[sender]) return await reply(`${sec('FUOCO')}\n${boxOpen()}\n${line('Hai già messo fuoco a '+trunc(title,18))}\n${line('🔥 Fuochi: '+rec.count)}\n${boxEnd()}`);
        rec.count+=1; rec.users[sender]=1; rec.last=Date.now(); rec.artist=artist; rec.title=title;
        try{ saveDB(); }catch(_){}
        return await reply(`${sec('FUOCO')}\n${boxOpen()}\n${line('🔥 +1 a '+trunc(title,18)+' — '+trunc(artist,18))}\n${line('🔥 Totale fuochi: '+rec.count)}\n${boxEnd()}`);
      }
      let username=null;
      const raw=String(textArgs||'').trim();
      if(raw && !['fuoco','fire','🔥','fuochi'].includes(raw.toLowerCase().split(/\s+/)[0])){
        if(mentioned.length>0 && String(textArgs).includes('@')){
          username=(db && db._lastfm && db._lastfm[mentioned[0]])||null;
          if(!username) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Utente non collegato a Last.fm.')}\n${boxEnd()}`);
        } else {
          username=raw.split(/\s+/)[0];
        }
      } else if(mentioned.length>0){
        username=(db && db._lastfm && db._lastfm[mentioned[0]])||null;
        if(!username) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Questo utente non ha collegato un account Last.fm.')}\n${boxEnd()}`);
      } else {
        username=(db && db._lastfm && db._lastfm[sender])||null;
      }
      if(!username) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Nessun account Last.fm collegato. Collegalo con: .lastfm <nomeutente>')}\n${boxEnd()}`);
      let npData;
      try{ npData=await lastfm.getNowPlaying(username); }catch(e){ return await reply(mapErr(e)); }
      const track=npData.track;
      if(!track) return await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line(username+' non ha ancora ascoltato nulla.')}\n${boxEnd()}`);
      let trackInfo={playcount:0,listeners:0,userplaycount:0,duration:0};
      try{ trackInfo=await lastfm.getTrackInfo(track.artist, track.name, username); }catch(e){ console.error('[cur] trackInfo',e.message); }
      let cover; let durSec = trackInfo.duration || 0;
      try{ const f=await fetchCover(axios, sharp, track); cover=f.cover; if(f.duration>0) durSec=f.duration; }catch(e){ console.error('[cur] cover',e.message); }
      if(!cover){
        try{
          const svg=`<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="500" fill="#0f0f0f"/><circle cx="250" cy="180" r="70" fill="none" stroke="#444" stroke-width="2"/><polygon points="230,155 230,205 275,180" fill="#888"/><text x="250" y="300" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle" font-weight="bold">${trunc(track.name,24).replace(/&/g,'&').replace(/</g,'<')}</text><text x="250" y="330" font-family="sans-serif" font-size="15" fill="#aaa" text-anchor="middle">${trunc(track.artist,22).replace(/&/g,'&').replace(/</g,'<')}</text></svg>`;
          cover=await sharp(Buffer.from(svg)).png().toBuffer();
        }catch(_){ cover=null; }
      }
      const searchTerm=`${track.name} ${track.artist}`.trim().slice(0,80);
      const firesKey=`${track.artist} — ${track.name}`.toLowerCase().slice(0,120);
      const fires=(db._curFires && db._curFires[firesKey]?.count)||0;
      const durText=fmtDuration(durSec);
      if(!db._lastCur) db._lastCur={};
      db._lastCur[sender]={key:firesKey, artist:track.artist, title:track.name};
      try{ saveDB(); }catch(_){}
      // ALWAYS send text fallback FIRST (garantito visibile su Termux)
      const fallback = 
        sec('IN RIPRODUZIONE')+'\n'+
        boxOpen()+'\n'+
        line('🎵 '+trunc(track.name,30))+'\n'+
        line('👤 '+trunc(track.artist,30))+'\n'+
        (track.album ? line('💿 '+trunc(track.album,28))+'\n' : '')+
        (durText!=='—' ? line('⏱️ '+durText)+'\n' : '')+
        line('🔥 Fuochi: '+fires)+'\n'+
        line('👤 @'+trunc(username,18))+'\n'+
        boxEnd();
      // SEMPRE invia testo PRIMA
      await reply(fallback);
      let cardBuf=null;
      try{
        const { renderCurCard } = require('../../lib/lastfmCard');
        cardBuf=await renderCurCard(sharp, {coverBuffer: cover, trackName: track.name, trackArtist: track.artist, username, isNowPlaying: !!npData.nowPlaying, userPlaycount: trackInfo.userplaycount||0, globalPlaycount: trackInfo.playcount||0, listeners: trackInfo.listeners||0});
      }catch(e){ console.error('[cur] card render',e.message); cardBuf=null; }
      // SEMPRE manda qualcosa - prima testo, poi immagine
      try{
        if(cardBuf){
          await sock.sendMessage(from, {image: cardBuf, caption: `🔥 ${fires} fuochi • ${fmtDuration(durSec)} • @${username}`}, {quoted: msg});
        } else if(cover){
          await sock.sendMessage(from, {image: cover, caption: `🎵 ${trunc(track.name,30)}\n👤 ${trunc(track.artist,30)}\n🔥 ${((db._curFires && db._curFires[`${track.artist} — ${track.name}`.toLowerCase().slice(0,120)]?.count)||0)} fuochi • ${fmtDuration(durSec)} • @${username}`}, {quoted: msg});
        }
      }catch(e){
        console.error('[cur] send image failed',e.message);
      }
      // pulsanti
      const fireLabel=fires>0?`🔥 Fuoco (${fires})`:'🔥 Fuoco';
      try{
        if(sendButtons) await sendButtons(sock, from, `Cosa vuoi fare?`, [{label:'📝 Testo', id:`lyrics ${searchTerm}`},{label:'🎵 MP3', id:`mp3 ${searchTerm}`},{label:fires>0?`🔥 Fuoco (${fires})`:'🔥 Fuoco', id:`cur fuoco`}], msg);
      }catch(e){ console.error('[cur] buttons',e.message); }
    }catch(e){
      console.error('[cur] FATAL',e.message, e.stack);
      try{ await reply(`${sec('ERRORE')}\n${boxOpen()}\n${line('Errore .cur: '+String(e.message).slice(0,80))}\n${boxEnd()}`); }catch(_){}
    }
  }
};