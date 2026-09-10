# AbxHub v0.18.0 validation notes

Build date: 10 Sep 2026

## Release checks

- `app.js` passes Node JavaScript syntax validation.
- `clinical-data.json`, `nag-topics.json`, `local-antibiogram.example.json` and `manifest.webmanifest` parse successfully.
- Database counts remain **60 drugs, 63 conditions/syndromes, 26 organisms, 12 resistance pathways and 31 renal/RRT records**.
- All structured source IDs resolve.
- All bundled reference PDFs resolve at their database paths.
- App-shell/service-worker assets are versioned to **v0.18.0**.
- Static HTTP checks returned **200** for the app shell, JavaScript, CSS, clinical JSON, NAG topic index, local-antibiogram template, manifest, service worker and bundled HPUSM PDF.

## Validation-focused safeguards added in v0.18

### Institutional empirical therapy
- HPUSM ASP 2025 remains the configured local **policy source**.
- No HPUSM/unit cumulative antibiogram has been supplied; local susceptibility percentages are therefore **outside the current v1.0 scope** and are not inferred.
- Empirical syndrome cards that are especially dependent on local epidemiology now show this status and link to the current NAG explanation of cumulative-antibiogram limitations.

### TDM
- Vancomycin displays the inputs required for a valid AUC/TDM workflow and retains NAG Bayesian/two-concentration source methods.
- AbxHub still refuses to estimate AUC from a single trough via an unsupported shortcut.
- Aminoglycosides are routed conceptually into EID/SDD, conventional, Gram-positive synergy, neonatal and renal/RRT pathways rather than a single generic nomogram.

### CRRT/RRT
- The renal tool now displays CRRT context fields for CVVH/CVVHD/CVVHDF: effluent rate, running/interrupted state and residual renal-function context.
- If CRRT is interrupted/stopped, the app does not present the CRRT maintenance regimen as if the circuit were still running.
- Vancomycin effluent-dependent MSIC examples are shown as source examples only and still require MIC/TDM context.

### Paediatric/neonatal
- Current NAG high-risk line-by-line audit completed for 11 agents: benzylpenicillin, ampicillin, cefotaxime, cefepime, meropenem, gentamicin, amikacin, metronidazole, piperacillin-tazobactam, cloxacillin and vancomycin.
- Frank Shann DrugDoses and Blue Book APK records remain parallel cross-checks rather than being averaged with NAG.

### Injectable preparation
- National MOH standard preparation and Dec 2025 fluid-restricted ICU preparation remain separate layers.
- Local stocked-product and Y-site/compatibility sign-off remains explicit rather than assumed.

## Runtime integrity

- The historical `navActive is not defined` startup defect remains fixed.
- Service-worker registration uses `sw.js?v=0.18.0` with `updateViaCache: none`.
- Old `abxhub-*` and `abx-critical-*` caches are removed during activation when they are not the current cache.

## Release status

**VALIDATION-GATED / PRE-v1.0.** The software and source architecture are suitable for continued review, but institutional ID/AMS/pharmacy/TDM sign-off remains the clinical release gate.

See `V1_RELEASE_AUDIT.md` and `PRE_V1_SIGNOFF.md`.

## Remaining blocking items

- Current HPUSM/unit cumulative antibiogram dataset, or a documented decision to publish without local susceptibility percentages.
- Local vancomycin Bayesian/two-level AUC workflow and aminoglycoside nomogram/TDM sign-off.
- Local CRRT prescription/effluent/downtime assumptions.
- Paediatric/Neonatal ID/pharmacy sign-off for high-risk records.
- Local injectable product/stability/Y-site compatibility sign-off.
- Named clinical reviewer approval of priority empirical/MDR pathways.
- Confirm redistribution permission before publishing bundled copyrighted guideline PDFs in a public repository.
