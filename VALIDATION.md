# AbxHub v0.10 validation notes

- GitHub Pages startup bug from v0.6 (`navActive is not defined`) remains fixed.
- Selected FUKKM formulary fields were manually verified against live MOH pages on 10 Sep 2026.
- Selected preparation/dilution fields are derived from the official JKN Sabah Injectable Drug Dilution Protocol, 1st Edition. These entries remain manufacturer/formulation-specific and must be checked against the locally stocked product and pharmacy policy.
- Frank Shann DrugDoses is linked as an external paediatric dose cross-check source; the book is not bundled or bulk-transcribed.
- New microbiology/pathogenesis text is educational context and does not override organism susceptibility, local epidemiology, NAG, HPUSM, MSIC or MSIDC treatment guidance.

# AbxHub validation status

## v0.9.0 critical fix
The v0.6/v0.8 startup path called `navActive()` but the function was absent, causing `navActive is not defined`. Because the call occurred inside `init()`'s try block, the app displayed a misleading **Unable to load clinical database** message even when the JSON fetch succeeded. v0.9.0 defines `navActive()` and updates the initialization error wording.

## New monograph fields
- Microbiology/pathogenesis summaries are educational background. Treatment decisions remain driven by NAG/local/MSIDC/MSIC source cards and susceptibility.
- Preparation/dilution is product-specific. AbxHub must not substitute for the locally stocked product insert, pharmacy compatibility database or institutional IV guide.
- MyFormulary is a live MOH source. Prescriber category/formulation may change and must be checked live.
- Frank Shann DrugDoses content is **not** present in this build because no licensed source copy was available.

# AbxHub v0.8 clinical validation status

## Completed for this build

- JSON/schema integrity check.
- Source provenance routing to bundled PDFs/live NAG links.
- History/back-navigation preservation.
- High-yield cross-check of extracted HPUSM, MSIC ICU, MSIDC MDR and structured NAG records used in this release.
- Renal/RRT records are only populated when a supplied source gives explicit information; missing/uncertain modality rows are labelled rather than inferred.
- NAG freshness checked against the official MOH site at build date.

## Required before v1.0 / institutional deployment

- Independent line-by-line review by an ID physician/intensivist and antimicrobial-stewardship pharmacist.
- Full chapter-by-chapter completeness review of NAG adult content.
- Verify every dose, unit, interval, infusion duration, renal threshold and RRT modality against the original source and local formulary.
- Align empirical pathways with the current HPUSM antibiogram/local susceptibility data.
- Validate TDM calculations/workflows against institutional laboratory sampling and pharmacy practice.
- Validate pregnancy/lactation content against current specialist/product information, noting that the supplied appendix uses legacy FDA categories.
- Decide which bundled PDFs have redistribution permission before a public GitHub release.

## Release principle

A record is not considered clinically final merely because it is present in the JSON database. Source provenance remains visible so reviewers can audit every recommendation.
