# alisearch.github.io

Website of the [AliSearch](https://alisearch.github.io/) Chrome extension: home, support, privacy, install welcome and uninstall survey. Served by GitHub Pages from `main` / root.

## Languages

| Language | Home | Support | Privacy | Welcome | Uninstall |
|---|---|---|---|---|---|
| English (default) | `/` | `/support` | `/privacy` | `/welcome` | `/uninstall` |
| Español | `/es/` | `/es/support` | `/es/privacy` | `/es/welcome` | `/es/uninstall` |
| Português (Brasil) | `/pt-br/` | `/pt-br/support` | `/pt-br/privacy` | `/pt-br/welcome` | `/pt-br/uninstall` |
| Français | `/fr/` | `/fr/support` | `/fr/privacy` | `/fr/welcome` | `/fr/uninstall` |

Source of truth for copy: `i18n/<lang>.json` + `templates/*.html`. Generated HTML is committed (no GitHub Pages build step).

Store “Add to Chrome” CTAs are built in `scripts/build.js` (`buildStoreUrl`): `hl` (Store locale) plus `utm_source=website`, `utm_medium=<lang>`, `utm_campaign=<placement>` (`hero` / `footer` / `support`). Template placeholders: `{{store_url_hero}}`, `{{store_url_footer}}`, `{{store_url_support}}` (and `{{store_url}}` = hero).

## Build

```bash
npm run build    # regenerate HTML + sitemap.xml
npm run check    # fail if committed output is stale; asserts hreflang closure
```

After editing templates or `i18n/*.json`, run `npm run build` and commit the generated files.

Static assets live under `/assets/` (root-relative). Shared client script: `assets/locale.js` (language switcher + suggestion banner). Preference redirect for returning visitors is a tiny inline script in the English pages’ `<head>` only.

This repository is public: never commit secrets or internal notes here.

The privacy policy must match the extension's Chrome Web Store Privacy practices (`store/listing/privacy-practices.md` in the extension repo) and the code. Non-English privacy pages are convenience translations; the English page is authoritative. Tasks: zachrisdev/alisearch, label `mod:store` ([#81](https://github.com/zachrisdev/alisearch/issues/81)).
