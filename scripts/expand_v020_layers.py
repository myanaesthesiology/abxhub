#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/clinical-data.json'
db=json.load(open(DATA,encoding='utf-8'))

# ---------------- helpers ----------------
drugs={x['id']:x for x in db['drugs']}
conds={x['id']:x for x in db['conditions']}
res={x['id']:x for x in db['resistance']}
orgs={x['id']:x for x in db['organisms']}

def ref(source,page=None,url=None,pdfPage=None):
    x={'source':source}
    if page is not None: x['page']=page
    if pdfPage is not None: x['pdfPage']=pdfPage
    elif page is not None and source in {'msidc','hpusm','msic'}: x['pdfPage']=page
    if url: x['url']=url
    return x

def unique(seq):
    out=[]
    for x in seq:
        if x not in out: out.append(x)
    return out

def norm_text(x):
    return ' '.join(re.sub(r'[^a-z0-9]+',' ',str(x).lower()).split())

def drug_terms(drug):
    return unique([norm_text(drug['name']), norm_text(drug['id']), *[norm_text(x) for x in (drug.get('aliases') or [])]])

def drug_ids(text):
    # Longest non-overlapping phrase matching prevents combination products such as
    # ampicillin-sulbactam from also being exposed as plain ampicillin.
    hay=norm_text(text)
    candidates=[]
    for d in db['drugs']:
        for term in drug_terms(d):
            if len(term)<4: continue
            for m in re.finditer(r'(?<![a-z0-9])'+re.escape(term)+r'(?![a-z0-9])',hay):
                candidates.append((m.start(),m.end(),len(term),d['id']))
    candidates.sort(key=lambda x:(-x[2],x[0]))
    chosen=[]; occupied=[]
    for a,b,_,did in candidates:
        if any(not (b<=x or a>=y) for x,y in occupied): continue
        occupied.append((a,b)); chosen.append((a,did))
    return unique([did for _,did in sorted(chosen)])

def text_mentions(drug, text):
    return drug['id'] in drug_ids(text)

# ---------------- targeted disease-depth corrections from bundled sources ----------------
# PJI was still a principle-only card in v0.19 although the bundled HPUSM table contains
# explicit retained-implant staphylococcal regimens and duration.
pji=conds.get('prosthetic-joint-infection')
if pji:
    hp=next((r for r in pji.get('recommendations',[]) if r.get('source')=='hpusm'),None)
    if hp:
        hp.update({
          'label':'HPUSM culture-directed retained-implant pathways',
          'preferred':['MSSA: cloxacillin 2 g IV q4–6h PLUS rifampicin 300–450 mg PO q12h when the implant remains in situ.','MRSA: vancomycin 15–20 mg/kg IV q8–12h PLUS rifampicin 300–450 mg PO q12h when the implant remains in situ.'],
          'alternative':['After the initial IV phase, use an oral combination selected from susceptibility results and the surgical strategy.','Empirical treatment is not recommended before adequate specimens in the stable patient; treatment strategy and duration depend on surgery (no surgery, removal/fusion, DAIR, one-stage or two-stage revision).'],
          'duration':'HPUSM table displays 14–42 days for the initial MSSA/MRSA pathways shown; total strategy remains surgery-, organism- and susceptibility-dependent.',
          'notes':['Rifampicin should be included in the cited HPUSM staphylococcal pathway when the implant is retained; do not use rifampicin alone.'],
          'page':14,'pdfPage':14
        })
# The invasive-fungal record is deliberately a drug-reference hub, but surface the actual
# MSIC voriconazole PK/renal regimen rather than requiring the user to open the PDF for it.
fungal=conds.get('invasive-fungal-infection')
if fungal:
    vr=next((r for r in fungal.get('recommendations',[]) if r.get('source')=='msic'),None)
    if vr:
        vr.update({
          'label':'MSIC voriconazole PK / renal-formulation reference',
          'preferred':['Voriconazole Day 1: 6 mg/kg IV q12h; Day 2 onward: 4 mg/kg IV q12h in the cited ICU dosing table.'],
          'alternative':['When CrCl <50 mL/min, the MSIC table advises using the oral formulation because the IV carrier SBECD accumulates: body weight >40 kg: 400 mg PO q12h on Day 1 then 200 mg q12h; body weight <40 kg: 200 mg PO q12h on Day 1 then 100 mg q12h.'],
          'duration':'Use the syndrome-specific antifungal guideline; this MSIC row is a dosing/formulation reference rather than a duration recommendation.',
          'notes':['For HD/CVVH/CVVHD/CVVHDF in the cited table, use the oral dosing approach used for CrCl <50 mL/min; reconcile with current antifungal/TDM guidance and the actual infection.'],
          'page':140,'pdfPage':150
        })

