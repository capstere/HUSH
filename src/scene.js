/* HUSH 5.0 — original top-down illustration, two-bone limbs and spring animation. */
(function (root) {
  'use strict';
  const {clamp, random} = HushGame;
  const C = { night:'#111d2c', ink:'#243749', paper:'#efeada', pencil:'#8195a0', blue:'#416c94', fold:'#638aac', deep:'#305776', mint:'#b5d2bd', gold:'#e9bc82', rose:'#ec9b8c' };
  const P = { pillow:{x:84,y:121}, tissue:{x:369,y:310}, window:{x:200,y:18}, hand:{x:261,y:284}, foot:{x:262,y:439}, armTarget:{x:169,y:211}, footTarget:{x:157,y:396}, dock:{x:366,y:178}, head:{x:266,y:135}, rug:{x:58,y:483}, cat:{x:186,y:386}, blanket:{x:320,y:258}, phone:{x:33,y:191}, door:{x:370,y:418}, tiptoe:{x:200,y:445} };
  const paths = new Map();
  function path(c,d,fill=C.paper,stroke=C.ink,w=1.6) { let p=paths.get(d);if(!p){p=new Path2D(d);if(paths.size<140)paths.set(d,p);} if(fill){c.fillStyle=fill;c.fill(p);} if(stroke){c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.strokeStyle=stroke;c.stroke(p);} }
  function line(c,d,color=C.pencil,w=1.4) { path(c,d,null,color,w); }
  function ellipse(c,x,y,rx,ry,fill,stroke=null,w=1.5) { c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();} }
  function rect(c,x,y,w,h,r,fill,stroke=null) { c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();} }
  function text(c,s,x,y,size=12,color=C.paper,serif=false) { c.fillStyle=color;c.font=`${serif?'italic ':''}${size}px ${serif?'Georgia,serif':'system-ui,sans-serif'}`;c.textAlign='center';c.fillText(s,x,y); }
  function tForFan(t){return t*14;}
  function mix(a,b,dt,k=10) { return a+(b-a)*(1-Math.exp(-dt*k)); }
  function bone(a,b,l1,l2,side=1) { const dx=b.x-a.x,dy=b.y-a.y,d=clamp(Math.hypot(dx,dy),.01,l1+l2-.1),angle=Math.atan2(dy,dx),bend=Math.acos(clamp((d*d+l1*l1-l2*l2)/(2*d*l1),-1,1)); return {x:a.x+Math.cos(angle+side*bend)*l1,y:a.y+Math.sin(angle+side*bend)*l1}; }
  class Bedroom {
    constructor(canvas) {
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.time=0;this.scale=1;this.ox=0;this.oy=0;
      this.hand={...P.hand,vx:0,vy:0};this.foot={...P.foot,vx:0,vy:0};this.impulse=0;this.fan=0;this.cozy=0;this.rings=[];this.motion=false;
      this.sit=0;this.drift=0;this.fx=new HushMotion.Theatre();this.pointer=null;this.frameState=null;
      this.back=document.createElement('canvas');this.back.width=400;this.back.height=520;this.background(this.back.getContext('2d'));this.resize();
    }
    reset() { this.sit=0;this.drift=0;this.fx.reset();this.impulse=this.cozy=this.fan=0;this.rings=[];this.hand={...P.hand,vx:0,vy:0};this.foot={...P.foot,vx:0,vy:0}; }
    resize() { const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.dpr=d;this.scale=Math.min(r.width/400,r.height/520);this.ox=(r.width-400*this.scale)/2;this.oy=(r.height-520*this.scale)/2; }
    world(x,y) { const r=this.canvas.getBoundingClientRect();return {x:(x-r.left-this.ox)/this.scale,y:(y-r.top-this.oy)/this.scale}; }
    screen(p) { const r=this.canvas.getBoundingClientRect();return {x:r.left+this.ox+p.x*this.scale,y:r.top+this.oy+p.y*this.scale}; }
    background(c) {
      const g=c.createRadialGradient(207,228,35,200,250,320);g.addColorStop(0,'#284052');g.addColorStop(1,'#111d2c');c.fillStyle=g;c.fillRect(0,0,400,520);
      // Moonlight through the off-screen window; woven rug and walnut bedside tables.
      path(c,'M0 19 37 0 399 313 399 394Z','#c3dbe607',null);
      for(let i=0;i<6;i++)line(c,`M${i*80-140} 0 ${i*80+300} 520`,'#bfd7de08',1);
      rect(c,50,47,297,418,22,'#21394b');rect(c,59,51,282,406,16,'#8cabb8');rect(c,63,58,274,393,13,'#a0c1cc');
      rect(c,58,33,284,40,10,'#36576b');line(c,'M67 43H332','#6c8b9a',1);line(c,'M68 66H333','#152c3f',2);
      rect(c,7,130,44,113,8,'#213141','#456071');rect(c,348,129,44,111,8,'#213141','#456071');
      line(c,'M11 220H46 M352 218H387','#638093',1);ellipse(c,28,232,2,1,C.gold);ellipse(c,370,232,2,1,C.gold);
      rect(c,13,134,30,16,4,'#142332');text(c,'02:00',28,145,7,C.gold);
      line(c,'M362 204 Q350 217 369 224 Q390 238 383 275','#759595',1.5);
      rect(c,23,460,70,38,15,'#566168');for(let i=0;i<10;i++)line(c,`M${27+i*7} 465v27`,'#758078',1);
      rect(c,354,377,36,78,3,'#142332','#648593');line(c,'M360 448V384h24v64','#879a8c',1);ellipse(c,380,418,2,2,C.gold);
      const r=random(711);for(let i=0;i<5200;i++){c.fillStyle=r()>.5?'#ffffff05':'#00000008';c.fillRect(r()*400,r()*520,r()*1.5+.3,r()*1.5+.3);}
    }
    pick(p,n) {
      const near=(q,r=26)=>Math.hypot(p.x-q.x,p.y-q.y)<Math.max(r,23/this.scale);
      if(n.away)return near(P.tiptoe,45)?{kind:'tiptoe'}:null;
      const e=n.event;
      if(n.awake&&near({x:137,y:100-this.sit*17},32))return {kind:'caress'};
      if(e?.id==='sneeze'&&near(P.tissue,29))return {kind:'tissue'};
      if(e?.id==='breeze'&&near(P.window,28))return {kind:'window'};
      if(near(P.pillow,18))return {kind:'pillow'};
      if(e?.id==='nightmare'){for(let i=0;i<3;i++)if(!e.popped.includes(i)&&near(this.ghost(i),20))return {kind:'ghost',index:i};}
      if(e?.id==='phone'&&near(P.phone))return {kind:'phone'};
      if(e?.id==='mosquito'&&near(this.bug(),25))return {kind:'mosquito'};
      if(e?.id==='cat'&&near(P.cat,38))return {kind:'cat'};
      if(near(n.headphones?P.head:P.dock,30))return {kind:'headphones'};
      if(near(this.hand,28))return {kind:'hand'};
      if(near(this.foot,29))return {kind:'foot'};
      if(e?.id==='fart'&&p.x>80&&p.x<322&&p.y>295&&p.y<404)return {kind:'fan'};
      if(near(P.blanket,23))return {kind:'blanket'};
      if(e?.id==='toilet'&&near(P.door,30))return {kind:'door'};
      if(near(P.head,26))return {kind:'shush'};
      return null;
    }
    ghost(i) { return {x:85+i*49,y:52+Math.sin(this.time*2+i)*5}; }
    bug() { return {x:200+Math.sin(this.time*1.4)*100,y:81+Math.cos(this.time*1.8)*25}; }
    effect(e) { if(e.kind==='resettled')this.drift=2.8;this.fx.effect(e,P,this.frameState);if(['nudge','kick'].includes(e.kind))this.impulse=1+e.strength;if(e.kind==='fan')this.fan=1;if(e.kind==='blanket')this.cozy=1;if(['pop','success','headphones'].includes(e.kind))this.rings.push({age:0,kind:e.kind}); }
    spring(p,target,dt,dragged) {
      if(dragged){p.x=target.x;p.y=target.y;p.vx=p.vy=0;return;}
      const steps=Math.max(1,Math.ceil(dt/.015));for(let i=0;i<steps;i++){const d=dt/steps;p.vx+=(target.x-p.x)*170*d;p.vy+=(target.y-p.y)*170*d;p.vx*=Math.exp(-13*d);p.vy*=Math.exp(-13*d);p.x+=p.vx*d;p.y+=p.vy*d;}
    }
    pillow(c,x,y,rotation=0) { c.save();c.translate(x,y);c.rotate(rotation);ellipse(c,0,5,58,43,'#1c334522');path(c,'M-55-38Q-36-30-8-35Q28-31 55-39L51-5 57 40Q25 34-6 38Q-35 33-57 41L-52 8Z',C.paper,C.pencil);line(c,'M-47-28-39-20M47-28 39-19M-45 29-38 23M45 29 37 23','#a3b1b0',1);c.restore(); }
    head(c,x,y,n,you=false) {
      const t=this.time,stir=n.stir>0,lost=n.status==='lost',wide=n.awake&&!you,breath=Math.max(0,Math.sin(n.elapsed*Math.PI/1.8));
      c.save();c.translate(x,y);c.rotate(you?(n.headphones?Math.sin(t*1.3)*.055:-.07):(Math.sin(t*27)*this.impulse*.035+(wide?-.11+Math.sin(t*.8)*.025:stir?.07:breath*.018)+(wide?0:this.fx.side*.34)));
      if(!you){const squash=this.motion?0:Math.sin(this.fx.impact*4)*this.fx.impact*.045;c.scale(1+squash,1-squash);}
      if(you && n.event?.id==='sneeze' && !this.motion)c.translate(Math.sin(t*23)*Math.min(1,n.event.age/9),Math.sin(t*17)*.7);
      if(you){path(c,'M-32 19Q-45 38-49 54L-29 48 29 49 50 54Q38 31 37 6L39-19Q33-50 6-45Q-24-51-37-26Z','#d8dacf',C.pencil);line(c,'M-29-25Q-44-1-36 35M27-31Q42-1 33 34','#819698',1.5);}
      ellipse(c,-31,1,5,9,C.paper,C.pencil);ellipse(c,31,1,5,9,C.paper,C.pencil);
      path(c,'M-31-18Q-32-40 1-39Q31-38 32-12L28 15Q18 35 0 36Q-23 29-29 11Z',C.paper,C.ink);
      if(you){line(c,'M-29-17Q-18-34 1-34L29-15',C.pencil,2);const calm=n.headphones||(n.noise<30&&!n.awake)||n.care==='lullaby';
        if(calm||t%7<.17){line(c,'M-22 0q7 5 13 0M9 0q7 5 13 0',C.ink,1.8);}else{line(c,'M-23-9-9-5M9-5 23-9',C.ink,2);const glance=this.pointer?clamp((this.pointer.x-266)/55,-2.5,2.5):-1.4;ellipse(c,-15+glance,0,2,3,C.ink);ellipse(c,15+glance,0,2,3,C.ink);line(c,'M-21 8h12M10 8h11','#9faca9',1);}
        if(n.event?.id==='sneeze'){line(c,'M-22 0l13-3M9-3l13 3',C.ink,2);ellipse(c,0,23,4,5+Math.sin(t*5)*2,C.ink);}else if(n.shushing||n.care==='lullaby')ellipse(c,0,23,4,5,C.ink);else line(c,calm?'M-8 23q9 6 17-1':'M-9 26q9-5 18 0',C.ink,1.7);
      }else{
        if(wide){
          const openness=Math.max(.8,7.4*(1-n.settle/105)),blink=t%4.6<.13;
          for(const x of [-15,15]){ellipse(c,x,-1,6.7,blink?1:openness,C.paper,C.ink,1.3);if(!blink){ellipse(c,x+1,-1,2,Math.min(2.7,openness*.58),C.ink);}}
          line(c,n.settle>60?'M-23-10q8-2 15 0M9-10q8-2 15 0':'M-23-13-9-10M9-10 24-14',C.ink,1.6);
          if(n.settle>55&&Math.sin(n.awakeTime*1.6)>.65)ellipse(c,1,22,6,7,C.ink);
          else line(c,n.settle>45?'M-8 22q9 6 17 0':'M-9 24q9-3 18 0',C.ink,1.6);
        }
        else if(lost){ellipse(c,-15,-1,7,8,C.paper,C.ink);ellipse(c,15,-1,7,8,C.paper,C.ink);ellipse(c,-12,0,2.5,3,C.ink);ellipse(c,17,0,2.5,3,C.ink);line(c,'M-22-13-9-9M9-9 23-14M-9 23q9-4 18 0',C.ink,2);}
        else if(stir){line(c,'M-22 0q7 5 13 0M9 1q6-4 14-1M-8 25h17',C.ink,1.8);ellipse(c,16+clamp(((this.pointer?.x||260)-140)/85,-2,2),0,2,1.5+this.fx.stir*1.1,C.ink);line(c,'M10-10q8-5 14-1',C.ink,1.4);}
        else{line(c,'M-23-1q7 6 14 0M10-1q7 6 14 0',C.ink,1.8);ellipse(c,1,22,7,2+breath*n.noise/13,C.ink);ellipse(c,2,25,4,1.6,'#c79787');}
        path(c,'M-31 3Q-46-6-33-16Q-50-24-30-29Q-38-45-20-39Q-20-57-5-42Q9-58 18-41Q35-49 32-29Q47-29 34-9L20-19 14-6 5-24-6-11-12-28-21-12-27-20Z','#dcded2',C.ink);
        line(c,'M-32-23-19-31-14-21M-19-39-1-21-4-38M7-39 20-23 26-33',C.pencil,1.2);
        for(let i=0;i<7;i++)line(c,`M${-20+i*6} ${25+Math.sin(i/6*Math.PI)*7}l-1 3`,C.pencil,1);
      }
      line(c,'M0 0-2 10 3 12',C.pencil,1.5);c.restore();
    }
    headset(c,x,y,size=1,on=false,battery=80) {
      c.save();c.translate(x,y);c.scale(size,size);c.shadowColor='#09172588';c.shadowBlur=on?0:6;
      c.beginPath();c.arc(0,-4,34,Math.PI,0);c.strokeStyle='#172d3c';c.lineWidth=10;c.stroke();c.strokeStyle=C.gold;c.lineWidth=5;c.stroke();
      rect(c,-41,-9,14,32,6,'#273747',C.gold);rect(c,27,-9,14,32,6,'#273747',C.gold);line(c,'M-34-3v18M34-3v18','#f3d3a0',2);
      c.shadowBlur=0;if(!on){rect(c,-22,38,44,5,2,'#142c3a');rect(c,-22,38,44*battery/100,5,2,battery<15?C.rose:C.mint);}
      c.restore();
    }
    limb(c,p,foot=false) {
      const reach=!foot&&this.frameState?.awake;const a=foot?{x:278,y:268}:{x:240,y:198},elbow=bone(a,p,foot?90:reach?82:56,foot?94:reach?83:57,foot?-1:1);
      c.save();c.lineCap='round';c.lineJoin='round';
      // Soft rounded joints and contact shadows give the limbs weight on the duvet.
      const ux=(elbow.x-a.x)*.86+a.x,uy=(elbow.y-a.y)*.86+a.y,dx=elbow.x+(p.x-elbow.x)*.18,dy=elbow.y+(p.y-elbow.y)*.18;
      c.save();c.translate(2,3);c.strokeStyle='#152c4930';c.lineWidth=foot?28:20;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(ux,uy);c.quadraticCurveTo(elbow.x,elbow.y,dx,dy);c.lineTo(p.x,p.y);c.stroke();c.restore();
      for(const [color,width] of [[C.ink,foot?27:19],[foot?'#64839f':C.paper,foot?24:16]]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(ux,uy);c.quadraticCurveTo(elbow.x,elbow.y,dx,dy);c.lineTo(p.x,p.y);c.stroke();}
      c.strokeStyle=foot?'#a3b8c733':'#ffffff38';c.lineWidth=foot?3:2;c.beginPath();c.moveTo(a.x-3,a.y+4);c.lineTo(ux-3,uy+3);c.quadraticCurveTo(elbow.x-3,elbow.y+2,dx-3,dy);c.stroke();
      const angle=Math.atan2(p.y-elbow.y,p.x-elbow.x)-Math.PI/2;c.translate(p.x,p.y);c.rotate(angle);
      if(foot){rect(c,-12,-13,24,37,10,C.paper,C.ink);line(c,'M-11-3h22M-11 2h22',C.blue,2);line(c,'M-5 14 5 15',C.pencil,1);}
      else{ellipse(c,0,3,10,14,C.paper,C.pencil,1.2);line(c,'M-5 2v10M0 2v12M5 2v9',C.pencil,1);ellipse(c,-9,-3,4,7,C.paper,C.pencil,1);}
      c.restore();
    }
    halo(c,p,label,active=false) {
      const radius=Math.max(22,20/this.scale),pulse=this.motion?0:Math.sin(this.time*3)*2;
      c.save();c.strokeStyle=active?C.rose:C.gold;c.lineWidth=1.4;c.globalAlpha=.65;c.setLineDash([3,5]);c.beginPath();c.arc(p.x,p.y,radius+pulse,0,Math.PI*2);c.stroke();c.setLineDash([]);c.globalAlpha=1;if(label)text(c,label,p.x,p.y+radius+13,10,C.gold);c.restore();
    }
    draw(n,dt,g=null,guide='',home=false) {
      if(!this.width||!this.height)this.resize();this.time+=this.motion?0:dt;this.pointer=g?.pos||null;this.frameState=n;
      this.fx.step(dt,n,g,this.hand,this.foot,this.motion);
      this.sit=mix(this.sit,n.awake?1-n.settle*.006:0,dt,3);this.drift=Math.max(0,this.drift-dt);
      const stroking=n.awake&&(n.care==='stroke'||g?.kind==='caress');
      const strokePoint=g?.kind==='caress'?{x:clamp(g.pos.x,105,170),y:clamp(g.pos.y,65,130)}:{x:137+(this.motion?0:Math.sin(this.time*2.7)*20),y:91-this.sit*8};
      this.spring(this.hand,g?.kind==='hand'?g.pos:stroking?strokePoint:g?.kind==='fan'?{x:232+Math.sin(tForFan(this.time))*22,y:276}:P.hand,dt,g?.kind==='hand');this.spring(this.foot,g?.kind==='foot'?g.pos:P.foot,dt,g?.kind==='foot');
      this.impulse=mix(this.impulse,0,dt,5);this.fan=mix(this.fan,0,dt,5);this.cozy=mix(this.cozy,0,dt,3);
      const c=this.ctx,t=this.time;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.translate(this.ox,this.oy);c.scale(this.scale,this.scale);c.drawImage(this.back,0,0);this.fx.drawUnder(c,n,this.motion);
      const vignette=c.createRadialGradient(206,243,103,200,260,325);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#07121b38');c.fillStyle=vignette;c.fillRect(0,0,400,520);
      const dawn=clamp((n.t/n.length-.73)*.55,0,.15);if(dawn){c.fillStyle=`rgba(255,190,119,${dawn})`;c.fillRect(0,0,400,520);}
      const breath=this.motion?0:Math.max(0,Math.sin(n.elapsed*Math.PI/1.8)),jolt=this.motion?0:Math.sin(t*32)*this.impulse*2;
      const dragLift=g?.kind==='pillow'?clamp((g.pos.x-g.start.x)/8,-7,12):0;
      const pillowBounce=this.motion?0:Math.sin(this.fx.time*19)*this.fx.pillow*5;
      c.save();c.translate(0,-dragLift+pillowBounce);c.translate(137,125);c.scale(1+this.fx.pillow*.055,1-this.fx.pillow*.09);c.translate(-137,-125);this.pillow(c,137+jolt,125,-.03+jolt*.003);if(n.coolSide>0){line(c,'M87 148q45 10 96-1','#90b9af',3);line(c,'M92 153q42 8 87-1','#90b9af',1);}c.restore();this.pillow(c,267,125,.02);
      // Shirts and the reference's hand-over-ear silhouette.
      c.save();c.translate(-this.sit*2,-this.sit*7);path(c,'M106 170Q83 176 83 223L185 236Q190 190 165 173L157 162H117Z',C.paper,C.pencil);line(c,'M103 196q26 10 64-1','#b7beb8',1);c.restore();
      path(c,'M239 170Q220 181 219 235H313Q315 187 288 173L283 158H249Z',C.paper,C.pencil);
      line(c,'M115 174q19 18 43 0M247 173q17 21 37 0',C.pencil);
      this.head(c,137+jolt+this.fx.side*6,127+(n.awake?0:breath)-dragLift*.65+pillowBounce*.4-this.sit*18,n);this.head(c,266,128,n,true);
      // Right arm remains over the ear, or relaxes while the audiobook is playing.
      path(c,n.headphones?'M303 193Q326 231 296 252L280 242Q306 228 294 207Z':'M298 198Q327 238 321 187L313 135Q307 119 302 136L307 179 307 197Z',C.paper,C.pencil);
      // Duvet has a responsive seam, pinstripes, embroidery and kick ripples.
      const stolen=n.event?.id==='duvet',edge=clamp((stolen?305:333)+(g?.kind==='blanket'?clamp(g.pos.x-g.start.x,-28,50):0),274,348),top=230+breath*2-this.cozy*5;
      // A simulated cloth edge. Impulses travel between nodes instead of shaking the screen.
      const edgeY=x=>top+Math.sin((x-66)/267*Math.PI*3)*3+this.fx.cloth.sample(x)-this.sit*11*Math.exp(-(((x-137)/50)**2));
      c.beginPath();c.moveTo(66,edgeY(66));for(let x=66;x<=edge;x+=6)c.lineTo(x,edgeY(x));c.lineTo(edge,edgeY(edge));c.lineTo(edge,412);c.quadraticCurveTo(edge-2,436,307,437);c.lineTo(90,437);c.quadraticCurveTo(66,436,66,415);c.closePath();
      const linen=c.createLinearGradient(64,230,340,440);linen.addColorStop(0,'#497aa2');linen.addColorStop(.53,'#426d93');linen.addColorStop(1,'#315776');c.fillStyle=linen;c.fill();c.strokeStyle=C.deep;c.lineWidth=2;c.stroke();
      c.save();c.clip();
      c.beginPath();c.moveTo(66,edgeY(66)-2);for(let x=66;x<=edge+7;x+=6)c.lineTo(x,edgeY(x)-2);for(let x=edge+7;x>=60;x-=6)c.lineTo(x,edgeY(x)+29);c.closePath();c.fillStyle=C.fold;c.fill();
      c.beginPath();for(let x=66;x<=edge;x+=5){const y=edgeY(x)+28;x===66?c.moveTo(x,y):c.lineTo(x,y);}c.lineWidth=1;c.strokeStyle='#bdd0d2';c.stroke();
      for(let i=0;i<9;i++){const x=83+i*29,wave=this.fx.cloth.sample(x);line(c,`M${x} ${top+44}q${wave*.6-6} 50 1 142`,'#9fbacd25',1);}
      for(let i=0;i<5;i++){const x=96+i*46,wave=this.fx.cloth.sample(x);line(c,`M${x} ${top+48}q${wave*.8-5} 20 0 45`,'#b5c9d529',1.4);}
      line(c,`M194 281q${jolt*3-15} 36 4 65M190 369q13 22 1 40M84 293v112q1 12 13 12H310`,C.deep,2);
      c.save();c.translate(160,348);c.rotate(-.2);line(c,'M3-19A22 22 0 1 0 21 11A18 18 0 0 1 3-19Z','#b4c8cf',1.2);line(c,'M-32-8h8m-4-4v8M25-29h8m-4-4v8M14 36h6m-3-3v6','#b4c8cf',1.2);c.restore();
      if(this.impulse>.1){for(let i=0;i<3;i++)ellipse(c,156,391,20+i*9+this.impulse*4,7+i*3,null,'#a9cad24a',1);}
      c.restore();
      // Sleeper's loose arm and a sock peeking out below the cover.
      path(c,'M91 191Q69 210 82 258L128 285Q144 297 150 286L143 279 131 276 95 248 104 206Z',C.paper,C.pencil);line(c,'M130 283l13 7M87 216v25',C.pencil,1);
      rect(c,124,426,23,30,9,C.paper,C.pencil);line(c,'M125 432h20M125 436h20',C.blue,1.6);
      if(!n.away){this.fx.drawTrail(c,this.motion);this.limb(c,this.foot,true);this.limb(c,this.hand,false);}
      // A cool-side tab and a tissue box are objects in the room, not extra menu buttons.
      rect(c,75,113,12,18,3,n.pillowCooldown>0?'#748f99':'#adcfc9',C.pencil);line(c,'M78 119l3 4 3-4','#42657a',1);
      rect(c,351,300,36,25,5,'#466c78','#7e9ca7');ellipse(c,369,304,9,3,'#152f3d');path(c,'M360 304l-3-17 10 4 5-9 8 19Z',C.paper,C.pencil,1);
      rect(c,360,147,12,53,3,'#8d9b9c');ellipse(c,366,201,16,4,'#152733');
      if(!n.away){const hp=this.fx.pose;this.headset(c,hp.x,hp.y,.48+this.fx.phones*.52,this.fx.phones>.7,n.battery);}
      if(n.headphones&&!this.motion&&!n.away){for(let i=0;i<2;i++){const beat=(t*.6+i*.5)%1;c.save();c.globalAlpha=(1-beat)*.65;text(c,i?'♫':'♪',305+beat*10,104-beat*24,10+beat*4,C.gold);c.restore();}}
      if(g?.kind==='tissue' || this.fx.tissue>.1){const tp=g?.kind==='tissue'?g.pos:{x:266,y:148};c.save();c.translate(tp.x,tp.y);c.rotate(Math.sin(t*9)*.09);path(c,'M-14-12-1-9 12-15 15 10 3 8-12 13Z',C.paper,C.pencil,1);line(c,'M-3-8l6 16M-12 2 12-3','#b4c4bf',1);c.restore();}
      // Buzzing phone always remains in a consistent place.
      c.save();c.translate(n.event?.id==='phone'?Math.sin(t*45)*2:0,0);rect(c,21,169,23,42,4,'#101d29','#7892a0');rect(c,24,173,17,29,2,n.event?.id==='phone'?C.gold:'#365363');line(c,'M30 206h5',C.pencil,1);c.restore();
      if(!home){
        if(!n.awake&&!g&&guide!=='none'){if(!guide||guide==='hand')this.halo(c,this.hand,'drag',n.stir>0);if(!guide||guide==='foot')this.halo(c,this.foot,'drag',n.stir>0);}
        if(guide==='headphones'||guide==='dock')this.halo(c,n.headphones?P.head:P.dock,'tap');
        if(g?.kind==='hand'||g?.kind==='foot'||guide==='hand'||guide==='foot'){
          const foot=g?.kind==='foot'||guide==='foot',target=foot?P.footTarget:P.armTarget,from=foot?this.foot:this.hand;
          this.halo(c,target,'',n.stir>0);c.save();c.globalAlpha=.45;c.setLineDash([3,5]);line(c,`M${from.x} ${from.y}Q${(from.x+target.x)/2} ${target.y-30} ${target.x} ${target.y}`,n.stir>0?C.rose:C.gold,1.5);c.restore();
          if(!g&&!this.motion){const p=(t*.6)%1;ellipse(c,from.x+(target.x-from.x)*p,from.y+(target.y-from.y)*p,4,4,C.gold);}
        }
        if(n.awake){}
        else if(n.stir>0){text(c,'…?',142,78,18,C.gold,true);}
        else if(n.noise>40&&!n.event&&!this.motion){for(let i=0;i<2;i++){const p=(t*.32+i*.5)%1;c.save();c.globalAlpha=(1-p)*.55;text(c,'z',181+p*17,130-p*35,10+p*6,C.paper,true);c.restore();}}
        if(n.shushing)text(c,'shhhh…',216,105,13,C.mint,true);
      }
      if(n.catOnRug){ellipse(c,58,481,22,12,'#c89978',C.ink);ellipse(c,46,476,10,9,'#d8b497',C.ink);line(c,'M40 476h5M49 476h4',C.ink,1);text(c,'z',75,465,9,C.gold,true);}
      this.events(c,n,g);if(n.awake||this.drift>0)this.recovery(c,n,g);
      if(g && ['hand','foot'].includes(g.kind) && !g.hit){const force=clamp((g.speed||0)/850,0,1);c.save();c.strokeStyle=force>.75?C.rose:C.mint;c.lineWidth=2.5;c.beginPath();c.arc(g.pos.x,g.pos.y,22,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.05,force));c.stroke();c.restore();}
      if(g?.kind==='pillow')this.halo(c,{x:120,y:120},'slowly →',n.stir>0);
      this.fx.drawTop(c,n,this.motion);
      this.rings=this.rings.filter(r=>r.age<1);for(const r of this.rings){r.age+=dt;c.save();c.globalAlpha=1-r.age;ellipse(c,r.kind==='headphones'?266:151,r.kind==='headphones'?134:60,15+r.age*35,15+r.age*35,null,C.mint,1.5);c.restore();}
      if(n.away)this.corridor(c,n);
      if(n.status==='lost'&&!this.motion){text(c,'Really?',143,78,17,C.gold,true);}
      if(n.status==='won'){c.save();c.fillStyle='#eac48a18';c.fillRect(0,0,400,520);text(c,'Good morning, survivors.',200,505,14,C.gold,true);c.restore();}
    }
    recovery(c,n,g) {
      const t=this.time,active=n.awake;c.save();
      if(!active){c.globalAlpha=Math.min(1,this.drift);text(c,'Back to sleep. Back on your side.',200,300,12,C.mint,true);c.restore();return;}
      // A warm pool of light stays behind the sleeper, with no screen shake.
      const glow=c.createRadialGradient(137,114,23,137,114,84);
      glow.addColorStop(0,'#b4d8c300');glow.addColorStop(.65,'#b4d8c317');glow.addColorStop(1,'#b4d8c300');
      c.fillStyle=glow;c.fillRect(50,35,176,181);
      if(n.awakeTime<3.8){
        rect(c,183,39,149,35,10,'#1b3043eb','#8ba99f55');
        const quote=n.stats.awakenings%3===1?['I was resting','my eyebrows.']:n.stats.awakenings%3===2?['Is that your sock','or a plot twist?']:['It is far too early','for character development.'];
        text(c,quote[0],258,53,9.5,C.paper,true);text(c,quote[1],258,66,9.5,C.paper,true);
      }
      // An essential breathing cue is visible even with reduced motion or muted sound.
      const cycle=n.awakeTime%5.6,inhale=cycle<2.5,fill=inhale?cycle/2.5:1-(cycle-2.5)/3.1;
      const breathe=n.care==='breathe',radius=breathe?26+fill*13:30;
      const x=200,y=347;
      c.globalAlpha=.7;ellipse(c,x,y,43,43,null,'#b7d1c12b',1);
      ellipse(c,x,y,radius,radius,breathe?'#b2d2bd15':'#162e4633',breathe&&!inhale?C.mint:'#aac9be77',1.5);c.globalAlpha=1;
      c.beginPath();c.arc(x,y,43,-Math.PI/2,-Math.PI/2+Math.PI*2*n.settle/100);c.strokeStyle=C.mint;c.lineWidth=2.2;c.stroke();
      if(breathe){
        text(c,inhale?'in':'out',x,y+5,21,C.paper,true);
        text(c,inhale?'release':'hold gently',x,y+61,10,C.mint);
      }else{
        // A tiny chalk sheep crosses the duvet as their eyes become heavy.
        const p=this.motion?.5:(t*.3)%1,sx=x-18+p*36,sy=y-Math.sin(p*Math.PI)*12;
        c.save();c.translate(sx,sy);for(const [dx,dy,r] of [[-8,0,8],[0,-4,9],[8,0,8],[0,5,9]])ellipse(c,dx,dy,r,r,'#e7edde');
        ellipse(c,13,3,6,7,'#9fb4ba');line(c,'M-9 10v7M5 11v6','#c4d5d1',2);ellipse(c,15,1,1.1,1.1,C.ink);c.restore();
        text(c,n.settle>=62?'drifting away…':'a little tenderness',x,y+62,11,C.mint,true);
      }
      if(n.care==='lullaby'){text(c,'mmm…',247,94,12,C.mint,true);if(!this.motion){text(c,'♪',223+Math.sin(t)*5,82-(t*9)%22,12,C.gold);}}
      if(!n.care&&!g&&n.awakeTime>3.8)this.halo(c,{x:137,y:91-this.sit*8},'slow strokes');
      c.restore();
    }
    events(c,n,g) {
      const e=n.event;if(!e)return;const t=this.time;
      if(e.id==='fart'){
        c.save();c.globalAlpha=(1-e.progress)*.7;const sway=Math.sin(t*2)*5+this.fan*Math.sin(t*16)*9; c.translate(e.progress*42, -e.progress*19);c.scale(1+e.progress*.2,1-e.progress*.2);
        for(let i=0;i<7;i++){const x=118+i*25+sway,y=341+Math.sin(i*2+t)*18;ellipse(c,x,y,29+Math.sin(t+i)*3,23,'#aabc78');}
        line(c,'M134 337q-8-11 2-20M179 336q12-12 0-21M225 334q-6-10 1-19','#7d915b',2);c.restore();
        this.halo(c,{x:204,y:344},'swipe to fan');
      }
      if(e.id==='nightmare'){
        const haze=c.createRadialGradient(135,49,4,135,66,116);haze.addColorStop(0,'#9584cb32');haze.addColorStop(1,'#9584cb00');c.fillStyle=haze;c.fillRect(15,0,250,148);
        path(c,'M111 84 106 91 120 84','#8095ae',null);
        for(let i=0;i<3;i++){if(e.popped.includes(i))continue;const p=this.ghost(i);c.save();c.translate(p.x,p.y);c.rotate(this.motion?0:Math.sin(t*3+i)*.11);const bounce=this.motion?0:Math.sin(t*4+i)*.06;c.scale(1-bounce,1+bounce);
          ellipse(c,0,2,23,25,'#67758e99','#afbacd');
          path(c,'M-14 14V-2Q-13-20 0-19Q15-18 15-1V14L7 10 1 15-6 10Z',i===0?'#d9d0e4':i===1?'#c0d6d0':'#dbccb7',null);
          const look=this.pointer?clamp((this.pointer.x-p.x)/65,-2,2):Math.sin(t)*1.3;ellipse(c,-5+look,-3,2.7,4,C.ink);ellipse(c,6+look,-3,2.7,4,C.ink);ellipse(c,1,6,3,2,C.ink);
          if(i===0){rect(c,-17,-22,34,4,1,'#27394b');rect(c,-10,-31,20,11,2,'#27394b');}
          if(i===1){line(c,'M-16-3h32M-1-3h4',C.ink,1);ellipse(c,-7,-3,6,6,null,C.ink,1);ellipse(c,8,-3,6,6,null,C.ink,1);}
          if(i===2){path(c,'M-12-19-13-30-4-24 1-33 6-23 14-29 12-17Z',C.gold,C.pencil,1);}
          c.restore();}
      }
      if(e.id==='sneeze'){
        this.halo(c,P.tissue,'to your nose');
        const urge=clamp(e.age/10,0,1);text(c,urge>.7?'AH… AH…':'ah…',302,91,12+urge*3,C.gold,true);
        if(!this.motion){for(let i=0;i<3;i++){const x=330-(e.age*9+i*14)%64,y=114+Math.sin(t+i)*7;ellipse(c,x,y,1.5,1.5,'#d6c795');}}
      }
      if(e.id==='breeze'){
        c.save();c.fillStyle='#183b52';c.fillRect(145,1,110,26);const sway=this.motion?0:Math.sin(t*3)*8;
        path(c,`M139 0h19q${sway} 20 15 42q-20-6-29-1Z`,'#bad0cf',C.pencil,1);path(c,`M241 0h20l-4 42q-9-8-24 0q${-sway} -22 8-42Z`,'#bad0cf',C.pencil,1);
        line(c,'M195 20h10v8h-10Z',C.gold,2);
        if(!this.motion){for(let i=0;i<4;i++){const y=33+(t*25+i*49)%165;c.save();c.globalAlpha=(1-(y-33)/165)*.3;line(c,`M${156+i*9} ${y}q28 11 48 0`,'#c3dde1',1.5);c.restore();}}
        c.restore();this.halo(c,P.window,'pull ↓');
      }
      if(e.id==='cat'){
        const p=g?.kind==='cat'?g.pos:P.cat;c.save();c.translate(p.x,p.y);c.rotate(Math.sin(t*3)*.03);ellipse(c,0,0,29,19,'#c89978',C.ink);path(c,'M-28-3-31-24-17-17-4-24-5-4Q-13 9-28-3Z','#d8b497',C.ink);line(c,'M-25-8h5M-14-8h5',C.ink,2);line(c,`M24 2q${25+Math.sin(t*3)*8}-27 26-4`,C.ink,3);for(let i=0;i<2;i++)ellipse(c,-8+i*16,16+Math.sin(t*6+i*3)*3,5,7,'#d8b497',C.ink,1);c.restore();this.halo(c,P.rug,'cat goes here');
      }
      if(e.id==='duvet'){this.halo(c,P.blanket,'pull →');}
      if(e.id==='phone'){this.halo(c,P.phone,'tap');}
      if(e.id==='toilet'&&!n.away){rect(c,361,384,23,64,1,'#d2bc8266');this.halo(c,P.door,'loo');}
      if(e.id==='mosquito'){const p=this.bug();ellipse(c,p.x-5,p.y-4,6,3,'#c4d6dd88');ellipse(c,p.x+5,p.y-4,6,3,'#c4d6dd88');ellipse(c,p.x,p.y,2,5,C.gold);line(c,`M${p.x} ${p.y+2}l-6 5m6-5 6 5`,C.gold,1);this.halo(c,p,'tap');}
    }
    corridor(c,n) {
      const e=n.event,safe=n.floorSafe;
      c.fillStyle='#101e2dee';c.fillRect(0,0,400,520);
      text(c,'OPERATION: BATHROOM',200,42,11,C.gold);text(c,'Even the floor has opinions.',200,65,16,C.paper,true);
      // Three bends of the route remain on the same screen; hold to walk, release to wait.
      for(let i=0;i<7;i++){const x=94+i*25,y=368-i*34;rect(c,x-22,y-12,79,28,5,i%2?'#30485a':'#385565');line(c,`M${x-12} ${y+2}h55`,'#5d7c89',1);}
      const prog=e.progress,px=101+prog*178,py=380-prog*241;
      for(let i=0;i<Math.floor(prog*15);i++){c.save();c.globalAlpha=.15;ellipse(c,98+i*11.8+(i%2?5:-5),384-i*16,4,7,C.paper);c.restore();}
      const cycle=n.elapsed%2.6;rect(c,110,408,180,4,2,'#59424b');rect(c,110,408,180*1.7/2.6,4,2,'#567d70');ellipse(c,110+180*cycle/2.6,410,3,5,C.paper);
      rect(c,265,79,60,35,7,C.paper,C.pencil);ellipse(c,295,125,29,34,C.paper,C.pencil);ellipse(c,295,122,19,22,'#6c95a1',C.pencil);ellipse(c,295,122,13,17,'#accbd4');
      c.save();c.translate(px,py);ellipse(c,0,8,20,8,'#00000044');for(let i=0;i<2;i++){const walk=e.holding&&safe?Math.sin(this.time*10+i*Math.PI)*7:0;rect(c,-14+i*17,-14+walk,13,27,6,C.paper,C.pencil);line(c,`M${-13+i*17} ${-5+walk}h11`,C.blue,2);}c.restore();
      ellipse(c,200,445,43,43,safe?'#334f4d':'#65434a',safe?C.mint:C.rose,2);
      text(c,safe?'TIPTOE':'FREEZE',200,447,12,safe?C.mint:C.rose);text(c,safe?'hold':'release',200,463,10,C.paper);
      const until=safe?(1.7-(n.elapsed%2.6)):(2.6-(n.elapsed%2.6));text(c,(safe?'Quiet boards · ':'Creaky boards · ')+until.toFixed(1)+'s',200,395,13,safe?C.mint:C.rose);
      rect(c,110,498,180,3,1,'#324b5d');rect(c,110,498,180*prog,3,1,C.mint);
    }
  }
  root.HushBedroom=Bedroom;root.HushPoints=P;
})(typeof globalThis!=='undefined'?globalThis:this);
