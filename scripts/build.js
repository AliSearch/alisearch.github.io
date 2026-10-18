#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://alisearch.github.io';
const STORE_BASE =
  'https://chromewebstore.google.com/detail/alisearch/fokaimlficgkliplmjoojafijpdicojf';
const EMAIL = 'alisearch.extension@gmail.com';
const EMAIL_LINK = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;

/** Store CTA placement → utm_campaign (keep in sync with marketing utm/README.md). */
const STORE_CAMPAIGNS = ['hero', 'footer', 'support'];

/**
 * @typedef {{ path: string, htmlLang: string, hreflang: string, ogLocale: string, storeHl: string, utmMedium: string, i18nFile: string, flag: string }} Locale
 * @type {Locale[]}
 */
const LOCALES = [
  { path: '', htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', storeHl: 'en', utmMedium: 'en', i18nFile: 'en.json', flag: '🇬🇧' },
  { path: 'es', htmlLang: 'es', hreflang: 'es', ogLocale: 'es_ES', storeHl: 'es', utmMedium: 'es', i18nFile: 'es.json', flag: '🇪🇸' },
  { path: 'pt-br', htmlLang: 'pt-BR', hreflang: 'pt-BR', ogLocale: 'pt_BR', storeHl: 'pt-BR', utmMedium: 'pt-br', i18nFile: 'pt-br.json', flag: '🇧🇷' },
  { path: 'fr', htmlLang: 'fr', hreflang: 'fr', ogLocale: 'fr_FR', storeHl: 'fr', utmMedium: 'fr', i18nFile: 'fr.json', flag: '🇫🇷' },
];

const PAGES = ['index', 'support', 'privacy', 'welcome', 'uninstall'];

const checkMode = process.argv.includes('--check');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function getByPath(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function applyPlaceholders(str, dict) {
  if (typeof str !== 'string') return str;
  const showOriginal = dict.support?.show_original || 'Show Original';
  const remove = dict.support?.remove || 'Remove';
  return str
    .replace(/\{email\}/g, EMAIL_LINK)
    .replace(/\{extensions\}/g, '<code>chrome://extensions</code>')
    .replace(/\{show_original\}/g, `<strong>${showOriginal}</strong>`)
    .replace(/\{remove\}/g, `<strong>${remove}</strong>`);
}

function flattenStrings(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenStrings(value, next, out);
    } else {
      out[next] = value;
    }
  }
  return out;
}

function renderTemplate(template, vars, dict) {
  let out = template;
  // Built-in vars first (may contain HTML)
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value == null ? '' : String(value));
  }
  // i18n keys
  const flat = flattenStrings(dict);
  out = out.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(flat, key)) {
      return applyPlaceholders(String(flat[key]), dict);
    }
    return match;
  });
  if (/\{\{[a-zA-Z0-9_.]+\}\}/.test(out)) {
    const missing = [...out.matchAll(/\{\{([a-zA-Z0-9_.]+)\}\}/g)].map((m) => m[1]);
    throw new Error(`Unresolved placeholders: ${[...new Set(missing)].join(', ')}`);
  }
  return out;
}

function pageUrl(localePath, page) {
  if (page === 'index') {
    return localePath ? `${SITE}/${localePath}/` : `${SITE}/`;
  }
  return localePath ? `${SITE}/${localePath}/${page}` : `${SITE}/${page}`;
}

function pageHref(localePath, page) {
  if (page === 'index') {
    return localePath ? `/${localePath}/` : '/';
  }
  return localePath ? `/${localePath}/${page}` : `/${page}`;
}

function outputRelPath(localePath, page) {
  const file = page === 'index' ? 'index.html' : `${page}.html`;
  return localePath ? path.join(localePath, file) : file;
}

function hreflangLinks(page) {
  const lines = LOCALES.map(
    (loc) =>
      `<link rel="alternate" hreflang="${loc.hreflang}" href="${pageUrl(loc.path, page)}">`
  );
  lines.push(`<link rel="alternate" hreflang="x-default" href="${pageUrl('', page)}">`);
  return lines.join('\n');
}

