# AbxHub v0.13.0 validation notes

## Critical runtime fix retained
- The v0.6 GitHub Pages startup defect (`navActive is not defined`) remains fixed. `navActive()` is defined before `init()` and navigation rendering.
- Initialization errors now distinguish app/runtime initialization failure from a true clinical-database fetch failure.

## User-supplied APK sources
- **Blue Book APK:** parsed as an offline formulary/safety snapshot. 52/60 current AbxHub antimicrobial records have a direct match; the remaining 8 carry an explicit no-match status and live MyFormulary/FUKKM freshness link.
- **Frank Shann DrugDoses v5.5 APK:** parsed from its bundled XML database as a paediatric/critical-care cross-check. 57/60 current AbxHub antimicrobial records have a direct match; 3 are explicitly marked unmatched.
- The raw APK binaries are **not** redistributed in the GitHub package. `SOURCE_APK_METADATA.md` records the supplied filenames, SHA-256 hashes, embedded source structures and extraction provenance.
- Extracted fields are kept source-labelled. AbxHub does not silently reconcile a paediatric DrugDoses regimen with an adult, syndrome-specific, renal/RRT or local guideline regimen.

## Preparation / dilution
- 31 AbxHub antimicrobials were identified in the official JKN Sabah Injectable Drug Dilution Protocol, 1st Edition, and now carry page-level preparation-source provenance.
- Preparation data are formulation/product dependent. The locally stocked product insert, pharmacy compatibility reference and institutional IV policy take precedence.

## Microbiology and disease context
- 24/24 organism records carry family/group, morphology, reservoir/transmission, pathogenesis, resistance relevance, typical disease and reference fields.
- 56/56 disease/syndrome records carry disease-mechanism and diagnostic-microbiology fields.
- These educational summaries do not override local epidemiology, susceptibility results, infection-vs-colonisation assessment, source control or guideline-specific treatment recommendations.

## Special populations
- Drug pages cross-link source-supported altered-PK/special-population considerations including augmented renal clearance, hypoalbuminaemia, obesity, ECMO and CNS exposure where available in the structured source set.
- These are considerations rather than automatic dose changes.

## Source-dose audit
- A structural/provenance audit exists for all 60 drug records in `validation.sourceDoseAudit.records` and in `DOSE_VALIDATION.md`.
- The audit exposes AbxHub quick-dose source(s), Blue Book dose text where matched, DrugDoses v5.5 dose text where matched, renal/RRT source and preparation source.
- This is **not clinical reconciliation or sign-off**. Source doses may legitimately differ because of patient age, gestation, indication, severity, PK/PD target, organ function and RRT modality.

## Integrity checks completed for this build
- `app.js` JavaScript syntax check.
- `sw.js` JavaScript syntax check.
- `clinical-data.json`, `nag-topics.json` and `manifest.webmanifest` JSON parse checks.
- Bundled PDF paths and PWA core asset paths checked structurally.
- `navActive()` declaration precedes `init()`.

## Required before v1.0 / institutional clinical release
- Independent line-by-line clinical review by an ID physician/intensivist and antimicrobial-stewardship pharmacist.
- Verify every dose, unit, interval, loading dose, infusion duration, renal threshold and RRT modality against the original source.
- Reconcile apparent differences only when patient population/indication/severity are equivalent; otherwise preserve them as source-specific alternatives.
- Align empirical pathways with current HPUSM antibiogram/local susceptibility data.
- Validate TDM workflows against institutional sampling and pharmacy/laboratory practice.
- Validate pregnancy/lactation data against current specialist/product information; the supplied NAG appendix includes legacy FDA pregnancy categories.
- Decide which bundled PDFs and derived source material have redistribution permission before a public GitHub release.

## Release principle
Presence in the structured JSON does **not** mean a record is clinically final. Source provenance remains visible so every recommendation can be audited before v1.0 sign-off.
