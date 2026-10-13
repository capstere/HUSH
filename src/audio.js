/* HUSH 5.0: a gentle mix, independent music/effects, recoverable gesture audio.
 * Every sound is local. There are no recordings, downloads or speech services.
 */
(function(root) {
  'use strict';
  class Sound {
    constructor() {
      this.ctx=null; this.enabled=true; this.volume=.58; this.musicEnabled=true;
      this.musicVolume=.55; this.effectsVolume=.7; this.paused=false; this.available=true;
      this.pauseTimer=null; this.voices=new Set(); this.loops=[]; this.lastBreath=-1; this.wasAwake=false;
    }
    async unlock() {
      if(!this.enabled||!this.available)return false;
      if(this.pauseTimer){clearTimeout(this.pauseTimer);this.pauseTimer=null;}
      try {
        if(!this.ctx) {
          const AC=root.AudioContext||root.webkitAudioContext;
          if(!AC){this.available=false;return false;}
          const c=this.ctx=new AC();
          // Resume inside the actual gesture before generating PCM.
          const resumed=c.resume();
          this.master=c.createGain(); this.world=c.createGain(); this.book=c.createGain();
          this.music=c.createGain(); this.hum=c.createGain(); this.effects=c.createGain();
          this.master.gain.value=0; this.world.gain.value=1;
          this.book.gain.value=0; this.music.gain.value=0; this.hum.gain.value=0;
          const soft=c.createBiquadFilter();soft.type='lowpass';soft.frequency.value=2900;soft.Q.value=.45;
          const limit=c.createDynamicsCompressor();limit.threshold.value=-14;limit.knee.value=20;
          limit.ratio.value=4;limit.attack.value=.012;limit.release.value=.22;
          this.world.connect(soft);soft.connect(this.effects);this.book.connect(this.effects);
          this.hum.connect(this.effects);this.effects.connect(this.master);this.music.connect(this.master);
          this.master.connect(limit);limit.connect(c.destination);
          this.bank={...HushSoundBank(c),...HushNightSounds(c),...HushNocturne.render(c)};
          this.loop('room',.1,this.world);this.loop('book',.68,this.book);
          this.loop('moonlight',1,this.music);this.loop('humming',1,this.hum);
          await resumed;
        }
        if(this.ctx.state!=='running')await this.ctx.resume();
        this.mix();return this.ctx.state==='running';
      } catch (_) { this.available=false;return false; }
    }
    loop(name,gain,bus) {
      const c=this.ctx,s=c.createBufferSource(),g=c.createGain();
      s.buffer=this.bank[name];s.loop=true;g.gain.value=gain;s.connect(g);g.connect(bus);s.start();
      this.loops.push(s);
    }
    target(param,value,seconds=.18) {
      if(!param||!this.ctx)return;
      // Do not build unbounded AudioParam automation lists at frame rate.
      if(param._hushTarget===value)return;
      param._hushTarget=value;param.cancelScheduledValues(this.ctx.currentTime);
      param.setTargetAtTime(value,this.ctx.currentTime,seconds);
    }
    mix() {
      if(!this.ctx)return;
      if(this.paused||!this.enabled){
        if(!this.pauseTimer&&this.ctx.state==='running')this.pauseTimer=setTimeout(()=>{
          this.pauseTimer=null;
          if((this.paused||!this.enabled)&&this.ctx.state==='running')this.ctx.suspend().catch(()=>{});
        },350);
      }else if(this.pauseTimer){clearTimeout(this.pauseTimer);this.pauseTimer=null;}
      this.target(this.master.gain,this.enabled&&!this.paused?this.volume:0,.09);
      this.target(this.effects.gain,this.effectsVolume);
      if(this.paused||!this.enabled){this.target(this.book.gain,0);this.target(this.hum.gain,0);}
      this.target(this.music.gain,this.musicEnabled?this.musicVolume*(this.musicMood||.86):0,.4);
    }
    setPaused(value) { this.paused=value;if(value)this.stop();this.mix(); }
    stop() {
      for(const s of this.voices){try{
        const t=this.ctx.currentTime;
        if(s._hushGain){s._hushGain.cancelScheduledValues(t);s._hushGain.setTargetAtTime(0,t,.015);s.stop(t+.085);}
        else s.stop();
      }catch(_){}}this.voices.clear();
    }
    play(name,gain=1,pan=0,rate=1) {
      if(!this.ctx||this.ctx.state!=='running'||!this.enabled||this.paused||!this.bank[name])return;
      if(this.voices.size>20)return;
      const c=this.ctx,s=c.createBufferSource(),g=c.createGain();
      s.buffer=this.bank[name];s.playbackRate.value=rate;g.gain.value=gain;s._hushGain=g.gain;s.connect(g);
      let p=null;
      if(c.createStereoPanner){p=c.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(this.world);}
      else g.connect(this.world);
      this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();if(p)p.disconnect();};s.start();
    }
    tone(f=349.23,d=.3,gain=.018) {
      if(!this.ctx||this.ctx.state!=='running'||!this.enabled||this.paused)return;
      const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
      o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.045);
      g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.07,d));
      o._hushGain=g.gain;o.connect(g);g.connect(this.world);this.voices.add(o);
      o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start();o.stop(t+d+.04);
    }
    effect(e) {
      switch(e.kind) {
        case 'wake-up':this.stop();this.play('sigh',.8,-.3);break;
        case 'resettled':this.play('goodnight',.6);break;
        case 'tender':if(e.detail!=='lullaby')this.play('caress',.55,-.15);break;
        case 'fidget':this.play('fabric',.24);break;
        case 'pillow':this.play('pillow',.65,-.35);break;
        case 'breeze':this.play('wind',.6);break;
        case 'sneeze':this.play('sniff',.4,.45);break;
        case 'sneeze-miss':this.play('achoo',.5,.45);break;
        case 'tissue':this.play('pillow',.35,.45);this.play('sniff',.22,.45);break;
        case 'window':this.play('fabric',.35);break;
        case 'nudge':case 'kick':this.play('pat',e.kind==='kick'?.9:.6,-.35);this.play('fabric',.45);break;
        case 'fart':this.play('fart',.55,-.3);break;
        case 'cat':this.play('purr',.55);break;
        case 'flush':this.play('flush',.33,.65);break;
        case 'creak':this.play('creak',.42,.2,.86);break;
        case 'pop':this.play('pop',.45,-.6+(e.detail||0)*.3,1+(e.detail||0)*.125);break;
        case 'blanket':case 'door':case 'dock':this.play('fabric',.38);break;
        case 'shush':this.play('shush',.3,.3);break;
        case 'phone':this.tone(174.61,.38,.02);break;
        case 'headphones':this.tone(349.23,.3,.015);break;
        case 'empty':this.tone(174.61,.3,.012);break;
        case 'success':this.tone(523.25,.4,.015);break;
        case 'lost':this.stop();this.play('sigh',.8);break;
        case 'won':this.play('goodnight',.7);break;
      }
    }
    tick(n) {
      if(!this.ctx||this.ctx.state!=='running')return;
      this.musicMood=n.headphones?.3:n.awake?.69:.86;this.mix();
      if(!this.enabled||this.paused)return;
      this.target(this.world.gain,n.headphones?.24:1,.22);
      this.target(this.book.gain,n.headphones&&!n.awake&&n.status==='playing'?1:0,.2);
      this.target(this.hum.gain,n.awake&&n.care==='lullaby'&&n.status==='playing'?1:0,.25);
      if(n.status!=='playing')return;
      const b=Math.floor(n.elapsed/1.8);
      if(n.awake){this.wasAwake=true;return;}
      if(this.wasAwake){this.lastBreath=b;this.wasAwake=false;}
      if(b!==this.lastBreath){this.lastBreath=b;
        if(b%2===0&&n.noise>25&&n.stir<=0&&!n.away)this.play('snore'+(Math.floor(b/2)%3),.18+n.noise/250,-.35);
        else this.play('breath',.48,-.2);
      }
    }
  }
  root.HushAudio=Sound;
})(typeof globalThis!=='undefined'?globalThis:this);
