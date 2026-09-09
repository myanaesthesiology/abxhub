# Clinical JSON schema — practical overview

`clinical-data.json` contains:

- `meta`: app/database version and scope.
- `sources`: provenance metadata and optional official URLs.
- `drugs[]`: drug identity, aliases, class, quick dose, dosing notes, expected spectrum, PK/PD, renal key, pregnancy/lactation, warnings, linked indications and references.
- `conditions[]`: disease/syndrome identity, aliases, risk factors, before-first-dose checklist, source-specific recommendation cards, rationale and references.
- `organisms[]`: organism profile, phenotypes and linked resistance/syndrome records.
- `resistance[]`: resistance mechanism/phenotype with source-specific guidance cards.
- `renal`: renal/RRT dose records keyed by drug.
- `ivpo`: IV-to-oral stewardship checklist and exclusions.

Each recommendation should remain source-specific. Do not create a synthetic recommendation by merging incompatible guideline rows.
