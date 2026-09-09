# AbxHub clinical JSON schema — v0.8 overview

`clinical-data.json` is deliberately source-aware. A recommendation from one guideline is never silently merged with another guideline into a synthetic regimen.

## Top-level keys

- `meta` — app/database version, source order, disclaimer.
- `sources` — source metadata and bundled/live reference paths.
- `drugs[]` — drug/anti-infective monographs.
- `conditions[]` — syndrome/disease pathways with source-separated recommendations.
- `organisms[]` — organism profiles and linked phenotypes/syndromes.
- `resistance[]` — resistance mechanism/phenotype cards.
- `renal{}` — drug-keyed renal/RRT records.
- `specialPopulations{}` — obesity, hypoalbuminaemia, ARC, CNS and other cross-cutting ICU contexts.
- `tdm{}` — TDM source workspaces.
- `ivpo` — IV→PO stewardship criteria.
- `nagSnapshot` — NAG structured snapshot/freshness metadata.
- `bundledReferences[]` — source PDF library.
- `validation` — release validation status and remaining governance work.

## Condition recommendation

```json
{
  "source": "nag",
  "label": "Clinical stratum",
  "preferred": ["..."],
  "alternative": ["..."],
  "duration": "...",
  "notes": ["..."],
  "page": 10,
  "pdfPage": 10,
  "url": "https://..."
}
```

`page` means source-printed page. `pdfPage` means the page number used by the browser PDF viewer. For living NAG pages, use `url` instead.

## Renal/RRT record

```json
{
  "normal": "...",
  "high": "optional high-exposure context",
  "bins": [
    {"min": 31, "max": 50, "text": "..."},
    {"max": 9.99, "text": "..."}
  ],
  "rrt": {
    "HD": "...",
    "CVVH": "...",
    "CVVHD": "...",
    "CVVHDF": "..."
  },
  "source": "msic",
  "page": 139,
  "pdfPage": 149,
  "note": "optional caveat"
}
```

Never fill absent RRT data by interpolation. If the source does not provide a regimen, state that a current institutional/product/ID-pharmacy resource is required.

## NAG rule

NAG-derived records are fully searchable offline and participate in synthesis. Every NAG clinical result must retain an official live link because the national guideline is updated online.
