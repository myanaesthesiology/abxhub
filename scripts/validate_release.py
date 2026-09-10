#!/usr/bin/env python3
from __future__ import annotations
import json, re, hashlib, sys
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
VERSION='0.19.0'
PDF_PAGE_COUNTS={
    'hpusm':25,
    'msic':176,
    'msidc':96,
    'preg':3,
    'wellington':1,
}
REQUIRED_FILES=[
    'index.html','app.js','styles.css','manifest.webmanifest','sw.js',
    'data/clinical-data.json','data/nag-topics.json',
    'icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-192.png','icons/icon-maskable-512.png',
    'references/HPUSM_ASP_2025.pdf','references/MSIC_Adult_ICU_Antimicrobial_2023.pdf',
    'references/MSIDC_MDR_Gram_Negatives_2024.pdf','references/NAG_Pregnancy_Lactation_2024.pdf',
    'references/Wellington_ICU_Antibiotic_Summary_2022.pdf',
]
errors=[]; warnings=[]

def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)

def load_json(rel):
    try: return json.loads((ROOT/rel).read_text(encoding='utf-8'))
    except Exception as e: err(f'{rel}: JSON parse failed: {e}'); return {}

for rel in REQUIRED_FILES:
    if not (ROOT/rel).is_file(): err(f'missing required file: {rel}')

db=load_json('data/clinical-data.json')
nag=load_json('data/nag-topics.json')
manifest=load_json('manifest.webmanifest')

if db.get('meta',{}).get('version')!=VERSION: err('clinical-data meta.version mismatch')
if manifest.get('version')!=VERSION: err('manifest version mismatch')
if db.get('meta',{}).get('appName')!='AbxHub': err('appName is not AbxHub')

# Entity uniqueness and internal links.
collections=['drugs','conditions','organisms','resistance']
sets={}
for coll in collections:
    items=db.get(coll,[])
    ids=[x.get('id') for x in items]
    dup=[k for k,v in Counter(ids).items() if k and v>1]
    if dup: err(f'{coll}: duplicate ids: {dup}')
    if any(not x for x in ids): err(f'{coll}: blank id')
    sets[coll]=set(ids)

for x in db.get('drugs',[]):
    for target in x.get('indications',[]):
        if target not in sets['conditions'] and target not in sets['resistance']:
            err(f'drug {x["id"]}: broken indication link {target}')
for x in db.get('conditions',[]):
    for target in x.get('organisms',[]):
        if target not in sets['organisms']:
            err(f'condition {x["id"]}: broken organism link {target}')
for x in db.get('organisms',[]):
    for target in x.get('links',[]):
        if target not in sets['conditions'] and target not in sets['resistance']:
            err(f'organism {x["id"]}: broken pathway link {target}')

sources=set(db.get('sources',{}))
source_refs=[]
def walk(o,path=''):
    if isinstance(o,dict):
        if isinstance(o.get('source'),str): source_refs.append((path,o))
        for k,v in o.items(): walk(v,f'{path}.{k}' if path else k)
    elif isinstance(o,list):
        for i,v in enumerate(o): walk(v,f'{path}[{i}]')
walk(db)
for path,o in source_refs:
    s=o['source']
    if s not in sources: err(f'{path}: unknown source {s}')
    pp=o.get('pdfPage')
    if s in PDF_PAGE_COUNTS and isinstance(pp,int) and not (1<=pp<=PDF_PAGE_COUNTS[s]):
        err(f'{path}: pdfPage {pp} out of range for {s} (max {PDF_PAGE_COUNTS[s]})')

# Coverage requirements for current structured scope.
if len(db.get('drugs',[]))!=60: warn(f'drug count changed from audited 60 to {len(db.get("drugs",[]))}')
if len(db.get('conditions',[]))!=63: warn(f'condition count changed from audited 63 to {len(db.get("conditions",[]))}')
if len(db.get('organisms',[]))!=26: warn(f'organism count changed from audited 26 to {len(db.get("organisms",[]))}')
if len(db.get('resistance',[]))!=12: warn(f'resistance count changed from audited 12 to {len(db.get("resistance",[]))}')
for x in db.get('drugs',[]):
    if not x.get('refs'): err(f'drug {x["id"]}: no top-level source refs')
