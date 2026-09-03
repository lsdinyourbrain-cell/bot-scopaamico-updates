'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'database.json');
const PKG_FILE = path.join(ROOT, 'package.json');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));

// Anti DDOS: 100 req / 15min per IP
const limiter = rateLimit({
  windowMs: 15*60*1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Troppe richieste, riprova tra 15 min.' }
});
app.use('/api/', limiter);
// Anti bot: simple honeypot + user-agent check for /api/report
app.use('/api/report', (req,res,next)=>{
  const ua = String(req.headers['user-agent']||'');
  if(!ua || ua.length<10) return res.status(403).json({ ok:false, error:'Bot rilevato' });
  if(req.body && req.body.honeypot) return res.status(403).json({ ok:false, error:'Bot' });
  next();
});

const safeReadJSON = (f,fb={})=>{ try{ if(!fs.existsSync(f)) return fb; return JSON.parse(fs.readFileSync(f,'utf-8')); }catch{ return fb; } };

app.get('/api/stats', (req,res)=>{
  try{
    const db=safeReadJSON(DB_FILE,{});
    const pkg=safeReadJSON(PKG_FILE,{});
    const groupInfo=db._groupInfo||{};
    const groupIds=Object.keys(groupInfo).length?Object.keys(groupInfo).filter(k=>k.endsWith('@g.us')):Object.keys(db).filter(k=>k.endsWith('@g.us'));
    const users=groupIds.reduce((a,gid)=>{ const chat=db[gid]||{}; return a+Object.keys(chat).filter(k=>k.includes('@')).length; },0);
    const owners=db._owners||[];
    const mainOwner=db._mainOwner||owners[0]?.jid||owners[0]?.number||'';
    const rawNum=String(mainOwner).replace(/[^0-9]/g,'');
    const displayOwner=rawNum?`+${rawNum}`:mainOwner;
    res.json({
      ok:true,
      bot:{ name: pkg.name||'VEX BOT', version: pkg.version||'1.0.0', uptime: `${Math.floor(process.uptime()/3600)}h ${Math.floor((process.uptime()%3600)/60)}m` },
      stats:{ groups: groupIds.length, users, commands: 360, uptime: process.uptime() },
      owner:{ jid: mainOwner, display: displayOwner, waLink: rawNum?`https://wa.me/${rawNum}`:null }
    });
  }catch(e){ res.status(500).json({ok:false,error:e.message}); }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/*splat', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const PORT=process.env.SITE_PORT||3000;
const HOST=process.env.SITE_HOST||'0.0.0.0';
app.listen(PORT, HOST, ()=>{
  let lanIp='';
  try{
    const ifs=os.networkInterfaces();
    for(const addrs of Object.values(ifs)){
      for(const a of (addrs||[])){
        if(a.family==='IPv4'&&!a.internal){ lanIp=a.address; break; }
      }
      if(lanIp) break;
    }
  }catch{}
  console.log(`\n✦ VEX SITE online → http://127.0.0.1:${PORT}`);
  if(lanIp) console.log(`✦ VEX SITE rete → http://${lanIp}:${PORT}`);
  console.log(`✦ Anti-DDOS: 100 req/15min + Helmet`);
  console.log(`✦ Anti-Bot: UA check + honeypot`);
});
