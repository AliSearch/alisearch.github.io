# alisearch.github.io

Website of the [AliSearch](https://alisearch.github.io/) Chrome extension: home page, support page and privacy policy. Served by GitHub Pages from `main` / root.

## Languages

| Language | Home | Support | Privacy |
|---|---|---|---|
| English (default) | `/` | `/support` | `/privacy` |
| Español | `/es/` | `/es/support` | `/es/privacy` |
| Português (Brasil) | `/pt-br/` | `/pt-br/support` | `/pt-br/privacy` |
| Français | `/fr/` | `/fr/support` | `/fr/privacy` |

Source of truth for copy: `i18n/<lang>.json` + `templates/*.html`. Generated HTML is committed (no GitHub Pages build step).

## Build

```bash
npm run build    # regenerate HTML + sitemap.xml
npm run check    # fail if committed output is stale; asserts hreflang closure
```

After editing templates or `i18n/*.json`, run `npm run build` and commit the generated files.

Static assets live under `/assets/` (root-relative). Shared client script: `assets/locale.js` (language switcher + suggestion banner). Preference redirect for returning visitors is a tiny inline script in the English pages’ `<head>` only.

This repository is public: never commit secrets or internal notes here.

The privacy policy must match the extension's Chrome Web Store Privacy practices (`store/listing/privacy-practices.md` in the extension repo) and the code. Non-English privacy pages are convenience translations; the English page is authoritative. Tasks: zachrisdev/alisearch, label `mod:store` ([#81](https://github.com/zachrisdev/alisearch/issues/81)).
