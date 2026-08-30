'use strict';
const googleTTS = require('google-tts-api');
const ffmpeg = require('fluent-ffmpeg');
const { getFfmpegPath } = require('./ffmpeg-path');
const { Readable, Writable } = require('stream');
try { const p=getFfmpegPath(); if(p) ffmpeg.setFfmpegPath(p); } catch(_){}

const toOggOpus = (mp3Buffer) => new Promise((resolve, reject) => {
  const chunks=[];
  const out=new Writable({ write(c,_,cb){ chunks.push(c); cb(); } });
  ffmpeg(Readable.from([mp3Buffer])).inputFormat('mp3').audioCodec('libopus').audioChannels(1).audioFrequency(48000).format('ogg').outputOptions(['-application voip']).on('error',reject).on('end',()=>resolve(Buffer.concat(chunks))).pipe(out,{end:true});
});

async function textToVoice(text){
  const t=String(text||'').trim().slice(0,200);
  if(!t) return null;
  const parts=await googleTTS.getAllAudioBase64(t,{lang:'it',slow:false,timeout:15000});
  const mp3=Buffer.concat(parts.map(p=>Buffer.from(p.base64,'base64')));
  if(!mp3.length) return null;
  const ogg=await toOggOpus(mp3);
  return ogg && ogg.length ? ogg : null;
}

module.exports={ textToVoice };
