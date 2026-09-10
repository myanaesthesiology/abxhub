# Dilution / preparation provenance audit — v0.14.0

This document is a **source-extraction audit**, not a substitute for the current local product insert or pharmacy IV compatibility policy.

## Source hierarchy for preparation

1. **MOH national standard:** *Dilution Guideline for Injectable Drugs (Part I – Antimicrobial)* — primary standard preparation source.
2. **MOH Dec 2025 fluid-restricted critically ill adult guide:** special minimum-volume ICU overlay where structured.
3. **JKN Sabah protocol:** legacy/fallback only where no national Part I record has yet replaced the preparation entry.
4. **Product label / other source:** for newer agents not represented in the national Part I document.

## National MOH standard structured — 30
- Acyclovir
- Amikacin
- Amoxicillin–Clavulanate
- Amphotericin B deoxycholate
- Ampicillin
- Ampicillin–Sulbactam
- Anidulafungin
- Artesunate
- Azithromycin
- Benzylpenicillin
- Caspofungin
- Cefazolin
- Cefepime
- Cefotaxime
- Ceftazidime
- Ceftriaxone
- Cefuroxime
- Clindamycin
- Cloxacillin
- Ertapenem
- Erythromycin
- Gentamicin
- Imipenem–Cilastatin
- Meropenem
- Micafungin
- Pentamidine
- Piperacillin–Tazobactam
- Trimethoprim–Sulfamethoxazole
- Vancomycin
- Voriconazole

## MOH Dec 2025 fluid-restricted overlays — 4
- Ceftazidime
- Gentamicin
- Meropenem
- Vancomycin

These appear **in addition to**, not instead of, the standard preparation card.

## Sabah fallback preparation records — 6
- Ciprofloxacin
- Colistin (Polymyxin E)
- Fluconazole
- Linezolid
- Metronidazole
- Polymyxin B

## Other preparation sources — 2
- Aztreonam — dailymed
- Ceftazidime–Avibactam — dailymed

## No detailed preparation record currently — 22
Many of these are oral-only/non-injectable in the current AbxHub use case or are newer/specialist agents requiring a separate source.
- Amoxicillin
- Cefiderocol
- Ceftolozane–Tazobactam
- Cephalexin
- Clarithromycin
- Daptomycin
- Doxycycline
- Flucytosine
- Fosfomycin
- Imipenem–Cilastatin–Relebactam
- Itraconazole
- Levofloxacin
- Liposomal Amphotericin B
- Minocycline
- Nitrofurantoin
- Oseltamivir
- Phenoxymethylpenicillin (Penicillin V)
- Pyrimethamine
- Quinine dihydrochloride
- Rifampicin
- Sulfadiazine
- Tigecycline

## Mandatory pre-v1.0 checks
- Compare every structured entry with the locally stocked brand/product insert.
- Verify final concentration, diluent, infusion duration, stability and Y-site/admixture incompatibilities.
- Confirm whether local pharmacy preparation differs from the national generic reference.
- For fluid-restricted ICU entries, verify central/peripheral line restrictions and ensure the minimum-volume strategy is clinically necessary.
- Keep prolonged/extended infusion **dosing strategy** separate from simple dilution feasibility; the relevant PK/PD guideline controls the clinical regimen.
