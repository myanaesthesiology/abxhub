# AbxHub v0.20.0 high-risk source spot-check

**Review date:** 11 September 2026  
**Purpose:** focused manual source verification of high-risk records after the v0.19 → v0.20 clinical-depth patch.

This is not a claim that every line in every source was independently re-entered. It is a targeted regression check of areas where a transcription or source-merging error could be clinically consequential.

## 1. CRAB — HPUSM ASP 2025

**Bundled source:** `references/HPUSM_ASP_2025.pdf`, source/PDF pp.21–22.  
**Result:** PASS.

Spot-checked against the bundled pages:

- mild susceptible CRAB: ampicillin/sulbactam 3 g q4h;
- mild non-susceptible CRAB: high-dose ampicillin/sulbactam 9 g q8h;
- moderate–severe CRAB: high-dose ampicillin/sulbactam 9 g q8h over 3 h, with source-specific companion therapy shown separately;
- HPUSM duration displayed as 7–10 days where stated;
- Unasyn formulation ratio: ampicillin 1 g + sulbactam 0.5 g per 1.5-g vial;
- cefoperazone/sulbactam source formulation: 500 mg + 500 mg per 1-g vial;
- sulbactam targets by renal/RRT context: >50, 20–50, <20/HD and continuous-RRT strata preserved as separate rows;
- dilution volume 100 mL;
- listed diluents include WFI, 0.9% sodium chloride and 5% dextrose;
- four-hour infusion instruction preserved;
- high-dose Unasyn sodium exposure/hypernatraemia caution surfaced;
- cefoperazone/sulbactam hypoprothrombinaemia/vitamin-K precaution surfaced as a source-specific caution, not a universal default intervention.

## 2. CRAB — MSIDC MDR Gram-Negative 2024

**Bundled source:** `references/MSIDC_MDR_Gram_Negatives_2024.pdf`, source/PDF pp.42–44.  
**Result:** PASS.

Spot-checked:

- colonisation is not treated as infection;
- mild susceptible and non-susceptible approaches remain distinguishable;
- moderate–severe disease uses combination-therapy logic rather than a single-agent shortcut;
- high-dose sulbactam remains a core source-specific component;
- polymyxin B is kept distinct from colistin and site-of-infection considerations are retained;
- cefiderocol is presented as a source-specific option/consideration, not as a blanket first-line recommendation;
- routine nebulised polymyxin/aminoglycoside therapy is not invented;
- regimen differences between HPUSM and MSIDC remain displayed separately.

## 3. Prolonged-infusion beta-lactams — MSIC Adult ICU 2023

**Bundled source:** `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`, source pp.144–145 / physical PDF pp.154–155.  
**Result:** PASS.

Spot-checked:

- loading dose is separated from maintenance infusion;
- cefepime, ceftazidime, imipenem, meropenem and piperacillin/tazobactam have distinct preparation rows;
- extended maintenance infusion is represented as approximately four hours;
- meropenem standard and CNS/MDR higher-exposure context remain separate;
- Appendix C concentration/preparation information is not used to infer the clinical dose or renal/RRT adjustment;
- TDM/high-MIC/serious-infection context remains visible.

## 4. Vancomycin TDM

**Structured sources:** NAG pharmacokinetic appendix + MSIC ICU TDM/renal records.  
**Result:** PASS.

Safety gates retained:

- AUC24/MIC remains the exposure framework where structured;
- validated Bayesian or validated multi-level/two-concentration methods are accepted concepts;
- AbxHub does **not** calculate AUC from one trough using an unsupported shortcut;
- renal/RRT context is presented separately;
- CRRT example regimens remain source examples requiring effluent/MIC/TDM context rather than automatic prescriptions.

## 5. Aminoglycoside TDM

**Structured sources:** NAG + MSIC.  
**Result:** PASS.

- EID/SDD exclusions are surfaced before routing to an extended-interval approach;
- conventional/synergy/neonatal/renal-RRT contexts are not collapsed into a single nomogram;
- AbxHub does not derive a dosing interval from serum creatinine alone when exclusion criteria apply.

## 6. CRRT / renal dosing

**Result:** PASS.

- CVVH, CVVHD and CVVHDF are not converted into a single fictional CrCl value;
- actual effluent rate is requested where the source makes it relevant;
- interrupted/stopped CRRT does not continue to display the running-CRRT maintenance regimen as if clearance were unchanged;
- residual renal function and TDM remain contextual variables;
- drug-specific loading dose remains conceptually separate from maintenance adjustment.

## 7. High-risk formulation distinctions

**Result:** PASS.

Regression guards preserved:

- colistin/CMS and polymyxin B are distinct drugs/units/renal behaviors;
- amphotericin B deoxycholate, lipid-complex and liposomal formulations are not treated as automatically interchangeable;
- injectable preparation remains source/product/formulation dependent;
- paediatric/neonatal records retain population/age/gestational/renal qualifiers where structured.

## 8. Current official NAG web spot-checks

