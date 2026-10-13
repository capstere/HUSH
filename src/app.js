/* HUSH 5.0 — one-pointer direct manipulation, guided first play and mobile lifecycle. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),{Night,EVENTS,clamp}=HushGame,P=HushPoints;
  let raw={};try{raw=JSON.parse(localStorage.getItem('hush.v5')||localStorage.getItem('hush.v3')||'{}')||{};}catch(_){}
  if(typeof raw!=='object'||Array.isArray(raw))raw={};
  const settings={music:raw.music!==false,musicVolume:Number.isFinite(raw.musicVolume)?clamp(raw.musicVolume,0,1):.55,effectsVolume:Number.isFinite(raw.effectsVolume)?clamp(raw.effectsVolume,0,1):.7,sound:raw.sound!==false,volume:Number.isFinite(raw.volume)?clamp(raw.volume,.05,1):.6,reduced:typeof raw.reduced==='boolean'?raw.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,mode:['cozy','normal','chaos'].includes(raw.mode)?raw.mode:'normal',learned:raw.learned===true,tap:raw.tap===true,best:Number.isFinite(raw.best)?Math.max(0,raw.best):0};
  const audio=new HushAudio(),room=new HushBedroom($('bedroom'));
  let night=new Night('normal',543,true),screen='home',paused=false,lesson=-1,g=null,control=null,scripted=null,last=0,ui=0,feedback='',feedbackUntil=0,ended=false,focusBefore=null;
  night.patience=48;
  let sandbox=false,endWait=0;
  function save(){try{localStorage.setItem('hush.v5',JSON.stringify(settings));}catch(_){}}
  function soundUI(){audio.enabled=settings.sound;audio.volume=settings.volume;audio.musicEnabled=settings.music;audio.musicVolume=settings.musicVolume;audio.effectsVolume=settings.effectsVolume;audio.mix();$('soundButton').innerHTML=`<svg><use href="#${settings.sound?'sound':'mute'}"/></svg>`;$('soundButton').setAttribute('aria-label',settings.sound?'Mute sound':'Enable sound');$('soundButton').setAttribute('aria-pressed',String(settings.sound));}
  function motionUI(){room.motion=settings.reduced;document.body.classList.toggle('reduced',settings.reduced);}
  async function unlock(){if(!settings.sound)return;const ok=await audio.unlock();if(!ok&&!audio.available){settings.sound=false;soundUI();night.say('Audio is unavailable here. Everything still works silently.');}}
  function cancel(){if(g){try{$('bedroom').releasePointerCapture(g.id);}catch(_){}}g=null;scripted=null;control=null;night.setShush(false);night.setCare('',false);if(night.event)night.event.holding=false;$('shushButton').classList.remove('active');}
  function start(forceLesson=false){
    sandbox=false;endWait=0;room.reset();cancel();close(false);screen='game';paused=false;ended=false;lesson=forceLesson||!settings.learned?0:-1;
    night=new Night(settings.mode,Date.now(),lesson>=0);feedback='';feedbackUntil=0;
    $('app').dataset.screen='game';['intro','homeFooter'].forEach(id=>$(id).hidden=true);['hud','status','controls','clock'].forEach(id=>$(id).hidden=false);
    $('menuButton').setAttribute('aria-label','Pause game');$('menuButton').innerHTML='<svg><use href="#pause"/></svg>';
    audio.lastBreath=-1;audio.setPaused(false);unlock();update();resize();
  }
  function finishLesson(){settings.learned=true;save();lesson=-1;cancel();night=new Night(settings.mode,Date.now());night.say('You have the moves. Now save the night.');audio.lastBreath=-1;update();}
  function lessonUpdate(){if(lesson===1&&night.stir<=0)lesson=2;if(lesson===3&&night.stir<=0)lesson=4;}
  function goHome(){sandbox=false;endWait=0;room.reset();cancel();close(false);screen='home';paused=false;ended=false;lesson=-1;night=new Night('normal',543,true);night.patience=48;audio.stop();audio.book?.gain.setTargetAtTime(0,audio.ctx.currentTime,.04);
    $('app').dataset.screen='home';$('app').classList.remove('partner-awake');['intro','homeFooter'].forEach(id=>$(id).hidden=false);['hud','status','controls','clock'].forEach(id=>$(id).hidden=true);$('menuButton').setAttribute('aria-label','Help and settings');$('menuButton').innerHTML='<svg><use href="#help"/></svg>';audio.setPaused(true);resize();}
  function hit(kind,force){const ok=night.hit(kind==='hand'?'hand':'foot',force);if(ok){if(lesson===0&&kind==='hand')lesson=1;else if(lesson===2&&kind==='foot')lesson=3;try{if(navigator.vibrate&&!settings.reduced)navigator.vibrate(foot(kind)?18:10);}catch(_){}}return ok;}
  function foot(kind){return kind==='foot';}
  function toggleHeadphones(){if(night.toggleHeadphones()){if(lesson===4&&night.headphones)lesson=5;else if(lesson===5&&!night.headphones)finishLesson();}unlock();update();}
  function animateTap(kind){if(paused||screen!=='game'||scripted||night.away)return;const from={...(kind==='foot'?room.foot:room.hand)},target=kind==='foot'?P.footTarget:P.armTarget;scripted={kind,from,target,age:0,pos:from};}
  function process(){lessonUpdate();while(night.effects.length){const e=night.effects.shift();if(e.kind==='wake-up')cancel();room.effect(e);audio.effect(e);}while(night.messages.length){const msg=night.messages.shift();feedback=msg.text;feedbackUntil=night.elapsed+4;}
    if(night.status!=='playing'&&!ended){ended=true;cancel();endWait=night.status==='won'?1.7:1.05;}}
  function write(id,text){if($(id).textContent!==text)$(id).textContent=text;}
  function update(){
    if(screen!=='game')return;
    const minute=Math.min(420,120+Math.floor(night.t/night.length*300));write('clock',sandbox?'PLAY':String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'));
    const patience=Math.ceil(night.patience),wake=Math.ceil(night.awake?night.settle:night.wake);
    write('partnerMeterLabel',night.awake?'Back to sleep':'Wake-up risk');$('wakeMeter').classList.toggle('settling',night.awake);$('wakeMeter').setAttribute('aria-label',night.awake?'Progress back to sleep':'Wake-up risk');write('patienceValue',String(patience));write('wakeValue',night.awake?wake+'%':night.stir>0?'Stirring':wake>66?'High':wake>33?'Careful':'Low');
    $('patienceFill').style.width=patience+'%';$('wakeFill').style.width=wake+'%';$('wakeMeter').classList.toggle('high',!night.awake&&wake>65);$('patienceMeter').setAttribute('aria-valuenow',String(patience));$('wakeMeter').setAttribute('aria-valuenow',String(wake));$('nightProgress').style.width=night.t/night.length*100+'%';
    const battery=Math.round(night.battery);write('headphoneTitle',night.headphones?'Dock & charge':'Listen');write('headphoneHint',battery+'% · '+(night.headphones?'audiobook':battery>=100?'fully charged':'charging'));
    $('batteryFill').style.width=battery+'%';$('batteryFill').style.background=battery<15?'var(--rose)':'var(--mint)';$('headphoneButton').classList.toggle('on',night.headphones);$('headphoneButton').disabled=night.away;$('headphoneButton').hidden=night.awake;
    $('headphoneButton').setAttribute('aria-label',night.headphones?'Dock headphones to charge':'Put on headphones');$('headphoneButton').setAttribute('aria-pressed',String(night.headphones));
    write('shushTitle',night.shushing?'Shhhhh…':night.shushCooldown>0?'Breathe…':'Shhh…');write('shushHint',night.shushCooldown>0?Math.ceil(night.shushCooldown)+'s TO RECOVER':'HOLD TO SOOTHE');$('shushButton').classList.toggle('active',night.shushing);$('shushButton').disabled=night.shushCooldown>0;$('shushButton').hidden=night.away||night.awake;$('walkButton').hidden=!night.away;
    $('recoveryControls').hidden=!night.awake;
    $('app').classList.toggle('partner-awake',night.awake);
    for(const [id,kind] of [['strokeButton','stroke'],['humButton','lullaby'],['breatheButton','breathe']]) {
      $(id).classList.toggle('active',night.care===kind);
      $(id).classList.toggle('preferred',night.preferredCare===kind);
    }
    $('breatheButton').classList.toggle('exhale',night.breathingOut);
    write('breatheTitle',night.breathingOut?'Breathe out':'Breathe in');
    write('breatheHint',night.breathingOut?'HOLD NOW':'RELEASE · INHALE');
    $('walkButton').classList.toggle('danger',!night.floorSafe);$('walkButton').classList.toggle('active',night.floorSafe);write('walkTitle',night.floorSafe?'Tiptoe':'Freeze!');write('walkHint',night.floorSafe?'HOLD ON GREEN':'RELEASE ON RED');
    let title='Deep asleep. Handle with care.',hint=settings.tap?'Tap your hand or foot for a soft nudge.':'Drag your hand or sock left towards your partner.',mood='normal';
    const e=night.event;
    if(sandbox){title='Practice room. No pressure.';hint='Try anything. Scenes opens the other midnight disasters.';}
    if(night.headphones){title='A little peace. On borrowed battery.';hint=['Chapter 1: A very important turnip.','Chapter 2: Nothing happens, at length.','Chapter 3: The footnote has a footnote.'][Math.floor(night.bookTime/5)%3];}
    if(feedbackUntil>night.elapsed)hint=feedback;
    if(e){title=EVENTS[e.id].name+' '+Math.ceil(e.left)+'s';hint=night.away?'Hold to walk on green. Release before the boards turn red.':EVENTS[e.id].hint;mood='warning';}
    if(night.stir>0){title='FREEZE. They are stirring. '+Math.ceil(night.stir)+'s';hint=e?EVENTS[e.id].hint:'Another nudge now could wake them. Let the eyes close.';mood=night.wake>65?'danger':'warning';}
    if(night.awake){
      mood='tender';title=night.settle>=62?'Almost asleep. You have got this.':'Wide awake. Not game over.';
      const preference={stroke:'They like slow strokes.',lullaby:'They like a quiet lullaby.',breathe:'They like breathing together.'};
      hint=preference[night.preferredCare]+' Hold a button or stroke their hair.';
      if(night.care==='breathe')hint=night.breathingOut?'Hold as the ring shrinks. A long, slow breath out.':'Let go. Let the ring fill. Breathe in together.';
      if(night.t>=night.length)title='Dawn can wait. Get them back to sleep.';
    }
    if(lesson>=0){mood='lesson';const instructions=[['1 / 4 · Borrow your own hand.',settings.tap?'Tap the glowing hand.':'Grab the glowing hand. Drag it LEFT onto their shoulder.'],['Good. Now do absolutely nothing.',Math.ceil(night.stir)+'s until they settle. Never hit twice in a row.'],['2 / 4 · Put your foot into it.',settings.tap?'Tap the glowing sock.':'Grab your sock at the bottom. Drag it LEFT towards their leg.'],['Innocent face. Keep still.',Math.ceil(night.stir)+'s. One open eye is not an invitation.'],['3 / 4 · Your personal escape hatch.','Tap the headphones on the right table, or the Listen button.'],['4 / 4 · Peace needs charging.','Tap Dock & charge. Or drag the headphones back to their stand.']];[title,hint]=instructions[lesson];}
    if(night.status==='lost'){title='A cup of tea it is.';hint='Your patience ran out. Tomorrow is another night.';mood='danger';}
    if(night.status==='won'){title='07:00. You made it.';hint='Nobody mention any of this over breakfast.';mood='normal';}
    if(g?.kind==='pillow'){title=night.pillowCooldown>0?'Let the pillow settle.':'The cool side is a peace offering.';hint='Slide slowly to the right, then release.';}
    write('statusTitle',title);write('statusHint',hint);$('status').dataset.mood=mood;$('skipButton').hidden=lesson<0&&!sandbox;write('skipButton',sandbox?'Scenes':'Skip lesson');$('eventTrack').hidden=!e;
    if(e)$('eventFill').style.width=clamp(e.left/(e.id==='toilet'&&e.stage==='walking'?28:EVENTS[e.id].time)*100)+'%';
  }
  const canvas=$('bedroom');
  function begin(e){
    if(screen!=='game'||paused||night.status!=='playing'||g||control||e.isPrimary===false||e.button>0)return;
    const pos=room.world(e.clientX,e.clientY),pick=room.pick(pos,night);if(!pick)return;
    e.preventDefault();unlock();const anchor=pick.kind==='hand'?room.hand:pick.kind==='foot'?room.foot:pos;g={...pick,id:e.pointerId,start:pos,pos:{x:anchor.x,y:anchor.y},offset:{x:anchor.x-pos.x,y:anchor.y-pos.y},previous:pos,distance:0,began:performance.now(),movedAt:performance.now(),speed:0,hit:false};
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    if(g.kind==='shush')night.setShush(true);if(g.kind==='tiptoe')night.eventAction('walk',true);
  }
  function constrained(pos,kind){const a=kind==='hand'?{x:240,y:198}:{x:278,y:268},max=kind==='hand'?111:182;let x=clamp(pos.x,100,330),y=kind==='hand'?clamp(pos.y,155,324):clamp(pos.y,325,471);const d=Math.hypot(x-a.x,y-a.y);if(d>max){x=a.x+(x-a.x)*max/d;y=a.y+(y-a.y)*max/d;}return{x,y};}
  function contact(){if(!g||g.hit||!['hand','foot'].includes(g.kind)||g.distance<45)return;const target=g.kind==='hand'?P.armTarget:P.footTarget;if(Math.hypot(g.pos.x-target.x,g.pos.y-target.y)<40){g.hit=true;hit(g.kind,clamp(g.speed/850,.12,1));}}
  function move(e){if(!g||e.pointerId!==g.id)return;e.preventDefault();const p=room.world(e.clientX,e.clientY),dx=p.x-g.previous.x,dy=p.y-g.previous.y;const now=performance.now(),distance=Math.hypot(dx,dy),seconds=Math.max(.006,(now-g.movedAt)/1000);g.speed=g.speed*.25+distance/seconds*.75;g.movedAt=now;g.distance+=distance;g.previous=p;g.pos=['hand','foot'].includes(g.kind)?constrained({x:p.x+g.offset.x,y:p.y+g.offset.y},g.kind):p;
    if(g.kind==='caress'&&Math.hypot(p.x-137,p.y-103)<63)night.stroke(Math.abs(dx),g.speed);
    if(g.kind==='fan'&&Math.abs(dx)>Math.abs(dy)*.5)night.eventAction('fan',Math.abs(dx));contact();}
  function end(e,cancelled=false){
    if(!g||e.pointerId!==g.id)return;e.preventDefault();if(!cancelled)contact();const a=g;g=null;try{canvas.releasePointerCapture(e.pointerId);}catch(_){}
    if(a.kind==='shush')night.setShush(false);if(a.kind==='tiptoe')night.eventAction('walk',false);if(cancelled)return;
    const tap=a.distance<18;
    if(a.kind==='caress'&&settings.tap&&tap)scripted={kind:'caress',age:0,pos:{x:137,y:103}};
    else if(a.kind==='pillow'&&((a.pos.x-a.start.x>24)||(settings.tap&&tap)))night.pillow(tap?.22:clamp(a.distance/Math.max(.1,(performance.now()-a.began)/1000)/1000,0,1));
    else if(a.kind==='tissue'&&((settings.tap&&tap)||Math.hypot(a.pos.x-266,a.pos.y-148)<48))night.eventAction('tissue');
    else if(a.kind==='window'&&((settings.tap&&tap)||a.pos.y-a.start.y>22))night.eventAction('close');
    else if(a.kind==='headphones'&&(tap||Math.hypot(a.pos.x-(night.headphones?P.dock.x:P.head.x),a.pos.y-(night.headphones?P.dock.y:P.head.y))<65))toggleHeadphones();
    else if(a.kind==='ghost'&&tap)night.eventAction('pop',a.index);
    else if(['phone','mosquito'].includes(a.kind)&&tap)night.eventAction('tap');
    else if(a.kind==='door'&&tap)night.eventAction('enter');
    else if(a.kind==='cat'&&Math.hypot(a.pos.x-P.rug.x,a.pos.y-P.rug.y)<57)night.eventAction('rug');
    else if(a.kind==='blanket'&&a.pos.x-a.start.x>25)night.blanket();
    else if(['hand','foot'].includes(a.kind)&&!a.hit){if(settings.tap&&tap)animateTap(a.kind);else night.say('Grab, drag across, then release. A tap alone will not nudge.');}
    process();update();
  }
  canvas.addEventListener('pointerdown',begin);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));canvas.addEventListener('lostpointercapture',e=>{if(g&&g.id===e.pointerId){g=null;night.setShush(false);night.eventAction('walk',false);}});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  function holdButton(id,action){const b=$(id);b.addEventListener('pointerdown',e=>{if(screen!=='game'||paused||g||control||e.isPrimary===false||b.disabled)return;e.preventDefault();control={id:e.pointerId,action};try{b.setPointerCapture(e.pointerId);}catch(_){}unlock();action(true);update();});
    const stop=e=>{if(control&&control.id===e.pointerId){control.action(false);control=null;update();}};b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
    b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)&&!e.repeat&&!paused){e.preventDefault();unlock();action(true);}});b.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();action(false);}});b.addEventListener('contextmenu',e=>e.preventDefault());}
  holdButton('strokeButton',on=>night.setCare('stroke',on));holdButton('humButton',on=>night.setCare('lullaby',on));holdButton('breatheButton',on=>night.setCare('breathe',on));
  holdButton('shushButton',on=>night.setShush(on));holdButton('walkButton',on=>night.eventAction('walk',on));
  $('headphoneButton').addEventListener('click',()=>{if(!paused&&!g)toggleHeadphones();});$('startButton').addEventListener('click',()=>start());$('skipButton').addEventListener('click',()=>sandbox?gallery():finishLesson());$('playgroundButton').addEventListener('click',gallery);
  $('soundButton').addEventListener('click',()=>{settings.sound=!settings.sound;soundUI();save();if(settings.sound)unlock();});
  function open(title,html){cancel();paused=true;audio.setPaused(true);focusBefore=document.activeElement;$('dialogTitle').textContent=title;$('dialogContent').innerHTML=html;const d=$('modal');if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}}
  function close(resume=true){const d=$('modal');if(d.open){if(d.close)d.close();else d.removeAttribute('open');}if(resume){paused=false;audio.setPaused(screen!=='game'||night.status!=='playing');if(screen==='game'&&night.status==='playing')unlock();}try{focusBefore?.focus({preventScroll:true});}catch(_){}last=performance.now();}
  function help(){const playing=screen==='game'&&night.status==='playing';open(playing?'A little breather.':'A very delicate art.',`
    <p class="help-row"><b>Grab. Nudge. Freeze.</b>Drag your hand onto their shoulder, or your sock towards their leg. Faster swipes are stronger, but riskier. When an eye opens, stop nudging until they settle.</p>
    <p class="help-row"><b>Headphones are a holiday, not a cure.</b>Tap Listen or drag them onto your head. The nonsense audiobook protects your patience, not their sleep. Dock them to recharge. Hold Shhh for a brief, safe breather.</p>
    <p class="help-row"><b>The cool side is real diplomacy.</b>Drag the mint tab on the sleeper's pillow slowly to the right. Catch a sneeze with a tissue from the right table. Pull the window latch down to close it.</p><p class="help-row"><b>The bedroom is the controller.</b>Swipe away a fart. Pop dream monsters. Drag the cat onto the rug. Silence the phone. Reclaim the duvet. For the loo, hold Tiptoe on green and release on red. Only one event happens at a time.</p>
    <p class="help-row"><b>Waking up is not game over.</b>Stroke their hair slowly, hold Hum, or hold Breathe while the ring contracts. The highlighted favourite works a little faster; every gentle method works. A pillow flip or a tuck also helps. Wake-ups pause interruptions. Get them back to sleep before your patience runs out.</p>
    <label class="settings-row">Night music · Borrowed Moonlight<input id="musicInput" type="checkbox" ${settings.music?'checked':''}></label>
    <label class="settings-row">Music level<input id="musicVolumeInput" type="range" min="0" max="1" step=".05" value="${settings.musicVolume}"></label>
    <label class="settings-row">Bedroom sounds<input id="effectsInput" type="range" min="0" max="1" step=".05" value="${settings.effectsVolume}"></label>
    <label class="settings-row">Next night's difficulty<select id="modeSelect"><option value="cozy">Cozy</option><option value="normal">Normal</option><option value="chaos">Chaos</option></select></label>
    <label class="settings-row">Master volume<input id="volumeInput" type="range" min=".05" max="1" step=".05" value="${settings.volume}"></label>
    <label class="settings-row">Reduced motion<input id="motionInput" type="checkbox" ${settings.reduced?'checked':''}></label>
    <label class="settings-row">Tap instead of drag<input id="tapInput" type="checkbox" ${settings.tap?'checked':''}></label>
    <p>Keyboard: A = hand, K = foot, H = headphones. Hold Space to shush (or tiptoe). P = pause. Gentle cartoon mischief; no injury.</p>
    <div class="dialog-actions"><button class="primary" id="resumeButton">${playing?'Back to bed':'Got it'}</button><button class="secondary" id="galleryButton">Try the chaos · practice scenes</button><button class="secondary" id="lessonButton">Show me the moves · restart lesson</button>${playing?'<button class="secondary" id="homeButton">End night & go home</button>':''}</div>`);
    $('musicInput').onchange=e=>{settings.music=e.target.checked;soundUI();save();};
    $('musicVolumeInput').oninput=e=>{settings.musicVolume=Number(e.target.value);soundUI();save();};
    $('effectsInput').oninput=e=>{settings.effectsVolume=Number(e.target.value);soundUI();save();};
    $('modeSelect').value=settings.mode;$('modeSelect').onchange=e=>{settings.mode=e.target.value;save();};$('volumeInput').oninput=e=>{settings.volume=Number(e.target.value);soundUI();save();};$('motionInput').onchange=e=>{settings.reduced=e.target.checked;motionUI();save();};$('tapInput').onchange=e=>{settings.tap=e.target.checked;save();};$('resumeButton').onclick=()=>close();$('lessonButton').onclick=()=>start(true);$('galleryButton').onclick=gallery;if($('homeButton'))$('homeButton').onclick=goHome;
  }
  function practice(id='pillow') {
    start();lesson=-1;sandbox=true;night.training=true;night.t=0;night.nextEvent=Infinity;
    night.wake=4;night.patience=80;
    if(id==='secondchance')night.wakeUp();
    else if(id==='pillow')night.say('Try the small mint tab on the left pillow. Drag slowly right.');
    else night.spawn(id);
    process();update();
  }
  function gallery() {
    const scenes=[['secondchance','Oops. Both eyes.','Help them drift off'],['pillow','The cool side','Slide the pillow'],['sneeze','A suspicious tickle','Catch the sneeze'],['breeze','Curtain call','Shut the window'],['fart','Love is in the air','Fan it away'],['nightmare','Tiny tax inspectors','Pop the nightmares'],['toilet','Operation: bathroom','Mind the floorboards'],['cat','Biscuit factory','Move the cat'],['duvet','Duvet custody','Pull it back'],['phone','Not now, Dave','Silence the phone'],['mosquito','Tiny helicopter','Catch the mosquito']];
    open('Try the chaos.',`<p>A little playground. No timer, no score, no game over. Pick a scene and play with the room.</p><div class="scene-grid">${scenes.map(([id,name,hint])=>`<button class="scene-choice" data-scene="${id}"><b>${name}</b><small>${hint}</small></button>`).join('')}</div><div class="dialog-actions"><button class="primary" id="realNight">Start a real night</button><button class="secondary" id="galleryBack">${screen==='game'?'Back to bed':'Back'}</button></div>`);
    document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>practice(b.dataset.scene));
    $('realNight').onclick=()=>start();$('galleryBack').onclick=()=>close();
  }
  function showEnd(){const win=night.status==='won',score=Math.round(night.patience*10+night.stats.solved*120+Math.min(150,night.stats.listening*2));if(win&&score>settings.best){settings.best=score;save();}
    open(win?'Still together. Still asleep.':'Tea for two, then.',`<p>${win?'07:00. A miracle, a few questionable decisions, and absolutely no witnesses.':night.reason}</p><div class="stats"><div><strong>${night.stats.resettled}</strong><small>second chances saved</small></div><div><strong>${night.stats.solved}</strong><small>disasters averted</small></div><div><strong>${Math.round(night.stats.listening)}s</strong><small>borrowed peace</small></div></div>${win?`<p class="record">NIGHT SCORE ${score} · BEST ${settings.best}</p>`:''}<div class="dialog-actions"><button class="primary" id="againButton">${win?'One more night':'Try a gentler approach'} <svg><use href="#arrow"/></svg></button><button class="secondary" id="endHomeButton">Back to the bedroom</button></div>`);
    $('againButton').onclick=()=>start();$('endHomeButton').onclick=goHome;
  }
  $('menuButton').addEventListener('click',help);$('howButton').addEventListener('click',help);$('closeModal').addEventListener('click',()=>{if(ended)goHome();else close();});$('modal').addEventListener('cancel',e=>{e.preventDefault();if(ended)goHome();else close();});
  function autoPause(){if(screen==='game'&&!paused&&night.status==='playing')help();cancel();audio.setPaused(true);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});window.addEventListener('blur',autoPause);window.addEventListener('pagehide',autoPause);
  window.addEventListener('keydown',e=>{if(e.target.matches('input,select,button')||e.repeat)return;if(e.key.toLowerCase()==='p'&&screen==='game'){e.preventDefault();if(paused&&!ended)close();else if(!ended)help();return;}if(paused||screen!=='game'||night.status!=='playing')return;const k=e.key.toLowerCase();if(['a','k','h',' '].includes(k)){e.preventDefault();unlock();if(k==='a')animateTap('hand');if(k==='k')animateTap('foot');if(k==='h')toggleHeadphones();if(k===' ')night.away?night.eventAction('walk',true):night.setShush(true);}});
  window.addEventListener('keyup',e=>{if(e.key===' '){night.setShush(false);night.eventAction('walk',false);}});
  function resize(){document.documentElement.style.setProperty('--vh',(window.visualViewport?.height||window.innerHeight)+'px');room.resize();}
  window.addEventListener('resize',()=>{cancel();resize();});window.visualViewport?.addEventListener('resize',()=>{cancel();resize();});if(rootOrientation())rootOrientation().addEventListener('change',()=>{cancel();resize();});
  function rootOrientation(){return screenOrientation();}function screenOrientation(){return window.screen?.orientation;}
  function frame(now){const dt=Math.min(.06,Math.max(0,(now-(last||now))/1000));last=now;if(!paused){night.step(dt);if(scripted?.kind==='caress'){scripted.age+=dt;scripted.pos={x:137+Math.sin(scripted.age*5)*20,y:103};night.comfort(dt*7.8,'stroke');if(scripted.age>=1)scripted=null;}else if(scripted){scripted.age+=dt;const p=clamp(scripted.age/.38,0,1),ease=p*p*(3-2*p);scripted.pos={x:scripted.from.x+(scripted.target.x-scripted.from.x)*ease,y:scripted.from.y+(scripted.target.y-scripted.from.y)*ease};if(p>=1){hit(scripted.kind,.22);scripted=null;}}if(screen==='game')process();if(endWait>0){endWait-=dt;if(endWait<=0)showEnd();}}
    const guides=['hand','none','foot','none','headphones','dock'];room.draw(night,paused?0:dt,g||scripted,lesson>=0?guides[lesson]:night.stats.nudges+night.stats.kicks<3?'':'none',screen==='home');if(screen==='game')audio.tick(night);ui+=dt;if(ui>.1){update();ui=0;}requestAnimationFrame(frame);
  }
  soundUI();motionUI();resize();requestAnimationFrame(frame);
  // Test controls exist only on a local development origin with ?test=1, never on the public game.
  if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('test')==='1'){
    window.__hush={get night(){return night;},get audio(){return audio;},get room(){return room;},get paused(){return paused;},get gesture(){return g;},get lesson(){return lesson;},start,finishLesson,spawn:id=>{night.event=null;night.spawn(id);process();update();},advance:seconds=>{for(let t=0;t<seconds;t+=.05){night.step(.05);lessonUpdate();}process();update();},pause:value=>{paused=value;},update,help,close,goHome,settings,practice,gallery,get sandbox(){return sandbox;},setCare:(kind,on)=>night.setCare(kind,on)};
  }
})();
