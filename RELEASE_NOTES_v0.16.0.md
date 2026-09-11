# AbxHub v0.16.0 — current NAG + paediatric/neonatal reconciliation

This release moves the pre-v1.0 work from broad extraction into population-specific source reconciliation.

## Major changes

- Official NAG freshness rechecked on 10 Sep 2026; the official site still identifies January 2026 as the latest update.
- Seven paediatric/neonatal syndrome records are now first-class searchable conditions rather than being hidden inside adult drug pages.
- Current NAG paediatric/neonatal dosing is displayed next to, but never silently merged with, Frank Shann DrugDoses v5.5 and the Blue Book/FUKKM snapshot.
- Vancomycin TDM now shows the NAG AUC/TDM framework and the MSIC source-specific CRRT examples separately.
- RRT records now surface effluent-rate/residual-renal-function guards and preserve source unit conventions.
- Colistin/CMS and polymyxin B are explicitly product/unit separated; amphotericin formulations are formulation-locked.

## v1.0 gate

The data are source-reconciled, not institutionally approved. Before v1.0, local ID/AMS/pharmacy/TDM review should sign off high-risk dosing, local assay timing/Bayesian workflow, CRRT assumptions, product-specific dilution compatibility, and paediatric/neonatal practice.
