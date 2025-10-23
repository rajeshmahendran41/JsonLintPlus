/**
 * Smoke tests for JsonlintPlus build output
 * - Starts a local static server for ./dist
 * - Verifies presence of critical PWA/SEO tags and assets
 * - Ensures service worker and manifest are reachable
 */

import { spawn } from 'node:child_process';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
const BASE = `http://localhost:${PORT}`;
const SERVER_CMD = 'npx';
const SERVER_ARGS = ['serve', './dist', '-l', String(PORT)];
const SERVER_OPTS = { stdio: 'pipe', shell: false };

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady(url, timeoutMs = 10000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await delay(250);
  }
  throw lastErr || new Error('Server readiness timed out');
}

function startServer() {
  const child = spawn(SERVER_CMD, SERVER_ARGS, SERVER_OPTS);
  child.stdout.on('data', (data) => {
    // Optional: log minimal output
    const s = data.toString();
    if (s.toLowerCase().includes('serving')) {
      // server likely ready; we'll still poll via HTTP
    }
  });
  child.stderr.on('data', (data) => {
    // Keep quiet unless needed
  });
  return child;
}

async function fetchText(pathname, okRequired = true) {
  const url = `${BASE}${pathname}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (okRequired && !res.ok) {
    throw new Error(`Fetch failed for ${pathname}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function extractMatches(html, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    matches.push(m[1] || m[0]);
  }
  return matches;
}

async function run() {
  console.log(`[Smoke] Starting server: ${SERVER_CMD} ${SERVER_ARGS.join(' ')}`);
  const server = startServer();
  let exitCode = 0;

  try {
    console.log(`[Smoke] Waiting for server on ${BASE}/index.html`);
    await waitForServerReady(`${BASE}/index.html`, 12000);

    console.log('[Smoke] Fetching index.html');
    const html = await fetchText('/index.html');
    assert(html.length > 0, 'index.html content is empty');

    // Basic SEO/PWA checks
    console.log('[Smoke] Verifying meta and manifest tags');
    assert(/<meta\s+name="theme-color"\s+content="[^"]*"/i.test(html), 'Missing theme-color meta');
    assert(/<link\s+rel="manifest"\s+href="\/manifest\.json"/i.test(html), 'Missing manifest link');
    assert(/<link\s+rel="canonical"\s+href="\/"/i.test(html), 'Missing canonical link');
    assert(/<meta\s+property="og:title"/i.test(html) && /<meta\s+name="twitter:card"/i.test(html), 'Missing OG/Twitter tags');

    // CSS and JS references rewritten to hashed assets
    console.log('[Smoke] Extracting hashed asset references');
    const cssRefs = extractMatches(html, /href="(assets\/css\/[A-Za-z0-9._-]+\.css)"/g);
    const jsRefs = extractMatches(html, /src="(assets\/js\/[A-Za-z0-9._-]+\.js)"/g);
    assert(cssRefs.length >= 1, 'No CSS asset references found');
    assert(jsRefs.length >= 1, 'No JS asset references found');

    // Check that one critical JS (ui) is present (hash ignored)
    const hasUi = jsRefs.some((p) => /assets\/js\/ui\.[A-Za-z0-9]+\.js$/.test(p));
    assert(hasUi, 'Hashed ui.js not found in index.html');

    // PWA resources reachable
    console.log('[Smoke] Fetching manifest.json');
    const manifestText = await fetchText('/manifest.json');
    const manifestOk = /"name"\s*:\s*"JSON Validator & Formatter"/.test(manifestText);
    assert(manifestOk, 'Manifest seems invalid or missing expected name');

    console.log('[Smoke] Fetching service-worker.js');
    const swText = await fetchText('/service-worker.js');
    assert(swText.includes('Service Worker'), 'Service worker content looks unexpected');

    // Optional: verify robots and sitemap existence
    console.log('[Smoke] Fetching robots.txt');
    const robots = await fetchText('/robots.txt');
    assert(/Sitemap:\s*\/sitemap\.xml/.test(robots), 'robots.txt missing Sitemap entry');

    console.log('[Smoke] Fetching sitemap.xml');
    const sitemap = await fetchText('/sitemap.xml');
    assert(/<urlset[^>]*>/.test(sitemap), 'sitemap.xml missing urlset');

    console.log('[Smoke] All checks passed');
  } catch (err) {
    exitCode = 1;
    console.error('[Smoke] FAILED:', err && err.message ? err.message : err);
  } finally {
    // Cleanup: kill server
    try {
      server.kill('SIGTERM');
    } catch (_) {
      // ignore
    }
    // Allow time for process to exit
    await delay(500);
    process.exit(exitCode);
  }
}

run().catch(async (err) => {
  console.error('[Smoke] Uncaught error:', err && err.message ? err.message : err);
  await delay(250);
  process.exit(1);
});