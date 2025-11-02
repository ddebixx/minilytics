/*
  Lightweight privacy-friendly tracker (MVP)
  Usage:
  <script defer src="https://your-domain/tracker.js" data-site-id="SITE_ID"></script>
*/
(function () {
  try {
    // Respect Do Not Track
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      return;
    }

    var scriptEl = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    var apiOrigin;
    try {
      var src = scriptEl && scriptEl.getAttribute('src');
      apiOrigin = src ? new URL(src, window.location.origin).origin : window.location.origin;
    } catch (_) {
      apiOrigin = window.location.origin;
    }

    var siteId = scriptEl && scriptEl.getAttribute('data-site-id');

    var payload = {
      domain: window.location.hostname,
      path: window.location.pathname,
      referrer: document.referrer || '',
      site_id: siteId || null,
    };

    var url = apiOrigin + '/api/track';
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: 'cors',
      }).catch(function () {});
    }
  } catch (e) {
    // swallow
  }
})();
