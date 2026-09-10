# Paediatric & neonatal reconciliation — v0.16.0

AbxHub now separates three evidence layers rather than combining them into one paediatric dose:

1. **Current NAG 4th Edition** — indication/population-specific Malaysian national recommendations.
2. **Frank Shann DrugDoses v5.5 APK** — paediatric/critical-care cross-check supplied by the project owner.
3. **Blue Book/FUKKM APK snapshot** — formulary/dose field cross-check, with live MyFormulary verification for current restrictions.

## New dedicated NAG condition records

- Paediatric febrile neutropenia
- Paediatric bacterial meningitis
- Neonatal meningitis
- Neonatal necrotising enterocolitis
- Neonatal early-onset sepsis
- Neonatal late-onset sepsis
- Paediatric acute pyelonephritis

## Population guards

- Gestational age, postnatal age, corrected/postmenstrual age and current renal function can change neonatal dose intervals.
- Adult aminoglycoside EID/SDD nomograms are not substituted for neonatal NAG schedules.
- Ceftriaxone and cefotaxime are kept distinct in young infants where the NAG source gives age-specific considerations.
- Paediatric CNS doses are not re-used as routine systemic doses.
- Every NAG-derived paediatric card links to the live official NAG page.
