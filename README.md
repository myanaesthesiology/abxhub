# AbxHub

Current build: **v0.8.0 / Clinical DB 2026.09.10-expanded8**

**AbxHub** is an offline-first antimicrobial clinical-reference PWA for intensivists, infectious-disease clinicians and trainees. It is designed for GitHub Pages and keeps source-specific recommendations visible rather than silently merging guidelines.

## What changed in v0.8.0

- Renamed the PWA from **ABX Critical** to **AbxHub**.
- Added a new AbxHub hub/network icon in 192 px, 512 px and SVG formats.
- Expanded the structured database to **60 antimicrobial/anti-infective drug records, 56 disease/syndrome pathways, 24 organism profiles, 12 resistance pathways and 29 renal/RRT records**.
- Expanded MDR content with mechanism-specific **KPC, NDM/MBL, OXA-48-like and non-carbapenemase CRE** pathways.
- Expanded DTR/MDR *Pseudomonas* and *Stenotrophomonas* source cards from the supplied MSIDC 2024 guideline.
- Added novel/MDR agent renal records including ceftazidime-avibactam, aztreonam, cefiderocol, polymyxin B, colistin and imipenem-cilastatin-relebactam where the supplied source provides structured dosing.
- Added NAG-derived adult pathways for CNS infection, urinary/prostatic infection, intra-abdominal infection, opportunistic infection, obstetrics, diabetic-foot disease, bite wounds and tropical infections.
- Added anti-infective monographs for antivirals, antifungals, antimalarials and selected opportunistic-infection agents used by the included source set.
- Preserved first-class NAG integration: NAG participates in search and synthesis, and every NAG result keeps **Check latest official NAG ↗**.
- Migrates old favourites/recent/theme values from the previous `abx-*` local-storage keys when present.

## Core capabilities

- Universal intelligent search across drugs, diseases/syndromes, organisms, resistance phenotypes and structured NAG records.
- Rule-based multi-term **Clinical synthesis**.
- Source-separated HPUSM, NAG, MSIC and MSIDC recommendations.
- Drug monographs with dosing, expected spectrum, renal/RRT links, PK/PD, pregnancy/lactation, indications and provenance.
- Adult/ICU syndrome pathways across respiratory, CNS, urinary, bloodstream/device, GI/hepatobiliary, opportunistic, fungal, bone/joint, SSTI and tropical infections.
- MDR algorithms for ESBL, AmpC, CRE mechanisms, CRAB, MDR/DTR *Pseudomonas*, *Stenotrophomonas*, MRSA and MSSA.
- Cockcroft-Gault CrCl, BMI, IBW and AdjBW calculator.
- Renal/RRT dosing reference including HD/CVVH/CVVHD/CVVHDF when source data is available.
- Vancomycin/aminoglycoside TDM workspace.
- Pregnancy/lactation cross-reference.
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
- **63** official NAG live-topic links in the freshness/navigation index

See `EXTRACTION_PROGRESS.md` and `VALIDATION.md` for the road to v1.0.

## Bundled source PDFs

The GitHub-ready build includes all supplied PDF references:

- `references/HPUSM_ASP_2025.pdf`
- `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`
- `references/MSIDC_MDR_Gram_Negatives_2024.pdf`
- `references/Wellington_ICU_Antibiotic_Summary_2022.pdf`
- `references/NAG_Pregnancy_Lactation_2024.pdf`

Where a structured record cites one of these PDF sources, the source button opens the bundled PDF and uses a page anchor when `pdfPage` is available.

NAG is a living online guideline rather than a single full PDF. AbxHub stores a structured offline snapshot for intelligent search while retaining the official NAG link for freshness verification.

## Source hierarchy

1. **HPUSM ASP 2025** — local guidance where applicable.
2. **Malaysia NAG** — structured national snapshot + live update check.
3. **MSIC Adult ICU 2023** — ICU dosing, PK/PD, RRT, TDM and special populations.
4. **MSIDC MDR Gram-Negative 2024** — dedicated MDR mechanism/phenotype guidance.
5. **Wellington ICU spectrum chart** — expected-spectrum reference only.

Dedicated guidance may outrank the generic hierarchy in its own domain; for example, MSIDC is prioritised for detailed MDR Gram-negative phenotypes.

## NAG freshness model

The structured NAG snapshot was reviewed on **10 September 2026**. The official MOH site still identified **January 2026** as the latest update at this build.

Update workflow:

1. Check the official **What's New** page.
2. Clinically review any changed topic.
3. Update only the affected structured JSON record(s).
4. Increment the clinical DB version and service-worker cache.
5. Publish a new GitHub release.

AbxHub never automatically overwrites a clinical recommendation merely because the website changed.

## GitHub Pages deployment

1. Create a repository, e.g. `abxhub`.
2. Upload the **contents** of this folder to the repository root.
3. Commit to `main`.
4. Open **Settings → Pages** and select **GitHub Actions**.
5. The included workflow deploys the PWA.
6. Open `https://YOUR-USERNAME.github.io/abxhub/`.
7. Install AbxHub from the browser/PWA install control.

### Local test

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Do not test by double-clicking `index.html`; service workers require HTTPS or localhost.

## Clinical governance and source permissions

This is an **expanded review build**, not a final institutionally validated prescribing system. Independent clinician/pharmacist validation is required before clinical deployment.

The supplied PDFs are included because this project was explicitly configured to keep source documents beside the structured database. Before placing the repository in a **public** GitHub repository, verify permission to redistribute every PDF and derived source content. A private repository or institutionally approved distribution is safer where rights are uncertain.

## Privacy

No login or backend is required. Favourites and AMS round cards stay in the local browser. Do not enter patient identifiers.


## v0.13.0 additions
Organism microbiology/pathogenesis, drug mechanism/safety/formulary fields, and selected IV preparation/dilution monographs were added with explicit source provenance. GitHub startup bug `navActive is not defined` is fixed.


## v0.10 monograph expansion
Selected high-use drug cards now include MOH FUKKM/MyFormulary formulary metadata, paediatric cross-checks and JKN Sabah Injectable Drug Dilution Protocol preparation data, each with explicit source provenance.


## v0.13 source expansion
The supplied Blue Book APK and Frank Shann DrugDoses v5.5 APK are now parsed into structured offline fields. Source binaries are not redistributed in the GitHub package; `SOURCE_APK_METADATA.md` records hashes and extraction provenance. See `DOSE_VALIDATION.md` for current source coverage and outstanding review.


## v0.13 systematic extraction
This release adds full source-coverage status for the supplied Blue Book and DrugDoses APKs, preparation/dilution records for every AbxHub antimicrobial identified in the Sabah injectable protocol, special-population cross-links, and a structural source-dose audit. Clinical sign-off remains pending before v1.0.


## Pre-v1.0 clinical review queue
See `CLINICAL_REVIEW_QUEUE.md` for the prioritized independent review list before clinical sign-off.
