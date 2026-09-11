# AbxHub extraction progress — v0.17.0

## 1. FUKKM / Blue Book
- All 60 drug records retain explicit formulary/source coverage status.
- Blue Book APK remains an offline snapshot; current MyFormulary/FUKKM remains the live freshness authority.

## 2. Injectable preparation / dilution
- National MOH standard preparation remains the baseline where structured.
- **MOH Dec 2025 fluid-restricted ICU overlay: 39 matching anti-infectives structured.**
- Liposomal amphotericin B is excluded from the lipid-complex MOH entry by formulation guard.

## 3. Organisms and diseases
- 26/26 organism records carry microbiology/pathogenesis fields.
- 63/63 syndrome records carry disease-mechanism/diagnostic-microbiology fields.

## 4. High-risk ICU reconciliation
- Vancomycin/TDM: source-level reconciliation completed; local workflow sign-off pending.
- Aminoglycosides: NAG exclusions/MSIC sampling structured; amikacin RRT added; gentamicin remains TDM/nomogram guarded.
- Polymyxins: separate PB vs CMS/colistin units/renal logic preserved.
- Prolonged beta-lactams: five-agent source matrix structured.
- Amphotericin: formulation separation enforced.

## 5. Paediatrics
- Blue Book and Frank Shann dose fields remain independent.
- Current source-presence statuses: BLUEBOOK-ONLY=1, DUAL-SOURCE=51, NO-DIRECT-MATCH=2, SHANN-ONLY=6.
- Seven current-NAG paediatric/neonatal syndrome records and population-specific high-yield drug cross-checks are now structured.
- Local paediatric/neonatal pharmacy/ID sign-off remains pending.

## 6. v1.0 gate
Coverage is now broad enough that the remaining work should focus on independent clinical/pharmacy validation, local antibiogram alignment and resolution of high-risk institutional workflows rather than adding unrelated features.

## v0.17.0
- Pregnancy/lactation: 60/60 entities checked against supplied NAG Appendix 4; 41 exact table mappings, 19 explicit exact-name/formulation gaps.
- Priority empirical reconciliation: 9 adult syndromes now carry source-difference cards.
- Current NAG freshness: January 2026 remains the official latest update at build review on 10 Sep 2026.

## v0.18 — extraction phase transitioned to validation phase

The principal next work is no longer bulk record growth. v0.18 adds explicit validation gates for local empirical susceptibility context, TDM, CRRT, high-risk neonatal/paediatric dosing and injectable-product compatibility. See `V1_RELEASE_AUDIT.md` for the remaining release blockers.
