/* Original 4.0 sound design. The "audiobook" is generated nonsense, not speech or a recording. */
(function(root){
  'use strict';
  function make(ctx){
    const rate=22050,bank={};let seed=45671;
    const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/2147483648-1;};
    function buf(name,len,fn){const b=ctx.createBuffer(1,Math.ceil(rate*len),rate),a=b.getChannelData(0);fn(a);bank[name]=b;}
    buf('book',12,a=>{
      let phase=0,lp=0,res1=0,res2=0,last1=0,last2=0,f=110,form1=500,form2=1200,b1=0,b2=0,syllable=-1;
      for(let i=0;i<a.length;i++){
        const t=i/rate,s=Math.floor(t*5.6),p=(t*5.6)%1,phrase=t%3;
        if(s!==syllable){syllable=s;f=91+(rand()+1)*20;form1=290+(rand()+1)*170;form2=800+(rand()+1)*420;b1=2*.94*Math.cos(2*Math.PI*form1/rate);b2=2*.91*Math.cos(2*Math.PI*form2/rate);}
        const env=Math.sin(Math.PI*p)**.6*(phrase>2.45?.03:1)*Math.min(1,t*12,(12-t)*12);
        phase+=2*Math.PI*(f+4*Math.sin(t*4))/rate;
        const voiced=Math.sin(phase)+Math.sin(2*phase)*.4+Math.sin(3*phase)*.23+Math.sin(4*phase)*.16;
        const src=voiced*.07+(p<.13?rand()*.16:rand()*.015);
        const v1=src*.1+b1*res1-.94*.94*last1;last1=res1;res1=v1;
        const v2=src*.04+b2*res2-.91*.91*last2;last2=res2;res2=v2;
        lp+=.17*((v1+v2)*env-lp);a[i]=Math.tanh(lp*1.9)*.32;
      }
    });
    buf('fart',.78,a=>{let ph=0,lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;ph+=2*Math.PI*(65-31*p+5*Math.sin(t*31))/rate;lp+=.1*(rand()-lp);a[i]=(Math.sin(ph)*.1+Math.sin(ph*2)*.025+lp*.25)*Math.sin(Math.PI*p)**.6*(.65+.35*Math.sin(t*65)**2);}});
    buf('creak',.48,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate;lp+=.025*(rand()-lp);a[i]=(Math.sin(t*2100+Math.sin(t*38)*2)*.025+lp*.4)*Math.sin(Math.PI*i/a.length);}});
    buf('flush',1.9,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;lp+=.075*(rand()-lp);a[i]=(lp*.58+Math.sin(t*(460-t*74))*.012)*Math.sin(Math.PI*p)**.8;}});
    buf('pop',.17,a=>{for(let i=0;i<a.length;i++){const t=i/rate;a[i]=Math.sin(2*Math.PI*(380*t-640*t*t))*.09*Math.exp(-t*29)*Math.min(1,t*300);}});
    buf('purr',.9,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate;lp+=.035*(rand()-lp);a[i]=lp*(.4+.4*Math.sin(t*155))*.6*Math.sin(Math.PI*i/a.length);}});
    buf('wind',2.2,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;lp+=.023*(rand()-lp);a[i]=(lp*.5+Math.sin(t*510+Math.sin(t*4)*4)*.006)*Math.sin(Math.PI*p)**1.4;}});
    buf('sniff',.42,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;lp+=.23*(rand()-lp);a[i]=lp*.14*Math.sin(Math.PI*p)**2*(.8+.2*Math.sin(t*300));}});
    buf('achoo',.62,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;lp+=.12*(rand()-lp);const env=p<.32?Math.sin(p/.32*Math.PI)*.3:Math.exp(-(p-.32)*7);a[i]=(lp*.55+Math.sin(t*(730-t*160))*.024)*env*Math.min(1,t*55);}});
    buf('pillow',.65,a=>{let lp=0;for(let i=0;i<a.length;i++){const t=i/rate,p=i/a.length;lp+=.08*(rand()-lp);a[i]=(lp*.32+Math.sin(t*250)*.008)*Math.sin(Math.PI*p)**1.5;}});
    return bank;
  }
  root.HushNightSounds=make;
})(typeof globalThis!=='undefined'?globalThis:this);
