# AbxHub priority empirical-source reconciliation — v0.17.0

This release adds explicit reconciliation cards to nine high-impact adult syndromes. The goal is not to manufacture a consensus regimen; it is to make clinically relevant source differences visible.

| Syndrome | Sources compared | v0.17 interpretation |
|---|---|---|
| Severe CAP | HPUSM ASP 2025, MSIC ICU 2023, current NAG | Keep the default severe-CAP and Pseudomonas-risk regimens separate; current NAG Jan 2026 update is the national freshness authority. |
| HAP/VAP | HPUSM ASP 2025, MSIC ICU 2023, current NAG | Preserve early/late acquisition and MDR-risk logic; local antibiogram/cultures drive final breadth. |
| Septic shock | HPUSM ASP 2025, current NAG | Important difference: the HPUSM local undifferentiated table is diabetes-stratified, whereas current NAG emphasizes source, acquisition, recent microbiology, resistance/colonisation risk, immune status and local susceptibility. |
| Adult febrile neutropenia | HPUSM ASP 2025, current NAG | Added the HPUSM local piperacillin/tazobactam entry; current NAG supplies the more detailed first-line/escalation logic. |
| Acute bacterial meningitis | HPUSM ASP 2025, current NAG | Core regimen is broadly concordant; current NAG explicitly conditions ampicillin on Listeria risk and adds allergy guidance. |
| Complicated intra-abdominal infection | MSIC ICU 2023, current NAG | Keep source-control and site/severity stratification central; avoid a generic “abdominal sepsis” prescription. |
| Urosepsis | HPUSM ASP 2025, current NAG | Keep local empirical entry separate from current NAG shock-stratified national pathway. |
| Melioidosis | MSIC ICU 2023, current NAG | Current NAG Jan 2026 melioidosis update is the national freshness authority; ICU/severity/site and ARC alter regimen and duration. |
| Infective endocarditis | HPUSM ASP 2025, MSIC ICU 2023, current NAG | Native/prosthetic/culture-negative pathways remain separate; current NAG received a Jan 2026 Bartonella culture-negative update. |

## Governance rule
A future local antibiogram should be layered on top of, not silently merged into, these source cards. Any institution-specific modification should retain its institution, unit, date range, isolate count/method where available, reviewer and effective date.
