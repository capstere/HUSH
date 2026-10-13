/* Export the original synthesis as optional 16-bit PCM WAV files. Node only. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
require('../assets/audio/sound-bank.js');require('../assets/audio/night-sounds.js');
const rate=22050;
const ctx={sampleRate:rate,createBuffer(channels,length,sampleRate){const a=Array.from({length:channels},()=>new Float32Array(length));return {numberOfChannels:channels,length,sampleRate,getChannelData:i=>a[i]};}};
const bank={...globalThis.HushSoundBank(ctx),...globalThis.HushNightSounds(ctx)};
const dest=path.join(__dirname,'../dist/audio');fs.mkdirSync(dest,{recursive:true});
for(const [name,b] of Object.entries(bank)){
 const size=b.length*b.numberOfChannels*2,out=Buffer.alloc(44+size);out.write('RIFF',0);out.writeUInt32LE(36+size,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(b.numberOfChannels,22);out.writeUInt32LE(b.sampleRate,24);out.writeUInt32LE(b.sampleRate*b.numberOfChannels*2,28);out.writeUInt16LE(b.numberOfChannels*2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(size,40);
 for(let i=0;i<b.length;i++)for(let c=0;c<b.numberOfChannels;c++){const value=b.getChannelData(c)[i];if(!Number.isFinite(value))throw new Error('Non-finite audio in '+name);out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+(i*b.numberOfChannels+c)*2);}
 fs.writeFileSync(path.join(dest,name+'.wav'),out);
}
console.log('Exported '+Object.keys(bank).length+' original WAV previews to '+dest);
