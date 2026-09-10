# AbxHub v1.0 release audit — status at v0.18.0

## Passed / structurally ready

- GitHub Pages / offline PWA architecture.
- Source-separated HPUSM, NAG, MSIC, MSIDC, Wellington and supplementary monograph layers.
- NAG live freshness links.
- Browser History API back navigation.
- Drug / syndrome / organism / resistance cross-linking.
- Source-provenance and bundled user-supplied PDF references.
- National MOH standard dilution + Dec 2025 fluid-restricted overlay architecture.
- TDM and CRRT safety guards that avoid unsupported calculation.
- Current-NAG high-risk neonatal/paediatric audit for 11 agents.

## Blocking items before a clinically validated v1.0

1. **Local susceptibility layer:** provide a current HPUSM/unit cumulative antibiogram, or explicitly choose to release v1.0 without local percentages and keep the current “not configured” guard.
2. **Vancomycin:** approve local Bayesian/two-level workflow, assay timing and pharmacy/ID ownership.
3. **Aminoglycosides:** approve local EID/conventional/synergy nomograms and redosing workflow.
4. **CRRT:** approve local modality/effluent/downtime/residual-function assumptions.
5. **Paediatric/neonatal:** paediatric/Neonatal ID/pharmacy review of high-risk dose records.
6. **Preparation:** pharmacy sign-off against locally stocked antimicrobial products and line-compatibility policy.
7. **Clinical content:** named ID/AMS/intensivist reviewer sign-off for the priority empirical and MDR pathways.

## Not required for v1.0

- user accounts/cloud sync;
- AI-generated prescribing;
- more visual complexity;
- exhaustive low-frequency organism expansion;
- an automatic vancomycin AUC engine.

Those features should not delay a safe reference-focused v1.0.
