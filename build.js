#!/usr/bin/env node
// ============================================================
// build.js  –  Bundle & minify for production
// ============================================================

const { build } = require('esbuild');
const { minify } = require('html-minifier-terser');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

async function run() {
  fs.mkdirSync(DIST, { recursive: true });

  // 1. Bundle JS
  console.log('📦 Bundling JS...');
  await build({
    entryPoints: [path.join(SRC, 'js/main.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: '_QC',
    outfile: path.join(DIST, 'app.bundle.js'),
    target: "es2020",
  });

  // 2. Inline JS into HTML & minify HTML
  console.log('🔧 Minifying HTML...');
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(DIST, 'app.bundle.js'), 'utf8');

  // Replace <script type="module" src="js/main.js"></script> with inlined bundle
  html = html
    // Remove tailwind CDN + config (we inline tailwind via CDN for the single-file build)
    // Replace module script with inline bundle
    .replace(
      /<script type="module" src="js\/main\.js"><\/script>/,
      `<script>${js}</script>`
    );

  const minified = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeAttributeQuotes: false,
    minifyCSS: true,
    minifyJS: false, // already minified
    removeRedundantAttributes: true,
  });

  fs.writeFileSync(path.join(DIST, 'index.html'), minified);

  // 3. Copy SW
  console.log('⚙️  Copying service worker...');
  fs.copyFileSync(path.join(SRC, 'sw.js'), path.join(DIST, 'sw.js'));

  // Clean up bundle file (it's inlined)
  fs.unlinkSync(path.join(DIST, 'app.bundle.js'));

  const size = (fs.statSync(path.join(DIST, 'index.html')).size / 1024).toFixed(1);
  console.log(`\n✅ Build complete! dist/index.html → ${size} KB`);
  console.log('   dist/sw.js');
}

run().catch(e => { console.error('Build failed:', e); process.exit(1); });
