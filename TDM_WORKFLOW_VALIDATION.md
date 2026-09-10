# AbxHub TDM workflow validation — v0.18.0

## Vancomycin

**Source status:** validated to current NAG Appendix 1 plus MSIC ICU 2023.

AbxHub preserves the following workflow principles:

- AUC24/MIC is the efficacy exposure metric in NAG.
- NAG describes Bayesian AUC estimation as the preferred/gold-standard approach and a two-concentration analytic method as an alternative.
- TDM is indicated when therapy is expected to continue beyond 48 hours; monitoring should be more frequent when pharmacokinetics are unstable.
- MSIC contributes ICU loading, renal/RRT examples and source-specific sampling schedules.
- AbxHub does **not** estimate AUC from one trough using an unvalidated shortcut.

**Still required locally before v1.0:** Bayesian platform/software, assay units/turnaround, exact local sampling workflow, pharmacy/ID ownership, documentation target and escalation process.

Current NAG source:
https://sites.google.com/moh.gov.my/nag/appendices/appendix-1-clinical-pharmacokinetic-guide-aminoglycoside-vancomycin

## Aminoglycosides

AbxHub now routes TDM by indication/population rather than treating every regimen as one nomogram:

- adult extended-interval/single-daily treatment;
- conventional dosing;
- Gram-positive synergy dosing;
- neonatal CGA/PNA-based regimens;
- renal impairment / dialysis / CRRT.

NAG-listed exclusions from routine EID/SDD remain visible. Local nomogram/PK-service sign-off is still required before AbxHub should calculate or recommend redosing intervals.