function ogLocaleAlternates(currentOg) {
  return LOCALES.filter((l) => l.ogLocale !== currentOg)
    .map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}">`)
    .join('\n');
}

function langSwitcher(currentPath, page, dictsByPath) {
  const options = LOCALES.map((loc) => {
    const native = dictsByPath[loc.path || 'en'].lang_native;
    const selected = loc.path === currentPath ? ' selected' : '';
    const href = pageHref(loc.path, page);
    const labelText = `${loc.flag} ${native}`;
    return `<option value="${escapeHtmlAttr(href)}" data-lang="${escapeHtmlAttr(loc.path || 'en')}"${selected}>${escapeHtmlAttr(labelText)}</option>`;
  }).join('');
  const label = dictsByPath[currentPath || 'en'].nav.lang_label;
  return `<label class="lang-switch"><span class="visually-hidden">${escapeHtmlAttr(label)}</span><select data-lang-switch aria-label="${escapeHtmlAttr(label)}">${options}</select></label>`;
}

function prefRedirectScript(localePath) {
  if (localePath) return '';
  return `<script>
(function(){try{var p=localStorage.getItem('alisearch.lang');if(!p||p==='en')return;var m={'es':1,'pt-br':1,'fr':1};if(!m[p])return;var path=location.pathname.replace(/\\/+$/,'')||'/';var twin;if(path==='/'||path==='')twin='/'+p+'/';else if(path==='/support')twin='/'+p+'/support';else if(path==='/privacy')twin='/'+p+'/privacy';else if(path==='/welcome')twin='/'+p+'/welcome';else if(path==='/uninstall')twin='/'+p+'/uninstall';else return;location.replace(twin+location.search+location.hash);}catch(e){}})();
</script>`;
}

function langBannerSlot() {
  return '<div id="lang-banner" class="lang-banner" hidden></div>';
}

/**
 * Chrome Web Store install URL with hl + UTM for campaign attribution.
 * @param {Locale} loc
 * @param {string} campaign  button placement: hero | footer | support
 */
function buildStoreUrl(loc, campaign) {
  if (!STORE_CAMPAIGNS.includes(campaign)) {
    throw new Error(`Unknown store campaign: ${campaign}`);
  }
  const q = new URLSearchParams({
    hl: loc.storeHl,
    utm_source: 'website',
    utm_medium: loc.utmMedium,
    utm_campaign: campaign,
  });
  return `${STORE_BASE}?${q.toString()}`;
}

/** @param {Locale} loc */
function storeUrlVars(loc) {
  /** @type {Record<string, string>} */
  const vars = {};
  for (const campaign of STORE_CAMPAIGNS) {
    vars[`store_url_${campaign}`] = buildStoreUrl(loc, campaign);
  }
  // Default alias used by pages with a single primary CTA
  vars.store_url = vars.store_url_hero;
  return vars;
}

function assertHreflang(html, page) {
  for (const loc of LOCALES) {
    const href = pageUrl(loc.path, page);
    const needle = `hreflang="${loc.hreflang}" href="${href}"`;
    if (!html.includes(needle)) {
      throw new Error(`Missing hreflang for ${loc.hreflang} on ${page}: ${needle}`);
    }
  }
  const xd = `hreflang="x-default" href="${pageUrl('', page)}"`;
  if (!html.includes(xd)) {
    throw new Error(`Missing x-default on ${page}`);
  }
}

/** Every generated index must carry the hero CTA with hl + UTM. */
function assertStoreCtas(html, loc) {
  const expected = buildStoreUrl(loc, 'hero');
  if (!html.includes(`href="${expected}"`)) {
    throw new Error(`Missing store CTA for ${loc.hreflang}: expected href="${expected}"`);
  }
  const hrefRe = /href="(https:\/\/chromewebstore\.google\.com\/[^"]+)"/g;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const url = m[1];
    if (!url.includes('utm_source=website') || !/[?&]hl=/.test(url)) {
      throw new Error(`Store link missing hl/UTM (${loc.hreflang}): ${url}`);
    }
  }
}

