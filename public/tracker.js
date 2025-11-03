/*
  Lightweight privacy-friendly tracker (MVP)
  Usage:
  <script defer src="https://your-domain/tracker.js" data-site-id="SITE_ID"></script>
*/
(function () {
  try {
    // Respect Do Not Track
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      console.log('⚠️ Minilytics: DNT enabled, not tracking');
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

    console.log('📊 Minilytics tracking:', payload);
    console.log('📡 Sending to:', apiOrigin + '/api/track');

    var url = apiOrigin + '/api/track';

    // Use fetch instead of sendBeacon to avoid credentials issues
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors',
      credentials: 'omit', // Don't send cookies/credentials
    }).then(function(res) {
      console.log('✅ Fetch response:', res.status, res.statusText);
      return res.json();
    }).then(function(data) {
      console.log('✅ Response data:', data);
    }).catch(function(err) {
      console.error('❌ Tracking error:', err);
    });
  } catch (e) {
    console.error('❌ Minilytics error:', e);
  }
})();
