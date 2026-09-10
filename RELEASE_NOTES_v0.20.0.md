# AbxHub v0.20.0 release notes

**Build date:** 11 September 2026  
**Status:** release candidate; static/clinical validation passed, deployed-browser PWA verification pending

## Validated build

- 60 drugs
- 63 conditions/syndromes
- 26 organisms
- 12 resistance pathways
- 1,721 source-reference objects
- 0 release-validator errors
- 0 release-validator warnings
- JavaScript syntax PASS
- JSON integrity PASS
- static HTTP smoke test PASS — 8/8 core assets

## Search, history and navigation

- Pressing Enter in universal search opens a dedicated search-results page instead of opening the first result.
- The results page retains a search bar and can be refined without leaving the page.
- Selecting an internal hit opens the intended AbxHub entity.
- Back from a result selected on the search-results page restores that results page/query.
- Back from a hit selected from the home dropdown restores the home query and dropdown results.
- Bottom primary tabs remember their last root-page scroll position.
- Long pages expose a subtle Go-to-top button after scrolling.

## Organisms and spectrum

- Spectrum Explorer now includes an explicit symbol legend.
- Ten major organisms have current NAG antimicrobial quick-guide groups.
- Every organism page also derives links to antimicrobials discussed in its linked AbxHub disease/resistance pathways.
- Organism antimicrobial links are deliberately labelled as guideline/pathway references, **not isolate susceptibility**.

## Drug monographs

- Existing v0.19 pharmacology/safety coverage is retained for all 60 drug records: mechanism, adverse effects, precautions, contraindications and interactions.
- v0.20 adds source-specific regimen occurrences collected from disease and resistance records so a drug page can show how its dose/use changes by indication, severity, phenotype and source.
- NAG-linked drug records retain direct official NAG URLs where structured.
- Preparation, renal/RRT, paediatric and special-population layers remain source-labelled.

## CRAB / Acinetobacter MDR

CRAB has been materially expanded rather than presented as a short summary.

- HPUSM guidance distinguishes mild susceptible, mild non-susceptible and moderate–severe disease.
- The HPUSM section includes high-dose/extended-infusion ampicillin-sulbactam strategies and source-specific companion options.
- The dedicated sulbactam guide records Unasyn and cefoperazone/sulbactam formulation ratios, target sulbactam exposure across renal/RRT strata, 100-mL dilution, compatible listed diluents and four-hour infusion.
- High-dose sodium/hypernatraemia and cefoperazone/sulbactam coagulation/vitamin-K precautions are surfaced as source-specific cautions.
- MSIDC contributes complementary severity-stratified combination-therapy, polymyxin site-of-infection and cefiderocol considerations.

## NAG clinical depth

NAG remains a structured offline source with direct official links for freshness verification. v0.20 deepens practical pathways for H. pylori, cholangitis, cholecystitis, appendicitis, brain abscess, diabetic-foot infection, prostatitis, postpartum endometritis, influenza, rickettsial disease, tetanus and melioidosis.

The stored material is structured paraphrase/clinical data rather than wholesale reproduction of the NAG website. Regimen, dose, duration, alternatives, risk/severity context and important source notes are retained where applicable.

## Renal/RRT and patient dose

- Opening the CrCl calculator from a drug-specific renal/RRT page preserves the current antimicrobial.
- “Use in renal dose tool” returns with that antimicrobial already selected.
- Patient-dose context can optionally select an antimicrobial even when opened directly.
- Existing CRRT context safeguards remain: modality, actual effluent where relevant, downtime/interruption, residual renal function and TDM context are not collapsed into a generic CrCl equivalent.

## Compare / pregnancy / IV→PO

- Compare now supports up to five antimicrobials with Add/Remove controls.
- Pregnancy/lactation is now a searchable collapsible table instead of a single dropdown.
- IV→PO now includes an interactive 48–72-hour NAG-based eligibility screen, early-switch exclusion selector and 21-row collapsible conversion/step-down table with drug links where monographs exist.

## Prolonged infusion

The prolonged-infusion tool now keeps each beta-lactam separate and shows:

- loading dose;
- maintenance strategy;
- higher-exposure context where specified;
- MSIC Appendix C preparation/concentration information;
- four-hour administration;
- direct links to the drug monograph, renal/RRT tool and source.

## TDM

- Vancomycin adds a renal/RRT context selector and method selector.
- The app continues to refuse an unsupported single-trough AUC24/MIC calculation.
- Aminoglycosides add an EID/SDD exclusion screen and route excluded populations away from a generic extended-interval pathway.
- The tool remains a source-grounded workflow assistant, not a replacement for a validated local Bayesian platform/nomogram.

## AMS round

AMS round remains because it now supports a more actionable 48–72-hour workflow:

- syndrome/indication;
- antimicrobial and therapy day;
- microbiology summary;
- stewardship decision (continue, narrow, switch, stop, escalate/review);
- planned stop/review date;
- rationale/source-control note;
- expanded checklist for diagnosis, cultures, spectrum, source control, organ function/TDM, IV→PO, duration and toxicity/interactions.

Cards remain local-browser data only and should not contain patient identifiers.

## Removed from user-facing tools

- Culture Interpreter
- Teaching Cases

## Bundled PDFs

All five requested source PDFs remain bundled. Extraction-only APK binaries are not required in the public deployable package.

## Remaining deployment gate

Chromium in the build environment blocks navigation to local/loopback pages with `ERR_BLOCKED_BY_ADMINISTRATOR`, so a true browser install/offline/cache-upgrade test cannot be marked as passed here. No actual deployed GitHub Pages URL is stored in the package or publicly discoverable at build time.

After deployment, complete `DEPLOYMENT_VERIFICATION_v0.20.0.md` against the real HTTPS origin before changing the release status to deployment-verified.
