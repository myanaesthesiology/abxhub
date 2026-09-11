# AbxHub v1.0 release audit — status at v0.19.0

## Current release position

**v0.19.0 is the comprehensive source-reconciliation and data-quality release candidate.**

The core v1.0 scope is now defined as a source-grounded antimicrobial, microbiology and infectious-disease reference. Institution-specific layers that are not available to the project are **optional future integrations**, not blockers.

## Passed / structurally ready

- GitHub Pages/offline-first PWA architecture.
- Source-separated HPUSM, NAG, MSIC, MSIDC, Wellington and supplementary monograph layers.
- 60 drug records, 63 syndrome records, 26 organism records and 12 resistance pathways.
- 31 structured renal/RRT records.
- 63/63 disease mechanism and diagnostic-microbiology records.
- 26/26 organism microbiology/pathogenesis records.
- 41 exact NAG Appendix 4 pregnancy/lactation mappings; unlisted drugs are not inferred by class.
- 60 paediatric cross-check records with Blue Book/Frank Shann/current-NAG provenance kept separate.
- 38 standard preparation records and 39 MOH Dec 2025 fluid-restricted overlays.
- High-risk source guards for vancomycin, aminoglycosides, polymyxins, amphotericin formulations, prolonged beta-lactam infusion and CRRT/RRT.
- NAG remains searchable offline and every NAG result retains a live official-source freshness link.
- Internal IDs, cross-links, source IDs, bundled-PDF paths and PDF-page anchors pass automated validation.
- v0.6 GitHub regression guard retained: `navActive()` must exist.
- History API back navigation retained.
- GitHub Actions now validates clinical data, JavaScript syntax and static HTTP delivery before deployment.

## Not required for v1.0 core scope

The following can be added later if the data or institutional workflow becomes available:

- HPUSM/unit cumulative antibiogram.
- Institution-specific vancomycin Bayesian/AUC workflow.
- Institution-specific aminoglycoside nomogram/TDM workflow.
- Institution-specific CRRT default prescription conventions.
- Local stocked-product/Y-site compatibility catalogue.

Their absence must not appear as a user-facing "not configured" error or an incomplete-state banner.

## Remaining v1.0 gate

1. **Deployed browser/PWA smoke test** on the real GitHub Pages URL and at least one installed mobile PWA.
2. **Final high-risk source spot-check** against linked references for the highest-risk dose/TDM/RRT/preparation records.
3. **Publication/licensing decision** for copyrighted bundled PDFs before public redistribution where permission is required.

Once items 1–2 pass, the software/data can be tagged as the v1.0 core release candidate. Item 3 governs public distribution of bundled copyrighted references, not the internal data architecture.
