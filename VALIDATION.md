# AbxHub v0.15.0 validation notes

## Runtime integrity
- The historical GitHub Pages `navActive is not defined` defect remains fixed.
- Versioned app-shell assets and cache namespace are updated to v0.15.0.

## MOH fluid-restricted dilution expansion
- **39** matching injectable anti-infective records now have a separate `fluidRestrictedPreparation` overlay from the MOH Dec 2025 critically ill adult guide.
- The overlay is never treated as normal dilution or as a dosing guideline.
- Liposomal amphotericin B is deliberately not mapped to the guide's amphotericin B lipid-complex entry.

## High-risk source reconciliation completed in this phase
- Vancomycin AUC/TDM principles and MSIC renal/RRT sampling schedules.
- Aminoglycoside EID/SDD exclusions, timed sampling, amikacin RRT and gentamicin TDM guard.
- Polymyxin B vs colistin/CMS dose-unit and renal distinction.
- Amphotericin formulation guard.
- Prolonged beta-lactam loading/maintenance framework.
- Selected MDR newer-agent safety cards.
- Paediatric Blue Book vs Frank Shann source-presence validation.

## Data counts
- Drugs: 60
- Conditions: 56
- Organisms: 24
- Resistance pathways: 12
- Renal/RRT records: 31
- Fluid-restricted preparation overlays: 39

## Automated checks required for release
- JavaScript syntax: `app.js`, `sw.js`.
- JSON parsing: `clinical-data.json`, `nag-topics.json`, `manifest.webmanifest`.
- Static HTTP availability of app shell/data/references.
- Headless Chromium page load and DOM check for startup/database errors.

## Still required before v1.0 clinical sign-off
- Local vancomycin Bayesian/AUC workflow validation.
- Local aminoglycoside nomogram/assay workflow.
- Local colistin/CMS unit convention and stock-product validation.
- CRRT effluent-rate/residual renal function assumptions.
- Local product stability/compatibility for prolonged infusions.
- Line-by-line paediatric/neonatal dose review.
- Current HPUSM antibiogram alignment for empirical therapy.
