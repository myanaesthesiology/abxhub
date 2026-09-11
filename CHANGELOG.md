# AbxHub changelog

## v0.20.0 — 11 Sep 2026

- Built v0.20 directly from the validated v0.19 source package while preserving all five bundled PDFs and source-governance safeguards.
- Added dedicated search-results routing, Back restoration, per-primary-tab scroll memory and Go-to-top behavior.
- Added first-class practical pathways to **63/63** condition records.
- Added syndrome/resistance-linked antimicrobial guides to **26/26** organism pages; ten major organisms retain dedicated current-NAG quick guides.
- Added practical management guides to **12/12** resistance/phenotype records, including AmpC, ESBL, CRE/CPE, non-CP CRE, NDM/MBL, KPC, OXA-48-like, MDR/DTR Pseudomonas, Stenotrophomonas, MRSA/MSSA and the existing deeper CRAB layer.
- Added curated regimen→drug monograph links and a regression guard against formulation-component false links.
- Deepened PJI from the bundled HPUSM source and surfaced the MSIC voriconazole renal/formulation dosing row in the invasive-fungal reference hub.
- Expanded compare (up to five agents), pregnancy/lactation table, IV→PO, prolonged infusion, TDM, patient-dose and AMS workflows; removed Culture Interpreter and Teaching Cases from the active tool set.
- Added expanded content and UI/static regression audits.
- Final expanded dataset validates **2,513 source-reference objects with 0 errors / 0 warnings**; JavaScript, JSON and 8/8 static core-asset checks pass.
- Service-worker/app-shell cache remains `abxhub-v0.20.0`; real deployed clean-install/offline/v0.19→v0.20 browser migration remains a post-deploy acceptance gate.

# Changelog

## v0.18.0 — 10 Sep 2026
- Shifted from database expansion to validation gates before v1.0.
- Separated HPUSM local empirical policy from the not-yet-configured local cumulative antibiogram; no susceptibility percentages are inferred.
- Added NAG cumulative-antibiogram limitation link and `data/local-antibiogram.example.json`.
- Added vancomycin and aminoglycoside TDM workflow validation requirements without adding an unvalidated AUC/nomogram calculator.
- Added CRRT context fields to the renal/RRT tool: effluent rate, running/interrupted state and residual renal function.
- Added effluent-aware vancomycin CRRT source examples as reference-only output.
- Completed a current-NAG high-risk neonatal/paediatric line-by-line audit for 11 agents.
- Added injectable preparation/compatibility local sign-off framework and formal v1.0 release-audit document.
- Updated service-worker/app-shell cache to v0.18.0.

## v0.18.0 — 10 Sep 2026
- Re-extracted NAG Appendix 4 pregnancy/lactation data across all current drug entities; 41 exact mappings, 19 exact-name/formulation gaps, no class-based inference.
- Removed unsupported cefazolin Appendix 4 mapping and corrected ampicillin/sulbactam to the direct source row.
- Added current-NAG indication-specific pregnancy context for selected drugs.
- Added source-reconciliation cards for nine priority adult empirical syndromes.
- Added the HPUSM febrile-neutropenia local piperacillin/tazobactam source card.
- Updated service-worker/app-shell version to v0.18.0.

# AbxHub changelog

## v0.16.0 — 10 Sep 2026

- Reconciled the offline NAG snapshot against the official January 2026 update status.
- Added seven dedicated paediatric/neonatal syndrome records: paediatric febrile neutropenia, paediatric bacterial meningitis, neonatal meningitis, neonatal NEC, neonatal early-onset sepsis, neonatal late-onset sepsis and paediatric pyelonephritis.
- Added current NAG population-specific dose cross-checks to high-yield drug monographs while preserving Frank Shann and Blue Book as separate sources.
- Added Group B Streptococcus and coagulase-negative staphylococci organism monographs.
- Expanded vancomycin/TDM with MSIC MIC/effluent-dependent CRRT examples and the current NAG paediatric framework.
- Added explicit RRT/effluent-rate, aminoglycoside population, polymyxin unit/product and amphotericin formulation guards.
- Updated search indexing so current NAG paediatric/neonatal dose fields participate in intelligent search.
- Updated service-worker/app-shell cache namespace to v0.16.0.

## v0.15.0 — 10 Sep 2026
- Expanded MOH Dec 2025 fluid-restricted dilution overlays to 39 matching anti-infectives.
- Added high-risk source reconciliation for TDM, aminoglycosides, polymyxins, amphotericin formulations, prolonged beta-lactam infusion, RRT/CRRT and paediatric cross-checks.
- Added data-driven prolonged-infusion tool and high-risk reconciliation cards on drug monographs.
- Updated service-worker/app-shell cache to v0.15.0.

## v0.14.0 — 10 Sep 2026
- Migrated standard injectable antimicrobial preparation to the national MOH *Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)*.
- Structured 30 national MOH preparation monographs with reconstitution, dilution, diluent, administration, stability/compatibility fields where supported and direct official PDF provenance.
- Added the Dec 2025 MOH *Dilution Guide for Fluid Restricted Critically Ill Adults* as a distinct ICU minimum-volume overlay; initial verified overlays: meropenem, vancomycin, ceftazidime and gentamicin.
- Reclassified Sabah preparation records as explicit fallback rather than the primary MOH source.
- Added `DILUTION_VALIDATION.md` and refreshed the source-dose audit.
- Drug search now indexes preparation/dilution fields.
- Source modal now distinguishes bundled PDFs from official remote PDFs.
- Updated service-worker/app-shell cache to v0.14.0.

