# AbxHub CRRT/RRT validation — v0.18.0

## Core rule

**CRRT is not a single renal-clearance state.** The app now asks for CRRT context when CVVH/CVVHD/CVVHDF is selected and prevents a stopped/interrupted circuit from being treated as if it were continuously running.

Minimum context:

- modality;
- actual prescribed effluent rate when relevant;
- current running/interrupted status;
- residual renal function / urine output where meaningful;
- infection site/severity;
- loading dose status;
- TDM availability where applicable.

## Vancomycin

MSIC CRRT examples are effluent- and MIC-dependent. AbxHub therefore asks for effluent rate and shows the source example as a **reference example**, not an automatic prescription.

## Aminoglycosides

- Amikacin: source-specific MSIC HD/CVVH/CVVHD/CVVHDF examples remain visible with TDM required.
- Gentamicin: no fixed CRRT interval is invented where the source path does not support one.

## Polymyxins

- Colistin/CMS and polymyxin B remain separate products with separate unit conventions.
- CRRT-specific colistin schedules are not continued automatically after CRRT stops.

## Beta-lactams

Loading/stat dose and maintenance adjustment remain separate. The fixed source table is shown with an explicit warning that real CRRT clearance can vary with effluent, downtime and residual renal function.

## Local v1.0 sign-off still needed

HPUSM usual CRRT modalities, effluent convention, downtime/filter assumptions, residual-renal-function handling and local pharmacy/TDM workflow.