for x in db.get('conditions',[]):
    if not x.get('refs'): err(f'condition {x["id"]}: no top-level source refs')
    if not x.get('diseaseMechanism'): err(f'condition {x["id"]}: missing diseaseMechanism')
    if not x.get('diagnosticMicrobiology'): err(f'condition {x["id"]}: missing diagnosticMicrobiology')
    if not x.get('microbiologyRefs'): err(f'condition {x["id"]}: missing microbiologyRefs')
for x in db.get('organisms',[]):
    m=x.get('microbiology') or {}
    for fld in ['familyOrGroup','morphology','reservoirTransmission','pathogenesis','resistanceSummary','commonDiseases','clinicalPearl','refs']:
        if not m.get(fld): err(f'organism {x["id"]}: missing microbiology.{fld}')
for x in db.get('resistance',[]):
    if not x.get('refs'): err(f'resistance {x["id"]}: no source refs')

# Every structured preparation and population record needs direct provenance.
for x in db.get('drugs',[]):
    cp=x.get('clinicalProfile') or {}
    if cp.get('preparation') and not cp['preparation'].get('ref'): err(f'drug {x["id"]}: preparation missing ref')
    if cp.get('fluidRestrictedPreparation') and not cp['fluidRestrictedPreparation'].get('ref'): err(f'drug {x["id"]}: fluid preparation missing ref')
    if cp.get('paediatric') and not cp['paediatric'].get('source'): err(f'drug {x["id"]}: paediatric record missing source')
    if x.get('pregnancy') and not x['pregnancy'].get('source'): err(f'drug {x["id"]}: pregnancy record missing source')

# Runtime regression guards.
app=(ROOT/'app.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
if not re.search(r'function\s+navActive\s*\(',app): err('navActive() missing (v0.6 GitHub regression guard)')
if "addEventListener('popstate'" not in app and 'addEventListener("popstate"' not in app: err('History popstate handler missing')
if 'history.back()' not in app: err('Back-navigation history.back() missing')
if f'sw.js?v={VERSION}' not in app: err('app.js service-worker version mismatch')
for needle in [f'app.js?v={VERSION}',f'styles.css?v={VERSION}',f'manifest.webmanifest?v={VERSION}']:
    if needle not in index: err(f'index missing versioned asset {needle}')
if f"const CACHE = 'abxhub-v{VERSION}'" not in sw: err('service worker cache version mismatch')
if 'NOT_CONFIGURED' in app or 'NOT CONFIGURED' in app: err('retired unavailable-institution banner still present in runtime UI')
if 'localDataContextHTML' in app: err('retired local antibiogram UI helper still present')

# Service worker app-shell paths must resolve locally (strip query).
m=re.search(r'const APP_SHELL = \[(.*?)\];',sw,re.S)
if not m: err('service-worker APP_SHELL array not found')
else:
    for rel in re.findall(r"'([^']+)'",m.group(1)):
        path=rel.split('?',1)[0]
        if path in ('./','./index.html'): continue
        if path.startswith('./') and not (ROOT/path[2:]).exists(): err(f'service worker references missing asset: {path}')

# NAG freshness metadata and live-check architecture.
if nag.get('latestUpdate')!='January 2026': warn('NAG latestUpdate differs from audited Jan 2026 marker; review official site')
if nag.get('lastChecked')!='2026-09-10': warn('NAG lastChecked differs from release audit date')
if 'Check latest official NAG' not in app: err('NAG live freshness link label missing')

# Audit-manifest self-consistency.
audit=db.get('dataQualityAudit',{})
if audit.get('status')!='PASS': err(f'dataQualityAudit status is {audit.get("status")!r}, expected PASS')
if audit.get('brokenInternalLinks'): err('dataQualityAudit contains broken internal links')
if audit.get('unknownSourceIds'): err('dataQualityAudit contains unknown source IDs')
if audit.get('invalidBundledPdfPages'): err('dataQualityAudit contains invalid PDF pages')

print(f'AbxHub {VERSION} release validation')
print(f'Entities: {len(db.get("drugs",[]))} drugs · {len(db.get("conditions",[]))} conditions · {len(db.get("organisms",[]))} organisms · {len(db.get("resistance",[]))} resistance pathways')
print(f'Source reference objects: {len(source_refs)}')
print(f'Errors: {len(errors)} · Warnings: {len(warnings)}')
for x in errors: print('ERROR:',x)
for x in warnings: print('WARN:',x)
if errors: sys.exit(1)
