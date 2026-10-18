(function () {
  'use strict';

  var ENDPOINT = 'https://alisearch.nanohub.workers.dev/feedback';
  // Same obfuscation as the extension feedback popup (reversed secret).
  var OBFUSCATED_SECRET = 'IyM4fEi4QDPYeyPM1LusGOv2iRvvTqyB';

  function getSecret() {
    return OBFUSCATED_SECRET.split('').reverse().join('');
  }

  function getVersion() {
    try {
      return new URLSearchParams(location.search).get('version') || '';
    } catch (e) {
      return '';
    }
  }

  function ready() {
    var form = document.getElementById('uninstall-form');
    var thanks = document.getElementById('uninstall-thanks');
    var errorEl = document.getElementById('uninstall-error');
    var submitBtn = document.getElementById('uninstall-submit');
    if (!form || !thanks || !submitBtn) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;

      var selected = form.querySelector('input[name="reason"]:checked');
      if (!selected) {
        if (errorEl) errorEl.hidden = false;
        return;
      }

      var reason = selected.value;
      var details = (form.querySelector('#uninstall-details') || {}).value || '';
      details = String(details).trim();

      var message = reason;
      if (details) message = reason + '\n\n' + details;

      var version = getVersion();
      var metadata = {
        reason: reason,
        page: 'uninstall',
      };
      if (version) metadata.version = version;
      if (typeof navigator !== 'undefined' && navigator.userAgent) {
        metadata.userAgent = navigator.userAgent;
      }

      submitBtn.disabled = true;
      var original = submitBtn.textContent;
      submitBtn.textContent = submitBtn.getAttribute('data-sending') || '…';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret': getSecret(),
        },
        body: JSON.stringify({
          type: 'uninstall',
          message: message,
          metadata: metadata,
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.hidden = true;
          thanks.hidden = false;
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = original;
          if (errorEl) {
            errorEl.textContent =
              errorEl.getAttribute('data-send-failed') || errorEl.textContent;
            errorEl.hidden = false;
          }
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
