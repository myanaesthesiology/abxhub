# Clinical JSON schema — v0.6 practical overview

`clinical-data.json` contains:

- `meta`: app/database version, generation date and scope.
- `sources`: provenance metadata and official URLs.
- `nagSnapshot`: NAG edition, snapshot review date, latest update noted and official update-check URLs.
- `drugs[]`: identity, aliases, class, quick dose, dosing notes, expected spectrum, PK/PD, renal key, pregnancy/lactation, warnings, linked indications and references.
- `conditions[]`: disease/syndrome identity, aliases, risk factors, before-first-dose checklist, source-specific recommendation cards, rationale and references. NAG recommendations are normal first-class records with `source: "nag"` and an official `url`.
- `organisms[]`: organism profile, phenotypes and linked resistance/syndrome records.
- `resistance[]`: resistance mechanism/phenotype with source-specific guidance cards and optional structured bullet points.
- `renal`: renal/RRT dose records keyed by drug; current numeric tables are principally sourced to MSIC ICU, while the UI retains a current NAG Appendix 2 cross-check link.
- `tdm`: source-specific vancomycin and aminoglycoside monitoring metadata.
- `specialPopulations`: hypoalbuminaemia, obesity, ECMO and augmented-renal-clearance source records.
- `ivpo`: IV-to-oral stewardship checklist, exclusions, notes and multiple sources.
- `bundledReferences`: bundled PDF library used by source provenance and the Sources tool.

## Recommendation record

Typical condition recommendation:

```json
{
  "source": "nag",
  "label": "Late onset / severe / Pseudomonas risk",
  "preferred": ["..."],
  "alternative": ["..."],
  "duration": "...",
  "url": "https://sites.google.com/moh.gov.my/nag/..."
}
```

Never merge conflicting source rows into one recommendation. Source-specific records are compared by the UI.

## NAG rule

NAG data participate in the same structured entity model as HPUSM/MSIC/MSIDC. The separate `nag-topics.json` file is **not the NAG clinical database**; it is the official live-navigation/update-check index.

Every NAG-derived clinical record should retain an official live URL so the user can select **Check latest official NAG ↗**.

## Missing source data

If an official source contains an embedded table/PDF that has not yet been reliably transcribed, do not silently substitute a numeric regimen from another guideline as if it were NAG. Keep the verified source-specific data and link the live NAG page for cross-check until the table is formally extracted and reviewed.


## Bundled PDF link fields

A source may include `pdfUrl`. An individual reference can override it with its own `pdfUrl` and can specify `pdfPage`. The UI opens `pdfUrl#page=<pdfPage>` when the browser PDF viewer supports page anchors. NAG records normally retain a live `url`; the pregnancy/lactation appendix may additionally point to the bundled local PDF.

## Navigation model

Main PWA views are recorded in the browser History API (`home`, directory, entity, tool and synthesis routes). The app back button calls browser history so it returns to the actual previous PWA view and restores the stored scroll position.
