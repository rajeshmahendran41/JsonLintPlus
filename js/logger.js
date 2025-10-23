/**
 * JsonlintPlus Logger
 * - Centralized, leveled logging with optional remote forwarding
 * - Global error/unhandledrejection capturing
 * - Honors Env.config.logLevel (debug, info, warn, error, silent)
 * - No external dependencies
 *
 * Usage:
 *   Logger.info('App started', { userId: 123 });
 *   Logger.error('Something failed', err);
 *
 * Remote forwarding:
 *   Set in config/env.json:
 *     "logLevel": "info",
 *     "logEndpoint": "/logs"   // optional relative URL to POST logs
 *
 * This module is safe to load before Env; it will self-initialize when Env is ready.
 */
(function initLogger() {
  var LEVELS = ['debug', 'info', 'warn', 'error', 'silent'];
  var DEFAULT_LEVEL = 'info';
  var MAX_QUEUE = 200;
  var SEND_BATCH_SIZE = 20;
  var SEND_INTERVAL_MS = 4000;
  var queue = [];
  var sending = false;
  var flushTimer = null;

  var state = {
    level: DEFAULT_LEVEL,
    endpoint: null,
    appName: 'JsonlintPlus',
    environment: 'production',
    analyticsEnabled: false,
    installed: false
  };

  function nowISO() {
    try { return new Date().toISOString(); } catch (_) { return '';}
  }

  function levelValue(lvl) {
    var idx = LEVELS.indexOf(String(lvl || '').toLowerCase());
    return idx >= 0 ? idx : LEVELS.indexOf(DEFAULT_LEVEL);
  }

  function shouldLog(lvl) {
    return levelValue(lvl) >= levelValue(state.level) && state.level !== 'silent';
  }

  function toPlainError(err) {
    if (!err) return null;
    if (typeof err === 'string') return { message: err };
    var plain = { name: err.name || 'Error', message: err.message || String(err) };
    try { plain.stack = String(err.stack || ''); } catch(_) {}
    try {
      if (err.cause) {
        plain.cause = typeof err.cause === 'string' ? err.cause : (err.cause.message || String(err.cause));
      }
    } catch(_) {}
    return plain;
  }

  function styleFor(level) {
    switch (level) {
      case 'debug': return 'color:#9E9E9E';
      case 'info':  return 'color:#2196F3';
      case 'warn':  return 'color:#FF9800';
      case 'error': return 'color:#F44336;font-weight:bold';
      default: return '';
    }
  }

  function safeConsole(method, args) {
    try {
      var c = console && console[method] ? console[method] : console.log;
      c.apply(console, args);
    } catch (_) { /* ignore */ }
  }

  function pushQueue(entry) {
    try {
      if (queue.length >= MAX_QUEUE) queue.shift();
      queue.push(entry);
    } catch (_) { /* ignore */ }
  }

  function scheduleFlush() {
    if (sending) return;
    if (flushTimer) return;
    if (!state.endpoint) return;
    flushTimer = setTimeout(flush, SEND_INTERVAL_MS);
  }

  async function flush() {
    flushTimer = null;
    if (sending) return;
    if (!state.endpoint) return;
    if (!queue.length) return;

    sending = true;
    try {
      var batch = queue.splice(0, SEND_BATCH_SIZE);
      await fetch(state.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: state.appName,
          env: state.environment,
          ts: nowISO(),
          logs: batch
        })
      });
    } catch (_) {
      // On failure, re-queue the batch (best-effort)
      try { queue = batch.concat(queue).slice(0, MAX_QUEUE); } catch(_) {}
    } finally {
      sending = false;
      if (queue.length) scheduleFlush();
    }
  }

  function makeEntry(level, args) {
    var payload = [];
    var err = null;

    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a instanceof Error) {
        err = toPlainError(a);
        payload.push(err);
      } else {
        payload.push(a);
      }
    }

    return {
      ts: nowISO(),
      level: level,
      msg: payload[0] && typeof payload[0] === 'string' ? payload[0] : '',
      data: payload.length > 1 ? payload.slice(1) : [],
      err: err || null,
      url: (location && location.href) || '',
      ua: (navigator && navigator.userAgent) || ''
    };
  }

  function log(level) {
    return function() {
      if (!shouldLog(level)) return;

      var entry = makeEntry(level, arguments);
      // Console output with styling
      var prefix = '%c[' + state.appName + '][' + level.toUpperCase() + ']';
      var style = styleFor(level);
      var rest = [];
      if (entry.msg) rest.push(entry.msg);
      if (entry.data && entry.data.length) rest = rest.concat(entry.data);
      if (entry.err && !entry.data.includes(entry.err)) rest.push(entry.err);

      safeConsole(level === 'debug' ? 'debug' : (level === 'info' ? 'info' : (level === 'warn' ? 'warn' : 'error')), [prefix, style].concat(rest));

      // Queue for remote forwarding
      if (state.endpoint) {
        pushQueue(entry);
        scheduleFlush();
      }
    };
  }

  function group(label) {
    if (!shouldLog('debug')) return;
    try { console.group(label); } catch(_) {}
  }
  function groupEnd() {
    if (!shouldLog('debug')) return;
    try { console.groupEnd(); } catch(_) {}
  }
  function time(label) {
    if (!shouldLog('debug')) return;
    try { console.time(label); } catch(_) {}
  }
  function timeEnd(label) {
    if (!shouldLog('debug')) return;
    try { console.timeEnd(label); } catch(_) {}
  }

  function setLevel(lvl) {
    if (LEVELS.indexOf(String(lvl)) >= 0) {
      state.level = String(lvl);
    }
  }

  function installGlobalHandlers() {
    if (state.installed) return;
    state.installed = true;

    // Uncaught errors
    window.addEventListener('error', function(e) {
      try {
        var msg = e && e.message ? e.message : 'Uncaught error';
        var errObj = e && e.error ? e.error : (e && e.message ? new Error(e.message) : null);
        Logger.error(msg, errObj || {});
      } catch(_) {}
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
      try {
        var reason = e && e.reason ? e.reason : { message: 'unhandledrejection' };
        if (reason instanceof Error) {
          Logger.error('Unhandled rejection', reason);
        } else {
          Logger.error('Unhandled rejection', reason);
        }
      } catch(_) {}
    });
  }

  // Public API
  var Logger = {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    group: group,
    groupEnd: groupEnd,
    time: time,
    timeEnd: timeEnd,
    setLevel: setLevel,
    flush: flush,
    _state: state
  };

  // Attach immediately
  window.Logger = Logger;

  // Initialize with Env when ready, else fall back to defaults
  function applyEnv(eCfg) {
    try {
      if (!eCfg) eCfg = (window.Env && window.Env.config) || {};
      state.level = (eCfg.logLevel && LEVELS.includes(String(eCfg.logLevel))) ? String(eCfg.logLevel) : DEFAULT_LEVEL;
      state.endpoint = eCfg.logEndpoint || null;
      state.appName = eCfg.appName || state.appName;
      state.environment = eCfg.environment || state.environment;
      state.analyticsEnabled = !!eCfg.analyticsEnabled;
      installGlobalHandlers();
    } catch(_) {
      // still install handlers
      installGlobalHandlers();
    }
  }

  if (window.Env && window.Env.config) {
    applyEnv(window.Env.config);
  } else if (window.Env && typeof window.Env.onReady === 'function') {
    window.Env.onReady(function(cfg) { applyEnv(cfg); });
  } else {
    // No Env yet; try again after DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { applyEnv(null); });
    } else {
      applyEnv(null);
    }
  }
})();