# Changelog

## v0.6.0 — 2026-09-09

- Kept Malaysia NAG as a first-class structured source with live MOH freshness links.
- Added NAG-backed PCP/PJP, CRBSI/CLABSI and complicated intra-abdominal source cards.
- Added spontaneous bacterial peritonitis and *Clostridioides difficile* pathways.
- Bundled all supplied PDF references under `/references/`.
- Source provenance now opens bundled PDFs and page anchors where available, while retaining official live links separately.
- Replaced directory/home-style back behavior with browser History API navigation and stored scroll restoration.
- Removed Standard/ICU mode switch; critical-care/ID detail is now the default interface.
- Updated service-worker cache to v0.6.0; large PDFs cache on demand rather than during installation.
