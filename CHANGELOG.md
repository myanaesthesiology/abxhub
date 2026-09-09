# Changelog

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
