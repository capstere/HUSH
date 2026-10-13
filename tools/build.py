"""Build a portable, dependency-free HUSH.html without changing production code."""
from pathlib import Path
import re
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]

def read(relative):
    path=(ROOT/relative).resolve()
    if ROOT not in path.parents or not path.is_file():
        raise ValueError(f'Missing or unsafe resource: {relative}')
    return path.read_text(encoding='utf-8')

html=read('index.html')
html=re.sub(r'<link rel="stylesheet" href="([^"?]+)[^"]*">',lambda m:'<style>'+read(m[1])+'</style>',html)
paths=re.findall(r'<script defer src="([^"?]+)[^"]*"></script>',html)
html=re.sub(r'<script defer src="[^"]*"></script>','',html)
html=html.replace('</body>',''.join('<script>'+read(path)+'</script>\n' for path in paths)+'</body>')
html=html.replace('href="assets/icon.svg"','href="data:image/svg+xml,'+quote(read('assets/icon.svg'),safe='')+'"')
out=ROOT/'dist'/'HUSH.html';out.parent.mkdir(exist_ok=True);out.write_text(html,encoding='utf-8')
print(f'Built {out} ({out.stat().st_size:,} bytes)')
