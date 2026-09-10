# AbxHub

Current build: **v0.15.0 / Clinical DB 2026.09.10-fluid39-highrisk15**

**AbxHub** is an offline-first antimicrobial clinical-reference PWA for intensivists, infectious-disease clinicians and trainees. It is designed for GitHub Pages and keeps source-specific recommendations visible rather than silently merging guidelines.

## v0.15.0 — fluid-restricted expansion + high-risk reconciliation

- Made the **MOH Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)** the primary standard preparation/dilution source.
- Structured national MOH preparation entries for **30 AbxHub injectable antimicrobial records**.
- Added the **MOH Dilution Guide for Fluid Restricted Critically Ill Adults (Dec 2025)** as a separate critical-care minimum-volume overlay, initially structured for **4 high-use drugs**: Ceftazidime, Gentamicin, Meropenem, Vancomycin.
- Kept the JKN Sabah dilution protocol only as an explicit fallback for **6** currently structured drugs not represented/migrated in the national Part I dataset.
- Kept product-label preparation sources for newer agents where the national 2020/2021 document does not contain the drug.
- Expanded drug-card preparation display to show **reconstitution, dilution, diluent, administration, stability, compatibility/incompatibility, comments and source provenance**.
- Universal search now indexes preparation/dilution content, so searches such as `vancomycin dilution`, `meropenem 4 hour infusion` or `gentamicin fluid restriction` can surface the drug directly.
- Official MOH PDF/source links are retained in each national preparation record. The Dec 2025 fluid-restricted guide remains a live MOH source rather than being bundled into the repository.

## Core capabilities

- Universal intelligent search across drugs, diseases/syndromes, organisms, resistance phenotypes, structured NAG content and drug preparation fields.
- Rule-based multi-term **Clinical synthesis**.
- Source-separated HPUSM, NAG, MSIC and MSIDC recommendations.
- Drug monographs with dosing, mechanism, safety, formulary fields, expected spectrum, renal/RRT, PK/PD, pregnancy/lactation, paediatric cross-check and preparation/dilution.
- Organism monographs with morphology, family/group, pathogenesis, resistance relevance and typical disease.
- Adult/ICU syndrome pathways across respiratory, CNS, urinary, bloodstream/device, GI/hepatobiliary, opportunistic, fungal, bone/joint, SSTI and tropical infections.
- MDR algorithms for ESBL, AmpC, CRE mechanisms, CRAB, MDR/DTR *Pseudomonas*, *Stenotrophomonas*, MRSA and MSSA.
- Cockcroft–Gault CrCl, BMI, IBW and AdjBW calculator.
- Renal/RRT dosing including HD/CVVH/CVVHD/CVVHDF where source data are available.
- Vancomycin/aminoglycoside TDM workspace.
- IV→PO stewardship, prolonged infusion, spectrum explorer, antimicrobial comparison, culture interpreter and local-only AMS round cards.
- Browser History API navigation: Back returns to the actual previous PWA view.
- Offline app shell + IndexedDB structured-data cache.

## Structured database size

- **60** drug / anti-infective records
- **56** disease / syndrome pathways
- **24** organism profiles
- **12** resistance mechanisms / phenotypes
- **29** detailed renal/RRT records
- **5** special-population/critical-care reference groups
- **2** TDM workspaces
- **63** official NAG live-topic links
- **30** national MOH standard injectable preparation monographs
- **4** current MOH fluid-restricted ICU dilution overlays

See `EXTRACTION_PROGRESS.md`, `DILUTION_VALIDATION.md`, `DOSE_VALIDATION.md` and `VALIDATION.md` for the road to v1.0.

## Dilution source model

AbxHub deliberately separates two MOH concepts:

1. **Standard preparation** — MOH national *Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)*, published December 2020 and placed on the MOH portal in April 2021.
2. **Fluid-restricted ICU option** — MOH *Dilution Guide for Fluid Restricted Critically Ill Adults*, current portal version dated December 2025. This is a minimum-volume strategy for selected critically ill adults, not a replacement for usual preparation instructions.

Both remain subordinate to the **current product insert for the locally stocked brand** and local pharmacy/institutional compatibility policy.

## Bundled source PDFs

The GitHub-ready build includes the PDF references supplied for the project:

- `references/HPUSM_ASP_2025.pdf`
- `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`
- `references/MSIDC_MDR_Gram_Negatives_2024.pdf`
- `references/Wellington_ICU_Antibiotic_Summary_2022.pdf`
- `references/NAG_Pregnancy_Lactation_2024.pdf`

The MOH national dilution source and the current Dec 2025 fluid-restricted guide are linked to their **official MOH source/PDF** rather than mirrored into this repository in this build.

## NAG freshness model

NAG remains a first-class structured source in AbxHub. Structured NAG records participate in search and clinical synthesis while every NAG result retains a live official MOH update link.

## GitHub Pages deployment

1. Create/open the `abxhub` repository.
2. Upload the **contents** of this folder to the repository root.
3. Commit to `main`.
4. In **Settings → Pages**, select **GitHub Actions**.
5. Let the included workflow deploy the PWA.
6. Hard-refresh once after deployment if upgrading from an old release; the service worker uses a versioned cache namespace.

### Local test

```bash
python -m http.server 8080
```

Open `http://localhost:8080`. Do not test by double-clicking `index.html`; service workers require HTTPS or localhost.

## Clinical governance

This remains a **pre-v1.0 review build**, not a final institutionally validated prescribing system. Independent ID/intensivist/pharmacist review is still required, particularly for high-risk drugs, TDM, renal replacement therapy, prolonged infusion, paediatrics and preparation compatibility.

## Privacy

No login or backend is required. Favourites and AMS round cards stay in the local browser. Do not enter patient identifiers.
