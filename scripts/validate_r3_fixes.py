#!/usr/bin/env python3
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'app.js').read_text(encoding='utf-8')
idx=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
errors=[]
def ck(ok,msg):
    if not ok: errors.append(msg)
ck("aliases:['CRRT','RRT','renal replacement therapy','CVVH','CVVHD','CVVHDF','IHD','HD'" in app,'CRRT/RRT tool aliases missing from search index')
ck("if(b.dataset.hitType==='tool'){renderTool(b.dataset.hitId);return}" in app,'search tool-result click route missing')
start=app.rfind('function toolSpectrum(){'); end=app.find('function toolCompare',start)
seg=app[start:end]
ck(seg.find('id="specOut"') < seg.find('spectrum-legend'),'Spectrum legend is not below interactive output')
for token in ['app.js?v=0.20.0-r3','styles.css?v=0.20.0-r3','manifest.webmanifest?v=0.20.0-r3']:
    ck(token in idx,f'index missing {token}')
ck("const CACHE = 'abxhub-v0.20.0-r3'" in sw,'r3 service-worker cache missing')
for f in ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-192.png','icons/icon-maskable-512.png','COVERAGE_CENSUS_v0.20.0-r3.md']:
    ck((ROOT/f).exists(),f'missing {f}')
print('AbxHub v0.20.0-r3 maintenance regression')
print('Errors:',len(errors))
for e in errors: print('ERROR:',e)
sys.exit(bool(errors))
