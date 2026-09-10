# AbxHub final pre-v1.0 audit plan

## Database gate — automated

Run:

```bash
python scripts/validate_release.py
node --check app.js
python scripts/smoke_static.py
```

All three must pass.

## Clinical source spot-check — manual

Spot-check at least the following against the linked source:

- Vancomycin: normal renal function, HD, CRRT and monitoring.
- Amikacin and gentamicin: adult, renal/RRT, neonatal and TDM sections.
- Colistin/CMS and polymyxin B: unit conversion and renal/RRT logic.
- Meropenem and piperacillin-tazobactam: loading dose, prolonged infusion and CRRT.
- Amphotericin B deoxycholate versus liposomal formulation separation.
- Ceftazidime-avibactam + aztreonam for NDM/MBL and other major MDR pathways.
- NAG paediatric/neonatal age/gestation-dependent regimens.
- MOH standard and fluid-restricted preparation records.

## Deployed functional gate — manual

On the final GitHub Pages URL and at least one installed mobile PWA:

1. Open Home and run universal searches for a drug, disease, organism, resistance phenotype and NAG-specific term.
2. Open a drug source card and confirm the linked PDF/page or official source.
3. Navigate through several views and verify Back returns to the actual previous view.
4. Open renal/RRT and TDM tools and confirm source-specific guards remain visible.
5. Load the app once, go offline, reopen/reload and verify the app shell plus structured data remain available.
6. Upgrade over an older cached version and confirm the new version loads without the historical `navActive` error.

## Publication gate

Before a public GitHub release, decide whether each bundled copyrighted PDF may legally be redistributed. If permission is not available, keep the structured/source-linked data but remove the affected PDF from the public repository and link to the authorised source instead.

## v1.0 decision

Tag v1.0 only after the automated database/static checks, high-risk source spot-check and deployed runtime smoke test pass.
