# AbxHub v0.18.0 — validation-gate release

This release deliberately adds **little new UI**. The focus is preventing unsupported clinical inference before v1.0.

## Changes

- Separates **HPUSM local empirical policy** from a **local cumulative antibiogram**. HPUSM ASP 2025 is configured; no local antibiogram has been supplied, so AbxHub displays no invented susceptibility percentages.
- Adds a local-antibiogram schema/template and a NAG link explaining limitations of cumulative antibiograms.
- Adds structured vancomycin and aminoglycoside **TDM workflow validation gates**; no unvalidated AUC/nomogram calculator was introduced.
- Adds CRRT context to the renal tool: modality, effluent rate, running/interrupted state and residual renal-function context.
- For vancomycin CRRT, effluent-dependent MSIC examples are shown as reference examples, not automatic prescriptions.
- Performs a line-by-line current-NAG audit for 11 high-risk paediatric/neonatal antimicrobials.
- Adds injectable preparation/compatibility sign-off tracking against locally stocked products.
- Adds `V1_RELEASE_AUDIT.md` with explicit blocking and non-blocking items.

## Why some features were intentionally omitted

- **No automatic local-antibiogram ranking** until an actual validated local dataset is supplied.
- **No single-trough vancomycin AUC calculator** because the source architecture supports Bayesian/two-level workflows rather than an unvalidated shortcut.
- **No generic CRRT dose engine** because modality/effluent/downtime and residual renal function matter and source coverage is not uniform across drugs.
- **No extra navigation tab** for validation; the relevant guards are placed in the existing syndrome, renal and TDM views to avoid UI bloat.
