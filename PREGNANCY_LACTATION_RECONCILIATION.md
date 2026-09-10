# AbxHub pregnancy/lactation reconciliation — v0.17.0

## Source basis
Primary structured source: **Malaysia NAG 4th Edition, Appendix 4: Antibiotic in Pregnancy & Lactation, Version 2 (July 2024)**, bundled in `references/NAG_Pregnancy_Lactation_2024.pdf` and linked to the official live MOH NAG Appendix 4 page.

The appendix uses **legacy FDA pregnancy categories**. AbxHub preserves those source labels and does not reinterpret them as the current FDA PLLR framework.

## Re-extraction result
- 60 AbxHub anti-infective entities reviewed against the supplied 3-page appendix.
- **41 exact source-supported name mappings** are now structured.
- **19 AbxHub entities are not separately listed by exact name/formulation** in the supplied Appendix 4 table; AbxHub does not infer a category from drug class.
- A previous cefazolin pregnancy mapping was removed because cefazolin is not separately listed in this supplied table.
- Ampicillin/sulbactam is now mapped directly to the exact table row (legacy category B) rather than inferred from ampicillin alone.

## Formulation guard
The table lists **“Amphotericin B”** generically without distinguishing deoxycholate versus lipid/liposomal products. AbxHub attaches the table row only to the conventional/deoxycholate entity and does not automatically transfer the pregnancy category to liposomal amphotericin B.

## Current-NAG indication-specific overlays
Where the live NAG explicitly adds pregnancy/gestational context, AbxHub keeps this as a separate current-NAG note rather than changing the Appendix 4 table field. Current overlays in v0.17 include:
- nitrofurantoin — avoid in the third trimester in the adult UTI pathway;
- doxycycline — contraindicated in pregnancy in selected current NAG pathways;
- azithromycin — used as a pregnancy option in selected STI/tropical pathways;
- ceftriaxone — current pregnancy regimen for uncomplicated gonorrhoea;
- rifampicin / trimethoprim-sulfamethoxazole — gestation-specific brucellosis pathway.

## Safety rule
A pregnancy category is **not** an automatic prescribing recommendation. Syndrome, gestational age, maternal/fetal risk, route, duration, renal function, resistance, alternatives and current product/specialist information still determine treatment.
