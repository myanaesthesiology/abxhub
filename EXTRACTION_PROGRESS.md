# AbxHub extraction progress — v0.14.0

## 1. FUKKM / Blue Book
- 60/60 drug records carry explicit formulary coverage status.
- 52/60 have direct parsed entries from the supplied Blue Book APK snapshot.
- 8/60 remain explicitly marked for live MyFormulary/FUKKM verification.

## 2. Injectable preparation / dilution
- **National MOH standard:** 30 AbxHub injectable antimicrobial records fully structured from Part I – Antimicrobial.
- **MOH fluid-restricted ICU overlay (Dec 2025):** 4 high-use drug overlays currently structured.
- **Sabah fallback:** 6 preparation records retained where national Part I has not yet replaced the record.
- **Other product source:** 2 preparation records retained for newer agents absent from the national Part I document.
- See `DILUTION_VALIDATION.md` for exact coverage.

## 3. Organisms
- 24/24 organism records have family/group, morphology, reservoir/transmission, pathogenesis, resistance relevance, typical diseases, clinical pearl and references.

## 4. Diseases
- 56/56 disease/syndrome records have disease-mechanism and diagnostic-microbiology layers.

## 5. Special populations / paediatrics
- Frank Shann DrugDoses v5.5 direct matches: 57/60.
- Drug pages cross-link relevant MSIC special-population principles where structured.

## 6. Source-by-source dose/preparation validation
- Structural provenance audit exists for all drugs.
- National standard dilution and ICU fluid-restricted dilution are now stored as separate records so they cannot be mistaken for equivalent preparation strategies.

## 7. Clinical review
- Pending. v1.0 should only be labelled clinically reviewed after high-risk dosing, TDM, RRT, paediatric and preparation records are independently checked by appropriate clinicians/pharmacists.
