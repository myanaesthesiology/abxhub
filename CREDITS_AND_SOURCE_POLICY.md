# Sources, provenance and redistribution

ABX Critical is a structured clinical-reference interface. Recommendations remain attributable to their source; conflicting source rows are intentionally kept separate.

## Sources in this build

- **HPUSM ASP 2025** — bundled PDF: `references/HPUSM_ASP_2025.pdf`
- **MSIC Adult ICU 2023** — bundled PDF: `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`
- **MSIDC MDR Gram-Negative 2024** — bundled PDF: `references/MSIDC_MDR_Gram_Negatives_2024.pdf`
- **Malaysia NAG 4th Edition** — first-class structured source with official MOH live links for update verification.
- **NAG Antibiotic in Pregnancy & Lactation (Version 2, July 2024)** — bundled PDF: `references/NAG_Pregnancy_Lactation_2024.pdf`
- **Wellington ICU Antibiotic Summary** — bundled PDF: `references/Wellington_ICU_Antibiotic_Summary_2022.pdf`

## NAG integration model

NAG is not a link-only index. Structured NAG records participate in:

- universal search;
- clinical synthesis;
- syndrome/source comparison;
- drug indications;
- pregnancy/lactation and stewardship views;
- special-situation cross-reference.

Every NAG-derived result also retains **Check latest official NAG ↗** because MOH maintains NAG as a living online guideline. The structured snapshot must therefore be periodically reviewed against the official site.

## PDF provenance

Where a source has a bundled PDF, provenance buttons can open the local PDF and, when available, jump to the referenced PDF page. Official/source-site links are shown separately when available.

The PDFs are deliberately **not** part of the installation app-shell cache because they add substantial size. They are served from the GitHub repository and may be cached after first opening.

## Redistribution

The project owner requested that the supplied PDFs be included in the GitHub-ready build. Before publishing the repository publicly, verify redistribution permission for each source. If permission is uncertain, use a private repository or remove the PDFs from the public build while retaining provenance metadata.

The official NAG site states that its content is periodically updated and that redistribution requires permission; this build therefore uses concise structured records and live links rather than bundling a full offline copy of the NAG website.

## Clinical safety

Expected spectrum is not susceptibility. Local epidemiology, microbiology results, site of infection, source control, organ function, allergy history, drug interactions, TDM and clinician judgement remain necessary.