## v0.13.0 — 10 Sep 2026
- Continued the systematic v1.0 extraction rather than adding isolated entries.
- Blue Book APK status is now explicit for all 60 antimicrobials: 52 direct snapshot matches and 8 explicit no-match/live-FUKKM checks.
- Frank Shann DrugDoses v5.5 APK remains integrated as a paediatric/critical-care cross-check: 57 direct antimicrobial matches, 3 explicit no-match records.
- Expanded detailed preparation/dilution summaries to every AbxHub antimicrobial identified in the official Sabah Injectable Drug Dilution Protocol 1st Edition (31 drug records), with page-level provenance and product-specific cautions.
- Added drug-level special-population cross-links for ARC, hypoalbuminaemia, obesity, ECMO and CNS infection when relevant to the structured source set.
- Added a source-dose/provenance audit for all drugs. This is a structural audit, not a claim that adult, paediatric, renal and syndrome-specific regimens are interchangeable.
- Added versioned app-shell URLs and `updateViaCache: none` service-worker registration to break the legacy v0.6 cache trap during GitHub Pages upgrades.
- Added `CLINICAL_REVIEW_QUEUE.md` with prioritized high-risk dose/TDM/RRT/preparation and paediatric review targets for the pre-v1.0 clinical sign-off phase.
- Clinical reconciliation/peer review remains pending before v1.0.

## v0.12.0 — 10 Sep 2026
- Integrated user-supplied Blue Book APK as an offline structured formulary/safety source, with live MyFormulary freshness check.
- Integrated Frank Shann DrugDoses v5.5 APK as an offline paediatric/critical-care dose cross-check source.
- Expanded intelligent search to mechanisms, adverse effects, contraindications, interactions, formulary text, disease mechanisms and organism pathogenesis.
- Completed organism morphology/resistance fields across the current organism set.
- Added disease-mechanism and diagnostic-microbiology sections across all current syndrome records.
- Added extraction hashes/source metadata and a source-by-source dose validation matrix.
- Maintained pre-v1.0 status pending human clinical/pharmacy/ID review and full injectable-dilution validation.

## v0.10.0 — 10 Sep 2026
- Retains the v0.9 `navActive()` GitHub Pages startup fix for the v0.6 database-load error.
- Expanded organism cards with morphology/key features and resistance relevance for high-yield ICU pathogens.
- Added/standardised disease-mechanism provenance with microbiology source buttons.
- Added structured MOH FUKKM/MyFormulary fields for selected high-use antimicrobials: prescriber category, listed indication, restriction and formulary dose.
- Added paediatric dose cross-check sections sourced to MOH FUKKM with an external Frank Shann DrugDoses source link.
- Added official JKN Sabah Injectable Drug Dilution Protocol as a preparation source.
- Added reconstitution/dilution/administration/compatibility cards for amikacin, cefepime, ceftazidime, ceftriaxone, gentamicin, meropenem, piperacillin–tazobactam and vancomycin.
- Every new monograph layer now exposes source provenance and live-source links.
- Updated service-worker cache namespace to `abxhub-v0.10.0`.

## v0.9.0 — 10 Sep 2026
- Fixed GitHub Pages startup failure: restored missing `navActive()` function.
- Added robust initialization wording so a runtime error is not mislabelled as a database-fetch failure.
- Added organism microbiology/pathogenesis cards with family/group, reservoir/transmission, host-damage mechanism, common diseases and clinical pearls.
- Added disease-level microbiology/mechanism cards with links to relevant organism profiles.
- Added drug pharmacology/safety sections: mechanism, important adverse effects, precautions, contraindications, interactions and source provenance.
- Added live MOH MyFormulary formulary/restriction links and structured prescriber categories where directly visible in the public formulary during this build.
- Added product-specific preparation/reconstitution/dilution sections for selected high-use IV antimicrobials using current DailyMed prescribing information.
- Added a Frank Shann DrugDoses source placeholder/schema; no content is reproduced until a licensed/source copy is supplied.
- Updated service-worker cache namespace to `abxhub-v0.9.0`.


## v0.8.0 — 2026-09-10

- Renamed the PWA to **AbxHub** and introduced a new hub/network Abx icon.
- Expanded to 60 drugs, 55 syndromes, 24 organisms, 12 resistance pathways and 29 renal/RRT records.
- Added mechanism-specific CRE pathways (KPC, NDM/MBL, OXA-48-like, non-carbapenemase CRE).
- Expanded DTR/MDR Pseudomonas and Stenotrophomonas guidance from MSIDC 2024.
- Added novel-agent renal records and additional MSIC ICU renal/RRT records.
- Added multiple NAG adult CNS, urinary, GI, opportunistic, obstetric, SSTI and tropical pathways.
- Added validation/extraction progress documents for the road to v1.0.
- Migrates legacy favourites/recent/theme storage from the previous ABX Critical build.
- Service-worker cache updated to `abxhub-v0.8.0`.

## v0.6.0 — 2026-09-09

- Kept Malaysia NAG as a first-class structured source with live MOH freshness links.
- Added NAG-backed PCP/PJP, CRBSI/CLABSI and complicated intra-abdominal source cards.
- Added spontaneous bacterial peritonitis and *Clostridioides difficile* pathways.
- Bundled all supplied PDF references under `/references/`.
- Source provenance now opens bundled PDFs and page anchors where available, while retaining official live links separately.
- Replaced directory/home-style back behavior with browser History API navigation and stored scroll restoration.
- Removed Standard/ICU mode switch; critical-care/ID detail is now the default interface.
- Updated service-worker cache to v0.6.0; large PDFs cache on demand rather than during installation.
