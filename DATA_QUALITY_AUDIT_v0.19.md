# AbxHub v0.19 data-quality audit

## Automated result

**PASS — 10 Sep 2026**

- Drugs: 60
- Conditions/syndromes: 63
- Organisms: 26
- Resistance pathways: 12
- Renal/RRT records: 31
- Structured source-reference objects: 1,673
- Duplicate entity IDs: 0
- Broken internal links: 0
- Unknown source IDs: 0
- Invalid bundled-PDF page anchors: 0

## Provenance coverage

- 60/60 drug records have top-level source references.
- 63/63 condition records have source references, disease mechanism, diagnostic microbiology and microbiology references.
- 26/26 organisms have family/group, morphology, reservoir/transmission, pathogenesis, resistance summary, common diseases, clinical pearl and references.
- 12/12 resistance pathways have source references.
- 41 pregnancy/lactation rows carry explicit source provenance.
- 60 paediatric records carry explicit source provenance.
- 38 standard preparation records carry direct preparation references.
- 39 fluid-restricted preparation records carry direct preparation references.

## PDF-link canonicalisation

224 previously implicit bundled-PDF page links were canonicalised during v0.19. The MSIC source uses the validated source-page → PDF-page offset, while HPUSM and MSIDC use direct PDF-page mapping in this package.

## Runtime regression guards

The release validator fails if:

- `navActive()` is missing;
- the History API `popstate` handler is missing;
- `history.back()` is removed;
- service-worker/app asset versions differ;
- retired institutional "NOT CONFIGURED" UI returns;
- an app-shell asset is absent;
- the NAG official freshness-link label disappears.

## Interpretation

This is a **structural and provenance audit**. It does not claim that every regimen from different populations or sources is clinically interchangeable. High-risk source spot-checking remains the final content gate before v1.0.
