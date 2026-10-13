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

# These checks exercise real emulated touches; hooks select deterministic scenes only.
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    page=ctx.new_page();prepare(page);cdp=ctx.new_cdp_session(page)
    check('release identifies itself as After Midnight 4.0', 'AFTER MIDNIGHT' in page.locator('#intro').inner_text() and '4.0' in page.locator('.home-meta').inner_text())
    page.locator('#playgroundButton').tap()
    check('practice gallery exposes all ten scenes',page.locator('[data-scene]').count()==10)
    page.locator('[data-scene="pillow"]').tap();page.wait_for_timeout(200)
    check('practice has no ticking night clock and displays PLAY',get(page,'__hush.sandbox&&__hush.night.training&&__hush.night.t===0') and page.locator('#clock').inner_text()=='PLAY')
    drag(page,cdp,'HushPoints.pillow',(126,121),steps=16,delay=35)
    check('pillow tab follows a real drag and starts cool-side relief',get(page,'__hush.night.coolSide>15&&__hush.night.pillowCount===1'))
    page.wait_for_timeout(300);page.screenshot(path=str(OUT/'v4-cool-side.png'))
    check('pillow has a visible animated turned head and feather effect',get(page,'__hush.room.fx.side>.2&&__hush.room.fx.pillow>0'))
    drag(page,cdp,'HushPoints.pillow',(126,121),steps=8,delay=20)
    check('pillow cooldown rejects immediate repeated drags',get(page,'__hush.night.pillowCount===1'))
    page.locator('#skipButton').tap();page.locator('[data-scene="sneeze"]').tap();page.wait_for_timeout(250)
    page.screenshot(path=str(OUT/'v4-sneeze.png'))
    check('sneeze appears with its on-screen tissue box',get(page,"__hush.night.event.id==='sneeze'") and 'tissue' in page.locator('#statusHint').inner_text())
    drag(page,cdp,'HushPoints.tissue',(266,148),steps=16,delay=20)
    check('tissue dragged to the nose catches the sneeze',get(page,'__hush.night.event===null&&__hush.night.stats.solved===1&&__hush.room.fx.tissue>0'))
    page.locator('#skipButton').tap();page.locator('[data-scene="breeze"]').tap();page.wait_for_timeout(150)
    page.screenshot(path=str(OUT/'v4-breeze.png'))
    drag(page,cdp,'HushPoints.window',(200,57),steps=9,delay=25)
    check('pulling the window latch down shuts out the breeze',get(page,'__hush.night.event===null&&__hush.night.stats.solved===1'))
    get(page,"__hush.practice('nightmare')");page.wait_for_timeout(250)
    page.screenshot(path=str(OUT/'v4-nightmare.png'));tap(page,'__hush.room.ghost(2)')
    check('tapped nightmare emits stars at the correct monster',get(page,"__hush.night.event.popped.includes(2)&&__hush.room.fx.particles.some(p=>p.kind==='star'&&p.x>150)"))
    get(page,"__hush.practice('pillow')")
    a=get(page,'({x:__hush.room.hand.x,y:__hush.room.hand.y})');q=point(page,(a['x']+10,a['y']+8))
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':q['x'],'y':q['y'],'id':1}]});page.wait_for_timeout(80)
    check('off-centre grip does not snap hand to the finger',get(page,f'Math.hypot(__hush.room.hand.x-{a["x"]},__hush.room.hand.y-{a["y"]})<1'))
    cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});page.wait_for_timeout(80)
    check('pointer cancellation drops the grip without a hit',get(page,'__hush.gesture===null&&__hush.night.stats.nudges===0'))
    drag(page,cdp,'__hush.room.hand','HushPoints.armTarget',steps=8,delay=20)
    check('a physical contact injects energy into the duvet mesh',get(page,'Array.from(__hush.room.fx.cloth.y).some(v=>Math.abs(v)>.1)'))
    check('one contact still produces one hit per drag',get(page,'__hush.night.stats.nudges===1'))
    page.wait_for_timeout(600)
    check('released hand springs back to its resting location',get(page,'Math.hypot(__hush.room.hand.x-HushPoints.hand.x,__hush.room.hand.y-HushPoints.hand.y)<4'))
    page.locator('#headphoneButton').tap();page.wait_for_timeout(500)
    check('headphones animate onto the head and start local audio',get(page,"__hush.night.headphones&&__hush.room.fx.pose.x<268&&__hush.audio.ctx.state==='running'"))
    page.screenshot(path=str(OUT/'v4-headphones.png'))
    page.locator('#menuButton').tap();t=get(page,'__hush.room.fx.time');page.wait_for_timeout(150)
    check('pause freezes the new animation clock',get(page,'__hush.room.fx.time')==t)
    page.locator('#motionInput').check();page.locator('#resumeButton').tap();page.wait_for_timeout(150)
    check('reduced motion clears physical waves and decorative particles',get(page,'__hush.room.fx.particles.length===0&&__hush.room.fx.trail.length===0&&Array.from(__hush.room.fx.cloth.y).every(v=>v===0)'))
    get(page,'__hush.settings.tap=true');get(page,"__hush.practice('sneeze')");tap(page,'HushPoints.tissue')
    check('tap alternative also catches a sneeze',get(page,'__hush.night.event===null'))
    get(page,"__hush.practice('breeze')");tap(page,'HushPoints.window')
    check('tap alternative also closes the window',get(page,'__hush.night.event===null'))
    get(page,"__hush.practice('pillow')");tap(page,'HushPoints.pillow')
    check('tap alternative gently flips the pillow',get(page,'__hush.night.coolSide>0'))
    get(page,"__hush.practice('phone');__hush.night.wake=100;__hush.night.patience=0;__hush.advance(60)")
    check('practice cannot produce a fake score or game over',get(page,"__hush.night.status==='playing'&&__hush.night.t===0"))
    get(page,'__hush.settings.learned=true');page.locator('#skipButton').tap();page.locator('#realNight').tap()
    check('leaving practice creates a real scored night',get(page,'!__hush.sandbox&&!__hush.night.training&&__hush.night.wake<5'))
    # Time only the renderer; this is not a physical-phone FPS benchmark.
    perf=get(page,"(()=>{const a=[];const n=new HushGame.Night('normal',4,true);for(let i=0;i<180;i++){const t=performance.now();__hush.room.draw(n,1/60,null,'none',false);a.push(performance.now()-t);}a.sort((x,y)=>x-y);return {mean_ms:a.reduce((x,y)=>x+y,0)/a.length,p95_ms:a[Math.floor(a.length*.95)]};})()")
    check('renderer remains finite during a 180-frame stress run',all(math.isfinite(v) for v in perf.values()))
    check('After Midnight has no uncaught browser errors',not errors)
    (OUT/'after-midnight-results.json').write_text(json.dumps({'checks':len(results),'passed':len(results),'errors':errors,'results':results,'renderer_synthetic_timing':perf,'mode':'inline fixture with local-only instrumentation'},indent=2))
    ctx.close();browser.close()
print(json.dumps({'passed':len(results),'errors':errors},indent=2))
