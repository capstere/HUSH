/* HUSH 4.0 — bounded, timestep-stable animation systems. No gameplay decisions. */
(function (root) {
  'use strict';
  const { clamp, random } = HushGame;
  const TAU = Math.PI * 2;
  class Cloth {
    constructor(count = 19) { this.y = new Float32Array(count); this.v = new Float32Array(count); }
    kick(x, strength = 1) {
      const at = clamp((x - 66) / 267, 0, 1) * (this.y.length - 1);
      for (let i = 1; i < this.y.length - 1; i++) this.v[i] += Math.exp(-Math.pow((i - at) / 2, 2)) * strength * 130;
    }
    step(dt, reduced) {
      if (reduced) { this.y.fill(0); this.v.fill(0); return; }
      const steps = Math.max(1, Math.ceil(dt / .008));
      const d = Math.min(dt, .08) / steps;
      for (let k = 0; k < steps; k++) {
        for (let i = 1; i < this.y.length - 1; i++) {
          const laplace = this.y[i-1] + this.y[i+1] - 2 * this.y[i];
          this.v[i] += (laplace * 190 - this.y[i] * 44 - this.v[i] * 8) * d;
        }
        for (let i = 1; i < this.y.length - 1; i++) this.y[i] = clamp(this.y[i] + this.v[i] * d, -17, 17);
      }
    }
    sample(x) {
      const f = clamp((x - 66) / 267, 0, 1) * (this.y.length - 1), i = Math.floor(f), j = Math.min(i+1, this.y.length-1);
      return this.y[i] + (this.y[j] - this.y[i]) * (f - i);
    }
  }
  class Theatre {
    constructor() { this.reset(); }
    reset() {
      this.time = 0; this.cloth = new Cloth(); this.particles = []; this.trail = [];
      this.rng = random(48041); this.impact = 0; this.impactKind = 'nudge';
      this.pillow = 0; this.side = 0; this.stir = 0; this.phones = 0; this.snore = -1;
      this.popIndex = 0; this.pose = {x:366, y:172}; this.vx = 0; this.vy = 0;
      this.lastHand = null; this.lastFoot = null; this.release = 0; this.fxSerial = 0;
      this.tissue = 0; this.success = 0; this.endAge = 0; this.prior = '';
    }
    emit(x, y, kind = 'spark', count = 8, strength = 1) {
      for (let i = 0; i < count && this.particles.length < 80; i++) {
        const a = this.rng() * TAU, s = (12 + this.rng() * 45) * strength;
        this.particles.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-12,
          age:0, life:.45+this.rng()*.65, size:1.2+this.rng()*2.5,
          spin:this.rng()*TAU, kind });
      }
    }
    effect(e, points, night) {
      this.fxSerial = e.serial;
      if (e.kind === 'nudge' || e.kind === 'kick') {
        const p = e.kind === 'kick' ? points.footTarget : points.armTarget;
        this.impact = .6 + e.strength*.7; this.impactKind = e.kind;
        this.cloth.kick(p.x, this.impact); this.emit(p.x, p.y, 'impact', 7, .5+e.strength);
      }
      if (e.kind === 'pillow') { this.pillow = 1; this.cloth.kick(118, -.6); this.emit(104, 127, 'feather', 7); }
      if (e.kind === 'blanket') this.cloth.kick(302, -.8);
      if (e.kind === 'pop') {
        const i = typeof e.detail === 'number' ? e.detail : this.popIndex++ % 3;
        this.emit(85+i*49,52,'star',16); this.success = .3;
      }
      if (e.kind === 'success') { this.success = 1; this.emit(211, 219, 'heart', 6, .55); }
      if (e.kind === 'tissue') { this.tissue = 1; this.emit(269,150,'puff',8,.5); }
      if (e.kind === 'sneeze-miss') { this.impact = 1.5; this.cloth.kick(266,1); this.emit(260,158,'puff',16,1); }
      if (e.kind === 'dock') this.emit(365,196,'charge',8,.4);
      if (e.kind === 'won') { this.endAge = .001; this.emit(201,120,'heart',16,.8); }
    }
    step(dt, n, g, hand, foot, reduced) {
      dt = Math.min(.06, Math.max(0,dt)); this.time += dt;
      const ease = (a,b,k=9) => a+(b-a)*(1-Math.exp(-dt*k));
      this.impact = ease(this.impact,0,7); this.pillow = ease(this.pillow,0,3);
      this.side = ease(this.side,n.coolSide>0?.72:0,2); this.stir = ease(this.stir,n.stir>0?1:0,7);
      this.phones = ease(this.phones,n.headphones?1:0,6); this.tissue = ease(this.tissue,0,2.5);
      this.success = ease(this.success,0,2); this.cloth.step(dt,reduced);
      if (this.endAge) this.endAge += dt;
      const target = g?.kind === 'headphones' ? g.pos : n.headphones ? {x:266,y:128} : {x:366,y:172};
      if (g?.kind === 'headphones' || reduced) this.pose = {...target};
      else { this.pose.x = ease(this.pose.x,target.x,12); this.pose.y = ease(this.pose.y,target.y,12); }
      if (!reduced) {
        for (const [p,key] of [[hand,'lastHand'],[foot,'lastFoot']]) {
          if (this[key] && g?.kind === (key==='lastHand'?'hand':'foot')) {
            const d = Math.hypot(p.x-this[key].x,p.y-this[key].y);
            if (d > 1.2 && this.trail.length<18) this.trail.push({x:p.x,y:p.y,age:0,foot:key==='lastFoot'});
          }
          this[key] = {x:p.x,y:p.y};
        }
        const phase = (n.elapsed % 3.6) / 3.6;
        const beat = Math.floor(n.elapsed/3.6);
        if (phase<.42 && beat!==this.snore && n.noise>38 && n.stir<=0 && !n.away && this.particles.length < 80) {
          this.snore=beat;
          this.particles.push({x:151,y:153,vx:12,vy:-15,age:0,life:1.5,size:3.5,spin:0,kind:'breath'});
        }
      } else { this.trail.length=0; this.particles.length=0; }
      for (const p of this.particles) { p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*1.6);p.vy+=dt*(p.kind==='feather'?7:-2);p.spin+=dt*2; }
      for (const p of this.trail) p.age+=dt;
      this.trail=this.trail.filter(p=>p.age<.14);this.particles=this.particles.filter(p=>p.age<p.life);
    }
    drawUnder(c, n, reduced) {
      c.save();
      // A window-shaped pool of light, not screen shake. Hit coordinates stay stable.
      const dawn = clamp((n.t/n.length-.62)/.38,0,1);
      const light = c.createLinearGradient(0,0,350,420);
      light.addColorStop(0,dawn?'rgba(246,200,148,.16)':'rgba(161,208,223,.09)'); light.addColorStop(1,'rgba(100,140,200,0)');
      c.fillStyle=light;c.beginPath();c.moveTo(88,8);c.lineTo(241,8);c.lineTo(399,460);c.lineTo(209,425);c.closePath();c.fill();
      if (!reduced) for(let i=0;i<13;i++) {
        const x=95+(i*23.7)%244+Math.sin(this.time*.15+i)*7, y=(i*51+this.time*3)%480;
        c.globalAlpha=.12+Math.sin(i+this.time)*.06;c.fillStyle='#f1e9d0';c.beginPath();c.arc(x,y,.55+(i%3)*.3,0,TAU);c.fill();
      }
      c.globalAlpha=1;
      // Small crescent window. The bedside props never occupy the character controls.
      c.fillStyle='#0b1828';c.strokeStyle='#607b8b';c.lineWidth=1.2;c.beginPath();c.roundRect?.(141,0,117,28,6);
      if(!c.roundRect)c.rect(141,0,117,28);c.fill();c.stroke();
      c.fillStyle='#e9cca0';c.beginPath();c.arc(225,10,7,0,TAU);c.fill();c.fillStyle='#0b1828';c.beginPath();c.arc(228,7,6,0,TAU);c.fill();
      c.fillStyle='#c5d8d7';for(let i=0;i<5;i++)c.fillRect(150+i*13,5+(i*7)%14,1,1);
      c.strokeStyle='#496577';c.beginPath();c.moveTo(200,1);c.lineTo(200,28);c.stroke();
      c.restore();
    }
    drawTrail(c, reduced) {
      if(reduced)return;
      for(const p of this.trail){c.save();c.globalAlpha=(1-p.age/.14)*.11;c.fillStyle=p.foot?'#bedbe4':'#f2d0a2';c.beginPath();c.ellipse(p.x,p.y,p.foot?13:10,p.foot?18:13,0,0,TAU);c.fill();c.restore();}
    }
    drawTop(c,n,reduced) {
      if (reduced) return;
      for (const p of this.particles) {
        c.save();c.translate(p.x,p.y);c.rotate(p.spin);c.globalAlpha=Math.sin(Math.PI*clamp(p.age/p.life,0,1))*.8;
        c.strokeStyle=p.kind==='impact'?'#efd2a8':p.kind==='star'?'#d2c2f4':'#c3d8d4';c.fillStyle=c.strokeStyle;c.lineWidth=1.2;
        const s=p.size;
        if(['star','impact','charge'].includes(p.kind)){c.beginPath();c.moveTo(-s*2,0);c.lineTo(s*2,0);c.moveTo(0,-s*2);c.lineTo(0,s*2);c.stroke();}
        else if(p.kind==='feather'){c.beginPath();c.ellipse(0,0,s, s*3, .4,0,TAU);c.fill();c.strokeStyle='#738f9d';c.beginPath();c.moveTo(0,-s*3);c.lineTo(0,s*3);c.stroke();}
        else if(p.kind==='heart'){c.beginPath();c.moveTo(0,s);c.bezierCurveTo(-s*3,-s,-s,-s*3,0,-s);c.bezierCurveTo(s,-s*3,s*3,-s,0,s);c.fill();}
        else {c.beginPath();c.ellipse(0,0,s+p.age*6,s+p.age*3,0,0,TAU);c.stroke();}
        c.restore();
      }
      // Battery charge travels up the stand; headphones get a subtle halo, not an equalizer panel.
      if(!n.headphones && n.battery<99){c.save();c.strokeStyle='#b8d3be';c.globalAlpha=.7;c.lineWidth=2;const y=206-(this.time*18)%49;c.beginPath();c.moveTo(363,y);c.lineTo(369,y-4);c.stroke();c.restore();}
      if(n.stir>0){c.save();c.strokeStyle='#e9bc8280';c.lineWidth=2;c.beginPath();c.ellipse(137,127,43,49,0,-Math.PI/2,-Math.PI/2+TAU*clamp(n.stir/6.2,0,1));c.stroke();c.restore();}
    }
  }
  root.HushMotion = { Cloth, Theatre };
  if (typeof module!=='undefined' && module.exports) module.exports = root.HushMotion;
})(typeof globalThis!=='undefined'?globalThis:this);
