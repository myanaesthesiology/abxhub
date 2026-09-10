# Source-dose and provenance audit — v0.14.0

This is a structural audit, **not clinical sign-off**. Source-specific doses may legitimately differ by age, indication, severity, PK/PD target and renal/RRT status. Dilution provenance now distinguishes standard national MOH preparation from special fluid-restricted ICU preparation.

| Drug | Quick-dose sources | Blue Book | DrugDoses v5.5 | Renal/RRT | Standard dilution source | Fluid-restricted overlay | Clinical review |
|---|---|---:|---:|---:|---|---:|---|
| Acyclovir | nag, msic | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Amikacin | msic, nag | ✓ | ✓ | — | MOH national | — | Pending |
| Amoxicillin | nag | ✓ | ✓ | — | — | — | Pending |
| Amoxicillin–Clavulanate | hpusm, msic, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Amphotericin B deoxycholate | nag | ✓ | ✓ | — | MOH national | — | Pending |
| Ampicillin | hpusm, nag, msic, wellington | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Ampicillin–Sulbactam | msic, hpusm, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Anidulafungin | msic | ✓ | ✓ | — | MOH national | — | Pending |
| Artesunate | msic | ✓ | ✓ | — | MOH national | — | Pending |
| Azithromycin | hpusm, msic, wellington, nag | ✓ | ✓ | — | MOH national | — | Pending |
| Aztreonam | msidc, wellington | — | ✓ | ✓ | Product label | — | Pending |
| Benzylpenicillin | nag, msic, wellington | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Caspofungin | msic | ✓ | ✓ | — | MOH national | — | Pending |
| Cefazolin | nag, msic, wellington | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Cefepime | msic, hpusm, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Cefiderocol | msidc | — | — | ✓ | — | — | Pending |
| Cefotaxime | hpusm, nag | ✓ | ✓ | — | MOH national | — | Pending |
| Ceftazidime | msic, hpusm, wellington, nag | ✓ | ✓ | ✓ | MOH national | ✓ | Pending |
| Ceftazidime–Avibactam | msidc | ✓ | ✓ | ✓ | Product label | — | Pending |
| Ceftolozane–Tazobactam | hpusm, msidc | ✓ | ✓ | — | — | — | Pending |
| Ceftriaxone | hpusm, msic, wellington, nag | ✓ | ✓ | — | MOH national | — | Pending |
| Cefuroxime | hpusm, nag, wellington | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Cephalexin | hpusm | ✓ | ✓ | — | — | — | Pending |
| Ciprofloxacin | msic, msidc, nag, wellington | ✓ | ✓ | ✓ | Sabah fallback | — | Pending |
| Clarithromycin | nag | ✓ | ✓ | — | — | — | Pending |
| Clindamycin | hpusm, nag, wellington | ✓ | ✓ | — | MOH national | — | Pending |
| Cloxacillin | hpusm, wellington, nag | ✓ | ✓ | — | MOH national | — | Pending |
| Colistin (Polymyxin E) | msic, msidc | ✓ | ✓ | ✓ | Sabah fallback | — | Pending |
| Daptomycin | msic, wellington | — | ✓ | ✓ | — | — | Pending |
| Doxycycline | nag | ✓ | ✓ | — | — | — | Pending |
| Ertapenem | msic, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Erythromycin | nag | ✓ | ✓ | — | MOH national | — | Pending |
| Fluconazole | msic, nag | ✓ | ✓ | ✓ | Sabah fallback | — | Pending |
| Flucytosine | nag | ✓ | ✓ | — | — | — | Pending |
| Fosfomycin | nag, msidc | ✓ | ✓ | — | — | — | Pending |
| Gentamicin | msic, wellington, nag | ✓ | ✓ | — | MOH national | ✓ | Pending |
| Imipenem–Cilastatin | msic, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Imipenem–Cilastatin–Relebactam | msidc | — | — | ✓ | — | — | Pending |
| Itraconazole | nag | ✓ | ✓ | — | — | — | Pending |
| Levofloxacin | msic, nag | ✓ | ✓ | ✓ | — | — | Pending |
| Linezolid | msic, nag, wellington | ✓ | ✓ | — | Sabah fallback | — | Pending |
| Liposomal Amphotericin B | nag | — | ✓ | — | — | — | Pending |
| Meropenem | msic, wellington, nag | ✓ | ✓ | ✓ | MOH national | ✓ | Pending |
| Metronidazole | hpusm, nag, wellington | ✓ | ✓ | — | Sabah fallback | — | Pending |
| Micafungin | msic | ✓ | ✓ | — | MOH national | — | Pending |
| Minocycline | msidc | ✓ | ✓ | ✓ | — | — | Pending |
| Nitrofurantoin | nag, msidc | ✓ | ✓ | — | — | — | Pending |
| Oseltamivir | msic, nag | ✓ | ✓ | ✓ | — | — | Pending |
| Pentamidine | msic | ✓ | ✓ | — | MOH national | — | Pending |
| Phenoxymethylpenicillin (Penicillin V) | nag | ✓ | ✓ | — | — | — | Pending |
| Piperacillin–Tazobactam | msic, hpusm, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Polymyxin B | hpusm, msidc, msic | ✓ | — | ✓ | Sabah fallback | — | Pending |
| Pyrimethamine | nag | — | ✓ | — | — | — | Pending |
| Quinine dihydrochloride | msic | ✓ | ✓ | — | — | — | Pending |
| Rifampicin | hpusm, nag | ✓ | ✓ | — | — | — | Pending |
| Sulfadiazine | nag | — | ✓ | — | — | — | Pending |
| Tigecycline | hpusm, msidc, wellington | — | ✓ | ✓ | — | — | Pending |
| Trimethoprim–Sulfamethoxazole | hpusm, msic, wellington, nag | ✓ | ✓ | ✓ | MOH national | — | Pending |
| Vancomycin | msic, hpusm, wellington, nag | ✓ | ✓ | ✓ | MOH national | ✓ | Pending |
| Voriconazole | msic | ✓ | ✓ | ✓ | MOH national | — | Pending |
