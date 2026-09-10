# Paediatric source validation — v0.16.0

Paediatric/critical-care dose text from the supplied Blue Book APK and Frank Shann DrugDoses APK remains as independent source records.

- Do not average or merge differing source doses.
- Preserve age, weight, gestational/post-menstrual age and maximum-dose qualifiers.
- Do not scale adult CRRT regimens automatically into children.
- Vancomycin and aminoglycosides require age/renal-function appropriate TDM where indicated.
- Source matching is not clinical sign-off; line-by-line paediatric pharmacy review remains pending before v1.0.

## Current NAG reconciliation added in v0.16

Dedicated structured records now cover paediatric febrile neutropenia, paediatric bacterial meningitis, neonatal meningitis, neonatal NEC, neonatal early-onset sepsis, neonatal late-onset sepsis and paediatric pyelonephritis. High-yield drug pages now display current NAG population-specific regimens separately from Frank Shann and Blue Book/FUKKM.

Current NAG neonatal interval logic is kept in the source record rather than simplified to an adult renal interval. The app explicitly prevents adult aminoglycoside EID/SDD assumptions from being presented as neonatal dosing.
