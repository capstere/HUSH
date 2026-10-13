/* User-gesture audio, quiet stereo ambience, breath-synchronised sound and soft foley. */
(function (root) {
  'use strict';
  class AudioRoom {
    constructor() { this.ctx = null; this.enabled = true; this.volume = .65; this.available = true; this.paused = false; this.phaseKey = ''; this.sources = new Set(); this.hum = null; }
    async unlock() {
      if (!this.enabled || !this.available) return false;
      try {
        if (!this.ctx) {
          const Context = root.AudioContext || root.webkitAudioContext;
          if (!Context) { this.available = false; return false; }
          this.ctx = new Context(); const c = this.ctx;
          this.master = c.createGain(); this.master.gain.value = this.volume;
          const limiter = c.createDynamicsCompressor(); limiter.threshold.value = -12; limiter.knee.value = 14; limiter.ratio.value = 5; limiter.attack.value = .008; limiter.release.value = .2;
          this.master.connect(limiter); limiter.connect(c.destination);
          this.bank = root.HushSoundBank(c);
          this.rain = this.loop('rain', 0); this.room = this.loop('room', .22);
        }
        // Called synchronously by click/pointer handlers, including Resume on iOS.
        if (this.ctx.state !== 'running') await this.ctx.resume();
        this.mix(); return this.ctx.state === 'running';
      } catch (_) { this.available = false; return false; }
    }
    loop(name, gain) {
      const c = this.ctx, source = c.createBufferSource(), g = c.createGain(); source.buffer = this.bank[name]; source.loop = true; source.loopStart = name === 'rain' ? .08 : name === 'room' ? .1 : 0; g.gain.value = gain; source.connect(g); g.connect(this.master); source.start(); return g;
    }
    mix() { if (this.ctx) this.master.gain.setTargetAtTime(this.enabled && !this.paused ? this.volume : 0, this.ctx.currentTime, .04); }
    setPaused(value) { this.paused = value; if (value) { this.stopVoices(); this.stopHum(); } this.mix(); }
    stopVoices() { for (const s of this.sources) { try { s.stop(); } catch (_) {} } this.sources.clear(); }
    play(name, gain = 1, pan = 0, rate = 1) {
      if (!this.ctx || this.ctx.state !== 'running' || !this.enabled || this.paused || !this.bank[name]) return;
      const c = this.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = this.bank[name]; s.playbackRate.value = rate; g.gain.value = gain; s.connect(g);
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.master); s.onended = () => { this.sources.delete(s); s.disconnect(); g.disconnect(); p.disconnect(); }; }
      else { g.connect(this.master); s.onended = () => { this.sources.delete(s); s.disconnect(); g.disconnect(); }; }
      this.sources.add(s); s.start(); return s;
    }
    tone(frequency, length = .45, gain = .045, delay = 0) {
      if (!this.ctx || this.ctx.state !== 'running' || !this.enabled || this.paused) return;
      const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = frequency;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .025); g.gain.exponentialRampToValueAtTime(.0001, t + length);
      o.connect(g); g.connect(this.master); this.sources.add(o); o.onended = () => { this.sources.delete(o); o.disconnect(); g.disconnect(); }; o.start(t); o.stop(t + length + .02);
    }
    startHum() { if (this.hum || !this.ctx || !this.enabled || this.paused) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.value = 196; g.gain.value = 0; g.gain.setTargetAtTime(.035, c.currentTime, .2); o.connect(g); g.connect(this.master); o.start(); this.hum = { o, g }; }
    stopHum() { if (!this.hum) return; const { o, g } = this.hum; this.hum = null; g.gain.setTargetAtTime(0, this.ctx.currentTime, .05); o.stop(this.ctx.currentTime + .2); o.onended = () => { o.disconnect(); g.disconnect(); }; }
    effect(id, good = true) {
      if (id === 'hush') this.play('shush', .6, .22);
      else if (['pillow', 'roll', 'tuck', 'warm'].includes(id)) this.play('fabric', .9, -.2, id === 'roll' ? .78 : 1);
      else if (id === 'pat') this.play('pat', .8, -.1);
      if (!good) this.tone(110, .25, .018);
    }
    event(kind) { if (kind === 'phone') { this.tone(115, .15, .04); this.tone(115, .15, .035, .22); } else { this.tone(420, .32, .023); this.tone(350, .3, .015, .13); } }
    finish(won) { this.stopVoices(); this.stopHum(); (won ? [261.63, 329.63, 392, 523.25] : [220, 196, 146.83]).forEach((f, i) => this.tone(f, 1, .035, i * .16)); }
    update(s) {
      if (!this.ctx) return;
      this.rain.gain.setTargetAtTime(s && s.buffs.rain > 0 ? .72 : 0, this.ctx.currentTime, 1.1);
      this.room.gain.setTargetAtTime(s ? .22 : .1, this.ctx.currentTime, .6);
      if (!s || s.status !== 'playing' || this.paused) return;
      const cycle = Math.floor(s.t / 4.4), exhale = s.phase >= .49;
      const key = cycle + ':' + exhale;
      if (key !== this.phaseKey) {
        this.phaseKey = key;
        if (exhale && s.noise > 24) this.play('snore' + (cycle % 3), .3 + s.noise / 100 * 1.8, -.35, s.buffs.side > 0 ? 1.1 : 1);
        else if (!exhale) this.play('breath', .75, -.25);
      }
    }
  }
  root.HushAudio = AudioRoom;
})(window);
