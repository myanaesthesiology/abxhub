# High-risk antimicrobial reconciliation — v0.15.0

## Vancomycin / TDM
Current NAG Appendix 1 identifies 24-h AUC/MIC as the efficacy exposure metric, describes Bayesian AUC estimation as the gold standard, and recommends TDM when treatment is expected for >48 h. MSIC source-specific loading, renal/RRT and sampling schedules remain separate. AbxHub does not estimate AUC from a single trough.

## Aminoglycosides
NAG EID/SDD exclusions and MSIC timed-level sampling are structured. Amikacin RRT regimens are linked to MSIC. Gentamicin renal failure/CRRT deliberately uses a TDM/nomogram guard rather than a guessed fixed regimen.

## Polymyxins
Polymyxin B and colistin/CMS remain separate with separate units and renal rules. No silent unit conversion is performed.

## Amphotericin B
Deoxycholate, lipid complex and liposomal formulations are treated as distinct products. Dilution data are not transferred between formulations.

## Prolonged beta-lactam infusion
MSIC loading/maintenance framework is structured for cefepime, ceftazidime, imipenem, meropenem and piperacillin/tazobactam. MOH fluid-restricted dilution contributes preparation feasibility only; clinical dose and renal/RRT adjustment remain source-specific.

## MDR high-risk agents
Ceftazidime-avibactam + aztreonam for NDM/MBL CRE, cefiderocol and high-dose tigecycline remain dedicated phenotype/site-specific MSIDC strategies requiring specialist review.
