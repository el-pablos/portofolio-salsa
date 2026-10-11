# Salsa's Field Notes

Static interactive portfolio for Adinda Salsa Aryadi Putri.

The content snapshot in `site/data/portfolio.json` is copied from the public source repository `el-pablos/web-porto-salsa`. Certificate scans are served from `site/assets/certificates/`; visual archive crops are derived from the repository's own documentation screenshots. The reference portfolio is used only for transferable interaction/layout principles; its source and assets are not copied.

## Structure

- `site/` — the only directory intended for public deployment
- `site/index.html`, `site/styles.css`, `site/app.js` — accessible poster-style shell, responsive map, dialogs, filters, and lightboxes
- `site/data/portfolio.json` — source-backed content snapshot
- `site/assets/` — source certificate scans, documentation screenshots, and named design crops
- `tests/` — jsdom behavior and source-provenance tests
- `tools/` — local deployment helper; it never writes credentials to disk
- `evidence/` — local-only source inspection and deployment metadata; never deploy this folder

## Local checks

```sh
node tests/test_site.cjs
python3 tools/vercel_api.py scan
# real browser + CDP smoke/accessibility test (requires Chromium)
python3 tools/browser/cdp_audit.py
```

The browser audit checks desktop/mobile width overflow, all seven map zones, certificate and design asset loading, dialog focus/escape behavior, and serious/critical axe-core violations. It also writes local screenshots under `evidence/`.

## Cleanup

The complete local workspace can be deleted after the public URL is verified:

```sh
rm -rf "$HOME/salsa-portfolio-public"
```

The Vercel project is remote and must be deleted separately from the Vercel dashboard or API if it is no longer wanted.
