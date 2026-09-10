# AbxHub v0.14.0 — Release notes

## Main change
Preparation/dilution has been re-based to the **national MOH Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)** as the standard source.

The newer **MOH Dilution Guide for Fluid Restricted Critically Ill Adults (Dec 2025)** is implemented as a separate ICU minimum-volume overlay, not as a replacement for routine preparation.

## Coverage
- 30 national MOH standard preparation monographs
- 4 Dec 2025 fluid-restricted ICU overlays: ceftazidime, gentamicin, meropenem, vancomycin
- 6 Sabah-protocol fallback preparation records
- 2 newer-agent product-label preparation records

## UI/data changes
Drug cards now display source-separated:
- Reconstitution
- Further dilution
- Diluent
- Administration rate/time
- Stability
- Compatibility/incompatibility
- Preparation notes
- Standard vs fluid-restricted ICU source

Universal search indexes these preparation fields.

## Governance
All dilution information remains product/brand dependent. The current local product insert and institutional pharmacy policy remain the final preparation check.
