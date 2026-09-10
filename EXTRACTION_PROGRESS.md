# AbxHub extraction progress — v0.15.0

## 1. FUKKM / Blue Book
- All 60 drug records retain explicit formulary/source coverage status.
- Blue Book APK remains an offline snapshot; current MyFormulary/FUKKM remains the live freshness authority.

## 2. Injectable preparation / dilution
- National MOH standard preparation remains the baseline where structured.
- **MOH Dec 2025 fluid-restricted ICU overlay: 39 matching anti-infectives structured.**
- Liposomal amphotericin B is excluded from the lipid-complex MOH entry by formulation guard.

## 3. Organisms and diseases
- 24/24 organism records carry microbiology/pathogenesis fields.
- 56/56 syndrome records carry disease-mechanism/diagnostic-microbiology fields.

## 4. High-risk ICU reconciliation
- Vancomycin/TDM: source-level reconciliation completed; local workflow sign-off pending.
- Aminoglycosides: NAG exclusions/MSIC sampling structured; amikacin RRT added; gentamicin remains TDM/nomogram guarded.
- Polymyxins: separate PB vs CMS/colistin units/renal logic preserved.
- Prolonged beta-lactams: five-agent source matrix structured.
- Amphotericin: formulation separation enforced.

## 5. Paediatrics
- Blue Book and Frank Shann dose fields remain independent.
- Current source-presence statuses: BLUEBOOK-ONLY=1, DUAL-SOURCE=51, NO-DIRECT-MATCH=2, SHANN-ONLY=6.
- Clinical line-by-line paediatric/neonatal reconciliation remains pending.

## 6. v1.0 gate
Coverage is now broad enough that the remaining work should focus on independent clinical/pharmacy validation, local antibiogram alignment and resolution of high-risk institutional workflows rather than adding unrelated features.
