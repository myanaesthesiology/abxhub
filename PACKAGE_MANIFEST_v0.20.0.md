# AbxHub v0.20.0 package manifest

Final archive: `AbxHub-v0.20.0-GitHub.zip`

## Included

- deployable HTML/CSS/JavaScript PWA source;
- `manifest.webmanifest` and v0.20 service worker;
- clinical and NAG JSON datasets;
- icons/assets;
- five requested bundled reference PDFs;
- validation scripts;
- v0.20 release notes, QA report, high-risk spot-check, expanded-content audit and deployment checklist;
- expanded content/UI regression validator (`scripts/ui_regression_v020.py`);
- existing project documentation/source-attribution material retained from v0.19 where useful for audit history.

## Excluded

- extraction-only APK binaries;
- `.git/`, caches, temporary files and local test logs;
- secrets/credentials;
- nested old release ZIPs;
- temporary PDF extraction/render directories used during QA (`_pdftext/`, `_renders/`).

## Service-worker upgrade behavior

The v0.20 service worker uses cache namespace `abxhub-v0.20.0`; on activation it removes other `abxhub-*` and `abx-critical-*` cache namespaces and claims clients. The real upgrade behavior must still be confirmed on the deployed origin because browser/service-worker lifecycle details cannot be proven by static inspection alone.