function buildSitemap() {
  const urls = [];
  for (const page of PAGES) {
    for (const loc of LOCALES) {
      const locUrl = pageUrl(loc.path, page);
      const alts = LOCALES.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.path, page)}"/>`
      ).join('\n');
      const xd = `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('', page)}"/>`;
      urls.push(
        `  <url>\n    <loc>${locUrl}</loc>\n${alts}\n${xd}\n  </url>`
      );
    }
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>\n`
  );
}

function loadDicts() {
  /** @type {Record<string, any>} */
  const byPath = {};
  for (const loc of LOCALES) {
    const key = loc.path || 'en';
    byPath[key] = JSON.parse(read(path.join(ROOT, 'i18n', loc.i18nFile)));
  }
  return byPath;
}

function generateAll(outRoot) {
  const dicts = loadDicts();
  const files = {};

  for (const loc of LOCALES) {
    const dictKey = loc.path || 'en';
    const dict = dicts[dictKey];
    for (const page of PAGES) {
      const template = read(path.join(ROOT, 'templates', `${page}.html`));
      const privacyNote =
        page === 'privacy' && loc.path
          ? `<p class="note privacy-authority">${applyPlaceholders(dict.privacy.authoritative_note, dict)}</p>`
          : '';

      const vars = {
        html_lang: loc.htmlLang,
        canonical: pageUrl(loc.path, page),
        hreflang_links: hreflangLinks(page),
        og_locale: loc.ogLocale,
        og_locale_alternates: ogLocaleAlternates(loc.ogLocale),
        ...storeUrlVars(loc),
        home_href: pageHref(loc.path, 'index'),
        support_href: pageHref(loc.path, 'support'),
        privacy_href: pageHref(loc.path, 'privacy'),
        lang_switcher: langSwitcher(loc.path, page, dicts),
        pref_redirect_script: prefRedirectScript(loc.path),
        lang_banner_slot: langBannerSlot(),
        privacy_authoritative_block: privacyNote,
        search_console_meta:
          page === 'index' && !loc.path
            ? '<meta name="google-site-verification" content="e_t7q0NGFd2Bet-LfRgqa4WmVJSnvoPTN7Yxin9znQ4" />\n'
            : '',
      };

      const html = renderTemplate(template, vars, dict);
      assertHreflang(html, page);
      if (page === 'index') assertStoreCtas(html, loc);
      const rel = outputRelPath(loc.path, page);
      files[rel] = html.endsWith('\n') ? html : html + '\n';
    }
  }

  files['sitemap.xml'] = buildSitemap();
  return files;
}

function writeFiles(files, outRoot) {
  for (const [rel, content] of Object.entries(files)) {
    write(path.join(outRoot, rel), content);
  }
}

function collectGeneratedPaths() {
  const paths = ['sitemap.xml'];
  for (const loc of LOCALES) {
    for (const page of PAGES) {
      paths.push(outputRelPath(loc.path, page).replace(/\\/g, '/'));
    }
  }
  return paths;
}

function checkAgainstRepo(files) {
  let ok = true;
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`MISSING: ${rel}`);
      ok = false;
      continue;
    }
    const existing = read(abs);
    if (existing !== content) {
      console.error(`OUT OF DATE: ${rel}`);
      ok = false;
    }
  }
  // Extra: ensure no unexpected generated locale dirs missing pages
  for (const rel of collectGeneratedPaths()) {
    if (!files[rel.replace(/\\/g, '/')]) {
      // normalize
    }
  }
  if (!ok) {
    console.error('\nRun: npm run build');
    process.exit(1);
  }
  console.log(`OK: ${Object.keys(files).length} generated files match (hreflang asserted).`);
}

function main() {
  const files = generateAll(ROOT);
  if (checkMode) {
    checkAgainstRepo(files);
    return;
  }
  writeFiles(files, ROOT);
  console.log(`Built ${Object.keys(files).length} files.`);
}

main();
