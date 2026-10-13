"""Real Chromium pointer checks for 5.0; inline fixture only changes the local test gate.
Run after the base tests: python tests/second-chances.test.py --inline
Local HTTP: serve this folder on 8765 and omit --inline.
"""
from pathlib import Path
import sys,json
# Reuse the same test fixture and gesture helpers, not the baseline test runner.
HELPER=(Path(__file__).parent/'browser.test.py').read_text().split('with sync_playwright() as pw:')[0]
exec(compile(HELPER,'browser-helpers','exec'))

def down(page,cdp,selector):
 box=page.locator(selector).bounding_box()
 x,y=box['x']+box['width']/2,box['y']+box['height']/2
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
 page.wait_for_timeout(250)

def up(cdp,cancel=False):
 cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]})

def recovery(page):
 get(page,'__hush.practice("secondchance")');page.wait_for_timeout(300)

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 page=ctx.new_page();prepare(page);cdp=ctx.new_cdp_session(page)
 check('5.0 title identifies Second Chances','SECOND CHANCES' in page.locator('#intro').inner_text())
 page.locator('#startButton').tap();page.wait_for_timeout(600)
 check('first gesture starts a single running audio context',get(page,"__hush.audio.ctx.state==='running'"))
 check('music is a 45-second stereo buffer',get(page,'__hush.audio.bank.moonlight.duration===45&&__hush.audio.bank.moonlight.numberOfChannels===2'))
 check('all four audio loops are created only once',get(page,'__hush.audio.loops.length===4'))
 recovery(page)
 check('wake-up keeps the round playable without a loss dialog',get(page,"__hush.night.awake&&__hush.night.status==='playing'") and not page.locator('#modal').is_visible())
 check('recovery replaces the normal dock, not adds another row',page.locator('#recoveryControls').is_visible() and not page.locator('#headphoneButton').is_visible() and not page.locator('#shushButton').is_visible())
 check('risk meter becomes correctly labelled sleep progress',page.locator('#partnerMeterLabel').inner_text()=='Back to sleep' and page.locator('#wakeMeter').get_attribute('aria-label')=='Progress back to sleep')
 check('preferred technique is visibly marked',page.locator('#strokeButton').evaluate('(e)=>e.classList.contains("preferred")'))
 page.screenshot(path=str(OUT/'v5-awake-390.png'))
 drag(page,cdp,(113,85),(163,85),steps=14,delay=48)
 check('direct hair stroke is selected and changes sleep progress',get(page,'__hush.night.settle>2&&__hush.night.stats.nudges===0'))
 recovery(page);down(page,cdp,'#strokeButton');get(page,'__hush.advance(4)')
 check('holding Stroke performs care without repeated taps',get(page,"__hush.night.care==='stroke'&&__hush.night.settle>25"))
 check('caressing animation reaches the sleeper rather than the old strike target',get(page,'__hush.room.hand.x<180&&__hush.room.hand.y<140'))
 up(cdp,True);check('pointer cancellation stops care',get(page,"__hush.night.care===''") )
 recovery(page);down(page,cdp,'#humButton');page.wait_for_timeout(650)
 check('Hum starts the local humming audio layer',get(page,"__hush.night.care==='lullaby'&&__hush.audio.hum.gain.value>.7"))
 get(page,'__hush.advance(10)');page.wait_for_timeout(120)
 check('drowsy state appears before falling asleep',get(page,"__hush.night.phase==='drowsy'"))
 page.screenshot(path=str(OUT/'v5-drowsy-390.png'))
 get(page,'__hush.advance(8)');up(cdp);page.wait_for_timeout(500)
 check('a completed lullaby restores the sleeper and normal controls',get(page,'!__hush.night.awake&&__hush.night.stats.resettled===1') and page.locator('#headphoneButton').is_visible())
 check('recovery emits a soft musical goodnight cue',get(page,"!!__hush.audio.bank.goodnight"))
 recovery(page);get(page,'__hush.night.awakeTime=2.7');down(page,cdp,'#breatheButton');get(page,'__hush.advance(1)');up(cdp)
 check('paced breathing works with one real hold during exhale',get(page,'__hush.night.settle>10'))
 page.screenshot(path=str(OUT/'v5-breathe-390.png'))
 down(page,cdp,'#humButton');page.evaluate("window.dispatchEvent(new Event('blur'))");page.wait_for_timeout(350);up(cdp)
 check('tab switch clears care, pauses rules and fades audio',get(page,"__hush.paused&&__hush.night.care===''&&__hush.audio.master.gain.value<.05"))
 page.locator('#musicInput').uncheck();check('music has an independent mute',get(page,'!__hush.audio.musicEnabled&&__hush.settings.sound'))
 page.locator('#musicVolumeInput').fill('0.3');page.locator('#effectsInput').fill('0.4')
 check('music and effect gains can be adjusted independently',get(page,'__hush.audio.musicVolume===.3&&__hush.audio.effectsVolume===.4'))
 page.locator('#musicInput').check();page.locator('#resumeButton').tap();page.wait_for_timeout(300)
 check('resume does not create duplicate music loops',get(page,'__hush.audio.loops.length===4&&__hush.audio.ctx.state==="running"'))
 page.locator('#soundButton').tap();page.wait_for_timeout(400)
 check('master mute silences music and effects together',get(page,'!__hush.audio.enabled&&__hush.audio.master.gain.value<.02'))
 page.locator('#soundButton').tap();page.wait_for_timeout(400)
 check('sound returns on a new real gesture',get(page,'__hush.audio.enabled&&__hush.audio.master.gain.value>.3'))
 get(page,"__hush.settings.sound=false;__hush.audio.enabled=false;__hush.audio.mix();__hush.setCare('stroke',true);__hush.advance(13)")
 check('muted players can complete the same recovery',get(page,'!__hush.night.awake'))
 reset(page);get(page,"__hush.spawn('toilet');__hush.night.eventAction('enter');__hush.night.wakeUp();__hush.update()")
 check('waking during the loo trip does not trap the player off-screen',get(page,'!__hush.night.away') and page.locator('#humButton').is_visible())
 get(page,"__hush.setCare('stroke',true);__hush.advance(13)")
 check('parked loo trip resumes after recovery',get(page,'!__hush.night.awake&&__hush.night.away') and page.locator('#walkButton').is_visible())
 recovery(page);get(page,"__hush.settings.reduced=true;__hush.room.motion=true;__hush.setCare('breathe',true);__hush.night.awakeTime=3;__hush.advance(1)")
 check('reduced motion keeps the essential breath timing functional',get(page,'__hush.night.settle>10'))
 ctx.close()
 for w,h in [(320,568),(360,640),(375,667),(390,844),(393,852),(412,915),(430,932),(768,1024),(1024,768),(568,320),(667,375),(844,390)]:
  c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=True,has_touch=True)
  p=c.new_page();prepare(p);p.locator('#startButton').tap();recovery(p)
  fits=get(p,"['bedroom','hud','status','strokeButton','humButton','breatheButton'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.width>0&&r.height>0})")
  check(f'recovery layout stays on screen {w}x{h}',fits)
  check(f'three care targets remain at least 44px {w}x{h}',get(p,"['strokeButton','humButton','breatheButton'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.width>=44&&r.height>=44})"))
  check(f'no page overflow while awake {w}x{h}',get(p,'document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1'))
  if w in [320,568,390]:p.screenshot(path=str(OUT/f'v5-recovery-{w}x{h}.png'))
  c.close()
 check('no uncaught JavaScript errors in second-chance tests',not errors)
 (OUT/'second-chances-results.json').write_text(json.dumps({'checks':len(results),'passed':len(results),'errors':errors,'browser':browser.version,'mode':'inline' if INLINE else 'HTTP','results':results},indent=2))
 print(json.dumps({'passed':len(results),'errors':errors}));browser.close()