# ---------------- all-disease practical layer ----------------
# This does not invent an additional guideline. It reorganises source-grounded fields already
# present in each disease record into a practical bedside workflow and adds stewardship guards.
for c in db['conditions']:
    duration_rows=[]
    regimen_rows=[]
    for r in c.get('recommendations',[]):
        combined=' '.join([r.get('label',''),*(r.get('preferred') or []),*(r.get('alternative') or []),*(r.get('notes') or [])])
        ids=drug_ids(combined)
        regimen_rows.append({
            'source':r.get('source'), 'label':r.get('label','Regimen'),
            'drugIds':ids, 'duration':r.get('duration',''),
            'ref':{k:r[k] for k in ('source','page','pdfPage','url','pdfUrl') if r.get(k) is not None}
        })
        if r.get('duration'):
            duration_rows.append({'source':r.get('source'),'label':r.get('label','Regimen'),'text':r['duration']})
    c['practicalPathway']={
        'title':'Practical clinical pathway',
        'status':'SOURCE-GROUNDED',
        'assessment':c.get('before',[]),
        'diagnostics':c.get('diagnosticMicrobiology',[]),
        'regimens':regimen_rows,
        'durationReview':duration_rows,
        'review':[
            'Reassess diagnosis and microbiology at 48–72 hours (earlier if the patient deteriorates); stop antimicrobials when infection is no longer supported.',
            'Narrow to the most appropriate active agent once pathogen/susceptibility data and the infection site are known; do not merge differing source regimens into an unsupported compromise.',
            'Recheck renal function/RRT, loading-versus-maintenance strategy, TDM requirements, allergy, toxicity and clinically important interactions.',
            'Confirm source control or procedural management where relevant, and document the planned duration or next review/stop date.',
            'Use the IV→PO tool when the patient and infection meet switch criteria; exclusions and source-specific duration still take precedence.'
        ],
        'notes':unique((c.get('riskFactors') or []) + (c.get('why') or [])),
        'refs':c.get('refs',[]),
        'updated':'2026-09-11'
    }

# ---------------- expanded resistance / phenotype guides ----------------
# Structure: definition/detection, infection-site strategy, dosing/administration, clinical pearls,
# duration principle, IPC. These are paraphrased from the bundled sources; source refs remain explicit.
mg={}
mg['ampc']={
 'title':'AmpC practical management guide','source':'msidc','refs':[ref('msidc',17),ref('msidc',18),ref('msidc',19),ref('msidc',20),ref('msidc',21),ref('msidc',73)],
 'definition':["Moderate-risk inducible AmpC organisms in the MSIDC pathway include Enterobacter cloacae complex, Klebsiella aerogenes and Citrobacter freundii; lower-risk organisms include Serratia marcescens, Providencia spp. and Morganella morganii.","Phenotypic suspicion can involve cefoxitin plus third-generation cephalosporin resistance, but definitive distinction of chromosomal versus acquired AmpC may require genotypic methods; discuss uncertain results with clinical microbiology."],
 'siteRows':[
  {'site':'Moderate-risk · uncomplicated cystitis','preferred':'Susceptible nitrofurantoin, TMP-SMX or a single gentamicin/amikacin dose','alternative':'Ciprofloxacin if susceptible; if already improving on a susceptible empirical beta-lactam, count that exposure and prefer oral step-down when feasible.','drugIds':['nitrofurantoin','trimethoprim-sulfamethoxazole','gentamicin','amikacin','ciprofloxacin'],'ref':ref('msidc',18)},
  {'site':'Moderate-risk · pyelonephritis / cUTI','preferred':'TMP-SMX, once-daily gentamicin/amikacin with TDM, or cefepime when susceptible','alternative':'Ciprofloxacin is less preferred when susceptible.','drugIds':['trimethoprim-sulfamethoxazole','gentamicin','amikacin','cefepime','ciprofloxacin'],'ref':ref('msidc',18)},
  {'site':'Moderate-risk · outside urinary tract','preferred':'Cefepime when susceptible','alternative':'For cefepime SDD/high-burden disease, cefepime or a carbapenem may be used per source context; carbapenem is preferred for high-burden disease and cefepime-resistant infection. Seek ID/microbiology input when cefepime non-susceptible.','drugIds':['cefepime','ertapenem','meropenem','imipenem'],'ref':ref('msidc',18)},
  {'site':'Lower-risk AmpC · outside urinary tract','preferred':'Non-severe disease: treat according to susceptibility. Severe/high-burden disease: cefepime is preferred in the MSIDC pathway.','alternative':'Escalate/seek specialist input when cefepime is non-susceptible.','drugIds':['cefepime'],'ref':ref('msidc',20)}],
 'dosing':["MSIDC adult appendix: cefepime 2 g IV q8h for non-cystitis infection; prolonged infusion over 3–4 h is recommended for severe/high-burden disease or susceptible-dose-dependent isolates.","Meropenem adult appendix: 1 g IV q8h for non-CNS AmpC/ESBL infection; 2 g IV q8h for CNS infection, with prolonged infusion in the source strategy."],
 'pearls':["Avoid piperacillin–tazobactam for moderate/high-risk inducible AmpC Enterobacterales in the dedicated MSIDC guidance.","Reserve newer beta-lactam/beta-lactamase-inhibitor combinations for difficult-to-treat carbapenem-resistant infection rather than routine AmpC treatment."],
 'duration':'AmpC status does not set duration by itself. Use the syndrome/source-control duration for the actual infection and include effective empirical therapy in the total course when the source allows completion.',
 'ipc':['Standard precautions; escalate infection-control measures according to institutional epidemiology and MDRO policy.']}

