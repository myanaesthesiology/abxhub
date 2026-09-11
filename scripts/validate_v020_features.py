#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
app=(ROOT/'app.js').read_text(encoding='utf-8')
index=(ROOT/'index.html').read_text(encoding='utf-8')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
db=json.loads((ROOT/'data/clinical-data.json').read_text(encoding='utf-8'))
errors=[]
def check(ok,msg):
    if not ok: errors.append(msg)
marker='v0.20.0 interaction/content overrides'
override=app[app.index(marker):] if marker in app else ''
check(bool(override),'v0.20 override block missing')
check("route.view==='search'" in override and 'renderSearchResults' in override,'dedicated search route missing')
check("id==='universalSearch'" in override and 'renderSearchResults(q)' in override,'Enter/search does not route to results page')
check('updateHomeSearchRoute' in override and "search:route.search" in override,'home dropdown query restore missing')
check('abxhub-tab-scroll' in override and 'switchPrimaryNav' in override,'primary-tab scroll memory missing')
check('id="goTop"' in index and "b.id==='goTop'" in override,'Go-to-top control missing')
check('organismGuideHTML' in override and 'pathwayAntimicrobialGuide' in override and 'Open full pathway' in override,'organism antimicrobial/pathway links missing')
check('count<5' in override and 'Add drug' in override,'five-drug compare control missing')
check('preg-table-row' in override and 'Collapsible table' in override,'collapsible pregnancy/lactation table missing')
check('ivpoStepdownRows' in override and 'Assess switch readiness' in override,'interactive IV-to-PO workflow missing')
check('data-drug="${esc(did)}"' in override and 'renalToCrcl' in override,'CrCl/renal drug-context round trip missing')
check('appendixCPreparation' in override and 'Open drug details' in override,'prolonged-infusion detail/link workflow missing')
check('No single-trough AUC shortcut' in override and 'EID suitability screen' in override,'TDM safety/workflow upgrade missing')
check('Stewardship decision' in override and 'Planned stop/review date' in override,'AMS round upgrade missing')
# Active v0.20 tool map must not expose removed tools.
m=re.search(r"const map=\{([^}]*)\};\s*\n?\s*\(map\[id\]",override)
check(bool(m),'active v0.20 tool map not found')
if m:
    check('culture:' not in m.group(1) and 'teaching:' not in m.group(1),'Culture/Teaching still in active v0.20 tool map')
check("const CACHE = 'abxhub-v0.20.0'" in sw,'service-worker cache not v0.20.0')
check('sw.js?v=0.20.0' in app and 'app.js?v=0.20.0' in index,'versioned v0.20 assets not wired')
# Data gates
check(len(db.get('drugs',[]))==60,'drug count changed')
check(len(db.get('conditions',[]))==63,'condition count changed')
check(len(db.get('organisms',[]))==26,'organism count changed')
check(len(db.get('resistance',[]))==12,'resistance count changed')
check(sum(bool(o.get('antimicrobialGuide')) for o in db['organisms'])>=10,'major organism quick guides incomplete')
check(len(db.get('ivpo',{}).get('stepdown',[]))==21,'NAG IV-to-PO stepdown table is not 21 rows')
for fld in ['mechanism','adverseEffects','precautions','contraindications','interactions']:
    check(all(bool((d.get('clinicalProfile') or {}).get(fld)) for d in db['drugs']),f'drug clinicalProfile.{fld} not complete')
# Every structured NAG recommendation and NAG-linked drug should have a direct official URL.
for c in db['conditions']:
    for r in c.get('recommendations',[]):
        if r.get('source')=='nag': check(bool(r.get('url')),f'NAG recommendation missing direct URL: {c["id"]}/{r.get("label")}')
for d in db['drugs']:
    refs=[r for r in d.get('refs',[]) if r.get('source')=='nag']
    if refs: check(any(r.get('url') for r in refs),f'NAG-linked drug lacks direct NAG URL: {d["id"]}')
crab=next((r for r in db['resistance'] if r['id']=='crab'),None)
check(crab is not None,'CRAB record missing')
if crab:
    check(len(crab.get('sourceCards',[]))>=4,'CRAB source cards incomplete')
    sg=crab.get('sulbactamGuide') or {}
    check(len(sg.get('renalRows',[]))==4,'CRAB sulbactam renal/RRT rows incomplete')
    text=' '.join(sg.get('administration',[])+sg.get('precautions',[])).lower()
    for token in ['100 ml','4 hours','sodium','hypernatra']:
        check(token in text,f'CRAB sulbactam detail missing: {token}')
