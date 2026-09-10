# AbxHub local empirical-therapy / antibiogram validation — v0.18.0

## Current state

- **Local empirical policy configured:** HPUSM ASP 2025.
- **Local cumulative antibiogram configured:** **No**. No current HPUSM/unit susceptibility dataset has been supplied to AbxHub.
- Therefore AbxHub **does not display or infer local susceptibility percentages**.

This is intentional. A cumulative antibiogram is a population-level empirical aid, not the same as the susceptibility profile of an individual patient's isolate. Current NAG also highlights that cumulative antibiograms may not distinguish community- from hospital-onset infection, may include colonisers, do not contain MIC data, and do not account for PK/PD, infection site or other patient factors.

Official NAG reference:
https://sites.google.com/moh.gov.my/nag/information/limitation-of-national-antibiogram

## AbxHub rule

The local susceptibility layer may change **display/ranking of empirical options only**. It must never overwrite:

1. an individual isolate AST/MIC result;
2. a source-specific MDR treatment algorithm;
3. patient-specific contraindications/site penetration/PK-PD considerations;
4. a current HPUSM/NAG/MSIC recommendation without clearly showing the source difference.

## Minimum dataset required before activation

- institution / unit
- surveillance date range
- first-isolate methodology
- organism
- antimicrobial
- number tested
- percent susceptible
- breakpoint standard/version
- reviewer / microbiology owner
- effective date

A machine-readable template is included at `data/local-antibiogram.example.json`.
