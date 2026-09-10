# AbxHub v0.19.0 release notes

**Release type:** source-reconciliation and data-quality release candidate.

No new clinical module was added. This build focuses on making the existing database dependable enough for a final pre-v1.0 audit.

### Main changes

- Completed database-wide ID, cross-link, provenance and PDF-page validation.
- Canonicalised 224 bundled-PDF page references.
- Updated coverage metadata to the actual 60 drugs / 63 conditions / 26 organisms / 12 resistance pathways.
- Retired the local-antibiogram "not configured" UI and removed institution-specific TDM/CRRT/product requirements from the v1.0 core gate.
- Added repeatable release validation and static HTTP smoke testing to GitHub Actions.
- Kept all high-risk source-specific guards and the NAG live freshness link.
- Added a formal final pre-v1.0 audit plan.

### Remaining before v1.0

- Real deployed GitHub Pages + installed-PWA smoke test.
- Manual high-risk source spot-check.
- Public redistribution/licensing decision for bundled copyrighted PDFs.
