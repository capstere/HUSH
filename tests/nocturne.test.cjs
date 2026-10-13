'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {render,score,duration}=require('../assets/audio/nocturne.js');
const context={createBuffer(ch,len,rate){const a=Array.from({length:ch},()=>new Float32Array(len));return {numberOfChannels:ch,length:len,sampleRate:rate,duration:len/rate,getChannelData:i=>a[i]};}};
const bank=render(context);
function metrics(b){let peak=0,sum=0,count=0;for(let c=0;c<b.numberOfChannels;c++)for(const x of b.getChannelData(c)){assert(Number.isFinite(x));peak=Math.max(peak,Math.abs(x));sum+=x*x;count++;}return {peak,rms:Math.sqrt(sum/count)};}
test('original nocturne is 45 seconds of stereo PCM',()=>{assert.equal(duration,45);assert.equal(bank.moonlight.duration,45);assert.equal(bank.moonlight.numberOfChannels,2);});
test('score is deterministic, bounded and stays inside the loop',()=>{const s=score();assert.deepEqual(s,score());assert(s.length<120);assert(s.every(n=>n.at>=0&&n.at<45&&n.duration>0&&n.level>0&&n.level<.1));});
test('all five new sounds are finite and non-silent, with ample headroom',()=>{assert.equal(Object.keys(bank).length,5);for(const b of Object.values(bank)){const m=metrics(b);assert(m.peak<.4);assert(m.rms>.001);}});
test('music wraps its tails without a large seam discontinuity',()=>{for(let c=0;c<2;c++){const a=bank.moonlight.getChannelData(c);assert(Math.abs(a[0]-a[a.length-1])<.008);}});
test('music has stereo width without inverting a channel',()=>{const l=bank.moonlight.getChannelData(0),r=bank.moonlight.getChannelData(1);let diff=0,cross=0;for(let i=0;i<l.length;i++){diff+=Math.abs(l[i]-r[i]);cross+=l[i]*r[i];}assert(diff>1);assert(cross>0);});
test('rendering does not consume global gameplay randomness',()=>{const old=Math.random;Math.random=()=>{throw Error('unexpected RNG');};try{const b=render(context);assert.equal(b.moonlight.getChannelData(0)[20000],bank.moonlight.getChannelData(0)[20000]);}finally{Math.random=old;}});
test('humming and short cues have quiet ends',()=>{for(const name of ['humming','goodnight','sigh','caress']){const a=bank[name].getChannelData(0);assert(Math.abs(a[0])<.002);assert(Math.abs(a.at(-1))<.002);}});
