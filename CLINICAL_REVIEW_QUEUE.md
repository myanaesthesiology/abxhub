# AbxHub clinical review queue — v0.20.0

**Review date:** 11 September 2026

The broad v0.20 disease/organism/resistance expansion is complete for the currently bundled/source-structured scope. Remaining items are release/deployment gates or optional future institutional layers.

## Completed in the current v0.20 build

- [x] High-risk vancomycin AUC/TDM, HD and CRRT source spot-check.
- [x] Aminoglycoside EID/conventional/population/RRT safety spot-check.
- [x] Colistin/CMS versus polymyxin-B distinction.
- [x] Amphotericin formulation separation.
- [x] Beta-lactam prolonged-infusion loading/maintenance/preparation checks.
- [x] CRAB high-dose sulbactam, renal/RRT, preparation and combination-strategy depth.
- [x] AmpC practical management layer.
- [x] ESBL practical management layer.
- [x] CRE/CPE + non-CP CRE + NDM/MBL + KPC + OXA-48-like management layers.
- [x] MDR/DTR Pseudomonas practical management layer.
- [x] Stenotrophomonas practical management layer.
- [x] MRSA/MSSA phenotype management layer.
- [x] Practical pathway layer for all 63 disease/condition records.
- [x] Syndrome/resistance-linked antimicrobial guide for all 26 organism pages.
- [x] PJI and voriconazole/invasive-fungal reference depth corrections.
- [x] Universal search-results/Back behavior implemented and statically regression-tested.
- [x] Per-primary-tab scroll memory and Go-to-top control.
- [x] Spectrum legend, five-drug comparison, collapsible pregnancy/lactation, interactive IV→PO, improved TDM, prolonged-infusion, patient-dose and AMS tools.
- [x] Culture Interpreter and Teaching Cases removed from the active tool set.
- [x] Bundled PDFs retained.

## Remaining release gate

- [ ] Deploy the exact final v0.20 package to its GitHub Pages HTTPS origin.
- [ ] Run real-browser clean-install PWA test.
- [ ] Run offline close/reopen test.
- [ ] Upgrade an existing v0.19 cached/installed PWA to v0.20 and confirm old cache removal/new shell control.
- [ ] Execute the search/Back, organism→drug, resistance→drug, CrCl→renal and primary-tab-scroll matrix on the deployed origin.

Local static validation is not being substituted for these real-browser deployment checks because Chromium in the build environment cannot provide a reliable local execution path.

## Optional future institutional layers — not release blockers

- HPUSM cumulative antibiogram once a current verified dataset is supplied.
- HPUSM-specific TDM/Bayesian platform or validated aminoglycoside nomogram if adopted locally.
- Hospital-specific CRRT default prescriptions/effluent conventions.
- Stocked-product/Y-site compatibility catalogue.
- Automated source-freshness/review reminders for online NAG updates.
