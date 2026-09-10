# Deploy AbxHub to GitHub Pages

## Recommended: GitHub Actions

1. Create a new repository, e.g. `abxhub`.
2. Upload the **contents of this folder** to the repository root.
3. Commit/push to `main`.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. The included `.github/workflows/pages.yml` deploys the static PWA.
7. Open the Pages URL shown by the deployment.

All application paths are relative (`./...`), so a project URL works:

`https://USERNAME.github.io/abxhub/`

## Local test before upload

```bash
python -m http.server 8080
```

Open `http://localhost:8080/`.

Do not test by double-clicking `index.html`; service workers require localhost or HTTPS.

## Updates

When clinical data changes, update:

- `data/clinical-data.json`
- the DB version in `meta.dbVersion`
- `CACHE` in `sw.js` when releasing a new app/database package
- `CHANGELOG.md`

## Bundled references

The `references/` folder contains the supplied source PDFs and GitHub Pages will serve them as static files. Before using a public repository, verify redistribution permission for each PDF. If permission is uncertain, keep the repository private or remove the PDF files from the public build while retaining source provenance/live links.
