# Paediatric / neonatal line-by-line audit — v0.18.0

Current-NAG high-risk audit completed on 10 Sep 2026 for the following 11 agents:

| Drug | Current NAG contexts checked | Status / guard |
|---|---|---|
| Benzylpenicillin | neonatal meningitis, EOS, GBS sepsis/meningitis | GA + PNA determine interval |
| Ampicillin | neonatal meningitis, EOS, GBS infection | age-specific total daily dose/division retained |
| Cefotaxime | neonatal meningitis, NEC | syndrome/age-specific interval retained |
| Cefepime | neonatal meningitis alternative, LOS alternative | neonatal age bands kept separate from adult/older-child dosing |
| Meropenem | severe hospital-acquired neonatal CNS infection | CNS regimen and GA/PNA interval retained |
| Gentamicin | NEC, EOS, LOS, GBS sepsis | CGA-based interval; TDM/renal reassessment still applies |
| Amikacin | NEC/LOS alternatives | CGA-based interval; adult EID nomogram not substituted |
| Metronidazole | NEC | loading + gestational-age-dependent maintenance retained |
| Piperacillin-tazobactam | NEC alternative, LOS second line | PMA/age-specific interval retained |
| Cloxacillin | LOS first line | neonatal age-specific interval retained |
| Vancomycin | NAG Appendix 1 paediatric/neonatal TDM | PMA/weight/SrCr determine neonatal interval; AUC/TDM remains separate |

The DrugDoses/Frank Shann and Blue Book APK records remain **parallel cross-check sources**. AbxHub does not average or merge those dose strings with current NAG.

Live NAG sources:
- https://sites.google.com/moh.gov.my/nag/contents/section-b-paediatrics/b6-neonatal-infections
- https://sites.google.com/moh.gov.my/nag/appendices/appendix-1-clinical-pharmacokinetic-guide-aminoglycoside-vancomycin
