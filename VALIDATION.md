# AbxHub v0.20.0 validation

Build date: **11 Sep 2026**

## Automated release result

- Entities: **60 drugs · 63 conditions · 26 organisms · 12 resistance pathways**
- Source-reference objects: **1,721**
- `scripts/validate_release.py`: **0 errors · 0 warnings**
- `node --check app.js`: **PASS**
- JSON parse/integrity: **PASS**
- `scripts/smoke_static.py`: **PASS — 8/8 core assets**
- Required bundled PDFs: **5/5 present**

## v0.20 regression gates

The v0.20 feature validator checks for:

- dedicated search-results route and Back restoration architecture;
- restored home search/dropdown context;
- tab-scroll persistence and Go-to-top control;
- organism quick-guide/pathway antimicrobial links;
- CRAB detailed source cards and sulbactam renal/preparation table;
- five-drug comparison support;
- collapsible pregnancy/lactation table;
- interactive IV→PO screen and 21 conversion/step-down rows;
- current-drug preservation across CrCl and renal/RRT tools;
- expanded prolonged-infusion, TDM and AMS workflows;
- removal of Culture Interpreter and Teaching Cases from the active tool map;
- v0.20 manifest, assets and service-worker cache namespace.

## High-risk source checks

Manual source spot-checking is recorded in `HIGH_RISK_SOURCE_SPOTCHECK_v0.20.0.md`. The release specifically checks CRAB/sulbactam, prolonged-infusion beta-lactams, vancomycin AUC/TDM, aminoglycoside routing, CRRT context and formulation-sensitive high-risk drugs.

## Browser/PWA limitation

A real Chromium test against the local build was attempted through both loopback and the container network address. Chromium returned `ERR_BLOCKED_BY_ADMINISTRATOR` before navigation. This is an environment restriction, not a passed browser test.

The project contains no actual deployed GitHub Pages URL, and a public search did not identify one. Therefore the following remain **PENDING on the deployed HTTPS origin**:

- install/Add-to-Home-Screen behavior;
- offline restart;
- History/Back regression in a real installed PWA;
- service-worker migration from an older cached AbxHub release.

Use `DEPLOYMENT_VERIFICATION_v0.20.0.md` after deployment.
