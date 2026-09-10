# User-supplied APK source metadata

These source binaries were used locally during database extraction and are **not bundled** in the public GitHub PWA package.

## Blue Book APK
- Supplied file: `Blue Book+(1).apk`
- SHA-256: `3b0f451bd1159fe3f1072c5a44bfaab09380c5e92dcb2e525822ec46e0520e31`
- Embedded database: SQLite `assets/flutter_assets/assets/db`
- Formulary rows in embedded `drugs` table: 2973
- Antimicrobials matched to an offline formulary entry in v0.12: 52/60
- Use: formulary category, indications, dose, adverse reactions, contraindications, interactions, precautions, restrictions and NEML snapshot.
- Freshness: always cross-check current MOH MyFormulary/FUKKM.

## Frank Shann DrugDoses APK
- Supplied file: `DrugDoses(1).apk`
- SHA-256: `03d7023a3c882267cd711fe1ea7f46180363eed0a053134593f55d4166e70082`
- Embedded reference database: `assets/drugdosesv5_5.xml`
- XML version: `5.5`
- Drug entries: 2577
- AbxHub antimicrobials with direct dose cross-check in v0.12: 57/60
- Use: paediatric/critical-care dose cross-check only; current indication-specific/local guidance remains authoritative.
