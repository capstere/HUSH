"""Playwright touch, lifecycle, audio and small-screen tests.
Run: python tests/browser.test.py --inline
Without --inline, serve the project at http://127.0.0.1:8765/ first.
Inline mode preserves production code except the local-only test-hook gate;
used when the test browser's navigation policy blocks local URLs.
"""
from pathlib import Path
import sys, re, json, math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests'
INLINE='--inline' in sys.argv
results=[]; errors=[]; audio={}
def bundle():
    s=(ROOT/'index.html').read_text()
    s=re.sub(r'<link rel="stylesheet" href="([^"?]+)[^"]*">',lambda m:'<style>'+(ROOT/m[1]).read_text()+'</style>',s)
    paths=re.findall(r'<script defer src="([^"?]+)[^"]*"></script>',s)
    s=re.sub(r'<script defer src="[^"]*"></script>','',s)
    scripts=''
    for path in paths:
        code=(ROOT/path).read_text().replace("if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('test')==='1'){",'if(true){')
        scripts+='<script>'+code+'</script>'
    return s.replace('</body>',scripts+'</body>')
def check(name,condition):
    assert condition,name
    results.append({'test':name,'passed':True});print('PASS',name,flush=True)
def get(page,expr): return page.evaluate(expr)
def point(page,p):
    if isinstance(p,str): return get(page,'__hush.room.screen('+p+')')
    return page.evaluate('(p)=>__hush.room.screen(p)',{'x':p[0],'y':p[1]})
def tap(page,p):
    q=point(page,p);page.touchscreen.tap(q['x'],q['y']);page.wait_for_timeout(40)
def drag(page,session,start,end,steps=12,delay=28,cancel=False,hold=0):
    a=point(page,start);b=point(page,end)
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':a['x'],'y':a['y'],'id':1}]})
    for i in range(1,steps+1):
        t=i/steps;session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':a['x']+(b['x']-a['x'])*t,'y':a['y']+(b['y']-a['y'])*t,'id':1}]})
        page.wait_for_timeout(delay)
    if hold:page.wait_for_timeout(hold)
    session.send('Input.dispatchTouchEvent',{'type':'touchCancel' if cancel else 'touchEnd','touchPoints':[]})
    page.wait_for_timeout(90)
def prepare(page):
    page.set_default_timeout(7000)
    page.on('pageerror',lambda e: errors.append(str(e)))
    if INLINE:page.set_content(bundle())
    else:page.goto('http://127.0.0.1:8765/?test=1')
    page.wait_for_timeout(100)