Current MOH NAG pages were checked during the v0.20 build. At review time, the site still displayed **LATEST UPDATES! (Jan '26)**.

Spot-checks included:

- Appendix 6 IV→PO review timing and eligibility/exclusion criteria;
- NAG Gram-negative organism quick guide;
- NAG Gram-positive organism quick guide;
- adult gastrointestinal/hepatobiliary pathways, including H. pylori, cholecystitis and cholangitis.

Each structured NAG recommendation in the v0.20 database has a direct official URL, and every drug with a top-level NAG reference has at least one direct NAG URL.

## 9. AmpC — MSIDC MDR Gram-Negative 2024

**Bundled source:** `references/MSIDC_MDR_Gram_Negatives_2024.pdf`, source pp.17–21 and adult dosing appendix.  
**Result:** PASS.

Spot-checked that the structured guide preserves:

- moderate-risk inducible AmpC organisms versus lower-risk organisms;
- uncomplicated cystitis versus pyelonephritis/cUTI versus extra-urinary infection;
- cefepime as the preferred susceptible extra-urinary beta-lactam in the relevant pathway;
- high-burden/SDD context where carbapenem therapy may be preferred;
- the dedicated caution against piperacillin–tazobactam for moderate/high-risk inducible AmpC;
- prolonged-infusion cefepime/meropenem dosing highlights as source-specific administration strategy.

## 10. ESBL Enterobacterales — MSIDC + current NAG quick guide

**Bundled MSIDC source:** source pp.25–26 plus adult dosing appendix.  
**Result:** PASS.

- uncomplicated cystitis retains nitrofurantoin/TMP-SMX as preferred susceptible options;
- pyelonephritis/cUTI retains susceptible TMP-SMX/ciprofloxacin and source-specific aminoglycoside/carbapenem alternatives;
- extra-urinary disease retains carbapenem therapy with critical-illness/hypoalbuminaemia context;
- MSIDC cautions around definitive piperacillin–tazobactam and cefepime are not silently removed;
- the current NAG quick-guide carbapenem layer is displayed as a separate NAG source rather than merged into MSIDC.

## 11. CRE / CPE / NDM / KPC / OXA-48-like — MSIDC

**Bundled source:** source pp.33–38 and dosing appendix.  
**Result:** PASS.

- non-carbapenemase CRE is separated from CP-CRE;
- CRE cystitis, pyelonephritis/cUTI and extra-urinary infection are not collapsed into one regimen;
- ceftazidime-avibactam susceptibility and carbapenemase mechanism remain decision variables;
- presumed/confirmed NDM/MBL retains the ceftazidime-avibactam + aztreonam simultaneous-administration strategy or cefiderocol alternative in the cited pathway;
- KPC and OXA-48-like records route through their own mechanism-aware cards rather than reusing the NDM regimen;
- tigecycline bacteraemia caution and polymyxin/site considerations remain explicit;
- renal adjustment remains delegated to the drug-specific renal/RRT layer rather than hidden inside a generic CRE card.

## 12. MDR / DTR Pseudomonas — MSIDC

**Bundled source:** source pp.48–51 and dosing appendix.  
**Result:** PASS.

- carbapenem-non-susceptible but traditional-beta-lactam-susceptible MDR isolates retain high-dose extended-infusion ceftazidime/cefepime/piperacillin-tazobactam strategy;
- DTR cystitis, pyelonephritis/cUTI and extra-urinary infection remain separate;
- ceftolozane-tazobactam and ceftazidime-avibactam are not presented as routine substitutes when a suitable traditional beta-lactam remains active;
- colistin versus polymyxin-B urinary-site distinction is retained;
- routine nebulised therapy and routine combination therapy are not promoted where the source advises against them.

## 13. Stenotrophomonas maltophilia — MSIDC

**Bundled source:** source pp.52–54 and dosing appendix.  
**Result:** PASS.

- the pathway begins with infection-versus-colonisation;
- TMP-SMX remains the preferred source-listed treatment;
- cefiderocol and ceftazidime-avibactam + aztreonam remain source-specific alternatives;
- moderate–severe combination-therapy language is preserved;
- low serum/urine exposure cautions for tetracycline derivatives and paediatric/neonatal cautions remain visible.

## 14. Disease-depth corrections

**HPUSM PJI page 14:** visually rechecked against the bundled PDF. **PASS.**

- MSSA retained-implant pathway: cloxacillin 2 g IV q4–6h + rifampicin 300–450 mg PO q12h;
- MRSA retained-implant pathway: vancomycin 15–20 mg/kg IV q8–12h + rifampicin 300–450 mg PO q12h;
- source table's 14–42-day display retained;
- culture-before-antibiotic and surgical-strategy dependence retained.

**MSIC voriconazole renal table source p.140 / physical PDF p.150:** visually rechecked. **PASS.**

- Day 1 6 mg/kg q12h and Day 2 onward 4 mg/kg q12h retained;
- CrCl <50 mL/min SBECD/IV-formulation caution and oral-formulation strategy retained;
- the record is explicitly labelled a dosing/formulation reference, not a syndrome-specific duration recommendation.

## 15. Organism-link safety regression

**Result:** PASS.

All 26 organism pages now use curated drug IDs from structured disease/resistance regimen rows. A dedicated regression guard confirms that plain ampicillin is not exposed as a standalone CRAB treatment simply because the Unasyn formulation description contains the word “ampicillin”. Organism pages continue to state that linked drugs are not an antibiogram and do not imply isolate susceptibility.

## Sign-off status

**Manual high-risk source spot-check: PASS for the areas above.**  
This does not remove the need for clinician/pharmacist judgement, current isolate susceptibility, local epidemiology, local product information or a validated institutional TDM workflow.