mg['esbl']={
 'title':'ESBL practical management guide','source':'msidc','refs':[ref('msidc',25),ref('msidc',26),ref('msidc',73),ref('hpusm',18),ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-negative')],
 'definition':["ESBL enzymes hydrolyse penicillins, expanded-spectrum cephalosporins and monobactams but not carbapenems/cephamycins; treatment still depends on site, severity and reliable susceptibility testing.","Current NAG organism quick guide lists ertapenem, imipenem and meropenem as preferred agents for ESBL Enterobacterales; the dedicated MSIDC pathway provides the site-specific narrower options below."],
 'siteRows':[
  {'site':'Uncomplicated cystitis','preferred':'Nitrofurantoin or TMP-SMX when susceptible','alternative':'Ciprofloxacin, one aminoglycoside dose, fosfomycin for E. coli only, or ertapenem if no suitable option.','drugIds':['nitrofurantoin','trimethoprim-sulfamethoxazole','ciprofloxacin','gentamicin','amikacin','fosfomycin','ertapenem'],'ref':ref('msidc',25)},
  {'site':'Pyelonephritis / cUTI','preferred':'TMP-SMX or ciprofloxacin when susceptible','alternative':'Once-daily aminoglycoside with TDM, or ertapenem/meropenem/imipenem when no suitable narrower option.','drugIds':['trimethoprim-sulfamethoxazole','ciprofloxacin','gentamicin','amikacin','ertapenem','meropenem','imipenem'],'ref':ref('msidc',25)},
  {'site':'Outside urinary tract','preferred':'Carbapenem therapy in the dedicated MSIDC pathway','alternative':'In critical illness or marked hypoalbuminaemia (<25 g/L), favour meropenem or imipenem rather than ertapenem.','drugIds':['ertapenem','meropenem','imipenem'],'ref':ref('msidc',25)},
  {'site':'HPUSM severe / ICU context','preferred':'Use the local HPUSM ESBL pathway and patient severity; critically ill/intubated ICU patients are directed toward meropenem/imipenem rather than ertapenem.','alternative':'Reassess de-escalation once microbiology and clinical response are known.','drugIds':['ertapenem','meropenem','imipenem'],'ref':ref('hpusm',18)}],
 'dosing':["MSIDC adult appendix: meropenem 1 g IV q8h for non-CNS ESBL/AmpC infection; 2 g IV q8h for CNS infection with prolonged infusion strategy where specified.","Ertapenem adult appendix: 1 g IV q24h in normal renal function; do not use ertapenem for Pseudomonas, Enterococcus, Acinetobacter or CNS infection."],
 'pearls':["MSIDC does not recommend piperacillin–tazobactam as definitive ESBL therapy regardless of reported susceptibility, except it allows completion in a narrow uncomplicated-cystitis scenario when already improving and no oral step-down is available.","MSIDC likewise does not recommend cefepime as definitive ESBL therapy regardless of susceptibility, with the same narrow cystitis-completion exception."],
 'duration':'Use the duration for the diagnosed syndrome and source control; ESBL phenotype alone does not justify a longer course.',
 'ipc':['Apply MDRO precautions/risk assessment according to local infection-prevention policy; colonisation should not be treated as infection.']}

mg['cre']={
 'title':'CRE / CPE practical management guide','source':'msidc','refs':[ref('msidc',27),ref('msidc',33),ref('msidc',34),ref('msidc',35),ref('msidc',36),ref('msidc',37),ref('msidc',72),ref('msidc',73),ref('msidc',74),ref('msidc',75)],
 'definition':["CRE is heterogeneous: separate carbapenemase-producing CRE from non-carbapenemase CRE and, when possible, identify the enzyme (e.g. NDM/MBL, OXA-48-like, KPC) because this changes active beta-lactam options.","Intrinsic imipenem elevation in Proteus/Morganella/Providencia must not be mislabelled as CRE without interpreting the other carbapenems. Carbapenemase testing may use phenotypic or molecular methods according to laboratory capability."],
 'siteRows':[
  {'site':'Non-CP CRE · meropenem/imipenem MIC ≤1 µg/mL, ertapenem non-susceptible','preferred':'High-dose meropenem or imipenem using 3–4 h extended infusion.','alternative':'Use the renal/RRT tool after selecting the source-defined clinical dose.','drugIds':['meropenem','imipenem'],'ref':ref('msidc',34)},
  {'site':'CRE non-susceptible to all carbapenems · uncomplicated cystitis','preferred':'Susceptible nitrofurantoin or TMP-SMX','alternative':'Fosfomycin for E. coli only, ciprofloxacin or a single aminoglycoside dose.','drugIds':['nitrofurantoin','trimethoprim-sulfamethoxazole','fosfomycin','ciprofloxacin','gentamicin','amikacin'],'ref':ref('msidc',34)},
  {'site':'CRE · pyelonephritis / cUTI','preferred':'Susceptible TMP-SMX, ciprofloxacin, ceftazidime-avibactam or cefiderocol','alternative':'Once-daily aminoglycoside with TDM or colistin; urinary-source polymyxin choice differs from non-urinary infection.','drugIds':['trimethoprim-sulfamethoxazole','ciprofloxacin','ceftazidime-avibactam','cefiderocol','gentamicin','amikacin','colistin'],'ref':ref('msidc',34)},
  {'site':'Outside urinary tract · ceftazidime-avibactam susceptible','preferred':'Ceftazidime-avibactam','alternative':'Cefiderocol, high-dose tigecycline or polymyxin B are less preferred. In moderate–severe/high-burden disease, MSIDC favours an additional susceptible companion when cefiderocol/tigecycline/polymyxin is used.','drugIds':['ceftazidime-avibactam','cefiderocol','tigecycline','polymyxin-b','meropenem','gentamicin','amikacin'],'ref':ref('msidc',35)},
  {'site':'Outside urinary tract · ceftazidime-avibactam resistant, presumed/confirmed NDM','preferred':'Ceftazidime-avibactam PLUS aztreonam administered simultaneously, or cefiderocol','alternative':'High-dose tigecycline (avoid for bacteraemia) or polymyxin B are less preferred; selected severe/high-burden cases may require susceptibility-directed combination therapy.','drugIds':['ceftazidime-avibactam','aztreonam','cefiderocol','tigecycline','polymyxin-b','meropenem','gentamicin','amikacin'],'ref':ref('msidc',36)},
  {'site':'Outside urinary tract · ceftazidime-avibactam resistant, mechanism unknown','preferred':'Cefiderocol in the source algorithm','alternative':'High-dose tigecycline or polymyxin B; obtain ID/clinical microbiology input and define the carbapenemase when possible.','drugIds':['cefiderocol','tigecycline','polymyxin-b'],'ref':ref('msidc',33)}],
 'dosing':["Ceftazidime-avibactam: MSIDC adult appendix lists 2.5 g IV q8h over 3 h in normal renal function; renal adjustment is required.","Aztreonam: 2 g IV q6–8h over 3 h in the adult appendix when used with ceftazidime-avibactam for CRE; the treatment section specifies simultaneous administration and notes Y-site compatibility.","Tigecycline high-dose strategy: 200 mg loading dose then 100 mg q12h; avoid relying on tigecycline for bloodstream/intravascular-source infection because serum concentrations are low.","Polymyxin B: 2.0–2.5 mg/kg IV loading, then 1.25–1.5 mg/kg q12h in the MSIDC adult appendix; no renal dose adjustment is listed there, but toxicity monitoring remains essential.","Colistin: adult appendix uses a 9-MU loading strategy with renal-adjusted maintenance; prefer colistin rather than polymyxin B for urinary-source infection when a polymyxin is required."],
 'pearls':["If meropenem MIC ≤8 mg/L, the MSIDC severe/high-burden combination framework may include the highest-dose prolonged-infusion meropenem as a companion; this is not carbapenem monotherapy for fully resistant CRE.","Polymyxins have more toxicity and generally worse outcome data than newer active beta-lactam options; do not default to them when a preferred active agent is available.","Cefiderocol is usually used as monotherapy in the cited literature, although emerging NDM-associated resistance is noted; specialist input is appropriate for severe disease."],
 'duration':'CRE phenotype does not determine duration. Use the diagnosed syndrome, source control and response; document a review/stop date and reassess combination therapy as soon as clinically appropriate.',
 'ipc':['Treat infection, not colonisation. CP-CRE generally warrants more intensive infection-control attention than non-CP CRE; follow local screening/contact-precaution policy.']}

mg['non-cp-cre']={
 'title':'Non-carbapenemase CRE guide','source':'msidc','refs':[ref('msidc',27),ref('msidc',34),ref('msidc',73)],
 'definition':["Non-CP CRE has carbapenem resistance through mechanisms such as porin/permeability change combined with other beta-lactamases rather than a carbapenemase."],
 'siteRows':[{'site':'Meropenem/imipenem susceptible (MIC ≤1 µg/mL), ertapenem non-susceptible','preferred':'High-dose meropenem or imipenem with 3–4 h extended infusion.','alternative':'If meropenem/imipenem are no longer susceptible, use the full CRE mechanism/site pathway.','drugIds':['meropenem','imipenem'],'ref':ref('msidc',34)}],
 'dosing':["MSIDC adult appendix: meropenem 1 g IV q8h for non-CNS infection; imipenem 500 mg IV q6h for usual non-cystitis infection, with prolonged infusion options in the source."],
 'pearls':["Do not call intrinsic imipenem non-susceptibility in Proteus/Morganella/Providencia CRE if the other carbapenems do not meet the definition."],
 'duration':'Use syndrome-specific duration; resistance mechanism alone does not lengthen the course.',
 'ipc':['Use local CRE infection-control policy and distinguish colonisation from clinical infection.']}

mg['ndm-mbl']={
 'title':'NDM / MBL CRE guide','source':'msidc','refs':[ref('msidc',33),ref('msidc',36),ref('msidc',72)],
 'definition':["NDM/VIM/IMP are metallo-beta-lactamases. Avibactam does not inhibit the MBL itself; the ceftazidime-avibactam + aztreonam strategy uses avibactam to protect aztreonam from co-produced serine beta-lactamases."],
 'siteRows':[{'site':'Outside urinary tract · presumed/confirmed NDM','preferred':'Ceftazidime-avibactam PLUS aztreonam simultaneously, or cefiderocol','alternative':'High-dose tigecycline (not for bacteraemia) or polymyxin B; severe/high-burden cases may need susceptibility-directed companion therapy.','drugIds':['ceftazidime-avibactam','aztreonam','cefiderocol','tigecycline','polymyxin-b'],'ref':ref('msidc',36)}],
 'dosing':["MSIDC adult appendix: ceftazidime-avibactam 2.5 g IV q8h over 3 h; aztreonam 2 g IV q6–8h over 3 h. Adjust for renal function according to the source tables."],
 'pearls':["Administer ceftazidime-avibactam and aztreonam simultaneously in the cited pathway; the source states they are Y-site compatible.","Avoid high-dose tigecycline for bacteraemia because serum exposure is low."],
 'duration':'Use syndrome-specific duration and reassess combination therapy with clinical/microbiology response.',
 'ipc':['Use CP-CRE infection-control precautions and local screening policy.']}

mg['kpc']={
 'title':'KPC-producing CRE guide','source':'msidc','refs':[ref('msidc',33),ref('msidc',35),ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-negative')],
 'definition':["KPC is a serine carbapenemase. Ceftazidime-avibactam activity must be confirmed by susceptibility testing; do not infer susceptibility from the enzyme name alone."],
 'siteRows':[{'site':'Outside urinary tract · ceftazidime-avibactam susceptible','preferred':'Ceftazidime-avibactam','alternative':'Cefiderocol, high-dose tigecycline or polymyxin B are less preferred in the MSIDC pathway; use the full CRE severity/combination framework for high-burden disease.','drugIds':['ceftazidime-avibactam','cefiderocol','tigecycline','polymyxin-b'],'ref':ref('msidc',35)}],
 'dosing':["Ceftazidime-avibactam: 2.5 g IV q8h over 3 h in the MSIDC adult normal-renal table; renal adjustment is required."],
 'pearls':["Obtain mechanism plus AST rather than treating all CP-CRE identically."],
 'duration':'Use the infection-syndrome duration and source-control plan.',
 'ipc':['Manage as CP-CRE according to local infection-control policy.']}

mg['oxa48']={
 'title':'OXA-48-like CRE guide','source':'msidc','refs':[ref('msidc',33),ref('msidc',35)],
 'definition':["OXA-48-like enzymes are serine carbapenemases; phenotype can be difficult to infer from routine beta-lactam results, so carbapenemase identification plus AST is important."],
 'siteRows':[{'site':'Invasive / outside urinary tract','preferred':'Use the CRE algorithm according to ceftazidime-avibactam susceptibility and infection site.','alternative':'If ceftazidime-avibactam is not active, use the mechanism-unknown/alternative CRE pathway with specialist review rather than assuming another beta-lactam will work.','drugIds':['ceftazidime-avibactam','cefiderocol','tigecycline','polymyxin-b'],'ref':ref('msidc',33)}],
 'dosing':["When active and appropriate, ceftazidime-avibactam is 2.5 g IV q8h over 3 h in the MSIDC adult normal-renal table; adjust for renal function."],
 'pearls':["Do not extrapolate NDM treatment to OXA-48-like disease or vice versa; mechanism matters."],
 'duration':'Use syndrome-specific duration and clinical response.',
 'ipc':['Manage as CP-CRE according to local infection-control policy.']}

mg['dtr-pseudomonas']={
 'title':'MDR / DTR Pseudomonas practical guide','source':'msidc','refs':[ref('msidc',48),ref('msidc',49),ref('msidc',50),ref('msidc',51),ref('msidc',70),ref('msidc',72),ref('msidc',73)],
 'definition':["MDR P. aeruginosa can remain susceptible to traditional non-carbapenem beta-lactams despite carbapenem non-susceptibility; DTR phenotype requires the dedicated newer-agent pathway and isolate-specific AST."],
 'siteRows':[
  {'site':'MDR · carbapenem non-susceptible but ceftazidime/cefepime/pip-tazo susceptible','preferred':'Use the active traditional beta-lactam at high dose with extended infusion: ceftazidime, cefepime or piperacillin-tazobactam.','alternative':'Ciprofloxacin/levofloxacin are less preferred if susceptible.','drugIds':['ceftazidime','cefepime','piperacillin-tazobactam','ciprofloxacin','levofloxacin'],'ref':ref('msidc',48)},
  {'site':'DTR · uncomplicated cystitis','preferred':'Ceftolozane-tazobactam or ceftazidime-avibactam','alternative':'Single-dose amikacin, colistin or cefiderocol. Avoid oral fosfomycin for Pseudomonas.','drugIds':['ceftolozane-tazobactam','ceftazidime-avibactam','amikacin','colistin','cefiderocol'],'ref':ref('msidc',49)},
  {'site':'DTR · pyelonephritis / cUTI','preferred':'Ceftolozane-tazobactam or ceftazidime-avibactam','alternative':'Once-daily amikacin with TDM, colistin or cefiderocol; use colistin rather than polymyxin B for urinary-source infection if a polymyxin is required.','drugIds':['ceftolozane-tazobactam','ceftazidime-avibactam','amikacin','colistin','cefiderocol'],'ref':ref('msidc',49)},
  {'site':'DTR · infection outside urinary tract','preferred':'Ceftolozane-tazobactam or ceftazidime-avibactam','alternative':'Cefiderocol or polymyxin B plus a second susceptible agent when no better active option; ID/microbiology review if no susceptible companion exists.','drugIds':['ceftolozane-tazobactam','ceftazidime-avibactam','cefiderocol','polymyxin-b'],'ref':ref('msidc',50)}],
 'dosing':["Piperacillin-tazobactam for MDR Pseudomonas: 4.5 g IV q6h; source appendix supports high-dose extended infusion (maintenance over about 4 h after a loading dose).","Ceftazidime: 2 g IV q6–8h; prolonged infusion over 4 h is recommended for severe/high-burden disease.","Cefepime: 2 g IV q8h for non-cystitis infection; prolonged infusion over 3–4 h is recommended for severe/high-burden disease.","Ceftolozane-tazobactam: 1.5 g IV q8h for cystitis; 3 g IV q8h for other infection, with 3-h extended infusion potentially needed in severe DTR disease.","Ceftazidime-avibactam: 2.5 g IV q8h over 3 h.","Cefiderocol: 2 g IV q8h in the adult normal-renal appendix; use renal/augmented-clearance adjustments from the source table."],
 'pearls':["Reserve newer beta-lactam/beta-lactamase inhibitor agents for DTR Pseudomonas rather than using them routinely when a traditional active beta-lactam remains suitable.","MSIDC does not recommend nebulised antibiotics for DTR Pseudomonas respiratory infection.","IV gentamicin is not recommended for Pseudomonas in the cited MSIDC document because CLSI breakpoints are unavailable.","Routine combination therapy is not recommended when an optimal active agent is available because benefit is unproven and adverse effects increase."],
 'duration':'Use the diagnosed infection-site duration (e.g. pneumonia, cUTI, bloodstream infection) and clinical/source-control response; DTR phenotype alone does not mandate a longer course.',
 'ipc':['Apply MDRO/contact precautions according to local DTR-Pseudomonas policy and institutional epidemiology.']}

mg['stenotrophomonas']={
 'title':'Stenotrophomonas maltophilia practical guide','source':'msidc','refs':[ref('msidc',52),ref('msidc',53),ref('msidc',54),ref('msidc',71),ref('msidc',75)],
 'definition':["S. maltophilia is a non-fermenting Gram-negative organism with broad intrinsic resistance, including carbapenems. Many respiratory/clinical isolates represent colonisation, so establish true infection before treatment."],
 'siteRows':[{'site':'True infection','preferred':'TMP-SMX IV/PO','alternative':'Cefiderocol, or ceftazidime-avibactam PLUS aztreonam. For moderate–severe infection, MSIDC prefers combination therapy when TMP-SMX or cefiderocol is used, at least until clinical improvement; levofloxacin or minocycline may be susceptibility-directed companions.','drugIds':['trimethoprim-sulfamethoxazole','cefiderocol','ceftazidime-avibactam','aztreonam','levofloxacin','minocycline'],'ref':ref('msidc',53)}],
 'dosing':["TMP-SMX adult appendix: all-other-infection dosing is expressed by trimethoprim component (8–12 mg/kg/day IV/PO in 2–3 divided doses in normal renal function); renal adjustment is required.","Minocycline: 200 mg IV/PO q12h in the MSIDC adult appendix for Stenotrophomonas/CRAB companion use.","Ceftazidime-avibactam + aztreonam combination follows the CRE dosing/administration framework when selected; administer simultaneously in the cited pathway."],
 'pearls':["Do not treat colonisation.","Polymyxins have no established breakpoint for S. maltophilia in the cited guideline.","Tetracycline derivatives have low urine and serum concentrations: do not use them for UTI and do not rely on minocycline monotherapy for bacteraemia.","IV minocycline is not recommended for children <8 years in the source; neonatal TMP-SMX needs caution because of hyperbilirubinaemia/kernicterus risk."],
 'duration':'Use the clinical syndrome and response to determine duration. In moderate–severe infection, reassess the need for combination therapy once improvement occurs.',
 'ipc':['Standard precautions in the source; reinforce hand hygiene, equipment disinfection and environmental cleaning.']}

mg['mrsa']={
 'title':'MRSA practical guide','source':'nag','refs':[ref('hpusm',15),ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-positive')],
 'definition':["Methicillin resistance predicts resistance to usual anti-staphylococcal beta-lactams; current NAG notes ceftaroline as the beta-lactam exception in its quick guide. Confirm vancomycin MIC/susceptibility rather than assuming activity."],
 'siteRows':[{'site':'Confirmed / high-risk MRSA where systemic therapy is required','preferred':'Vancomycin is the principal IV option in HPUSM/NAG quick guidance.','alternative':'NAG quick guide lists linezolid and ceftaroline as IV alternatives; oral/CA-MRSA options are syndrome- and susceptibility-dependent.','drugIds':['vancomycin','linezolid'],'ref':ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-positive')}],
 'dosing':["Use the vancomycin TDM workflow for loading, renal/RRT and exposure monitoring rather than a fixed trough-only approach."],
 'pearls':["Rifampicin should not be used alone for staphylococcal antimicrobial therapy.","When the isolate is MSSA, de-escalate from vancomycin to an effective anti-staphylococcal beta-lactam unless contraindicated."],
 'duration':'Duration depends on syndrome and whether disease is complicated (e.g. bacteraemia/endocarditis/deep focus) rather than the MRSA phenotype alone.',
 'ipc':['Follow local MRSA infection-control policy and distinguish colonisation from infection.']}

mg['mssa']={
 'title':'MSSA practical guide','source':'nag','refs':[ref('hpusm',15),ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-positive')],
 'definition':["Methicillin-susceptible S. aureus is best treated with an active anti-staphylococcal beta-lactam when one is clinically appropriate; HPUSM specifically notes vancomycin is inferior to cloxacillin for MSSA."],
 'siteRows':[{'site':'MSSA requiring systemic treatment','preferred':'Cloxacillin; current NAG quick guide also lists cefazolin as preferred IV therapy.','alternative':'Use syndrome-specific alternatives for allergy/other constraints; uncomplicated oral options in the NAG quick guide include cephalexin or cloxacillin.','drugIds':['cloxacillin','cefazolin','cephalexin'],'ref':ref('nag',url='https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-positive')}],
 'dosing':["Open the linked drug monograph and syndrome card because dose/duration differ between uncomplicated skin disease, bacteraemia, endocarditis, bone/joint and CNS infection."],
 'pearls':["Do not continue vancomycin solely for convenience when MSSA is confirmed and a suitable beta-lactam can be used.","Complicated S. aureus infection requires a search for deep focus/source and syndrome-specific duration."],
 'duration':'Use the actual MSSA syndrome duration; complicated bacteraemia/endocarditis/deep infection requires longer treatment than uncomplicated disease.',
 'ipc':['Use standard/local S. aureus infection-control measures according to clinical context.']}

for rid,guide in mg.items():
    if rid in res: res[rid]['managementGuide']=guide

# CRAB already has a high-detail bespoke sulbactam guide; add the same navigation/management shell without
# duplicating its dosing table.
res['crab']['managementGuide']={
 'title':'CRAB practical management guide','source':'hpusm','refs':[ref('hpusm',21),ref('hpusm',22),ref('msidc',42),ref('msidc',44),ref('msidc',70),ref('msidc',74)],
 'definition':["First distinguish true CRAB infection from colonisation; then stratify severity, ampicillin-sulbactam susceptibility, infection site and full AST.","High-dose sulbactam exposure is the backbone of the HPUSM/MSIDC pathways; use the dedicated sulbactam table below for formulation, renal/RRT and infusion details."],
 'siteRows':[{'site':'Mild · sulbactam susceptible','preferred':'Ampicillin-sulbactam using the source-defined susceptible regimen.','alternative':'Use the dedicated source cards and sulbactam table below.','drugIds':['ampicillin-sulbactam'],'ref':ref('hpusm',21)},{'site':'Mild non-susceptible / moderate–severe','preferred':'High-dose sulbactam-based therapy, with a susceptibility/site-directed companion according to the HPUSM/MSIDC pathway.','alternative':'Minocycline or polymyxin B are common source-listed companions; colistin is preferred over polymyxin B for urinary-source infection if a polymyxin is required.','drugIds':['ampicillin-sulbactam','minocycline','polymyxin-b','colistin'],'ref':ref('msidc',42)}],
 'dosing':["Use the dedicated Dosage regimen of sulbactam for Acinetobacter MDR table on this page; it contains formulation ratios, CrCl/RRT targets, 100-mL dilution and four-hour infusion instructions."],
 'pearls':["Minocycline has low serum/urinary concentrations; site matters.","Avoid routine nebulised antibiotic therapy and low-value/toxic combinations where the dedicated source advises against them."],
 'duration':'HPUSM local table gives 7–10 days for the CRAB regimen shown; individualise by infection site, source control and response.',
 'ipc':['Apply CRAB/contact precautions according to local infection-control policy.']}

# ---------------- build organism pathway guides for all organisms ----------------
# Preserve existing current-NAG quick guides. Add a second structured guide for every organism, built only
# from linked AbxHub source records, so all 26 organism pages have explicit syndrome/resistance antimicrobial links.
for o in db['organisms']:
    groups=[]
    for lid in o.get('links',[]):
        x=conds.get(lid) or res.get(lid)
        if not x: continue
        refs=[]; ids=[]
        if 'recommendations' in x:
            # Use the already source-normalised disease pathway rather than re-parsing prose.
            for rr in (x.get('practicalPathway') or {}).get('regimens',[]):
                ids += rr.get('drugIds',[])
                if rr.get('ref'): refs.append(rr['ref'])
        else:
            # Resistance management rows have deliberately curated drug IDs. This avoids
            # surfacing formulation ingredients (e.g. plain ampicillin from Unasyn composition)
            # as if they were standalone resistance-treatment choices.
            g=x.get('managementGuide') or {}
            for row in g.get('siteRows',[]):
                ids += row.get('drugIds',[])
                if row.get('ref'): refs.append(row['ref'])
            refs += g.get('refs',[])
        ids=unique([did for did in ids if did in drugs])
        if ids:
            groups.append({'label':x['name'],'kind':'condition' if lid in conds else 'resistance','targetId':lid,'drugIds':ids[:16],'refs':refs[:4]})
    o['pathwayAntimicrobialGuide']={
      'title':'Syndrome / resistance-linked antimicrobial guide',
      'groups':groups,
      'guard':'These drugs are extracted from this organism’s linked source-specific pathways. They are not an antibiogram and do not imply that an individual isolate is susceptible. Confirm site, phenotype/MIC, infection vs colonisation and patient factors.',
      'updated':'2026-09-11'
    }

# Add current NAG ESBL quick guide directly to the resistance page as an additional source card.
esbl=res['esbl']
if not any(sc.get('source')=='nag' for sc in esbl['sourceCards']):
    esbl['sourceCards'].append({
      'source':'nag','title':'Current NAG organism quick guide — ESBL Enterobacterales',
      'text':'Current NAG quick guide lists ertapenem, imipenem and meropenem as preferred agents for ESBL Enterobacterales. Use the MSIDC site-specific pathway above/below to avoid unnecessary carbapenem exposure when a reliable narrower option is appropriate.',
      'url':'https://sites.google.com/moh.gov.my/nag/information/organisms-and-antimicrobial-quick-guide/gram-negative',
      'bullets':['The NAG quick guide is a rapid organism reference; definitive therapy still requires syndrome, severity and susceptibility context.']
    })

# Ensure resistance references include any management-guide source refs (deduped by serialized value).
for r in db['resistance']:
    refs0=r.get('refs',[])
    refs1=(r.get('managementGuide') or {}).get('refs',[])
    seen=set(); merged=[]
    for x in refs0+refs1:
        key=json.dumps(x,sort_keys=True,ensure_ascii=False)
        if key not in seen: seen.add(key); merged.append(x)
    r['refs']=merged

# Update metadata/audit state. Counts are recalculated by validator later.
db['meta']['dbVersion']='0.20.0'
db['meta']['scope']='AbxHub v0.20 expands all 63 condition records with practical source-grounded pathways, all 26 organism records with linked antimicrobial guidance, and all 12 resistance/phenotype records with practical management guides, on the validated v0.19 baseline. It preserves guideline provenance, local susceptibility guards, renal/RRT context, paediatric/neonatal population separation, formulation-specific preparation and high-risk TDM safeguards.'
db['meta']['contentReview']='2026-09-11 expanded disease/organism/resistance layer'
db['validation']['lastValidated']='2026-09-11'

DATA.write_text(json.dumps(db,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Expanded practical pathways:',len(db['conditions']))
print('Resistance management guides:',sum(bool(x.get('managementGuide')) for x in db['resistance']),'/',len(db['resistance']))
print('Organism pathway antimicrobial guides:',sum(bool(x.get('pathwayAntimicrobialGuide')) for x in db['organisms']),'/',len(db['organisms']))
