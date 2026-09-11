# AbxHub v0.20.0 QA release report

**Date:** 11 September 2026  
**Target:** GitHub Pages PWA

## Automated validation

| Check | Result |
|---|---|
| Entity counts | PASS — 60 drugs / 63 conditions / 26 organisms / 12 resistance |
| Source-reference objects | 2,513 |
| Release validator | PASS — 0 errors / 0 warnings |
| v0.20 feature regression validator | PASS — 0 errors |
| Expanded UI/static regression audit | PASS — 0 errors |
| JavaScript syntax (`node --check`) | PASS |
| JSON integrity | PASS |
| Static HTTP smoke test | PASS — 8/8 core assets |
| Required bundled PDFs | PASS — 5/5 |

## Clinical-content coverage relevant to v0.20

- All 60 drug records retain mechanism, adverse-effect, precaution, contraindication and interaction fields.
- 60 conditions contain structured NAG recommendations; non-NAG conditions retain their other source-specific guidance.
- Every structured NAG recommendation has a direct official NAG URL.
- Every drug with a top-level NAG reference has at least one direct official NAG URL.
- Ten major organism records retain dedicated NAG quick-guide groups; **26/26** organism pages now have a structured syndrome/resistance-linked antimicrobial guide with curated drug-monograph links.
- **63/63** disease/condition records now have a practical source-grounded pathway with assessment, diagnostics, regimen map, duration/review and 48–72-hour stewardship review.
- **12/12** resistance/phenotype records now have a practical management guide with site/severity strategy, curated drug links, dosing/administration highlights, duration principle and source provenance.
- NAG IV→PO contains 21 structured conversion/step-down rows.
- CRAB includes four expanded source cards plus a dedicated HPUSM sulbactam renal/preparation guide.
- AmpC, ESBL, CRE/CPE, non-CP CRE, NDM/MBL, KPC, OXA-48-like, MDR/DTR Pseudomonas, Stenotrophomonas, MRSA and MSSA now have first-class practical resistance-management guides.
- PJI and the invasive-fungal/voriconazole reference hub received additional bundled-source depth corrections.

## Manual high-risk source review

See `HIGH_RISK_SOURCE_SPOTCHECK_v0.20.0.md`.

Result for the specified high-risk spot-check set: **PASS**.

## Browser/PWA test

**Not passed / not failed — blocked by the execution environment.**

Chromium could not provide a usable real-browser test in this execution environment: loopback attempts were blocked by policy and a later file-origin headless attempt hung before DOM capture. The actual GitHub Pages URL is not stored in the source package and was not publicly discoverable during the build. Therefore clean install, offline restart and v0.19→v0.20 service-worker migration remain explicit post-deploy acceptance checks.

## Release status

**v0.20.0 release candidate: static + clinical source spot-check validation PASS.**  
**Deployment/browser PWA verification: PENDING.**
