# Deploy to GitHub Pages

## Recommended (GitHub Actions)
1. Create a new repository, e.g. `abx-critical`.
2. Upload the **contents of this folder** to the repository root.
3. Commit/push to `main`.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. The included `.github/workflows/pages.yml` will deploy the static PWA.
7. Open the Pages URL shown by the deployment.

Because all app paths are relative (`./...`), it works when hosted at a project URL such as:
`https://USERNAME.github.io/abx-critical/`.

## Local test before upload
Run from this directory:

```bash
python -m http.server 8080
```

Open `http://localhost:8080/`.

Do not test by double-clicking `index.html`; service workers require localhost or HTTPS.
