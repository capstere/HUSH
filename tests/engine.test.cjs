'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Night,EVENTS}=require('../src/engine.js');
const tick=(n,seconds)=>{for(let t=0;t<seconds-1e-7;t+=.05)n.step(.05);};
const quietNight=()=>{const n=new Night('normal',1);n.nextEvent=999;return n;};
test('new night starts playable with nine named events',()=>{const n=new Night();assert.equal(n.status,'playing');assert.equal(n.length,150);assert.equal(Object.keys(EVENTS).length,9);});
test('seeded schedules are reproducible',()=>{assert.deepEqual(new Night('normal',71).eventBag,new Night('normal',71).eventBag);});
test('requested fart, nightmare and toilet occur before optional events',()=>{for(let s=1;s<30;s++)assert.deepEqual(new Set(new Night('normal',s).eventBag.slice(0,3)),new Set(['fart','nightmare','toilet']));});
test('invalid difficulty falls back to normal',()=>assert.equal(new Night('nope').mode,'normal'));
test('hand contact reduces snoring and opens the stirring window',()=>{const n=quietNight(),noise=n.noise;assert(n.hit('hand',.3));assert(n.noise<noise);assert(n.stir>3);assert.equal(n.phase,'stirring');assert.equal(n.stats.nudges,1);});
test('kick trades more quiet for more risk',()=>{const a=quietNight(),b=quietNight();a.hit('hand',.4);b.hit('foot',.4);assert(b.wake>a.wake);assert(b.noise<a.noise);assert(b.stir>a.stir);});
test('fast contact is riskier than slow contact',()=>{const a=quietNight(),b=quietNight();a.hit('hand',.1);b.hit('hand',1);assert(b.wake>a.wake);});
test('a second hard contact while stirring wakes the partner',()=>{const n=quietNight();n.hit('foot',1);tick(n,.5);n.hit('hand',1);assert.equal(n.status,'playing');assert(n.awake);assert.equal(n.stats.closeCalls,1);});
test('duplicate contact in one brief gesture is ignored',()=>{const n=quietNight();n.hit('hand',.3);assert.equal(n.hit('hand',.3),false);assert.equal(n.stats.nudges,1);});
test('waiting for eyes to close makes another soft nudge possible',()=>{const n=quietNight();n.hit('hand',.2);tick(n,8);assert.equal(n.stir,0);n.hit('hand',.2);assert.equal(n.status,'playing');assert.equal(n.stats.closeCalls,0);});
test('unattended night eventually fails',()=>{for(let i=1;i<5;i++){const n=new Night('normal',i);tick(n,151);assert.equal(n.status,'lost');}});
test('training has no ticking night clock and cannot lose',()=>{const n=new Night('normal',1,true);n.wake=100;n.patience=0;tick(n,30);assert.equal(n.t,0);assert.equal(n.status,'playing');assert.equal(n.event,null);});
test('headphones drain quickly and resume charging when docked',()=>{const n=quietNight();n.toggleHeadphones();const b=n.battery;tick(n,5);assert(n.battery<b-30);n.toggleHeadphones();const c=n.battery;tick(n,5);assert(n.battery>c+20);});
test('flat headphones automatically return to the stand',()=>{const n=quietNight();n.battery=12;n.toggleHeadphones();tick(n,2);assert.equal(n.headphones,false);tick(n,2);assert(n.battery>5);});
test('almost empty headphones cannot be equipped',()=>{const n=quietNight();n.battery=3;assert.equal(n.toggleHeadphones(),false);assert.equal(n.headphones,false);});
test('charging clamps at full and repeated toggles do not create battery',()=>{const n=quietNight();n.battery=99;tick(n,10);assert.equal(n.battery,100);for(let i=0;i<10;i++)n.toggleHeadphones();assert.equal(n.battery,100);});
test('headphones protect patience but never remove wake-up risk',()=>{const n=quietNight();n.patience=70;n.toggleHeadphones();tick(n,4);assert(n.patience>70);n.hit('foot',1);tick(n,.5);n.hit('hand',1);assert(n.awake);assert.equal(n.status,'playing');});
test('shush runs out of breath after 2.5 seconds',()=>{const n=quietNight();n.setShush(true);tick(n,3);assert.equal(n.shushing,false);assert(n.shushCooldown>0);n.setShush(true);assert.equal(n.shushing,false);});
test('shush can be stopped early and recovers after cooldown',()=>{const n=quietNight();n.setShush(true);tick(n,.2);n.setShush(false);tick(n,8.2);n.setShush(true);assert.equal(n.shushing,true);});
test('blanket has a cooldown but a stolen duvet can always be reclaimed',()=>{const n=quietNight();assert(n.blanket());assert.equal(n.blanket(),false);n.spawn('duvet');assert(n.blanket());assert.equal(n.event,null);assert.equal(n.stats.solved,1);});
test('events do not overlap and invalid IDs are rejected',()=>{const n=quietNight();assert.equal(n.spawn('nonsense'),false);n.spawn('cat');assert.equal(n.spawn('phone'),false);assert.equal(n.event.id,'cat');});
test('fart needs multiple swipes, resolves at enough distance',()=>{const n=quietNight();n.spawn('fart');n.eventAction('fan',150);assert(n.event);n.eventAction('fan',400);assert.equal(n.event,null);assert.equal(n.stats.solved,1);});
test('each nightmare monster must be popped separately',()=>{const n=quietNight();n.spawn('nightmare');n.eventAction('pop',0);n.eventAction('pop',0);n.eventAction('pop',9);assert.equal(n.event.progress,1/3);n.eventAction('pop',1);n.eventAction('pop',2);assert.equal(n.event,null);});
test('phone, cat, duvet and mosquito support their distinct interactions',()=>{for(const [id,action]of[['phone','tap'],['cat','rug'],['duvet','pull'],['mosquito','tap']]){const n=quietNight();n.spawn(id);n.eventAction(action);assert.equal(n.event,null);assert.equal(n.stats.solved,1);}});
test('wrong interaction cannot resolve an event',()=>{const n=quietNight();n.spawn('cat');assert.equal(n.eventAction('tap'),false);assert(n.event);});
test('missed event costs patience and is recorded',()=>{const n=quietNight();n.spawn('fart');tick(n,16.2);assert.equal(n.event,null);assert.equal(n.stats.missed,1);assert(n.patience<80);});
test('bathroom puts headphones on charge and blocks contact',()=>{const n=quietNight();n.toggleHeadphones();n.spawn('toilet');n.eventAction('enter');assert(n.away);assert.equal(n.headphones,false);assert.equal(n.hit('hand',1),false);assert.equal(n.toggleHeadphones(),false);});
test('bathroom progress stops on red boards, which add risk',()=>{const n=quietNight();n.spawn('toilet');n.eventAction('enter');n.elapsed=1.8;const w=n.wake;n.eventAction('walk',true);tick(n,.3);assert.equal(n.event.progress,0);assert(n.wake>w);});
test('release stops walking and prevents creak penalties',()=>{const n=quietNight();n.spawn('toilet');n.eventAction('enter');n.elapsed=1.8;n.eventAction('walk',false);const w=n.wake;tick(n,.3);assert(n.wake<=w);assert.equal(n.event.progress,0);});
test('tiptoeing only on green completes the round trip',()=>{const n=quietNight();n.spawn('toilet');n.eventAction('enter');for(let i=0;i<400&&n.event;i++){n.eventAction('walk',n.floorSafe);n.step(.05);}assert.equal(n.event,null);assert.equal(n.away,false);assert.equal(n.stats.solved,1);assert.equal(n.status,'playing');});
test('all numerical state stays bounded with invalid or large time deltas',()=>{const n=quietNight();const t=n.t;[NaN,Infinity,-1,0].forEach(x=>n.step(x));assert.equal(n.t,t);n.step(900);assert(n.t<=.1);n.hit('hand',NaN);for(const x of[n.wake,n.patience,n.noise,n.battery])assert(Number.isFinite(x)&&x>=0&&x<=100);});
test('finished nights stop time, charging, contact and sound actions',()=>{const n=quietNight();n.finish('lost','test');const t=n.t,b=n.battery;tick(n,10);assert.equal(n.t,t);assert.equal(n.battery,b);assert.equal(n.hit('hand'),false);assert.equal(n.toggleHeadphones(),false);});
test('controlled night reaches dawn and wins',()=>{const n=quietNight();n.noise=0;n.quiet=999;tick(n,151);assert.equal(n.status,'won');assert(n.t>=150);});
test('ten seeded normal nights are winnable with a conservative active strategy',()=>{
 for(let seed=1;seed<=10;seed++){
  const n=new Night('normal',seed);
  for(let i=0;i<3100&&n.status==='playing';i++){
   if(!n.away&&!n.headphones&&n.battery>68)n.toggleHeadphones();
   if(!n.away&&!n.headphones&&n.noise>65&&n.stir<=0&&n.wake<25)n.hit(i%2?'hand':'foot',.25);
   const e=n.event;
   if(e){if(e.id==='fart')n.eventAction('fan',4);if(e.id==='nightmare')n.eventAction('pop',e.popped.length);if(['phone','mosquito'].includes(e.id))n.eventAction('tap');if(e.id==='cat')n.eventAction('rug');if(e.id==='duvet')n.eventAction('pull');if(e.id==='toilet'){if(!n.away)n.eventAction('enter');else n.eventAction('walk',n.floorSafe);}}
   n.step(.05);
  }
  assert.equal(n.status,'won','seed '+seed);assert(n.stats.solved>=3);
 }
});
test('gentle pillow flip creates lasting cool-side relief',()=>{const n=quietNight(),before=n.noise;assert(n.pillow(.2));assert(n.noise<before);assert.equal(n.coolSide,17);assert.equal(n.stir,0);assert.equal(n.pillowCount,1);});
test('pillow cooldown prevents infinite soothing',()=>{const n=quietNight();n.pillow(.2);assert.equal(n.pillow(.2),false);assert.equal(n.pillowCount,1);tick(n,18.1);assert(n.pillow(.2));});
test('rough pillow motion creates a warning rather than free relief',()=>{const n=quietNight();n.pillow(.99);assert(n.stir>4);assert(n.wake>=24);assert.equal(n.coolSide,0);});
test('pillow movement while stirring also risks waking the sleeper',()=>{const n=quietNight();n.hit('hand',.2);const w=n.wake;n.pillow(.1);assert.equal(n.wake-w,40);});
test('pillow is unavailable when away or after loss',()=>{const n=quietNight();n.spawn('toilet');n.eventAction('enter');assert.equal(n.pillow(),false);n.resolve(true);n.finish('lost');assert.equal(n.pillow(),false);});
test('cool-side relief and cooldown expire independently',()=>{const n=quietNight();n.pillow(.1);tick(n,17.1);assert.equal(n.coolSide,0);assert(n.pillowCooldown>0);});
test('tissue resolves a pending sneeze and emits the visual effect',()=>{const n=quietNight();n.spawn('sneeze');assert(n.eventAction('tissue'));assert.equal(n.event,null);assert.equal(n.stats.solved,1);assert(n.effects.some(x=>x.kind==='tissue'));});
test('missed sneeze raises risk and emits achoo',()=>{const n=quietNight();n.spawn('sneeze');n.resolve(false);assert(n.wake>=22);assert(n.effects.some(x=>x.kind==='sneeze-miss'));});
test('window can be shut without touching the sleeper',()=>{const n=quietNight();n.spawn('breeze');assert(n.eventAction('close'));assert.equal(n.event,null);assert.equal(n.stats.nudges,0);assert(n.effects.some(x=>x.kind==='window'));});
test('new event gestures cannot accidentally solve the wrong event',()=>{const n=quietNight();n.spawn('phone');assert.equal(n.eventAction('tissue'),false);assert.equal(n.eventAction('close'),false);assert.equal(n.event.id,'phone');});
test('nightmare particle origin preserves the actual tapped monster',()=>{const n=quietNight();n.spawn('nightmare');n.eventAction('pop',2);assert.equal(n.effects.find(x=>x.kind==='pop').detail,2);});
test('practice can survive all nine events without ending or ticking the night clock',()=>{const n=new Night('normal',93,true);for(const id of Object.keys(EVENTS)){n.spawn(id);n.resolve(false);tick(n,2);}assert.equal(n.status,'playing');assert.equal(n.t,0);assert.equal(n.stats.missed,9);});