inf=db.get('infusionStrategies',{})
check(len(inf.get('agents',{}))>=5,'prolonged infusion agent set incomplete')
for d in ['cefepime','ceftazidime','imipenem','meropenem','piperacillin-tazobactam']:
    x=inf.get('agents',{}).get(d,{})
    check(bool(x.get('loading')) and bool(x.get('maintenance')) and bool(x.get('appendixCPreparation')),f'infusion fields incomplete: {d}')
# Expanded v0.20 disease / organism / resistance layer
check(sum(bool(c.get('practicalPathway')) for c in db['conditions'])==63,'not all 63 conditions have practicalPathway')
for c in db['conditions']:
    p=c.get('practicalPathway') or {}
    check(bool(p.get('regimens')),f'practicalPathway regimen map missing: {c["id"]}')
    check(bool(p.get('review')),f'practicalPathway review checklist missing: {c["id"]}')
    for rr in p.get('regimens',[]):
        check(bool(rr.get('source')),f'practicalPathway source missing: {c["id"]}')
        check(bool(rr.get('duration')),f'practicalPathway duration missing: {c["id"]}/{rr.get("label")}')
check('practicalPathwayHTML' in override and '48–72 h review' in override,'disease practical pathway UI missing')
check(sum(bool(r.get('managementGuide')) for r in db['resistance'])==12,'not all 12 resistance records have managementGuide')
for r in db['resistance']:
    g=r.get('managementGuide') or {}
    check(bool(g.get('definition')),f'resistance definition/interpretation missing: {r["id"]}')
    check(bool(g.get('siteRows')),f'resistance site/severity strategy missing: {r["id"]}')
    check(bool(g.get('dosing')),f'resistance dosing/administration missing: {r["id"]}')
    check(bool(g.get('duration')),f'resistance duration principle missing: {r["id"]}')
    check(all((row.get('drugIds') or []) for row in g.get('siteRows',[])),f'resistance site row has no curated drug links: {r["id"]}')
check('resistanceManagementGuideHTML' in override and 'Infection-site / severity strategy' in override,'resistance management UI missing')
check(sum(bool(o.get('pathwayAntimicrobialGuide')) for o in db['organisms'])==26,'not all 26 organisms have pathwayAntimicrobialGuide')
for o in db['organisms']:
    pg=o.get('pathwayAntimicrobialGuide') or {}
    check(bool(pg.get('groups')),f'organism has no linked antimicrobial groups: {o["id"]}')
    for gr in pg.get('groups',[]):
        check(bool(gr.get('drugIds')),f'organism group has no curated drug links: {o["id"]}/{gr.get("targetId")}')
        check(gr.get('kind') in {'condition','resistance'},f'organism group kind invalid: {o["id"]}')
        check(bool(gr.get('targetId')),f'organism group target missing: {o["id"]}')
# Combination formulation ingredients must not be surfaced as a standalone CRAB treatment link.
a=next((o for o in db['organisms'] if o['id']=='acinetobacter-baumannii'),{})
crab_group=next((g for g in (a.get('pathwayAntimicrobialGuide') or {}).get('groups',[]) if g.get('targetId')=='crab'),{})
check('ampicillin-sulbactam' in crab_group.get('drugIds',[]),'CRAB organism guide missing ampicillin-sulbactam link')
check('ampicillin' not in crab_group.get('drugIds',[]),'CRAB organism guide incorrectly exposes formulation-component ampicillin')
check('drugLinkButtons' in override and 'drug-link-strip' in override,'regimen-to-drug monograph links missing')
# PDFs retained
for f in ['HPUSM_ASP_2025.pdf','MSIC_Adult_ICU_Antimicrobial_2023.pdf','MSIDC_MDR_Gram_Negatives_2024.pdf','NAG_Pregnancy_Lactation_2024.pdf','Wellington_ICU_Antibiotic_Summary_2022.pdf']:
    check((ROOT/'references'/f).is_file(),f'bundled PDF missing: {f}')
print('AbxHub v0.20.0 feature regression validation')
print('Errors:',len(errors))
for e in errors: print('ERROR:',e)
sys.exit(1 if errors else 0)
