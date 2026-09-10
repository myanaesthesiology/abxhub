# AbxHub clinical JSON schema — v0.15 overview

`clinical-data.json` remains deliberately source-aware. Recommendations from different guidelines are not silently merged into a synthetic regimen.

## Top-level keys

- `meta` — app/database version, scope and disclaimer.
- `sources` — source metadata and bundled/live reference paths.
- `drugs[]` — drug/anti-infective monographs.
- `conditions[]` — syndrome/disease pathways with source-separated recommendations.
- `organisms[]` — organism profiles and linked phenotypes/syndromes.
- `resistance[]` — resistance mechanism/phenotype cards.
- `renal{}` — drug-keyed renal/RRT records.
- `specialPopulations{}` — obesity, hypoalbuminaemia, ARC, CNS and other cross-cutting ICU contexts.
- `tdm{}` — structured source-specific vancomycin/aminoglycoside TDM guidance.
- `infusionStrategies` — prolonged beta-lactam loading/maintenance matrix linked to MSIC and MOH preparation sources.
- `highRiskRRT` — RRT/CRRT safety/reconciliation policy.
- `paediatricValidation` — Blue Book vs Frank Shann source-presence matrix; no dose merging.
- `ivpo` — IV→PO stewardship criteria.
- `nagSnapshot` — NAG structured snapshot/freshness metadata.
- `bundledReferences[]` — user-supplied source PDF library.
- `validation` — release validation status and remaining governance work.

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

The two preparation records must never be merged. The fluid-restricted record is an exceptional minimum-volume strategy, not a dose-selection rule.

## High-risk clinical reconciliation

Selected drug profiles can contain `clinicalProfile.clinicalReconciliation[]`:

```json
{
  "id": "vanco-tdm",
  "title": "High-risk reconciliation — vancomycin/TDM",
  "status": "SOURCE-RECONCILED / LOCAL TDM WORKFLOW REQUIRED",
  "summary": "...",
  "points": ["..."],
  "refs": [{"source": "nag", "url": "..."}, {"source": "msic", "page": 153, "pdfPage": 163}]
}
```

`SOURCE-RECONCILED` means source statements have been aligned and provenance preserved; it does **not** mean institutional clinical sign-off.

## NAG rule

NAG-derived records remain fully searchable offline and participate in synthesis. Every NAG clinical result retains a live official link because NAG is maintained as an online, periodically updated guideline.
