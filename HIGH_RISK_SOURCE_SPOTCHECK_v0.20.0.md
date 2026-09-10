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

## Sign-off status

**Manual high-risk source spot-check: PASS for the areas above.**  
This does not remove the need for clinician/pharmacist judgement, current isolate susceptibility, local epidemiology, local product information or a validated institutional TDM workflow.
