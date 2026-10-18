(function () {
  'use strict';

  var STORAGE_LANG = 'alisearch.lang';
  var STORAGE_DISMISS = 'alisearch.lang.dismissed';
  var SUPPORTED = {
    es: { path: 'es', native: 'Español', flag: '🇪🇸' },
    'pt-br': { path: 'pt-br', native: 'Português (Brasil)', flag: '🇧🇷' },
    fr: { path: 'fr', native: 'Français', flag: '🇫🇷' },
    en: { path: '', native: 'English', flag: '🇬🇧' },
  };

  var BANNER_COPY = {
    es: {
      message: 'Esta página está disponible en {lang}.',
      switch: 'Cambiar',
      dismiss: 'No, gracias',
    },
    'pt-br': {
      message: 'Esta página está disponível em {lang}.',
      switch: 'Alterar',
      dismiss: 'Não, obrigado',
    },
    fr: {
      message: 'Cette page est disponible en {lang}.',
      switch: 'Changer',
      dismiss: 'Non merci',
    },
    en: {
      message: 'This page is available in {lang}.',
      switch: 'Switch',
      dismiss: 'No thanks',
    },
  };

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* private mode */
    }
  }

  function currentLangFromPath() {
    var path = location.pathname.replace(/\/+$/, '') || '/';
    if (
      path === '/' ||
      path === '/support' ||
      path === '/privacy' ||
      path === '/welcome' ||
      path === '/uninstall'
    ) {
      return 'en';
    }
    var m = path.match(/^\/(es|pt-br|fr)(?:\/|$)/);
    return m ? m[1] : 'en';
  }

  function pageKey() {
    var path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/es' || path === '/pt-br' || path === '/fr') return 'index';
    if (/\/support$/.test(path)) return 'support';
    if (/\/privacy$/.test(path)) return 'privacy';
    if (/\/welcome$/.test(path)) return 'welcome';
    if (/\/uninstall$/.test(path)) return 'uninstall';
    return 'index';
  }

  function hrefFor(lang, page) {
    var prefix = lang === 'en' ? '' : '/' + lang;
    if (page === 'index') return prefix ? prefix + '/' : '/';
    return (prefix || '') + '/' + page;
  }

  function matchSuggestedLang() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var raw = String(list[i] || '').toLowerCase();
      if (!raw) continue;
      if (raw === 'pt-br' || raw.indexOf('pt-br') === 0) return 'pt-br';
      if (raw === 'pt' || raw.indexOf('pt-') === 0) return 'pt-br';
      if (raw === 'es' || raw.indexOf('es-') === 0) return 'es';
      if (raw === 'fr' || raw.indexOf('fr-') === 0) return 'fr';
      if (raw === 'en' || raw.indexOf('en-') === 0) return 'en';
    }
    return null;
  }

  function bindLangSwitcher() {
    var select = document.querySelector('[data-lang-switch]');
    if (!select) return;
    select.addEventListener('change', function () {
      var opt = select.options[select.selectedIndex];
      var lang = opt.getAttribute('data-lang') || 'en';
      storageSet(STORAGE_LANG, lang);
      location.href = opt.value;
    });
  }

  function showBanner(suggested) {
    var el = document.getElementById('lang-banner');
    if (!el) return;
    var copy = BANNER_COPY[suggested] || BANNER_COPY.en;
    var info = SUPPORTED[suggested];
    var langLabel = info.flag ? info.flag + ' ' + info.native : info.native;
    var msg = copy.message.replace('{lang}', langLabel);
    el.hidden = false;
    el.innerHTML =
      '<div class="wrap lang-banner-inner">' +
      '<span>' +
      msg +
      '</span>' +
      '<span class="lang-banner-actions">' +
      '<button type="button" class="lang-banner-switch">' +
      copy.switch +
      '</button>' +
      '<button type="button" class="lang-banner-dismiss">' +
      copy.dismiss +
      '</button>' +
      '</span></div>';
    el.querySelector('.lang-banner-switch').addEventListener('click', function () {
      storageSet(STORAGE_LANG, suggested);
      location.href = hrefFor(suggested, pageKey());
    });
    el.querySelector('.lang-banner-dismiss').addEventListener('click', function () {
      storageSet(STORAGE_DISMISS, '1');
      el.hidden = true;
    });
  }

  function maybeBanner() {
    if (storageGet(STORAGE_LANG)) return;
    if (storageGet(STORAGE_DISMISS)) return;
    var suggested = matchSuggestedLang();
    if (!suggested || suggested === 'en') return;
    if (!SUPPORTED[suggested]) return;
    var current = currentLangFromPath();
    if (current === suggested) return;
    showBanner(suggested);
  }

  bindLangSwitcher();
  maybeBanner();
})();
