# AGENTS.md

## Cursor Cloud specific instructions

This repository is the **MES Production Dashboard** — a purely static, client-side frontend (HTML + CSS + vanilla JS). There is **no package manager, no build step, no backend, and no tests** in the repo. Third-party libs (Bootstrap, Bootstrap Icons, Chart.js, Google Fonts) load from CDNs, so internet access is required for full styling/charts.

### Running the app (development)

Serve the static files from the repo root with any static HTTP server, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` (the Dashboard). Do NOT open the files via `file://` — relative asset paths and `fetch` behave best over HTTP.

### Non-obvious notes

- The app runs entirely on **in-memory mock data**. `assets/js/config/app.config.js` sets `useMockData: true`; the API layer (`assets/js/api/client.js`) returns mock data from `assets/js/api/mock-data.js` instead of hitting a backend. Setting `useMockData: false` would point at a Laravel `/api/v1` backend that is **not present in this repo**.
- Because mock data is in-memory, created/edited records (e.g. new quotations) are **not persisted across page reloads** — each navigation reloads the scripts and resets the mock dataset. This is expected, not a bug.
- The sidebar navigation links to `pages/production/index.html`, which **does not exist in the repo** (returns 404). This is a pre-existing gap, not an environment issue.
- There are **no lint/test/build commands**. "Build" is just serving the files as-is.

### Verified hello-world flow

Creating a quotation works end-to-end on mock data: Dashboard → Quotations → New Quotation → fill form → Save Quotation → "Quotation Saved" success modal. No JS console errors.
