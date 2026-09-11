# AbxHub v0.20.0 deployed PWA verification

**Current status:** PENDING — must be completed against the actual deployed GitHub Pages HTTPS URL.

## Why this is still pending

The release environment could not provide a reliable local Chromium run: loopback/container navigation was blocked by policy, and a later file-origin headless attempt hung before DOM capture. The package itself does not contain a deployed GitHub Pages URL, and no public AbxHub deployment was discoverable during the build.

Static HTTP serving was nevertheless validated separately by `scripts/smoke_static.py` (8/8 core assets).

## A. Deployed smoke test

- [ ] Record the exact deployed URL: ______________________________
- [ ] HTTPS loads without redirect/path errors.
- [ ] `index.html`, `app.js`, `styles.css`, manifest, service worker and both JSON datasets load with HTTP 200.
- [ ] Icons load.
- [ ] All five bundled PDFs open from the deployed origin.
- [ ] No case-sensitive GitHub Pages path error.
- [ ] No console-breaking JavaScript error.

## B. Search / history regression

- [ ] Home search → type query → **Enter** opens the dedicated results page.
- [ ] Results page retains the search bar/query.
- [ ] Result → entity → browser/PWA Back returns to the results page.
- [ ] Home dropdown hit → entity → Back returns to the same query/dropdown.
- [ ] Organism → drug → Back returns to organism.
- [ ] Resistance → drug → Back returns to resistance.
- [ ] Renal/RRT → Calculate CrCl → calculate → Use in renal dose tool returns to the same drug.
- [ ] No history loop or unexpected jump to Home.

## C. Primary-tab scroll memory

For Home, Diseases, Drugs, Organisms and Tools:

- [ ] Scroll well down a root tab.
- [ ] Change to another bottom tab.
- [ ] Return to the first tab.
- [ ] Its prior root-page scroll position is restored sensibly.
- [ ] Go-to-top control appears on a long scrolled page and works.

## D. Functional v0.20 spot test

- [ ] Spectrum legend visible.
- [ ] Organism antimicrobial quick/pathway links work, including one organism without a dedicated NAG quick-guide card.
- [ ] Disease practical-pathway card expands and links to drug monographs/source cards.
- [ ] ESBL, AmpC, CRE/NDM and DTR Pseudomonas practical management cards render and their site/severity sections expand correctly.
- [ ] CRAB HPUSM/MSIDC cards render.
- [ ] CRAB sulbactam renal/preparation table scrolls responsively on mobile.
- [ ] Drug source-specific regimen occurrences render and link to pathways/sources.
- [ ] Compare adds fourth and fifth drugs; remove controls work.
- [ ] Pregnancy/lactation rows expand/collapse and filter.
- [ ] IV→PO eligibility decision changes based on criteria/exclusion selection.
- [ ] IV→PO conversion rows expand and drug/source links work.
- [ ] Prolonged-infusion rows expand and monograph/renal/source buttons work.
- [ ] Vancomycin trough-only selection displays the AUC-method guard.
- [ ] Aminoglycoside EID exclusion screen changes routing message.
- [ ] AMS review card stores locally and delete/clear works.
- [ ] Culture Interpreter is absent from active tools/home shortcuts.
- [ ] Teaching Cases is absent from active tools.

## E. Clean PWA install

Use a clean browser profile/device or clear all AbxHub site data first.

- [ ] Open deployed URL online.
- [ ] Manifest is detected.
- [ ] Service worker installs/activates.
- [ ] Install/Add to Home Screen is available where supported.
- [ ] Launch standalone.
- [ ] App version/data correspond to v0.20.0.
- [ ] Close and reopen standalone successfully.

## F. Offline restart

- [ ] While online, open representative Home, drug, disease, organism, resistance and tool pages.
- [ ] Open at least one bundled PDF if PDF offline-on-demand behavior is being tested.
- [ ] Close the PWA.
- [ ] Disable network connectivity.
- [ ] Reopen the installed PWA.
- [ ] App shell loads.
- [ ] Structured clinical/NAG data load from cache/IndexedDB.
- [ ] Previously cached representative pages/data remain usable.
- [ ] A previously fully opened bundled PDF is available if browser PDF caching permits the complete cached response.
- [ ] External live NAG/source links fail gracefully while offline and do not break the app.
- [ ] Re-enable network and verify normal recovery.

## G. Upgrade over an older cached release

Best tested on a browser/device that currently has v0.19.0 installed/cached.

- [ ] Confirm old app is v0.19.0 before deployment/update.
- [ ] Deploy v0.20.0 at the same origin/scope.
- [ ] Reopen/refresh with normal user behavior.
- [ ] `abxhub-v0.20.0` service-worker cache is created.
- [ ] Old `abxhub-*` / `abx-critical-*` caches are deleted during activation except the current cache.
- [ ] v0.20.0 JavaScript/CSS/manifest are controlling the UI.
- [ ] Clinical DB is the v0.20 dataset (2,513 source-reference objects in the packaged build).
- [ ] Search/history changes are present after upgrade.
- [ ] Close/reopen offline after upgrade and confirm the new shell/data still work.

## Final release gate

Only mark **deployment/browser PWA verification: PASS** after sections A–G applicable to the supported platforms have been completed on the real deployed origin.
