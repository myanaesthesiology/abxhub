# AbxHub v0.19 source reconciliation

## Objective

Reconcile the existing structured database without adding new clinical modules. Recommendations from different sources remain **parallel source-specific records** unless the source itself explicitly supports a combined rule.

## Source roles

- **HPUSM ASP 2025:** local treatment-policy source.
- **NAG 4th Edition:** national syndrome/drug/special-population recommendations; always paired with a live official freshness link.
- **MSIC 2023:** adult ICU dosing, PK/PD, renal/RRT, TDM, obesity, hypoalbuminaemia and prolonged infusion.
- **MSIDC 2024:** dedicated MDR Gram-negative phenotype/mechanism algorithms.
- **Blue Book APK / FUKKM:** formulary, restrictions, drug safety and dosing fields.
- **Frank Shann DrugDoses APK:** paediatric/critical-care dose cross-check.
- **MOH injectable dilution sources:** standard preparation and Dec 2025 fluid-restricted overlays.
- **Wellington ICU chart:** expected-spectrum teaching/reference layer only.

## Reconciliation rules applied

1. Do not average conflicting doses.
2. Do not convert a source-specific regimen into a universal recommendation.
3. Keep syndrome dose, renal/RRT dose, paediatric dose and preparation instructions as distinct concepts.
4. Preserve population and phenotype qualifiers.
5. Keep NAG structured offline, but retain `Check latest official NAG ↗` on NAG-derived output.
6. Keep exact PDF/source provenance where available.
7. Do not infer pregnancy categories for agents absent from the supplied NAG Appendix 4.
8. Do not invent institutional antibiogram/TDM/CRRT values.

## v0.19 reconciliation result

Automated audit currently reports 60 drugs, 63 conditions, 26 organisms, 12 resistance pathways and 1,673 structured source-reference objects with no duplicate IDs, broken internal links, unknown source IDs or invalid bundled-PDF page anchors.

The remaining work before v1.0 is final high-risk source spot-checking and real deployed-PWA runtime testing.
