/* Gesture-unlocked, locally generated stereo sound. No network, microphone or speech service. */
(function(root){
  'use strict';
  class Sound{
    constructor(){this.ctx=null;this.enabled=true;this.volume=.6;this.paused=false;this.available=true;this.voices=new Set();this.lastBreath=-1;}
    async unlock(){
      if(!this.enabled||!this.available)return false;
      try{
        if(!this.ctx){const AC=root.AudioContext||root.webkitAudioContext;if(!AC){this.available=false;return false;}const c=this.ctx=new AC();this.master=c.createGain();this.world=c.createGain();this.book=c.createGain();this.master.gain.value=0;
          const limit=c.createDynamicsCompressor();limit.threshold.value=-13;limit.knee.value=16;limit.ratio.value=5;this.world.connect(this.master);this.book.connect(this.master);this.master.connect(limit);limit.connect(c.destination);
          this.bank={...HushSoundBank(c),...HushNightSounds(c)};this.loop('room',.2,this.world);this.book.gain.value=0;this.loop('book',1,this.book);
        }
        if(this.ctx.state!=='running')await this.ctx.resume();this.mix();return this.ctx.state==='running';
      }catch(_){this.available=false;return false;}
    }
    loop(name,gain,bus){const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=this.bank[name];s.loop=true;g.gain.value=gain;s.connect(g);g.connect(bus);s.start();}
    mix(){if(this.ctx)this.master.gain.setTargetAtTime(this.enabled&&!this.paused?this.volume:0,this.ctx.currentTime,.04);}
    setPaused(value){this.paused=value;if(value)this.stop();this.mix();}
    stop(){for(const s of this.voices){try{s.stop();}catch(_){}}this.voices.clear();}
    play(name,gain=1,pan=0,rate=1){if(!this.ctx||this.ctx.state!=='running'||!this.enabled||this.paused||!this.bank[name])return;const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=this.bank[name];s.playbackRate.value=rate;g.gain.value=gain;s.connect(g);let p=null;if(c.createStereoPanner){p=c.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(this.world);}else g.connect(this.world);this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();if(p)p.disconnect();};s.start();}
    tone(f=390,d=.2,gain=.03){if(!this.ctx||!this.enabled||this.paused)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=0;g.gain.linearRampToValueAtTime(gain,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g);g.connect(this.world);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start();o.stop(c.currentTime+d+.02);}
    effect(e){switch(e.kind){case'nudge':case'kick':this.play('pat',e.kind==='kick'?1.6:1,-.35);this.play('fabric',.7);break;case'fart':this.play('fart',.9,-.3);break;case'cat':this.play('purr',.8);break;case'flush':this.play('flush',.55,.65);break;case'creak':this.play('creak',1,.2);break;case'pop':this.play('pop',.7);break;case'blanket':case'door':case'dock':this.play('fabric',.6);break;case'shush':this.play('shush',.6,.3);break;case'phone':this.tone(155,.3,.045);break;case'headphones':this.tone(370,.12,.025);break;case'empty':this.tone(145,.22,.025);break;case'success':this.tone(520,.16,.02);break;case'lost':this.stop();this.tone(110,.8,.025);break;case'won':this.tone(392,.6);this.tone(587,.9,.015);break;}}
    tick(n){if(!this.ctx||this.ctx.state!=='running')return;const c=this.ctx;this.world.gain.setTargetAtTime(n.headphones?.2:1,c.currentTime,.2);this.book.gain.setTargetAtTime(n.headphones&&n.status==='playing'?1:0,c.currentTime,.15);
      if(!this.enabled||this.paused||n.status!=='playing')return;const b=Math.floor(n.elapsed/1.8);if(b!==this.lastBreath){this.lastBreath=b;if(b%2===0&&n.noise>25&&n.stir<=0&&!n.away)this.play('snore'+(Math.floor(b/2)%3),.4+n.noise/110,-.35);else this.play('breath',.65,-.2);}}
  }
  root.HushAudio=Sound;
})(typeof globalThis!=='undefined'?globalThis:this);
