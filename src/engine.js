/* HUSH 4.0 — deterministic, DOM-free game rules. Fictional slapstick, no injury. */
(function (root) {
  'use strict';
  const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
  function random(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }
  const EVENTS = {
    fart: { name: 'An unexpected plot twist.', hint: 'Swipe the green cloud back and forth to fan it away.', time: 16 },
    nightmare: { name: 'Attack of the tiny nightmares.', hint: 'Tap all three dream monsters. Not your partner!', time: 16 },
    toilet: { name: 'Nature is calling. Quietly.', hint: 'Tap the bathroom door to sneak out.', time: 30 },
    sneeze: { name: 'Ah… ah… absolutely not.', hint: 'Drag the tissue from the right table to your nose.', time: 11 },
    breeze: { name: 'The window has joined the argument.', hint: 'Pull the glowing window latch DOWN to shut out the breeze.', time: 14 },
    phone: { name: 'Who texts at this hour?', hint: 'Tap the buzzing phone on the left bedside table.', time: 12 },
    cat: { name: 'The biscuit factory is open.', hint: 'Drag the cat onto the little rug at the foot of the bed.', time: 16 },
    duvet: { name: 'A hostile duvet takeover.', hint: 'Grab the blue duvet edge and pull it back to the right.', time: 16 },
    mosquito: { name: 'One extremely small helicopter.', hint: 'Tap the mosquito before it lands.', time: 12 }
  };
  const MODES = { cozy: .78, normal: 1, chaos: 1.22 };
  class Night {
    constructor(mode = 'normal', seed = Date.now(), training = false) {
      this.mode = MODES[mode] ? mode : 'normal'; this.rng = random(seed); this.training = training;
      this.t = 0; this.elapsed = 0; this.length = 150; this.status = 'playing'; this.reason = '';
      this.patience = 100; this.wake = 4; this.noise = 73; this.stir = 0; this.quiet = 0;
      this.battery = 82; this.headphones = false; this.bookTime = 0;
      this.shushing = false; this.shushUsed = 0; this.shushCooldown = 0; this.blanketCooldown = 0;
      this.event = null; this.nextEvent = 19; this.eventIndex = 0; this.lastHit = -20;
      this.stats = { nudges: 0, kicks: 0, closeCalls: 0, solved: 0, missed: 0, listening: 0 };
      this.pillowCooldown = 0; this.coolSide = 0; this.pillowCount = 0;
      this.catOnRug = false; this.messages = []; this.effects = []; this.serial = 0; this.lastMove = '';
      const shuffle = arr => arr.map(x => ({ x, k: this.rng() })).sort((a,b) => a.k-b.k).map(o => o.x);
      this.eventBag = [...shuffle(['fart','nightmare','toilet']), ...shuffle(['sneeze','breeze','phone','cat','duvet','mosquito'])];
    }
    get phase() { return this.status === 'lost' ? 'awake' : this.stir > 0 ? 'stirring' : this.noise < 32 ? 'peaceful' : 'asleep'; }
    get away() { return this.event?.id === 'toilet' && this.event.stage === 'walking'; }
    get floorSafe() { return (this.elapsed % 2.6) < 1.7; }
    say(text, mood = 'normal') { this.messages.push({ text, mood }); }
    fx(kind, strength = 1, detail = null) { this.effects.push({ kind, strength, detail, serial: ++this.serial }); }
    finish(status, reason = '') { this.status = status; this.reason = reason; this.shushing = false; if (this.event) this.event.holding = false; this.fx(status); }
    check() {
      this.patience = clamp(this.patience); this.wake = clamp(this.wake); this.noise = clamp(this.noise); this.battery = clamp(this.battery);
      if (this.training || this.status !== 'playing') return;
      if (this.wake >= 100) this.finish('lost', 'One nudge too many. Those eyes are definitely open.');
      else if (this.patience <= 0) this.finish('lost', 'You shouted “PLEASE.” The whole street heard.');
    }
    hit(kind, force = .4) {
      if (this.status !== 'playing' || this.away || this.elapsed-this.lastHit < .35) return false;
      const f = clamp(Number.isFinite(force) ? force : .4, 0, 1), foot = kind === 'foot';
      this.lastHit = this.elapsed; this.stats[foot ? 'kicks' : 'nudges']++; this.lastMove = kind;
      const danger = this.stir > 0;
      this.wake += danger ? 54 + f*32 : (foot ? 12 : 7) + f*24;
      if (this.event?.id === 'nightmare') this.wake += 12;
      this.noise -= (foot ? 35 : 27) + f*29; this.quiet = 4 + f*4;
      this.stir = (foot ? 4.8 : 3.6) + f*1.4;
      if (danger) { this.stats.closeCalls++; this.say('Too soon! They are waking up!', 'danger'); }
      else this.say(f > .78 ? 'That was a bit much. FREEZE.' : foot ? 'A little kick. Now play innocent.' : 'Nudge delivered. Now hold still.', 'warning');
      this.fx(foot ? 'kick' : 'nudge', f); this.check(); return true;
    }
    toggleHeadphones() {
      if (this.status !== 'playing' || this.away) return false;
      if (this.headphones) { this.headphones = false; this.say('Back on the charging stand. Peace was nice.'); this.fx('dock'); return true; }
      if (this.battery < 9) { this.say('Not enough battery. Let them charge a little longer.', 'warning'); return false; }
      this.headphones = true; this.say('Playing: The Incredibly Unimportant Adventures of Lord Turnip.'); this.fx('headphones'); return true;
    }
    setShush(on) {
      if (this.status !== 'playing' || this.away) return;
      if (on && this.shushCooldown <= 0) { this.shushing = true; this.shushUsed = 0; this.fx('shush'); }
      if (!on && this.shushing) { this.shushing = false; this.shushCooldown = 8; this.quiet = Math.max(this.quiet, 2); }
    }
    blanket() {
      if (this.event?.id === 'duvet') { this.resolve(true); this.fx('blanket'); return true; }
      if (this.status !== 'playing' || this.away || this.blanketCooldown > 0) return false;
      this.blanketCooldown = 15; this.noise -= 13; this.quiet = Math.max(this.quiet, 3); this.wake -= 3;
      this.say('A tiny tuck. A tiny truce.'); this.fx('blanket'); this.check(); return true;
    }
    pillow(force = .3) {
      if (this.status !== 'playing' || this.away || this.pillowCooldown > 0) return false;
      const f = clamp(Number.isFinite(force) ? force : .3, 0, 1);
      this.pillowCooldown = 18; this.pillowCount++;
      if (this.stir > 0 || f > .82) {
        this.wake += this.stir > 0 ? 40 : 24; this.stir = Math.max(this.stir, 4.3);
        this.say('Easy! The pillow is not a catapult.', 'warning');
      } else {
        this.coolSide = 17; this.noise -= 28; this.quiet = Math.max(this.quiet, 8);
        this.wake -= 3; this.say('The cool side. An entirely new personality.');
      }
      this.fx('pillow', f); this.check(); return true;
    }
    spawn(id) {
      if (!EVENTS[id] || this.event || this.status !== 'playing') return false;
      this.event = { id, left: EVENTS[id].time, progress: 0, popped: [], stage: 'waiting', holding: false, age: 0, squeak: 0 };
      this.say(EVENTS[id].name); this.fx(id); return true;
    }
    eventAction(action, value) {
      const e = this.event; if (!e || this.status !== 'playing') return false;
      if (e.id === 'fart' && action === 'fan') { e.progress = clamp(e.progress + Math.abs(value || 0)/540, 0, 1); this.fx('fan', .2); }
      else if (e.id === 'nightmare' && action === 'pop' && [0,1,2].includes(value) && !e.popped.includes(value)) { e.popped.push(value); e.progress = e.popped.length/3; this.fx('pop', 1, value); }
      else if (e.id === 'sneeze' && action === 'tissue') { e.progress = 1; this.fx('tissue'); }
      else if (e.id === 'breeze' && action === 'close') { e.progress = 1; this.fx('window'); }
      else if (e.id === 'phone' && action === 'tap') e.progress = 1;
      else if (e.id === 'cat' && action === 'rug') e.progress = 1;
      else if (e.id === 'duvet' && action === 'pull') e.progress = 1;
      else if (e.id === 'mosquito' && action === 'tap') e.progress = 1;
      else if (e.id === 'toilet' && action === 'enter') { e.stage = 'walking'; e.left = 28; this.headphones = false; this.say('Hold TIPTOE on green. Release on creaky red boards.'); this.fx('door'); }
      else if (e.id === 'toilet' && action === 'walk') e.holding = !!value;
      else return false;
      if (e.progress >= 1) this.resolve(true); return true;
    }
    resolve(success) {
      const e = this.event; if (!e) return;
      const jokes = { sneeze: 'Achoo? Never heard of them.', breeze: 'Outside can stay outside.', fart: 'Love is in the air. Not that bit, though.', nightmare: 'The tiny tax inspectors have been defeated.', toilet: 'Stealth bathroom mission: accomplished.', phone: '“Are you awake?” Not the point, Dave.', cat: 'The biscuit factory has relocated.', duvet: 'Joint custody of the duvet restored.', mosquito: 'Helicopter grounded.' };
      if (success) { if (e.id === 'cat') this.catOnRug = true; this.stats.solved++; this.patience += 9; this.wake -= 4; this.say(jokes[e.id]); this.fx(e.id === 'toilet' ? 'flush' : 'success'); if (e.id === 'nightmare') { this.noise -= 22; this.quiet = 6; } }
      else { if(e.id === 'sneeze') this.fx('sneeze-miss'); this.stats.missed++; this.patience -= e.id === 'fart' ? 22 : 15; this.wake += ['phone','nightmare','mosquito','sneeze'].includes(e.id) ? 22 : 8; this.say('A small disaster. We are not discussing it in the morning.', 'warning'); this.fx('miss'); }
      this.event = null; this.nextEvent = this.t + 10 + this.rng()*5; this.check();
    }
    step(dt) {
      if (this.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
      dt = Math.min(dt, .1); this.elapsed += dt;
      if (!this.training) this.t += dt;
      const m = MODES[this.mode];
      this.pillowCooldown = Math.max(0, this.pillowCooldown-dt); this.coolSide = Math.max(0, this.coolSide-dt);
      this.stir = Math.max(0, this.stir-dt); this.quiet = Math.max(0, this.quiet-dt);
      this.shushCooldown = Math.max(0, this.shushCooldown-dt); this.blanketCooldown = Math.max(0, this.blanketCooldown-dt);
      this.wake -= dt * (this.stir > 0 ? .8 : 4.1);
      this.noise += dt * (this.quiet > 0 ? -3.5 : (this.noise < 84 ? 4.1*m*(this.coolSide>0?.68:1) : Math.sin(this.elapsed)*.3));
      if (this.headphones) {
        this.battery -= dt*6.6; this.bookTime += dt; this.stats.listening += dt;
        if (this.battery <= 0) { this.headphones = false; this.say('Battery flat. Back on the stand to recharge.', 'warning'); this.fx('empty'); }
      } else this.battery += dt*4.5;
      if (this.shushing) { this.shushUsed += dt; this.noise -= dt*9; this.wake -= dt*.8; if (this.shushUsed >= 2.5) { this.setShush(false); this.say('Out of shhh. Catch your breath.'); } }
      if (!this.training) {
        const perceived = this.noise * (this.headphones || this.away ? .12 : 1);
        this.patience += dt * (perceived < 33 ? .76 : -(perceived-28)/67 * .94*m);
        if (this.event?.id === 'fart') this.patience -= dt*.6;
      }
      const e = this.event;
      if (e) {
        e.age += dt; e.left -= dt;
        if (e.id === 'toilet' && e.stage === 'walking' && e.holding) {
          if (this.floorSafe) { e.progress += dt/5.2; e.squeak = 0; }
          else { this.wake += dt*23*m; e.squeak += dt; if (e.squeak >= .45) { this.fx('creak'); e.squeak = 0; } }
        }
        if (e.progress >= 1) this.resolve(true); else if (e.left <= 0) this.resolve(false);
      } else if (!this.training && this.t >= this.nextEvent && this.stir <= 0 && this.t < this.length-12) {
        this.spawn(this.eventBag[this.eventIndex++ % this.eventBag.length]);
      }
      this.check(); if (this.status === 'playing' && !this.training && this.t >= this.length) this.finish('won');
    }
  }
  const api = { Night, clamp, random, EVENTS, MODES };
  root.HushGame = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