def reset(page):
    get(page,"__hush.settings.learned=true;__hush.start();__hush.night.nextEvent=999;__hush.night.wake=0;")
    page.wait_for_timeout(200)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    if '--only-layouts' not in sys.argv:
        ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
        page=ctx.new_page();prepare(page);cdp=ctx.new_cdp_session(page)
        check('home loads and all six script globals exist',get(page,"!!(HushGame&&HushSoundBank&&HushNightSounds&&HushAudio&&HushBedroom&&__hush)"))
        page.screenshot(path=str(OUT/'home-390.png'))
        page.locator('#startButton').tap();page.wait_for_timeout(400)
        check('first start enters a no-pressure hands-on lesson',get(page,'__hush.lesson===0&&__hush.night.training&&__hush.night.t===0'))
        check('audio is unlocked by the real start gesture',get(page,"__hush.audio.ctx.state==='running'"))
        audio=get(page,"Object.fromEntries(Object.entries(__hush.audio.bank).map(([k,b])=>{const a=b.getChannelData(0);let energy=0,peak=0,finite=true;for(let i=0;i<a.length;i++){energy+=a[i]*a[i];peak=Math.max(peak,Math.abs(a[i]));finite=finite&&Number.isFinite(a[i]);}return[k,{duration:b.duration,rms:Math.sqrt(energy/a.length),peak,finite}]}))")
        check('all generated sounds are finite, non-silent and below digital clipping',all(v['finite'] and 0<v['rms'] and v['peak']<1 for v in audio.values()))
        check('the nonsense audiobook is a 12-second local audio buffer',11.99<audio['book']['duration']<12.01)
        drag(page,cdp,'HushPoints.hand','HushPoints.armTarget',delay=35,hold=250)
        check('real finger drag lands one hand nudge, not repeated hits while held',get(page,'__hush.night.stats.nudges===1&&__hush.lesson===1'))
        check('contact produces a visible freeze warning', 'FREEZE' in page.locator('#statusTitle').inner_text() or 'nothing' in page.locator('#statusTitle').inner_text())
        get(page,'__hush.advance(7)');page.wait_for_timeout(300)
        check('lesson waits for settling before teaching the foot',get(page,'__hush.lesson===2'))
        drag(page,cdp,'__hush.room.foot','HushPoints.footTarget',delay=35)
        check('real finger drag delivers a foot kick',get(page,'__hush.night.stats.kicks===1&&__hush.lesson===3'))
        get(page,'__hush.advance(8)');page.wait_for_timeout(250)
        drag(page,cdp,'HushPoints.dock','HushPoints.head')
        check('headphones can be dragged onto the player',get(page,'__hush.night.headphones&&__hush.lesson===5'))
        page.screenshot(path=str(OUT/'headphones-390.png'))
        drag(page,cdp,'HushPoints.head','HushPoints.dock')
        check('dragging headphones to stand completes lesson and starts night',get(page,'!__hush.night.headphones&&!__hush.night.training&&__hush.lesson===-1'))
        reset(page)
        before=get(page,'__hush.night.stats.nudges')
        drag(page,cdp,'__hush.room.hand',(251,264),cancel=True)
        check('cancelled short drag causes no unintended contact',get(page,'__hush.night.stats.nudges')==before and get(page,'__hush.gesture===null'))
        page.wait_for_timeout(250)
        tap(page,'__hush.room.hand')
        check('simple tap does not nudge in drag mode',get(page,'__hush.night.stats.nudges')==before)
        get(page,'__hush.settings.tap=true')
        tap(page,'__hush.room.hand');page.wait_for_timeout(500)
        check('optional tap mode animates a real soft nudge',get(page,'__hush.night.stats.nudges')==before+1)
        get(page,'__hush.settings.tap=false');reset(page)
        drag(page,cdp,'__hush.room.foot','HushPoints.footTarget',steps=3,delay=2)
        page.wait_for_timeout(400)
        drag(page,cdp,'__hush.room.hand','HushPoints.armTarget',steps=3,delay=2)
        check('hard repeat contact while stirring actually triggers game over',get(page,"__hush.night.status==='lost'"))
        check('loss shows a usable replay dialog',page.locator('#againButton').is_visible())
        page.screenshot(path=str(OUT/'lost-390.png'))
        page.locator('#againButton').tap();get(page,'__hush.night.nextEvent=999')
        check('replay resets wake-up risk and stats',get(page,'__hush.night.wake<5&&__hush.night.stats.nudges===0'))
        page.locator('#headphoneButton').tap();page.wait_for_timeout(120)
        check('one-thumb headphone button equips without a gesture',get(page,'__hush.night.headphones'))
        get(page,'__hush.advance(4)');b=get(page,'__hush.night.battery');page.locator('#headphoneButton').tap();get(page,'__hush.advance(3)')
        check('visible battery increases on stand',get(page,'__hush.night.battery')>b and 'charging' in page.locator('#headphoneHint').inner_text())
        page.locator('#soundButton').tap();page.wait_for_timeout(120)
        check('mute changes the actual audio bus as well as the icon',get(page,'!__hush.audio.enabled&&__hush.audio.master.gain.value<.05'))
        page.locator('#soundButton').tap();page.wait_for_timeout(120)
        check('unmute restores audio without restarting night',get(page,'__hush.audio.enabled&&__hush.audio.master.gain.value>.3'))
        reset(page)
        box=page.locator('#shushButton').bounding_box();x,y=box['x']+box['width']/2,box['y']+20
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]});page.wait_for_timeout(300)
        check('holding the thumb control starts shushing',get(page,'__hush.night.shushing'))
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':10,'y':y-60,'id':1}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        check('releasing outside the button still stops the hold',not get(page,'__hush.night.shushing'))
        reset(page);get(page,"__hush.spawn('fart')");page.screenshot(path=str(OUT/'fart-390.png'))
        drag(page,cdp,(120,343),(305,343),steps=10);drag(page,cdp,(305,343),(112,343),steps=10);drag(page,cdp,(112,343),(300,343),steps=10)
        check('three back-and-forth fan gestures clear the fart cloud',get(page,'__hush.night.event===null&&__hush.night.stats.solved===1'))
        get(page,"__hush.spawn('nightmare')");page.screenshot(path=str(OUT/'nightmare-390.png'))
        for i in range(3):tap(page,f'__hush.room.ghost({i})')
        check('all three dream monsters can be popped by touch',get(page,'__hush.night.event===null&&__hush.night.stats.solved===2'))
        get(page,"__hush.spawn('cat')");drag(page,cdp,'HushPoints.cat','HushPoints.rug')
        check('cat drag ends on the rug, not just in an invisible success state',get(page,'__hush.night.catOnRug&&__hush.night.event===null'))
        get(page,"__hush.spawn('phone')");tap(page,'HushPoints.phone')
        check('tapping actual bedside phone silences its event',get(page,'__hush.night.event===null'))
        get(page,"__hush.spawn('duvet')");drag(page,cdp,'HushPoints.blanket',(370,258))
        check('dragging the duvet edge reclaims it',get(page,'__hush.night.event===null'))
        get(page,"__hush.spawn('mosquito')");tap(page,'__hush.room.bug()')
        check('moving mosquito has a touch-sized hit target',get(page,'__hush.night.event===null'))
        get(page,"__hush.spawn('toilet')");tap(page,'HushPoints.door')
        check('bathroom door opens the same-screen tiptoe scene',get(page,'__hush.night.away') and page.locator('#walkButton').is_visible())
        page.screenshot(path=str(OUT/'bathroom-390.png'))
        # Check the real hold target, then advance deterministic rules separately.
        tapstate=get(page,'__hush.night.elapsed');get(page,'__hush.night.elapsed=0.2')
        box=page.locator('#walkButton').bounding_box();x,y=box['x']+box['width']/2,box['y']+20
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]});page.wait_for_timeout(300)
        check('green bathroom hold moves the sock avatar',get(page,'__hush.night.event.progress>0'))
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});check('bathroom release stops moving',not get(page,'__hush.night.event.holding'))
        get(page,'for(let i=0;i<400&&__hush.night.event;i++){__hush.night.eventAction("walk",__hush.night.floorSafe);__hush.night.step(.05)};__hush.update();')
        page.wait_for_timeout(100)
        check('successful toilet visit returns all normal controls',not get(page,'__hush.night.away') and page.locator('#shushButton').is_visible())
        reset(page);page.locator('#menuButton').tap();t=get(page,'__hush.night.t');page.wait_for_timeout(250)
        check('pause freezes the night and audio',get(page,'__hush.night.t')==t and get(page,'__hush.audio.paused'))
        page.locator('#motionInput').check();page.locator('#resumeButton').tap()
        check('reduced-motion preference is applied to scene and page',get(page,'__hush.room.motion&&document.body.classList.contains("reduced")'))
        check('resume restores simulation',get(page,'!__hush.paused'))
        page.evaluate("window.dispatchEvent(new Event('blur'))")
        check('switching away automatically pauses and clears holds',get(page,'__hush.paused&&!__hush.night.shushing&&__hush.gesture===null'))
        page.locator('#resumeButton').tap();reset(page)
        get(page,'__hush.night.noise=0;__hush.night.quiet=999;__hush.advance(151)')
        check('dawn produces the winning summary and replay',get(page,"__hush.night.status==='won'") and page.locator('#againButton').is_visible())
        page.screenshot(path=str(OUT/'won-390.png'))
        page.locator('#endHomeButton').tap();check('returning home resets the game screen',get(page,"document.querySelector('#app').dataset.screen==='home'"))
        ctx.close()
    for w,h in ([] if '--only-main' in sys.argv else [(320,568),(360,640),(375,667),(390,844),(393,852),(412,915),(430,932),(768,1024),(1024,768),(568,320),(667,375),(844,390)]):
        c=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=True,has_touch=True);p=c.new_page();prepare(p)
        check(f'home start button on-screen {w}x{h}',p.locator('#startButton').bounding_box()['y']+p.locator('#startButton').bounding_box()['height']<=h+1)
        p.locator('#startButton').tap();p.wait_for_timeout(100);p.locator('#skipButton').tap();get(p,'__hush.night.nextEvent=999')
        fits=get(p,"['hud','status','controls','headphoneButton','shushButton','bedroom'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.width>0&&r.height>0})")
        check(f'all gameplay controls fit without scrolling {w}x{h}',fits)
        check(f'no document overflow {w}x{h}',get(p,'document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1'))
        session=c.new_cdp_session(p);drag(p,session,'__hush.room.hand','HushPoints.armTarget',steps=8,delay=15)
        check(f'real scaled touch nudge works {w}x{h}',get(p,'__hush.night.stats.nudges===1'))
        p.screenshot(path=str(OUT/f'layout-{w}x{h}.png'));c.close()
    check('no uncaught JavaScript errors in the entire browser run',not errors)
    payload={'mode':'inline exact source with test-hook gate enabled' if INLINE else 'local HTTP','browser':browser.version,'checks':len(results),'passed':len(results),'errors':errors,'results':results,'audio':audio}
    (OUT/('browser-results'+('-main' if '--only-main' in sys.argv else '-layouts' if '--only-layouts' in sys.argv else '')+'.json')).write_text(json.dumps(payload,indent=2))
    browser.close()
print(json.dumps({'passed':len(results),'errors':errors},indent=2))
