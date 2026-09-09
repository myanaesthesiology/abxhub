# AbxHub extraction progress — v0.13.0

## 1. FUKKM / Blue Book
- 60/60 drug records now carry an explicit formulary coverage status.
- 52/60 have direct parsed entries from the user-supplied Blue Book APK snapshot.
- 8/60 have no suitable direct systemic entry in that snapshot and are explicitly marked for live MyFormulary/FUKKM verification.

## 2. Injectable preparation / dilution
- 31 AbxHub antimicrobials were identified in the official Sabah Injectable Drug Dilution Protocol 1st Edition.
- All 31 now have a structured preparation/dilution source record with protocol page provenance; drug pages retain the warning to verify the locally stocked product insert and pharmacy policy.

## 3. Organisms
- 24/24 organism records have family/group, morphology, reservoir/transmission, pathogenesis, resistance relevance, typical diseases, clinical pearl and references.

## 4. Diseases
- 56/56 disease/syndrome records have a disease-mechanism summary and diagnostic-microbiology layer.

## 5. Special populations / paediatrics
- Frank Shann DrugDoses v5.5 direct matches: 57/60.
- All drug records explicitly show matched/unmatched paediatric cross-check status.
- Drug pages now cross-link relevant MSIC special-population principles (ARC, hypoalbuminaemia, obesity, ECMO, CNS exposure).

## 6. Source-by-source dose validation
- Structural/provenance audit complete across all 60 drugs: quick-dose source, Blue Book dose text, DrugDoses text, renal/RRT source and preparation source are recorded side-by-side.
- This deliberately does **not** auto-reconcile adult vs paediatric vs syndrome-specific vs renal-adjusted doses. Those differences are flagged for clinical review.

## 7. Clinical review
- Pending. v1.0 should only be labelled clinically reviewed after the source audit and high-risk dosing/preparation records are independently checked by appropriate clinicians/pharmacists.
