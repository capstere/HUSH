/* Borrowed Moonlight — an original 45-second nocturne for HUSH 5.
 * Soft felt-piano partials, warm sustained chords, no drums or recorded assets.
 * Deterministic PCM, rendered once. Tails wrap around the loop seam.
 */
(function(root) {
  'use strict';
  const RATE = 22050, BEAT = 60 / 64, BARS = 16, LENGTH = BARS * 3 * BEAT;
  const chords = [[41,57,60,64],[40,55,60,64],[38,57,60,65],[34,53,57,60],
    [43,53,57,62],[36,55,60,62],[41,57,60,64],[36,55,58,62]];
  const tune = [[69,null,67],[64,67,null],[65,null,69],[65,62,null],
    [62,null,65],[64,62,null],[60,65,69],[67,null,64],
    [69,72,null],[67,null,64],[65,69,null],[65,null,62],
    [62,65,null],[64,null,62],[60,65,69],[67,64,null]];
  function score() {
    const notes = [];
    for (let bar = 0; bar < BARS; bar++) {
      const c = chords[bar % 8], at = bar * 3 * BEAT;
      notes.push({at, midi:c[0], duration:4.3, level:.047, pan:-.16, voice:'felt'});
      c.slice(1).forEach((m,i) => notes.push({at:at + .028*i, midi:m, duration:4.5,
        level:.012, pan:(i-1)*.35, voice:'pad'}));
      tune[bar].forEach((m,i) => { if (m) notes.push({at:at + i*BEAT + (i===1?.035:0), midi:m,
        duration:2.9, level:.048 + (i===0?.006:0), pan:(m-66)*.038, voice:'felt'}); });
    }
    return notes;
  }
  function render(ctx) {
    const bank = {}, size = Math.round(LENGTH*RATE);
    const b = ctx.createBuffer(2,size,RATE), l=b.getChannelData(0), r=b.getChannelData(1);
    for (const note of score()) {
      const f = 440*Math.pow(2,(note.midi-69)/12), start=Math.round(note.at*RATE);
      const count=Math.ceil(note.duration*RATE), pan=Math.max(-.8,Math.min(.8,note.pan));
      const left=Math.cos((pan+1)*Math.PI/4), right=Math.sin((pan+1)*Math.PI/4);
      for(let j=0;j<count;j++) {
        const t=j/RATE, phase=2*Math.PI*f*t;
        const env=note.voice==='pad' ? Math.pow(Math.sin(Math.PI*j/count),2) :
          (1-Math.exp(-t*38))*Math.exp(-t*1.75)*Math.min(1,(count-j)/(.4*RATE));
        const v=(Math.sin(phase)+.14*Math.sin(phase*2.001)*Math.exp(-t*3)+
          .028*Math.sin(phase*3.002)*Math.exp(-t*5))*env*note.level;
        const pos=(start+j)%size;
        l[pos]+=v*left; r[pos]+=v*right;
      }
    }
    // One quiet, non-feedback stereo echo; deterministic and bounded.
    const dryL=l.slice(),dryR=r.slice(),delay=Math.round(.28125*RATE);
    for(let i=0;i<size;i++) {
      l[i]+=dryR[(i-delay+size)%size]*.17;
      r[i]+=dryL[(i-delay*2+size)%size]*.16;
    }
    bank.moonlight=b;
    function mono(name, duration, fn) {
      const a=ctx.createBuffer(1,Math.ceil(duration*RATE),RATE), data=a.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=fn(i/RATE,i/data.length);
      bank[name]=a;
    }
    mono('humming',5.625,(t,p)=> {
      const midi=[53,57,60,57][Math.min(3,Math.floor(p*4))],f=440*Math.pow(2,(midi-69)/12);
      const local=(p*4)%1,env=Math.sin(Math.PI*local)**1.2;
      return (Math.sin(2*Math.PI*f*t)+.12*Math.sin(4*Math.PI*f*t))*env*.045;
    });
    mono('goodnight',2.7,(t,p)=> {
      let v=0;[65,69,72].forEach((m,i)=> {const a=t-i*.23;if(a>0){const f=440*2**((m-69)/12);v+=Math.sin(2*Math.PI*f*a)*(1-Math.exp(-a*30))*Math.exp(-a*2.4)*.065;}});
      return v*Math.min(1,(1-p)*8);
    });
    mono('sigh',1.25,(t,p)=> (Math.sin(2*Math.PI*(119*t-12*t*t))+
      .13*Math.sin(2*Math.PI*232*t))*Math.sin(Math.PI*p)**2*.035);
    mono('caress',.75,(t,p)=>Math.sin(2*Math.PI*174.615*t)*Math.sin(Math.PI*p)**2*.016);
    return bank;
  }
  const api={render,score,duration:LENGTH,sampleRate:RATE,title:'Borrowed Moonlight'};
  root.HushNocturne=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
