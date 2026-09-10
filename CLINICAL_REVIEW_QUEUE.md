# AbxHub clinical review queue — pre-v1.0

This queue is intentionally conservative. It identifies records that should receive independent clinician/pharmacist review before AbxHub is labelled v1.0 clinically reviewed. It is **not** a list of errors.

## Priority 1 — high-risk dosing / narrow therapeutic index / rescue therapy

1. **Vancomycin** — loading dose, AUC/TDM targets, renal impairment, HD and CRRT workflows; verify local sampling and pharmacy model.
2. **Amikacin / Gentamicin** — once-daily versus conventional regimens, neonatal/paediatric intervals, TDM timing, AKI/RRT handling.
3. **Polymyxin B / Colistin** — unit conversion (mg vs IU/MU), loading/maintenance, renal adjustment distinction, HD/SLED/CRRT, toxicity and preparation.
4. **Cefiderocol** — specialist MDR indications, renal/ARC adjustments, infusion duration; no direct Blue Book or DrugDoses match in supplied APK snapshots.
5. **Ceftazidime–Avibactam + Aztreonam** — NDM/MBL pathway, simultaneous administration/compatibility, renal adjustment of both components.
6. **Tigecycline high-dose regimens** — site limitations, bacteraemia caveat, severe MDR indications and no direct Blue Book match in supplied snapshot.
7. **Amphotericin B formulations** — deoxycholate versus liposomal must never be conflated; formulation-specific dose, dilution and nephrotoxicity.
8. **Acyclovir** — encephalitis dose, obesity/weight basis, renal/CRRT adjustment and crystal-nephropathy prevention.

## Priority 2 — ICU PK/PD and renal/RRT reconciliation

- Meropenem, imipenem-cilastatin, cefepime, ceftazidime and piperacillin-tazobactam: loading dose, prolonged infusion, CNS/MDR higher-dose regimens, ARC and RRT modality.
- Ertapenem: critically ill/hypoalbuminaemia caveat and renal dosing.
- Fluconazole / voriconazole: loading dose, renal formulation issue for IV voriconazole, CRRT handling and TDM where relevant.
- Trimethoprim-sulfamethoxazole: TMP-component dosing, PCP versus Stenotrophomonas regimens, renal adjustment and electrolyte toxicity.

## Priority 3 — paediatric / neonatal cross-check

- Review all 57 direct DrugDoses v5.5 matches against indication-specific paediatric guidance where available.
- Explicitly review the three direct unmatched records: **cefiderocol, imipenem-cilastatin-relebactam, polymyxin B**.
- Neonatal aminoglycoside, vancomycin, acyclovir and beta-lactam intervals require gestational/postnatal-age context; do not reduce them to a single generic paediatric dose.

## Priority 4 — preparation / compatibility

- Review all 30 national-MOH standard injectable antimicrobial preparation records against the locally stocked product and institutional pharmacy policy.
- Expand and independently validate the Dec 2025 MOH fluid-restricted critically ill adult overlay beyond the current 4 structured high-use drugs.
- Retain Sabah/product-label entries only as explicit fallback where the national standard does not cover the agent.
- Highest-risk formulation/compatibility checks: amphotericin B deoxycholate, colistin, polymyxin B, vancomycin, pentamidine, caspofungin, phenytoin-like incompatibility analogies must not be inferred, and beta-lactam/aminoglycoside admixture should follow source-specific instructions.

## Priority 5 — empirical syndrome pathways

- Compare HPUSM local empirical pathways with the **current HPUSM antibiogram** before institutional deployment.
- HAP/VAP, septic shock, febrile neutropenia, meningitis, complicated intra-abdominal infection and urosepsis should receive priority because local ecology and severity materially affect empirical coverage.

## Priority 6 — pregnancy / lactation

- The supplied NAG appendix includes legacy FDA pregnancy categories. Preserve the source wording but add contemporary product/specialist verification before clinical sign-off.

## Review method

For each reviewed record:
1. Open the linked original source/PDF page.
2. Confirm drug, formulation, patient population, indication/site and severity.
3. Confirm loading dose, maintenance dose, route, interval, infusion duration and maximum dose.
4. Confirm renal threshold and RRT modality rather than extrapolating between HD/SLED/CVVH/CVVHD/CVVHDF.
5. Confirm paediatric/neonatal age or gestation basis where applicable.
6. Confirm preparation concentration, diluent, stability and compatibility against the stocked product.
7. Record reviewer initials/date and mark the JSON record `clinicalReview: REVIEWED` only after reconciliation.

The current release remains **pre-v1.0 / clinical review pending**.
