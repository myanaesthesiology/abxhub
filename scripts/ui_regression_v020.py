#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'app.js').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
db=json.loads((ROOT/'data/clinical-data.json').read_text(encoding='utf-8'))
errors=[]; notes=[]
def check(ok,msg):
    if not ok: errors.append(msg)

def section_after(marker):
    return app[app.index(marker):] if marker in app else ''
override=section_after('v0.20.0 interaction/content overrides')
check(bool(override),'v0.20 override layer not found')
# Navigation / history / search
for token,msg in [
    ("route.view==='search'",'search route restore missing'),
    ('renderSearchResults(q)','dedicated search result navigation missing'),
    ('updateHomeSearchRoute','home-dropdown search state missing'),
    ('searchPageInput','search-results refinement field missing'),
    ('window.addEventListener(\'popstate\'','popstate history restore missing'),
    ('abxhub-tab-scroll','primary-tab scroll persistence missing'),
    ("b.id==='goTop'",'Go-to-top click handler missing')]: check(token in override,msg)
# New clinical renderers
for token,msg in [
    ('practicalPathwayHTML','disease practical pathway renderer missing'),
    ('pathwayAntimicrobialGuide','organism pathway antimicrobial renderer missing'),
    ('resistanceManagementGuideHTML','resistance management renderer missing'),
    ('drugLinkButtons','clinical drug-link helper missing')]: check(token in override,msg)
# Tools / removed features
m=re.search(r"const map=\{([^}]*)\};\s*\n?\s*\(map\[id\]",override)
check(bool(m),'active tool map not found')
if m:
    amap=m.group(1)
    check('culture:' not in amap,'Culture Interpreter still exposed in active map')
    check('teaching:' not in amap,'Teaching Cases still exposed in active map')
for token,msg in [('count<5','compare does not support 5 agents'),('ivpoStepdownRows','IV→PO table missing'),('No single-trough AUC shortcut','vancomycin safety guard missing'),('EID suitability screen','aminoglycoside screen missing')]: check(token in override,msg)
# Asset/version wiring
for token in ['./styles.css?v=0.20.0','./app.js?v=0.20.0','./manifest.webmanifest?v=0.20.0']:
    check(token in index,f'index versioned asset missing: {token}')
check("const CACHE = 'abxhub-v0.20.0'" in sw,'service worker cache name mismatch')
check("k.startsWith('abxhub-')" in sw and 'caches.delete(k)' in sw,'old AbxHub cache cleanup missing')
# CSS variables and bracket sanity
declared=set(re.findall(r'(--[\w-]+)\s*:',css)); used=set(re.findall(r'var\((--[\w-]+)',css))
for x in sorted(used-declared): errors.append(f'undefined CSS custom property: {x}')
check(css.count('{')==css.count('}'),'CSS brace imbalance')
check(css.count('(')==css.count(')'),'CSS parenthesis imbalance')
# Structured internal-link integrity
D={d['id'] for d in db['drugs']}; C={c['id'] for c in db['conditions']}; R={r['id'] for r in db['resistance']}
for c in db['conditions']:
    for rr in (c.get('practicalPathway') or {}).get('regimens',[]):
        for did in rr.get('drugIds',[]): check(did in D,f'condition {c["id"]} links unknown drug {did}')
for r in db['resistance']:
    for row in (r.get('managementGuide') or {}).get('siteRows',[]):
        for did in row.get('drugIds',[]): check(did in D,f'resistance {r["id"]} links unknown drug {did}')
for o in db['organisms']:
    for g in (o.get('pathwayAntimicrobialGuide') or {}).get('groups',[]):
        for did in g.get('drugIds',[]): check(did in D,f'organism {o["id"]} links unknown drug {did}')
        target=g.get('targetId'); kind=g.get('kind')
        check((kind=='condition' and target in C) or (kind=='resistance' and target in R),f'organism {o["id"]} has broken target {kind}:{target}')
# CSS responsive rules for new long content
for token,msg in [('@media(max-width:520px)','mobile breakpoint missing'),('.management-site','resistance mobile styling missing'),('.organism-path-group','organism group styling missing'),('.practical-pathway','disease pathway styling missing')]: check(token in css,msg)
# Browser execution is environment-limited; record but do not make static QA fail.
notes.append('Headless Chromium execution is not counted as passed: this environment hangs/blocks local navigation before DOM capture; deployment browser/PWA verification remains separate.')
print('AbxHub v0.20.0 UI/static regression audit')
print('Errors:',len(errors))
for e in errors: print('ERROR:',e)
for n in notes: print('NOTE:',n)
sys.exit(1 if errors else 0)
