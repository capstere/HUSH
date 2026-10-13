/* HUSH 2.0 — deterministic game rules, independent of the DOM and audio. */
(function (root) {
  'use strict';
  const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
  function random(seed) {
    let x = seed >>> 0;
    return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const TOOLS = [
    { id: 'hush', name: 'Shhh', icon: 'hush', type: 'timing', hint: 'Tap while the breath is in the soft zone.', label: 'Shhh…', power: 23, risk: 17, cooldown: 4, duration: 2.4 },
    { id: 'pillow', name: 'Pillow', icon: 'pillow', type: 'hold', hint: 'Hold gently. Release inside the soft zone.', label: 'Adjust the pillow', power: 32, risk: 22, cooldown: 9, duration: 2.5 },
    { id: 'roll', name: 'Roll over', icon: 'roll', type: 'drag', hint: 'Hold & release in the zone, or slowly swipe the bed →', label: 'A little to the side', power: 37, risk: 28, cooldown: 15, duration: 2.8 },
    { id: 'pat', name: 'Gentle pats', icon: 'hand', type: 'rhythm', hint: 'Three gentle taps. About half a second apart.', label: 'Pat, pat, pat', power: 24, risk: 17, cooldown: 8, duration: 2 },
    { id: 'rain', name: 'Rain sounds', icon: 'rain', type: 'instant', hint: 'A little rain. A little peace. Lasts 18 seconds.', label: 'Let it rain', power: 15, risk: 3, cooldown: 27, duration: 1 },
    { id: 'tuck', name: 'Tuck in', icon: 'tuck', type: 'hold', hint: 'Hold & release in the zone. No blanket stealing.', label: 'Make a tiny cocoon', power: 21, risk: 14, cooldown: 12, duration: 2.2 },
    { id: 'hum', name: 'Hum softly', icon: 'hum', type: 'hold', hint: 'Hold a soft note. Release before the big finale.', label: 'A very small lullaby', power: 27, risk: 20, cooldown: 13, duration: 3 },
    { id: 'warm', name: 'Warm feet', icon: 'warm', type: 'hold', hint: 'Hold & release in the zone. Recover your patience.', label: 'Cold feet, warm heart', power: 13, risk: 10, cooldown: 17, duration: 2.8 }
  ];
  const MODES = { cozy: { name: 'Soft landing', drain: .70, growth: .83, risk: .80 }, normal: { name: 'An ordinary night', drain: 1, growth: 1, risk: 1 }, light: { name: 'Light sleeper', drain: 1.15, growth: 1.12, risk: 1.22 } };
  class Night {
    constructor(mode = 'normal', seed = Date.now(), duration = 120) {
      this.mode = MODES[mode] ? mode : 'normal'; this.config = MODES[this.mode];
      this.seed = seed >>> 0; this.rng = random(this.seed); this.duration = Math.max(20, duration);
      this.t = 0; this.noise = 65; this.wake = 8; this.patience = 100; this.status = 'playing';
      this.buffs = { side: 0, cozy: 0, rain: 0, calm: 0 }; this.cooldowns = {};
      this.queue = []; this.event = null; this.nextEvent = 20 + this.rng() * 7;
      this.last = ''; this.repeat = 0; this.pillowAt = -999; this.perfect = 0; this.moves = 0; this.quiet = 0; this.score = 0;
    }
    get progress() { return clamp(this.t / this.duration, 0, 1); }
    get phase() { return (this.t % 4.4) / 4.4; }
    get clock() { const min = 120 + Math.floor(300 * this.progress); return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
    ready(id) { return this.status === 'playing' && TOOLS.some(t => t.id === id) && !(this.cooldowns[id] > 0); }
    step(dt) {
      if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .1); this.t = Math.min(this.duration, this.t + dt);
      for (const key in this.cooldowns) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      for (const key in this.buffs) this.buffs[key] = Math.max(0, this.buffs[key] - dt);
      const relief = (this.buffs.side > 0 ? 1.65 : 0) + (this.buffs.rain > 0 ? 1 : 0) + (this.buffs.cozy > 0 ? .75 : 0) + (this.buffs.calm > 0 ? 1 : 0);
      this.noise = clamp(this.noise + (2.15 * this.config.growth + .35 * Math.sin(this.t * .27) - relief) * dt);
      this.wake = clamp(this.wake - (.64 + (this.noise < 30 ? .42 : 0)) * dt);
      this.patience = clamp(this.patience + (this.noise < 32 ? 1.65 : -(this.noise - 32) / 32 * this.config.drain) * dt);
      if (this.noise < 32) { this.quiet += dt; this.score += 9 * dt; }
      if (this.event) {
        this.event.left -= dt;
        if (this.event.left <= 0) { this.wake = clamp(this.wake + 15 * this.config.risk); this.noise = clamp(this.noise + 8); this.queue.push({ type: 'missed', kind: this.event.kind }); this.event = null; }
      } else if (this.t >= this.nextEvent && this.duration - this.t > 10) {
        const kind = this.rng() < .55 ? 'phone' : 'cat'; this.event = { kind, left: 7.5 };
        this.nextEvent = this.t + 23 + this.rng() * 12; this.queue.push({ type: 'event', kind });
      }
      this.checkEnd();
    }
    act(id, quality) {
      if (!this.ready(id) || !Number.isFinite(quality)) return null;
      const tool = TOOLS.find(t => t.id === id); const q = clamp(quality, 0, 1);
      this.repeat = this.last === id ? this.repeat + 1 : 0; this.last = id; this.moves++;
      this.cooldowns[id] = tool.cooldown;
      const repeated = this.repeat > 0; const potency = Math.max(.42, 1 - this.repeat * .23);
      const failed = q < .32;
      this.noise = clamp(this.noise - tool.power * q * potency + (failed ? 6 : 0));
      this.wake = clamp(this.wake + (tool.risk * (1 - q) * this.config.risk + (repeated ? 2 : 0)) - (q > .85 ? 3 : 0));
      if (q >= .85) this.perfect++;
      this.score += Math.round(80 * q); this.patience = clamp(this.patience + 3 * q);
      let combo = false;
      if (!failed) {
        if (id === 'pillow') this.pillowAt = this.t;
        if (id === 'roll') { this.buffs.side = 21 * q; if (this.t - this.pillowAt < 18) { combo = true; this.noise = clamp(this.noise - 12); this.score += 150; this.pillowAt = -999; } }
        if (id === 'rain') this.buffs.rain = 18;
        if (id === 'tuck') { this.buffs.cozy = 17 * q; this.patience = clamp(this.patience + 9 * q); }
        if (id === 'hum' || id === 'pat') this.buffs.calm = 11 * q;
        if (id === 'warm') this.patience = clamp(this.patience + 25 * q);
      }
      const result = { type: 'action', id, q, failed, repeated, combo };
      this.queue.push(result); this.checkEnd(); return result;
    }
    resolveEvent() {
      if (!this.event || this.status !== 'playing') return false;
      this.queue.push({ type: 'saved', kind: this.event.kind }); this.event = null; this.score += 100; return true;
    }
    checkEnd() {
      if (this.status !== 'playing') return;
      if (this.wake >= 100 || this.patience <= 0) {
        this.reason = this.patience <= 0 ? 'patience' : 'wake'; this.status = 'lost'; this.queue.push({ type: 'end' });
      } else if (this.t >= this.duration) {
        this.status = 'won'; this.score += Math.round(500 + this.patience * 5 + this.perfect * 20); this.queue.push({ type: 'end' });
      }
    }
  }
  const quality = x => x >= .52 && x <= .77 ? 1 : clamp(1 - Math.min(Math.abs(x - .52), Math.abs(x - .77)) * 3.5, 0, .8);
  const api = { Night, TOOLS, MODES, quality, clamp, random };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HushRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
