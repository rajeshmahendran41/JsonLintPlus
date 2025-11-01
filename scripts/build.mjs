/**
 * Build script for JsonlintPlus
 * - Minifies CSS and JS
 * - Adds cache-busting hashed filenames
 * - Rewrites index.html references
 * - Outputs dist/ with assets manifest
 *
 * Usage:
 *   node scripts/build.mjs           Build into ./dist
 *   node scripts/build.mjs --clean   Remove ./dist
 */

import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import { glob } from 'glob';
import CleanCSS from 'clean-css';
import { transform } from 'esbuild';
import { minify as minifyHtml } from 'html-minifier-terser';

const cwd = process.cwd();
const SRC = {
  root: cwd,
  htmlDir: cwd,
  cssDir: path.join(cwd, 'css'),
  jsDir: path.join(cwd, 'js'),
};
const DIST = {
  root: path.join(cwd, 'dist'),
  assets: path.join(cwd, 'dist', 'assets'),
  css: path.join(cwd, 'dist', 'assets', 'css'),
  js: path.join(cwd, 'dist', 'assets', 'js'),
  manifest: path.join(cwd, 'dist', 'assets-manifest.json'),
};

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--clean')) {
    await cleanDist();
    console.log('Cleaned dist/');
    return;
  }

  await fs.ensureDir(DIST.root);
  await fs.ensureDir(DIST.assets);
  await fs.ensureDir(DIST.css);
  await fs.ensureDir(DIST.js);

  const manifest = {};

  // Process CSS files
  const cssFiles = await globAsync('css/*.css', { cwd: SRC.root, nodir: true });
  for (const rel of cssFiles) {
    const abs = path.join(SRC.root, rel);
    const raw = await fs.readFile(abs, 'utf8');
    const minified = new CleanCSS({
      level: 2,
      returnPromise: false,
      rebase: false,
    }).minify(raw).styles;

    const hash = shortHash(minified);
    const baseName = path.basename(rel, '.css');
    const outName = `${baseName}.${hash}.css`;
    const outPath = path.join(DIST.css, outName);
    await fs.writeFile(outPath, minified, 'utf8');

    // Record in manifest using posix paths for web
    manifest[`css/${baseName}.css`] = `assets/css/${outName}`;
    console.log(`CSS  ${rel} -> assets/css/${outName}`);
  }

  // Process JS files (minify each file individually, preserve globals/IIFEs)
  const jsFiles = await globAsync('js/*.js', { cwd: SRC.root, nodir: true });
  for (const rel of jsFiles) {
    const abs = path.join(SRC.root, rel);
    const raw = await fs.readFile(abs, 'utf8');
    const result = await transform(raw, {
      minify: true,
      target: ['es2018'],
      charset: 'utf8',
      legalComments: 'none',
      // Do NOT change module format; keep as-is (IIFE/scripts or ES module)
      // format: 'esm'/'iife' omitted to avoid wrapping IIFEs again
    });

    const minified = result.code;
    const hash = shortHash(minified);
    const baseName = path.basename(rel, '.js');
    const outName = `${baseName}.${hash}.js`;
    const outPath = path.join(DIST.js, outName);
    await fs.writeFile(outPath, minified, 'utf8');

    manifest[`js/${baseName}.js`] = `assets/js/${outName}`;
    console.log(`JS   ${rel} -> assets/js/${outName}`);
  }

  // Copy static assets from public/ (manifest, service worker, robots, etc.)
  await copyPublic();
  
  // Copy images folder
  await copyImages();
  
  // Copy blog folder
  await copyBlog();
  
  // Copy SEO and site files
  await copySeoFiles();

  // Process all HTML files in the root directory
  const htmlFiles = await globAsync('*.html', { cwd: SRC.root, nodir: true });
  
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(SRC.root, htmlFile);
    const htmlIn = await fs.readFile(htmlPath, 'utf8');
    const htmlRewritten = rewriteHtml(htmlIn, manifest);

    // Minify HTML
    const htmlOut = await minifyHtml(htmlRewritten, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true, // only inline CSS, safe
      minifyJS: false, // avoid touching inline JS (none expected)
      keepClosingSlash: true,
      useShortDoctype: true,
      sortAttributes: true,
      sortClassName: true,
    });

    await fs.writeFile(path.join(DIST.root, htmlFile), htmlOut, 'utf8');
    console.log(`HTML ${htmlFile} -> dist/${htmlFile}`);
  }

  // Process all HTML files in the blog directory
  const blogHtmlFiles = await globAsync('blog/*.html', { cwd: SRC.root, nodir: true });
  
  for (const blogHtmlFile of blogHtmlFiles) {
    const blogHtmlPath = path.join(SRC.root, blogHtmlFile);
    const blogHtmlIn = await fs.readFile(blogHtmlPath, 'utf8');
    const blogHtmlRewritten = rewriteBlogHtml(blogHtmlIn, manifest);

    // Minify HTML
    const blogHtmlOut = await minifyHtml(blogHtmlRewritten, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true, // only inline CSS, safe
      minifyJS: false, // avoid touching inline JS (none expected)
      keepClosingSlash: true,
      useShortDoctype: true,
      sortAttributes: true,
      sortClassName: true,
    });

    await fs.writeFile(path.join(DIST.root, blogHtmlFile), blogHtmlOut, 'utf8');
    console.log(`HTML ${blogHtmlFile} -> dist/${blogHtmlFile}`);
  }

  // Write manifest
  await fs.writeJSON(DIST.manifest, {
    generatedAt: new Date().toISOString(),
    version: process.env.BUILD_VERSION || '1.0.0',
    assets: manifest,
  }, { spaces: 2 });
  console.log('Wrote assets-manifest.json');

  console.log('\nBuild complete -> dist/');
}

function shortHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function posixPath(p) {
  return p.split(path.sep).join('/');
}

function rewriteHtml(html, manifest) {
  // Replace <link href="css/*.css"> and <script src="js/*.js">
  let out = html;

  // Replace CSS hrefs (relative paths)
  out = out.replace(/href="css\/([A-Za-z0-9._-]+\.css)"/g, (m, file) => {
    const key = `css/${file}`;
    const mapped = manifest[key] || key;
    return `href="/${posixPath(mapped)}"`;
  });

  // Replace CSS hrefs (absolute paths starting with /)
  out = out.replace(/href="\/css\/([A-Za-z0-9._-]+\.css)"/g, (m, file) => {
    const key = `css/${file}`;
    const mapped = manifest[key] || key;
    return `href="/${posixPath(mapped)}"`;
  });

  // Replace JS srcs (relative paths)
  out = out.replace(/src="js\/([A-Za-z0-9._-]+\.js)"/g, (m, file) => {
    const key = `js/${file}`;
    const mapped = manifest[key] || key;
    return `src="/${posixPath(mapped)}"`;
  });

  // Replace JS srcs (absolute paths starting with /)
  out = out.replace(/src="\/js\/([A-Za-z0-9._-]+\.js)"/g, (m, file) => {
    const key = `js/${file}`;
    const mapped = manifest[key] || key;
    return `src="/${posixPath(mapped)}"`;
  });

  // Add a build meta comment and preloads for critical assets (style.css, ui.js) if present
  const criticalCss = manifest['css/style.css'];
  const criticalJs = manifest['js/ui.js'];

  const preloadTags = [
    criticalCss ? `<link rel="preload" href="/${criticalCss}" as="style">` : '',
    criticalJs ? `<link rel="preload" href="/${criticalJs}" as="script" crossorigin>` : '',
  ].filter(Boolean).join('\n    ');

  out = out.replace(/<head>([\s\S]*?)<\/head>/i, (match, inner) => {
    // Avoid duplicating existing manifest/theme-color and keep GTM at the very top of <head>
    const hasManifest = /<link[^>]+rel=["']manifest["'][^>]*>/i.test(inner) || /<link[^>]+rel=["']manifest["'][^>]*>/i.test(inner);
    const hasThemeColor = /<meta[^>]+name=["']theme-color["'][^>]*>/i.test(inner) || /<meta[^>]+name=["']theme-color["'][^>]*>/i.test(inner);

    const manifestTag = hasManifest ? '' : `<link rel="manifest" href="manifest.json">`;
    const themeColorTag = hasThemeColor ? '' : `<meta name="theme-color" content="#4CAF50">`;

    const buildBlock = `
    <!-- Build: hashed assets, preloads -->
    ${manifestTag}
    ${themeColorTag}
    ${preloadTags}
  `;

    // If GTM is present, keep it first and insert build block immediately after it
    const gtmMarker = '<!-- Google Tag Manager -->';
    const gtmEndMarker = '<!-- End Google Tag Manager -->';
    const gtmStart = inner.indexOf(gtmMarker);
    if (gtmStart !== -1) {
      const gtmEnd = inner.indexOf(gtmEndMarker, gtmStart);
      const insertPos = gtmEnd !== -1 ? gtmEnd + gtmEndMarker.length : gtmStart;
      const before = inner.slice(0, insertPos);
      const after = inner.slice(insertPos);
      return `<head>${before}
    ${buildBlock}${after}</head>`;
    }

    // Default: prepend build block before existing head content
    return `<head>${buildBlock}
    ${inner}</head>`;
  });

  return out;
}

function rewriteBlogHtml(html, manifest) {
  // Replace <link href="../css/*.css"> and <script src="../js/*.js"> for blog files
  let out = html;

  // Replace CSS hrefs (blog files use relative paths)
  out = out.replace(/href="\.\.\/css\/([A-Za-z0-9._-]+\.css)"/g, (m, file) => {
    const key = `css/${file}`;
    const mapped = manifest[key] || key;
    return `href="/${posixPath(mapped)}"`;
  });

  // Replace JS srcs (blog files use relative paths)
  out = out.replace(/src="\.\.\/js\/([A-Za-z0-9._-]+\.js)"/g, (m, file) => {
    const key = `js/${file}`;
    const mapped = manifest[key] || key;
    return `src="/${posixPath(mapped)}"`;
  });

  // Add a build meta comment and preloads for critical assets (style.css, ui.js) if present
  const criticalCss = manifest['css/style.css'];
  const criticalJs = manifest['js/ui.js'];

  const preloadTags = [
    criticalCss ? `<link rel="preload" href="/${criticalCss}" as="style">` : '',
    criticalJs ? `<link rel="preload" href="/${criticalJs}" as="script" crossorigin>` : '',
  ].filter(Boolean).join('\n    ');

  out = out.replace(/<head>([\s\S]*?)<\/head>/i, (match, inner) => {
    // Avoid duplicating existing manifest/theme-color and keep GTM at the very top of <head>
    const hasManifest = /<link[^>]+rel=["']manifest["'][^>]*>/i.test(inner) || /<link[^>]+rel=["']manifest["'][^>]*>/i.test(inner);
    const hasThemeColor = /<meta[^>]+name=["']theme-color["'][^>]*>/i.test(inner) || /<meta[^>]+name=["']theme-color["'][^>]*>/i.test(inner);

    const manifestTag = hasManifest ? '' : `<link rel="manifest" href="manifest.json">`;
    const themeColorTag = hasThemeColor ? '' : `<meta name="theme-color" content="#4CAF50">`;

    const buildBlock = `
    <!-- Build: hashed assets, preloads -->
    ${manifestTag}
    ${themeColorTag}
    ${preloadTags}
  `;

    // If GTM is present, keep it first and insert build block immediately after it
    const gtmMarker = '<!-- Google Tag Manager -->';
    const gtmEndMarker = '<!-- End Google Tag Manager -->';
    const gtmStart = inner.indexOf(gtmMarker);
    if (gtmStart !== -1) {
      const gtmEnd = inner.indexOf(gtmEndMarker, gtmStart);
      const insertPos = gtmEnd !== -1 ? gtmEnd + gtmEndMarker.length : gtmStart;
      const before = inner.slice(0, insertPos);
      const after = inner.slice(insertPos);
      return `<head>${before}
    ${buildBlock}${after}</head>`;
    }

    // Default: prepend build block before existing head content
    return `<head>${buildBlock}
    ${inner}</head>`;
  });

  return out;
}

async function copyPublic() {
  const pubDir = path.join(cwd, 'public');
  try {
    const exists = await fs.pathExists(pubDir);
    if (exists) {
      await fs.copy(pubDir, DIST.root, { overwrite: true, errorOnExist: false });
      console.log('Copied public/ -> dist/');
    } else {
      // No public/ directory, skip silently
    }
  } catch (err) {
    console.warn('Warning: failed to copy public/ -> dist/:', err.message);
  }
}

async function copyImages() {
  const imagesDir = path.join(cwd, 'images');
  try {
    const exists = await fs.pathExists(imagesDir);
    if (exists) {
      await fs.copy(imagesDir, path.join(DIST.root, 'images'), { overwrite: true, errorOnExist: false });
      console.log('Copied images/ -> dist/images/');
    } else {
      // No images/ directory, skip silently
    }
  } catch (err) {
    console.warn('Warning: failed to copy images/ -> dist/images/:', err.message);
  }
}

async function copyBlog() {
  const blogDir = path.join(cwd, 'blog');
  try {
    const exists = await fs.pathExists(blogDir);
    if (exists) {
      await fs.copy(blogDir, path.join(DIST.root, 'blog'), { overwrite: true, errorOnExist: false });
      console.log('Copied blog/ -> dist/blog/');
    } else {
      // No blog/ directory, skip silently
    }
  } catch (err) {
    console.warn('Warning: failed to copy blog/ -> dist/blog/:', err.message);
  }
}

async function copySeoFiles() {
  // Copy site.webmanifest
  const webmanifestPath = path.join(cwd, 'site.webmanifest');
  try {
    const exists = await fs.pathExists(webmanifestPath);
    if (exists) {
      await fs.copy(webmanifestPath, path.join(DIST.root, 'site.webmanifest'), { overwrite: true });
      console.log('Copied site.webmanifest -> dist/site.webmanifest');
    }
  } catch (err) {
    console.warn('Warning: failed to copy site.webmanifest:', err.message);
  }
  
  // Copy sitemap.xml if it exists in root (in addition to public/)
  const sitemapPath = path.join(cwd, 'sitemap.xml');
  try {
    const exists = await fs.pathExists(sitemapPath);
    if (exists) {
      await fs.copy(sitemapPath, path.join(DIST.root, 'sitemap.xml'), { overwrite: true });
      console.log('Copied sitemap.xml -> dist/sitemap.xml');
    }
  } catch (err) {
    console.warn('Warning: failed to copy sitemap.xml:', err.message);
  }
  
  // Copy rss.xml
  const rssPath = path.join(cwd, 'rss.xml');
  try {
    const exists = await fs.pathExists(rssPath);
    if (exists) {
      await fs.copy(rssPath, path.join(DIST.root, 'rss.xml'), { overwrite: true });
      console.log('Copied rss.xml -> dist/rss.xml');
    }
  } catch (err) {
    console.warn('Warning: failed to copy rss.xml:', err.message);
  }
}

async function cleanDist() {
  await fs.remove(DIST.root);
}

// Promisified glob (glob@10+ returns a Promise)
function globAsync(pattern, options = {}) {
  return glob(pattern, options);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exitCode = 1;
});