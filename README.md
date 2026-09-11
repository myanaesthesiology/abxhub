# AbxHub

Current build: **v0.20.0 / Clinical DB 2026.09.11-expanded-disease-organism-resistance-rc2**

**AbxHub** is an offline-first antimicrobial clinical-reference PWA for intensivists, infectious-disease clinicians and trainees. It is designed for GitHub Pages and deliberately preserves source-specific recommendations instead of silently merging different guidelines.

## v0.20.0 — clinical depth, search/navigation and stewardship tools

v0.20.0 is built directly on the validated v0.19.0 source-reconciliation baseline. The release keeps the same source-governance safeguards while making the stored guidance more usable without repeatedly leaving AbxHub.

Major changes:

- Search **Enter** now opens a dedicated results page instead of jumping to the first result.
- Back navigation restores either the dedicated results page or the original home search dropdown/query context.
- Bottom primary tabs remember their own scroll position; long pages have a subtle Go-to-top control.
- Spectrum Explorer now explains its symbols explicitly.
- All **26/26** organism pages now expose a structured syndrome/resistance-linked antimicrobial guide; ten major organisms additionally carry current structured NAG quick-guide groups. These are guideline links, **not isolate susceptibility claims**.
- Drug monographs now surface source-specific regimen occurrences from disease and resistance records, alongside the existing complete pharmacology/safety profile.
- All **12/12** resistance/phenotype records now have practical management pathways. CRAB retains its dedicated HPUSM/MSIDC sulbactam layer; AmpC, ESBL, CRE/CPE, non-CP CRE, NDM/MBL, KPC, OXA-48-like, MDR/DTR Pseudomonas, Stenotrophomonas, MRSA and MSSA now have site/severity, dosing, duration and source-linked management detail.
- All **63/63** disease/condition records now have a practical source-grounded assessment/regimen/duration/review layer above the original detailed source cards; previously deepened NAG pathways remain intact.
- Renal/RRT → CrCl → renal/RRT round-trip navigation preserves the selected antimicrobial.
- Compare supports up to five agents.
- Pregnancy/lactation is a collapsible searchable table.
- IV → PO is an interactive NAG-based 48–72 h screen with a collapsible conversion/step-down table.
- Prolonged-infusion beta-lactams show loading, maintenance, preparation and direct drug/renal links.
- TDM includes guided vancomycin and aminoglycoside routing while retaining the no-single-trough-AUC guard.
- Patient dose context now preserves the selected antimicrobial when handing off to renal dosing.
- AMS round cards now include a stewardship decision, review/stop date, rationale/source-control field and an expanded 48–72 h checklist.
- Culture Interpreter and Teaching Cases are removed from the user-facing tools.

## Current structured database

- **60** drug / anti-infective records
- **63** disease / syndrome pathways
- **26** organism profiles
- **12** resistance mechanisms / phenotypes
- **31** detailed renal/RRT records
- **2,513** source-reference objects in the expanded v0.20.0 release build
- **10** major organism records with current NAG antimicrobial quick-guide groups
- **21** structured NAG IV→PO conversion/step-down rows
- **41** NAG Appendix 4 pregnancy/lactation mappings
- **60/60** drug profiles with mechanism, adverse effects, precautions, contraindications and interactions
- **63/63** condition pathophysiology/mechanism records
- **63/63** condition diagnostic-microbiology records
- **26/26** organism microbiology/pathogenesis records
- **63/63** conditions with practical source-grounded pathways
- **26/26** organisms with syndrome/resistance-linked antimicrobial guides
- **12/12** resistance/phenotype records with practical management guides

## Source model

AbxHub keeps provenance explicit:

1. **HPUSM ASP 2025** — local source-specific treatment guidance.
2. **Malaysia NAG, 4th Edition** — structured national recommendations plus direct official MOH links for freshness checking.
3. **MSIC Adult ICU 2023** — ICU dosing, PK/PD, renal/RRT, TDM and special populations.
4. **MSIDC MDR Gram-Negative 2024** — dedicated MDR mechanism/phenotype guidance.
5. **Blue Book APK / live FUKKM** — formulary, indications, prescriber category, restrictions and drug safety fields.
6. **Frank Shann DrugDoses v5.5 APK** — paediatric/critical-care dosing cross-check.
7. **MOH injectable dilution sources** — standard preparation and the Dec 2025 fluid-restricted ICU overlay.
8. **Wellington ICU spectrum chart** — expected-spectrum reference only, never a substitute for isolate susceptibility.
9. **NCBI Medical Microbiology / explicit product-source records** — stable background pharmacology/microbiology or product-specific details where cited.

NAG remains searchable offline. NAG-derived records retain official MOH links because the online NAG is the freshness authority for future updates.

## High-risk source handling

AbxHub retains explicit no-extrapolation rules for vancomycin/AUC, aminoglycosides, polymyxins, amphotericin formulations, prolonged-infusion beta-lactams, CRRT/RRT and neonatal/paediatric dosing. Source-specific regimens can legitimately differ by population, site, severity, susceptibility and organ support; those differences are displayed rather than averaged.

No HPUSM cumulative susceptibility percentages are invented when an actual current local cumulative antibiogram has not been supplied.

## Bundled source PDFs

The requested source PDFs remain bundled:

- `references/HPUSM_ASP_2025.pdf`
- `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`
- `references/MSIDC_MDR_Gram_Negatives_2024.pdf`
- `references/Wellington_ICU_Antibiotic_Summary_2022.pdf`
- `references/NAG_Pregnancy_Lactation_2024.pdf`

The national MOH dilution guides remain linked to their official sources rather than duplicated.

**Publishing note:** inclusion in this development package does not itself establish redistribution permission. Confirm copyright/licensing requirements before making bundled copyrighted PDFs publicly downloadable.

## Validation status

The packaged v0.20.0 candidate passes:

- release validator: **0 errors · 0 warnings**;
- JavaScript syntax: **PASS**;
- JSON integrity: **PASS**;
- static HTTP smoke test: **8/8 core assets**;
- v0.20 feature regression: **PASS — 0 errors**;
- expanded UI/static regression audit: **PASS — 0 errors**.

A reliable Chromium real-browser test could not be executed in this environment: loopback navigation was blocked by policy and a later file-origin headless attempt hung before DOM capture. No deployed GitHub Pages URL is present in the project and none was publicly discoverable during the release build, so deployed installation/offline/update-over-old-cache testing remains an explicit post-deploy acceptance gate rather than being falsely marked as passed.

See `RELEASE_NOTES_v0.20.0.md`, `QA_RELEASE_REPORT_v0.20.0.md`, `HIGH_RISK_SOURCE_SPOTCHECK_v0.20.0.md`, `EXPANDED_CONTENT_AUDIT_v0.20.0.md` and `DEPLOYMENT_VERIFICATION_v0.20.0.md`.

## GitHub Pages deployment

1. Upload the **contents of this folder** to the repository root.
2. Commit to `main`.
3. In **Settings → Pages**, select **GitHub Actions** if that is the repository's configured workflow.
4. Deploy the exact packaged copy.
5. Complete `DEPLOYMENT_VERIFICATION_v0.20.0.md` against the actual HTTPS URL before calling the release deployment-verified.

### Local test

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. Service-worker testing requires HTTPS or localhost; opening `index.html` directly is not an equivalent PWA test.

## Privacy

No login or backend is required. Favourites and AMS round cards stay in local browser storage. Do not enter patient identifiers.
