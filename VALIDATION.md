# AbxHub v0.14.0 validation notes

## Runtime integrity
- The previous GitHub Pages `navActive is not defined` defect remains fixed.
- `navActive()` is declared before initialization.
- Versioned app-shell assets and a new service-worker cache namespace are used for this release.

## National MOH preparation migration
- **30** current AbxHub drug records now use `moh-dilution-standard` as their primary preparation source.
- The source is the Pharmaceutical Services Programme, MOH Malaysia *Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)*.
- The source states publication **December 2020**, MOH portal publication **14 April 2021**, and a stated review date **December 2025**.
- The source is explicitly brand/product dependent; the current product insert at the facility must still be checked.
- **4** records currently have a separate `fluidRestrictedPreparation` overlay sourced to the MOH **December 2025** critically ill adult fluid-restriction guide.
- The fluid-restricted overlay is never treated as the normal preparation method.
- **6** structured preparation records remain on the Sabah protocol as explicit legacy fallback; **2** newer-agent records use another source such as a product label.

## Current fluid-restricted overlays
- Ceftazidime
- Gentamicin
- Meropenem
- Vancomycin

## User-supplied APK sources
- Blue Book APK remains an offline formulary/safety snapshot; live MyFormulary/FUKKM remains the freshness authority.
- Frank Shann DrugDoses v5.5 APK remains a paediatric/critical-care cross-check.
- Raw APK binaries are not redistributed in the GitHub package.

## Microbiology and disease context
- 24/24 organism records carry family/group, morphology, reservoir/transmission, pathogenesis, resistance relevance, typical diseases and reference fields.
- 56/56 disease/syndrome records carry disease-mechanism and diagnostic-microbiology fields.

## Source-dose audit
- `DOSE_VALIDATION.md` remains a structural/provenance audit, not clinical sign-off.
- Preparation provenance has been refreshed to distinguish national MOH standard, MOH fluid-restricted overlay, Sabah fallback and other product-level sources.

## Automated checks for this build
- `app.js` JavaScript syntax.
- `sw.js` JavaScript syntax.
- `clinical-data.json`, `nag-topics.json` and `manifest.webmanifest` JSON parsing.
- Core HTTP asset availability smoke test through a local HTTP server.
- Headless-browser automation is not used as a release gate in this environment; JavaScript/JSON/static-route checks remain the automated validation here.

## Still required before v1.0
- Independent clinical/pharmacy validation of each reconstitution, dilution volume/concentration, administration rate, stability and incompatibility statement against the current locally stocked product.
- Full Dec 2025 fluid-restricted-guide extraction for all AbxHub drugs represented there, followed by critical-care pharmacy review.
- High-risk dose/TDM/RRT review, especially glycopeptides, aminoglycosides, polymyxins, amphotericin formulations and newer MDR agents.
- Current HPUSM antibiogram integration/validation for empirical pathways.
- Paediatric/neonatal dose reconciliation by indication and age/weight group.
