# AbxHub sources, provenance and redistribution

AbxHub is a structured clinical-reference interface. Recommendations remain attributable to their source; conflicting source rows are intentionally kept separate.

## Sources in this build

- **HPUSM ASP 2025** — bundled PDF: `references/HPUSM_ASP_2025.pdf`
- **MSIC Adult ICU 2023** — bundled PDF: `references/MSIC_Adult_ICU_Antimicrobial_2023.pdf`
- **MSIDC MDR Gram-Negative 2024** — bundled PDF: `references/MSIDC_MDR_Gram_Negatives_2024.pdf`
- **Malaysia NAG 4th Edition** — first-class structured source with official MOH live links for update verification.
- **NAG Antibiotic in Pregnancy & Lactation (Version 2, July 2024)** — bundled PDF: `references/NAG_Pregnancy_Lactation_2024.pdf`
- **Wellington ICU Antibiotic Summary** — bundled PDF: `references/Wellington_ICU_Antibiotic_Summary_2022.pdf`

## NAG integration

NAG is not a link-only index. Structured NAG records participate in universal search, clinical synthesis, syndrome comparison, drug indications, pregnancy/lactation, stewardship and special-situation views.

Every NAG-derived result retains **Check latest official NAG ↗** because MOH maintains NAG as a periodically updated online guideline. The structured snapshot must be reviewed against the official site when NAG changes.

## PDF provenance

Where a source has a bundled PDF, provenance buttons can open the local PDF and, when available, jump to the referenced PDF page. Official/source-site links are shown separately when available.

Large PDFs are deliberately not pre-cached in the installation app shell. They may cache after first opening when the browser returns a complete response.

## Redistribution

The project owner requested inclusion of the supplied PDFs in the GitHub-ready build. Before publishing the repository publicly, verify redistribution permission for each source. If permission is uncertain, use a private repository or remove the affected PDF while retaining provenance metadata.

The official NAG site states that its content is periodically updated and that redistribution requires permission. AbxHub therefore stores concise structured clinical records and live source links rather than bundling a complete mirror of the NAG website.

## Clinical safety

Expected spectrum is not susceptibility. Local epidemiology, microbiology, infection-vs-colonisation assessment, infection site, source control, organ function, allergy, interactions, TDM and clinician judgement remain necessary.
