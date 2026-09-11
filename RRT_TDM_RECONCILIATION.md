# RRT / TDM reconciliation — v0.16.0

## Core rule

**CRRT is not one dosing category.** AbxHub preserves modality, actual effluent prescription, residual renal function, rapidly changing renal function, MIC/site context and TDM as separate determinants. A fixed CRRT dose is shown only where the selected source supplies one.

## Vancomycin

- NAG: AUC is the efficacy exposure metric; Bayesian estimation is described as gold standard, with a two-concentration analytic alternative. TDM is indicated when therapy is expected to exceed 48 h.
- MSIC: provides ICU loading, HD/CRRT example maintenance regimens and sampling schedules. The CRRT example changes maintenance according to MIC and whether effluent is below or above 30 mL/kg/h.
- AbxHub does not calculate AUC from a single trough.

## Aminoglycosides

- NAG EID/SDD exclusions remain visible.
- MSIC timed sampling and adult RRT data remain source-specific.
- Neonatal NAG CGA/PNA schedules are a separate population layer.

## Polymyxins

- Colistin/CMS and polymyxin B are not interchangeable.
- Source unit conventions are preserved.
- Urinary-source distinction is surfaced because MDR guidance favours colistin/CMS over polymyxin B for UTI.

## β-lactams

- Source-specified loading/stat dose is separated from maintenance renal/RRT adjustment.
- Prolonged infusion is not interpreted independently of dose, renal support, infection site, MIC and product stability.
