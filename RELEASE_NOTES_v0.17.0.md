# AbxHub v0.17.0 — 10 Sep 2026

## Main changes
- Re-extracted the complete supplied NAG Appendix 4 pregnancy/lactation table against all 60 current AbxHub anti-infective entities.
- Increased exact Appendix 4 mappings to **41 drugs** and explicitly marked **19 unlisted exact-name/formulation entities** instead of inferring class safety.
- Removed an unsupported cefazolin pregnancy mapping found during the audit.
- Added current live-NAG indication-specific pregnancy overlays where explicitly stated.
- Added explicit source-reconciliation cards for **9 high-impact adult empirical syndromes**.
- Added the HPUSM local neutropenic piperacillin/tazobactam entry alongside the current NAG febrile-neutropenia framework.
- Updated the PWA to display source reconciliation and current-NAG pregnancy context without changing the underlying source-specific recommendation model.
- Updated asset/service-worker namespace to v0.17.0.

## v1.0 status
Still pre-v1.0. Source reconciliation is increasingly mature, but local ID/AMS/pharmacy/TDM review remains the clinical release gate.
