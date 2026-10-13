"""Production single-file smoke without test hooks; local HTTP resource integrity.
Build with python tools/build.py and serve the project on localhost:8765 first.
"""
from pathlib import Path
import json,re,urllib.request
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
resources=re.findall(r'(?:src|href)="((?:src/|assets/|style\.css)[^"]*)"',html)
checks=[]
for path in resources:
 with urllib.request.urlopen('http://127.0.0.1:8765/'+path,timeout=5) as r:
  body=r.read();assert r.status==200
  assert body==(ROOT/path.split('?')[0]).read_bytes(),path
  checks.append({'resource':path,'status':r.status,'bytes':len(body)})
errors=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content((ROOT/'dist/HUSH.html').read_text())
 assert p.evaluate('typeof window.__hush === "undefined"')
 p.locator('#playgroundButton').tap();p.locator('[data-scene="secondchance"]').tap()
 p.wait_for_timeout(500);assert p.locator('#recoveryControls').is_visible()
 target=p.locator('#strokeButton').bounding_box();session=c.new_cdp_session(p)
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':target['x']+target['width']/2,'y':target['y']+target['height']/2,'id':1}]})
 p.wait_for_timeout(12500)
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert p.locator('#headphoneButton').is_visible()
 assert not p.locator('#recoveryControls').is_visible()
 assert p.locator('#partnerMeterLabel').inner_text()=='Wake-up risk'
 assert not errors,errors
 p.screenshot(path=str(ROOT/'tests/v5-production-recovered.png'))
 c.close();b.close()
result={'http_resources':checks,'production_smoke':'PASS: unmodified standalone, no test hooks, real 12.5s touch hold restores sleep','page_errors':errors,'live_site_gameplay_tested':False}
(ROOT/'tests/production-results.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
