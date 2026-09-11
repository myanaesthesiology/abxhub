# AbxHub clinical JSON schema — v0.19 overview

`clinical-data.json` is deliberately source-aware. Different guidelines are not silently merged into a synthetic prescription.

## Core top-level objects

- `meta` — app/database version, scope and disclaimer.
- `sources` — source metadata and bundled/live reference paths.
- `drugs[]` — drug/anti-infective monographs.
- `conditions[]` — syndrome/disease pathways with source-separated recommendations.
- `organisms[]` — organism profiles and linked phenotypes/syndromes.
- `resistance[]` — resistance mechanism/phenotype cards.
- `renal{}` — drug-keyed renal/RRT records.
- `specialPopulations{}` — obesity, hypoalbuminaemia, ARC, CNS and other cross-cutting ICU contexts.
- `tdm{}` — source-specific vancomycin/aminoglycoside TDM guidance.
- `infusionStrategies` — prolonged beta-lactam loading/maintenance matrix.
- `highRiskRRT` / `rrtValidation` — RRT/CRRT source rules and no-extrapolation guards.
- `paediatricValidation` — Blue Book/Frank Shann/NAG provenance cross-checks; no dose averaging.
- `ivpo` — IV→PO stewardship criteria.
- `nagSnapshot` — NAG structured snapshot/freshness metadata.
- `bundledReferences[]` — source PDF library.
- `validation` — current release validation state.
- `dataQualityAudit` — machine-readable v0.19 structural/provenance audit result.

## Source reference

A source-linked record uses the following shape where applicable:

```json
{
  "source": "msic",
  "page": 139,
  "pdfPage": 149,
  "url": "optional live URL",
  "pdfUrl": "optional direct/bundled PDF override"
}
```

`page` is the source's printed/logical page. `pdfPage` is the physical PDF page used for deep-linking. v0.19 canonicalises bundled PDF page mappings explicitly.

## Renal/RRT record

```json
{
  "normal": "...",
  "high": "optional high-exposure context",
  "bins": [{"min": 31, "max": 50, "text": "..."}],
  "rrt": {"HD": "...", "CVVH": "...", "CVVHD": "...", "CVVHDF": "..."},
  "source": "msic",
  "page": 139,
  "pdfPage": 149,
  "note": "optional caveat"
}
```

Absent RRT data must never be filled by interpolation.

## Standard and fluid-restricted preparation

`drug.clinicalProfile.preparation` is the standard preparation record. `drug.clinicalProfile.fluidRestrictedPreparation` is a separate ICU minimum-volume overlay with the same field shape:

```json
{
  "reconstitution": "...",
  "dilution": "...",
  "diluent": "...",
  "administration": "...",
  "stability": "...",
  "compatibility": "...",
  "comments": "...",
  "sourceStatus": "...",
  "ref": {"source": "moh-dilution-fluid", "page": 129, "pdfPage": 129, "pdfUrl": "https://..."}
}
```

The two preparation records must never be merged. The fluid-restricted record is a minimum-volume strategy, not a dose-selection rule.

## High-risk reconciliation

Selected drug profiles can contain `clinicalProfile.clinicalReconciliation[]` and the database contains global high-risk RRT/TDM objects. `SOURCE-RECONCILED` means source statements and provenance have been aligned for the current structured scope. It does **not** imply that different source regimens are equivalent or interchangeable.

Patient-specific AUC/aminoglycoside redosing calculators are not enabled unless based on a validated method. CRRT doses are never inferred when a source-specific regimen is absent.

## Paediatric/neonatal rule

Paediatric and neonatal source records remain population-specific. Gestational/postmenstrual age, postnatal age, indication, maximum dose and renal support must not be collapsed into an adult or generic paediatric schedule.

## NAG rule

NAG-derived records remain fully searchable offline and participate in synthesis. Every NAG clinical result retains a live official link because NAG is maintained as an online, periodically updated guideline.

## v0.19 scope decision

Unavailable institution-specific layers are not represented as missing core data. The following are optional future integrations:

- institution/unit cumulative antibiogram;
- institution-specific TDM platform/workflow;
- institution-specific CRRT defaults;
- stocked-product/Y-site compatibility catalogue.

HPUSM ASP 2025 remains a source-specific local guideline irrespective of whether those optional layers exist.

## `dataQualityAudit`

The v0.19 audit stores entity counts, provenance coverage, source-reference counts, duplicate-ID results, internal-link results and bundled-PDF page validation. `scripts/validate_release.py` rechecks these invariants before GitHub Pages deployment.
