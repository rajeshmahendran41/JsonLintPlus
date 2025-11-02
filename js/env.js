/**
 * Runtime Environment Loader for JsonlintPlus
 * - Loads /config/env.json at startup
 * - Exposes window.APP_CONFIG and window.Env helpers
 * - Conditionally registers Service Worker based on config.enablePwa
 * - Provides robust fallbacks when config is missing
 */
(function envInit() {
  var DEFAULT_CONFIG = {
    appName: 'JsonlintPlus',
    environment: 'production',
    logLevel: 'info',
    analyticsEnabled: false,
    baseUrl: '',
    sentryDsn: '',
    cspReportUri: '',
    enablePwa: true
  };

  var CONFIG_READY_EVENT = 'appconfigready';

  function isSecureContext() {
    var isLocalhost = ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1 || /\.local$/.test(location.hostname);
    return location.protocol === 'https:' || isLocalhost;
  }

  function loadConfig() {
    var url = 'config/env.json?v=' + Date.now(); // avoid stale caches during deploys
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load env.json: ' + res.status);
        return res.json();
      })
      .catch(function(err) {
        console.warn('Env: using default config. Reason:', err && err.message ? err.message : err);
        return DEFAULT_CONFIG;
      });
  }

  function registerServiceWorkerIfEnabled(cfg) {
    if (!cfg || !cfg.enablePwa) {
      console.log('PWA disabled by config.');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported.');
      return;
    }
    if (!isSecureContext()) {
      console.log('Service Worker requires HTTPS or localhost.');
      return;
    }

    window.addEventListener('load', function() {
      var swUrl = 'public/service-worker.js';
      navigator.serviceWorker.register(swUrl, { scope: './' })
        .then(function(reg) {
          console.log('Service Worker registered with scope:', reg.scope);
          if (reg.update) {
            try { reg.update(); } catch (e) {}
          }
        })
        .catch(function(err) {
          console.warn('Service Worker registration failed:', err);
        });
    });
  }

  function emitReady(config) {
    try {
      var evt = new CustomEvent(CONFIG_READY_EVENT, { detail: { config: config } });
      window.dispatchEvent(evt);
    } catch (_) {
      // Fallback for environments without CustomEvent
    }
  }

  function attachHelpers(config) {
    var Env = {
      config: config,
      get: function(key, fallback) {
        if (!key) return config;
        return Object.prototype.hasOwnProperty.call(config, key) ? config[key] : fallback;
      },
      set: function(key, value) {
        config[key] = value;
      },
      onReady: function(cb) {
        if (typeof cb === 'function') {
          window.addEventListener(CONFIG_READY_EVENT, function(e) { cb(e.detail && e.detail.config ? e.detail.config : config); }, { once: true });
        }
      },
      ready: Promise.resolve(config)
    };
    window.Env = Env;
    window.APP_CONFIG = config;
  }

  // Bootstrap
  loadConfig().then(function(cfg) {
    attachHelpers(cfg);
    emitReady(cfg);
    registerServiceWorkerIfEnabled(cfg);
  });
})();