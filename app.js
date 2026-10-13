/* HUSH 2.0 — small-screen UI, gesture handling and lifecycle. No network access. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const { Night, TOOLS, MODES, quality, clamp } = HushRules;
  const icon = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  let saved = {}; try { saved = JSON.parse(localStorage.getItem('hush.v2') || '{}') || {}; } catch (_) {}
  if (typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const settings = { sound: saved.sound !== false, volume: Number.isFinite(saved.volume) ? clamp(saved.volume, .1, 1) : .65, motion: typeof saved.motion === 'boolean' ? saved.motion : matchMedia('(prefers-reduced-motion: reduce)').matches, mode: MODES[saved.mode] ? saved.mode : 'normal', daily: saved.daily === true, records: {} };
  if (saved.records && typeof saved.records === 'object') for (const [k,v] of Object.entries(saved.records)) if (Number.isFinite(v) && v >= 0) settings.records[k] = v;
  const audio = new HushAudio(); audio.enabled = settings.sound; audio.volume = settings.volume;
  const room = new HushBedroom($('bedroom'));
  const home = new Night('normal', 122); home.patience = 40;
  let night = null, screen = 'home', paused = false, selected = TOOLS[0], active = null, taps = [], endShown = false;
  let lastFrame = 0, modalView = '', focusBefore = null, captionUntil = 0, feedbackUntil = 0, lastAnnounce = -100, uiElapsed = 0;
  function persist() { try { localStorage.setItem('hush.v2', JSON.stringify(settings)); return true; } catch (_) { return false; } }
  function dailySeed() { const d = new Date(); return Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`); }
  function recordKey() { return settings.mode + (settings.daily ? '-' + dailySeed() : ''); }
  function announce(text) { $('announcer').textContent = text; }
  function soundUI() { $('soundButton').setAttribute('aria-pressed', String(settings.sound)); $('soundButton').setAttribute('aria-label', settings.sound ? 'Mute sound' : 'Enable sound'); $('soundButton').innerHTML = icon(settings.sound ? 'sound' : 'muted'); }
  async function unlockAudio() {
    if (!settings.sound) return;
    const ok = await audio.unlock();
    if (!ok && !audio.available) { settings.sound = false; audio.enabled = false; soundUI(); announce('Audio is unavailable here. You can still play without sound.'); }
  }
  function cancelGesture() { active = null; taps = []; audio.stopHum(); $('actionButton').classList.remove('holding', 'good'); }
  function notify(text, bad = false, duration = 3) { $('feedback').textContent = text; $('feedback').classList.toggle('bad', bad); feedbackUntil = (night?.t || 0) + duration; }
  function caption(text, duration = 3) { $('sceneCaption').textContent = text; captionUntil = (night?.t || 0) + duration; }
  function buildDock() {
    $('toolDock').innerHTML = TOOLS.slice(0,3).map(t => `<button class="tool-button" data-tool="${t.id}" aria-pressed="${t.id===selected.id}" aria-label="Choose ${t.name}">${icon(t.icon)}<span>${t.name}</span><small class="cool" hidden></small></button>`).join('') + `<button class="tool-button" id="moreButton" aria-label="More moves" aria-pressed="${!TOOLS.slice(0,3).includes(selected)}">${icon(!TOOLS.slice(0,3).includes(selected)?selected.icon:'more')}<span>${!TOOLS.slice(0,3).includes(selected)?selected.name:'More'}</span><small class="cool" hidden></small></button>`;
    document.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => select(b.dataset.tool)));
    $('moreButton').addEventListener('click', () => openModal('moves'));
  }
  function select(id) { selected = TOOLS.find(t => t.id === id) || TOOLS[0]; cancelGesture(); buildDock(); updateUI(); }
  function start() {
    cancelGesture(); closeModal(false); night = new Night(settings.mode, settings.daily ? dailySeed() : (Date.now() ^ Math.floor(Math.random()*1e8)));
    screen = 'game'; paused = false; endShown = false; lastFrame = performance.now(); audio.phaseKey = ''; audio.setPaused(false); unlockAudio();
    $('app').dataset.screen = 'game'; ['intro','homeFooter','homeEyebrow'].forEach(id => $(id).hidden = true); ['hud','controls','smallBrand'].forEach(id => $(id).hidden = false);
    $('menuIcon').setAttribute('href','#i-pause'); $('menuButton').setAttribute('aria-label','Pause game');
    room.pose = { side:0, cozy:0, relax:0, reach:0, lift:0, warm:0 }; room.effect = null;
    select('hush'); caption('02:00. Here we go again.', 5); notify('Keep them quiet. Keep your cool.', false, 6); announce('The night begins. Keep the snoring down without waking your partner.');
    room.resize(); $('actionButton').focus({preventScroll:true});
  }
  function goHome() {
    cancelGesture(); closeModal(false); night = null; screen = 'home'; paused = false; endShown = false; audio.stopVoices(); audio.setPaused(false);
    $('app').dataset.screen = 'home'; ['intro','homeFooter','homeEyebrow'].forEach(id => $(id).hidden = false); ['hud','controls','smallBrand'].forEach(id => $(id).hidden = true);
    $('menuIcon').setAttribute('href','#i-settings'); $('menuButton').setAttribute('aria-label','Settings'); $('eventButton').hidden = true;
    $('sceneCaption').textContent = 'One bed. Two very different nights.'; updateRecord(); room.resize(); $('startButton').focus({preventScroll:true});
  }
  function updateRecord() { const best = settings.records[recordKey()]; $('record').textContent = best ? `Your best night: ${Math.round(best).toLocaleString('en-US')} points` : ''; $('startButton').firstElementChild.textContent = settings.daily ? 'Save today’s night' : 'Save the night'; }
  function pause(reason) { if (!night || night.status !== 'playing') return; paused = true; cancelGesture(); audio.setPaused(true); openModal('pause', reason); }
  function resume() { closeModal(false); if (screen === 'game' && night?.status === 'playing') { paused = false; audio.setPaused(false); lastFrame = performance.now(); unlockAudio(); updateUI(); } }
  function openModal(view, reason='') {
    if (!$('modal').open) focusBefore = document.activeElement;
    if (screen === 'game' && night?.status === 'playing') { paused = true; cancelGesture(); audio.setPaused(true); }
    modalView = view; $('closeModal').hidden = view === 'result';
    const content = $('dialogContent');
    if (view === 'moves') {
      $('dialogEyebrow').textContent = 'A FEW MORE BRIGHT IDEAS'; $('dialogTitle').textContent = 'Midnight diplomacy.';
      const descriptions = {pat:'Tap a gentle rhythm',rain:'18 seconds of soft rain',tuck:'Keep the blanket peace',hum:'A tiny, tiny lullaby',warm:'Restore your patience'};
      content.innerHTML = `<div class="moves-grid">${TOOLS.slice(3).map(t => `<button class="extra-move" data-extra="${t.id}">${icon(t.icon)}<span><strong>${t.name}</strong><small>${night?.cooldowns[t.id]>0?'Ready in '+Math.ceil(night.cooldowns[t.id])+'s':descriptions[t.id]}</small></span></button>`).join('')}</div><p class="audio-note">The night is paused while you choose. Every move works with sound off, too.</p>`;
      content.querySelectorAll('[data-extra]').forEach(b=>b.onclick=()=>{select(b.dataset.extra);resume();});
    } else if (view === 'help') {
      $('dialogEyebrow').textContent = 'THE ART OF DOING VERY LITTLE'; $('dialogTitle').textContent = 'Quietly does it.';
      content.innerHTML = `<div class="help-step"><b>One. Keep the peace.</b><p>Get from <strong>02:00 to 07:00</strong> in two real minutes. Snoring drains your patience. Quiet restores it. If you snap, you wake them.</p></div><div class="help-step"><b>Two. Less is more.</b><p>Choose a move below the bed. For Shhh, <strong>tap in the soft zone</strong>. For most other moves, <strong>hold, then release in that zone</strong>. Rough moves raise the wake-up risk.</p></div><div class="help-step"><b>Three. Improvise.</b><p>Try <strong>Pillow → Roll over</strong>. Repeating one trick makes it weaker. Look under <strong>More</strong> for rain, a lullaby and warm feet. Tap the alert if the phone or cat interrupts.</p></div><p class="audio-note">Mouse, touch or keyboard. Tab to a button; Space or Enter to use it. Swipe actions also have a hold-button alternative. No microphone needed.</p><button class="primary dialog-primary" id="helpDone">Let’s be very quiet ${icon('arrow')}</button>`;
      $('helpDone').onclick=()=>screen==='game'?resume():closeModal();
    } else if (view === 'pause' || view === 'settings') {
      $('dialogEyebrow').textContent = screen==='game'?'THE NIGHT CAN WAIT':'MAKE YOURSELF COMFORTABLE'; $('dialogTitle').textContent = screen==='game'?'A little breather.':'Bedside settings.';
      content.innerHTML = `${reason?`<p>${reason}</p>`:''}<div class="setting-row"><span>Sound</span><button id="settingSound" aria-pressed="${settings.sound}">${settings.sound?'On':'Off'}</button></div><label class="setting-row"><span>Sound level</span><input id="volume" type="range" min="10" max="100" value="${Math.round(settings.volume*100)}" aria-label="Sound level"></label><div class="setting-row"><span>Reduced motion</span><button id="settingMotion" aria-pressed="${settings.motion}">${settings.motion?'On':'Off'}</button></div>${screen==='home'?`<p class="setting-label">CHOOSE YOUR NIGHT</p><div class="modes">${Object.entries(MODES).map(([id,m])=>`<button data-mode="${id}" aria-pressed="${settings.mode===id}">${m.name}</button>`).join('')}</div><div class="setting-row"><span>Daily night · same seed today</span><button id="settingDaily" aria-pressed="${settings.daily}">${settings.daily?'On':'Off'}</button></div>`:''}<button class="primary dialog-primary" id="resumeButton">${screen==='game'?'Back to bed':'All settled'} ${icon('arrow')}</button><div class="dialog-links"><button id="modalHelp">How to play</button>${screen==='game'?'<button id="quitButton">Leave this night</button>':'<span></span>'}</div><p class="audio-note">Original synthesised audio. No microphone, account, ads or tracking. Based on Jesper’s original drawing.</p>`;
      $('settingSound').onclick=()=>{toggleSound();$('settingSound').textContent=settings.sound?'On':'Off';$('settingSound').setAttribute('aria-pressed',String(settings.sound));};
      $('volume').oninput=e=>{settings.volume=Number(e.target.value)/100;audio.volume=settings.volume;audio.mix();persist();};
      $('settingMotion').onclick=()=>{settings.motion=!settings.motion;persist();$('settingMotion').textContent=settings.motion?'On':'Off';$('settingMotion').setAttribute('aria-pressed',String(settings.motion));};
      if($('settingDaily'))$('settingDaily').onclick=()=>{settings.daily=!settings.daily;persist();$('settingDaily').textContent=settings.daily?'On':'Off';$('settingDaily').setAttribute('aria-pressed',String(settings.daily));updateRecord();};
      content.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{settings.mode=b.dataset.mode;persist();content.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateRecord();});
      $('resumeButton').onclick=()=>screen==='game'?resume():closeModal(); $('modalHelp').onclick=()=>openModal('help'); if($('quitButton'))$('quitButton').onclick=()=>openModal('quit');
    } else if (view === 'quit') {
      $('dialogEyebrow').textContent='THE SOFA IS CALLING';$('dialogTitle').textContent='Call it a night?';
      content.innerHTML='<p>This run will end. Your saved best score stays.</p><button class="primary" id="stayButton">Stay in bed</button><div class="dialog-links"><button id="leaveButton">Leave this night</button></div>';
      $('stayButton').onclick=resume;$('leaveButton').onclick=goHome;
    } else if (view === 'result') {
      const won=night.status==='won', score=Math.round(night.score), key=recordKey(), best=settings.records[key]||0, isBest=score>best;
      if(isBest){settings.records[key]=score;persist();}
      $('dialogEyebrow').textContent=won?'07:00 · THE NIGHT IS YOURS':`${night.clock} · SOMEONE IS AWAKE`;
      $('dialogTitle').textContent=won?'Good morning, diplomat.':'Wide awake. Obviously.';
      const stars=won?Math.min(3,1+(night.quiet>25?1:0)+(night.wake<35&&night.patience>45?1:0)):0;
      content.innerHTML=`<div class="result-mark">${won?['A NIGHT SURVIVED','A LITTLE MIDNIGHT MAGIC','A MASTERCLASS IN QUIET'][stars-1]:'GAME OVER'}</div><blockquote class="result-quote">${won?'“I slept so well. Did you?”':'“I wasn’t snoring. I was breathing with character.”'}</blockquote>${!won?`<p>${night.reason==='patience'?'Your patience ran out. “STOP SNORING!” is not a lullaby.':'One move too many. Your partner woke up.'}</p>`:''}<div class="result-stats"><div><b>${score.toLocaleString('en-US')}</b><small>points</small></div><div><b>${Math.floor(night.quiet)}s</b><small>sweet silence</small></div><div><b>${night.perfect}</b><small>gentle moves</small></div></div><p>${isBest?'A new best. Try not to mention it at breakfast.':'Some nights deserve another try.'}</p><button id="againButton" class="primary">One more night ${icon('arrow')}</button><div class="dialog-links"><button id="homeButton">Back to the bedroom</button></div>`;
      $('againButton').onclick=start;$('homeButton').onclick=goHome;
    }
    if(!$('modal').open)$('modal').showModal();
    const first=content.querySelector('button,input'); if(first)first.focus({preventScroll:true});
  }
  function closeModal(restore=true) { if($('modal').open)$('modal').close();modalView='';if(restore&&focusBefore?.isConnected&&!focusBefore.closest('[hidden]'))focusBefore.focus({preventScroll:true}); }
  function toggleSound() { settings.sound=!settings.sound;audio.enabled=settings.sound;audio.mix();if(!settings.sound)audio.stopVoices();else unlockAudio();soundUI();persist(); }
  function canAct() { return screen==='game'&&!paused&&night?.ready(selected.id)&&!$('modal').open; }
  function commit(q) {
    if(!canAct())return;const id=selected.id;cancelGesture();night.act(id,q);processEvents();updateUI();
  }
  function actionDown(e,source='button') {
    if(e?.type==='pointerdown'&&(e.button!==0||!e.isPrimary))return;
    if(!canAct()||active)return;
    if(e)e.preventDefault();unlockAudio();
    if(selected.type==='timing'){commit(quality(night.phase));return;}
    if(selected.type==='instant'){commit(1);return;}
    if(selected.type==='rhythm'){
      if(taps.length&&night.t-taps[taps.length-1]>1.3)taps=[];
      taps.push(night.t);audio.play('pat',.8,-.1);room.animate('pat');
      if(taps.length===3){const gaps=[taps[1]-taps[0],taps[2]-taps[1]];const q=gaps.reduce((a,g)=>a+(g>=.35&&g<=.85?1:clamp(1-Math.abs(g-.6)*2,0,.7)),0)/2;commit(q);}else notify(taps.length===1?'One. A little patience…':'Two. One more soft pat.',false,2);
      return;
    }
    active={id:selected.id,source,start:night.t,pointer:e?.pointerId,x:e?.clientX||0,delta:0};
    if(e?.pointerId!==undefined)try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}
    if(selected.id==='hum')audio.startHum();
    if(['pillow','roll','tuck'].includes(selected.id))audio.play('fabric',.25,-.2);
    $('actionButton').classList.add('holding');
  }
  function actionUp(e,cancel=false) {
    if(!active)return;if(e?.pointerId!==undefined&&active.pointer!==e.pointerId)return;
    if(e)e.preventDefault();if(cancel||!canAct()){cancelGesture();return;}
    const age=night.t-active.start;
    if(active.source==='canvas'&&selected.type==='drag'){
      const required=Math.min(95,Math.max(45,$('bedroom').clientWidth*.2));const q=age>=.55&&age<=3?clamp(active.delta/required,0,1):clamp(age/.55,0,.45);
      if(active.delta<8){cancelGesture();notify('A slow swipe to the right. Or use the button.',false,3);return;}commit(q);
    }else commit(quality(age/selected.duration));
  }
  function processEvents() {
    while(night?.queue.length){
      const e=night.queue.shift();
      if(e.type==='action'){
        room.animate(e.id,e.q);audio.effect(e.id,!e.failed);
        if(e.combo)notify('Pillow + roll. Five-star hotel energy.',false,4);
        else if(e.failed)notify('Easy. That was a little too much.',true,3);
        else if(e.repeated)notify('They’re getting used to that. Try another move.',false,3);
        else {const words={hush:'A small shhh. A big improvement.',pillow:'Fluffed, not flustered.',roll:'A change of perspective. And volume.',pat:'A tiny rhythm. A little peace.',rain:'Let the rain do the talking.',tuck:'Cocoon mode: quietly activated.',hum:'An audience of one. Thankfully asleep.',warm:'Cold feet, warm heart.'};notify(e.q>.84?words[e.id]:'That helped. Softer next time.',false,3);}
      }else if(e.type==='event'){audio.event(e.kind);caption(e.kind==='phone'?'The group chat has terrible timing.':'The cat has entered the negotiations.',4);announce(e.kind==='phone'?'Phone buzzing. Tap the alert to silence it.':'Cat at the foot of the bed. Tap the alert to pet it.');}
      else if(e.type==='saved'){audio.play('pat',.25);notify(e.kind==='phone'?'Airplane mode. Relationship saved.':'The cat accepts your terms.',false,3);}
      else if(e.type==='missed'){audio.event(e.kind);notify(e.kind==='phone'?'Bzzz. So much for subtle.':'The cat would like to speak to management.',true,3);}
      else if(e.type==='end'&&!endShown){endShown=true;cancelGesture();audio.finish(night.status==='won');openModal('result');announce(night.status==='won'?'You made it to morning.':'Your partner woke up. Game over.');}
    }
  }
  function updateUI() {
    if(!night)return;
    $('clock').textContent=night.clock;$('nightProgress').style.width=(night.progress*100)+'%';
    $('patienceFill').style.transform=`scaleX(${night.patience/100})`;$('wakeFill').style.transform=`scaleX(${night.wake/100})`;
    $('patienceMeter').setAttribute('aria-valuenow',Math.round(night.patience));$('wakeMeter').setAttribute('aria-valuenow',Math.round(night.wake));
    $('patienceWord').textContent=night.patience>65?'Plenty':night.patience>30?'Holding on':'Running thin';$('wakeWord').textContent=night.wake<35?'Low':night.wake<65?'Stirring':'Careful';
    $('patienceMeter').classList.toggle('critical',night.patience<25);$('wakeMeter').classList.toggle('critical',night.wake>65);
    if(night.t>captionUntil)$('sceneCaption').textContent=night.noise<32?'Sweet, glorious silence.':night.noise>83?'Is that a person or a small tractor?':night.noise>55?'One bed. Two very different nights.':'A little quieter. A little closer to sleep.';
    if(night.t>feedbackUntil)$('feedback').textContent=night.patience<25?'Your patience is thin. Try Warm feet.':night.wake>65?'They’re stirring. Gentle moves, or wait a little.':night.noise<32?'Nothing to fix. Enjoy the quiet.':'A softer touch goes a long way.';
    if((night.patience<25||night.wake>65)&&night.t-lastAnnounce>12){announce(night.patience<25?'Patience is low. Quiet the snoring or try Warm feet.':'High wake-up risk. Be gentle.');lastAnnounce=night.t;}
    const cd=Math.ceil(night.cooldowns[selected.id]||0);
    $('instruction').textContent=selected.hint;
    $('actionButton').disabled=cd>0||night.status!=='playing'||paused;
    $('actionText').textContent=cd>0?`A little breather · ${cd}s`:selected.type==='rhythm'&&taps.length?`${taps.length} of 3 gentle pats`:selected.label;
    $('actionHint').textContent=cd>0?'TRY ANOTHER MOVE':active?'RELEASE IN THE ZONE':selected.type==='timing'?'TAP IN THE SOFT ZONE':selected.type==='instant'?'TAP ONCE':selected.type==='rhythm'?'TAP · TAP · TAP':'HOLD & RELEASE';
    $('skillTrack').style.visibility=['instant','rhythm'].includes(selected.type)?'hidden':'visible';
    let p=selected.type==='timing'?night.phase:active?(night.t-active.start)/selected.duration:0;
    if(active?.source==='canvas')p=active.delta/Math.min(95,Math.max(45,$('bedroom').clientWidth*.2))*.65;
    $('skillNeedle').style.left=clamp(p*100,0,100)+'%';$('actionButton').classList.toggle('good',!!active&&p>=.52&&p<=.77);
    document.querySelectorAll('[data-tool]').forEach(b=>{const wait=Math.ceil(night.cooldowns[b.dataset.tool]||0),el=b.querySelector('.cool');el.hidden=!wait;el.textContent=wait+'s';});
    const moreCool=$('moreButton')?.querySelector('.cool');if(moreCool){const wait=TOOLS.slice(0,3).includes(selected)?0:cd;moreCool.hidden=!wait;moreCool.textContent=wait+'s';}
    $('eventButton').hidden=!night.event||night.status!=='playing';
    if(night.event)$('eventButton').textContent=`${night.event.kind==='phone'?'Silence the phone':'Pet the cat'} · ${Math.ceil(night.event.left)}s`;
  }
  function frame(now) {
    const dt=lastFrame?Math.min((now-lastFrame)/1000,.05):1/60;lastFrame=now;
    if(!document.hidden){
      if(screen==='game'&&night){
        if(!paused&&night.status==='playing'){night.step(dt);if(active&&night.t-active.start>selected.duration*1.08)commit(0);processEvents();}
        uiElapsed+=dt;if(uiElapsed>.05){updateUI();uiElapsed=0;}
        room.draw(night,paused?0:dt,settings.motion,false,active?{id:active.id,age:night.t-active.start}:null);audio.update(night);
      }else{home.t+=dt;room.draw({...home,clock:'02:14',phase:home.phase,progress:0},dt,settings.motion,true);audio.update(null);}
    }
    requestAnimationFrame(frame);
  }
  $('startButton').onclick=start;$('soundButton').onclick=toggleSound;
  $('menuButton').onclick=()=>screen==='game'?pause():openModal('settings');$('helpButton').onclick=()=>openModal('help');
  $('closeModal').onclick=()=>screen==='game'&&night?.status==='playing'?resume():closeModal();
  $('modal').addEventListener('cancel',e=>{e.preventDefault();if(modalView==='result')goHome();else if(screen==='game')resume();else closeModal();});
  $('eventButton').onclick=()=>{if(!paused&&night?.resolveEvent()){processEvents();updateUI();}};
  $('actionButton').addEventListener('pointerdown',e=>actionDown(e));
  $('actionButton').addEventListener('pointerup',e=>actionUp(e));
  $('actionButton').addEventListener('pointercancel',e=>actionUp(e,true));
  $('actionButton').addEventListener('lostpointercapture',e=>{if(active?.pointer===e.pointerId)cancelGesture();});
  $('actionButton').addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)actionDown(e,'keyboard');});
  $('actionButton').addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')actionUp(e);});
  // Assistive technology may synthesize a click without preceding pointer/key events.
  $('actionButton').addEventListener('click',e=>{if(e.detail===0&&e.isTrusted&&canAct()&&!active&&!['hold','drag'].includes(selected.type))actionDown(null);});
  $('bedroom').addEventListener('pointerdown',e=>{
    if(screen!=='game'||paused)return;const p=room.point(e);
    if(night.event&&((night.event.kind==='phone'&&p.x<95&&p.y>300)||(night.event.kind==='cat'&&p.x>460&&p.y>520))){night.resolveEvent();processEvents();updateUI();return;}
    if(selected.type==='drag')actionDown(e,'canvas');
  });
  $('bedroom').addEventListener('pointermove',e=>{if(active?.source==='canvas'&&active.pointer===e.pointerId){active.delta=e.clientX-active.x;e.preventDefault();}});
  $('bedroom').addEventListener('pointerup',e=>actionUp(e));$('bedroom').addEventListener('pointercancel',e=>actionUp(e,true));
  $('bedroom').addEventListener('lostpointercapture',e=>{if(active?.pointer===e.pointerId)cancelGesture();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelGesture();audio.setPaused(true);if(audio.ctx)audio.ctx.suspend().catch(()=>{});if(screen==='game'&&night?.status==='playing')pause('Paused while you were away. Nothing happened without you.');}else if(screen==='home'){audio.setPaused(false);}});
  window.addEventListener('pagehide',()=>{cancelGesture();audio.setPaused(true);if(audio.ctx)audio.ctx.suspend().catch(()=>{});if(screen==='game'&&night?.status==='playing')pause('Welcome back. Your night is paused.');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal').open&&screen==='game')pause();if(e.target.matches('input,button')||$('modal').open)return;if(['1','2','3'].includes(e.key)&&screen==='game')select(TOOLS[Number(e.key)-1].id);});
  window.addEventListener('contextmenu',e=>{if(e.target===$('bedroom')||e.target.closest('#actionButton'))e.preventDefault();});
  soundUI();buildDock();updateRecord();requestAnimationFrame(frame);
  // Explicitly opt-in diagnostics; never change production rules for testing.
  if(new URLSearchParams(location.search).has('test') || window.__HUSH_TEST__ === true)window.__HUSH__={get night(){return night;},get audio(){return audio;},get room(){return room;},get paused(){return paused;},get selected(){return selected;},start,select,pause,resume,updateUI,processEvents,advance(seconds){for(let i=0;i<seconds*20;i++)night.step(.05);processEvents();updateUI();},act(id,q){night.act(id,q);processEvents();updateUI();},settings};
})();
