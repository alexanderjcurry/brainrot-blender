// Turns an Expo web export into one self-contained HTML file. It works from
// GitHub Pages, any web host, or opened straight from disk.
// Usage: node scripts/inline-web.js <distDir> <out.html>
const fs = require('fs');
const path = require('path');

const [dist, out] = process.argv.slice(2);
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)];
if (!scripts.length) throw new Error('no script tags found');
for (const [tag, src] of scripts) {
  const code = fs.readFileSync(path.join(dist, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(tag, () => `<script>${code}</script>`);
}

const icon = (file) => `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '..', 'assets', 'web', file)).toString('base64')}`;

// Phone extras: a home-screen icon, full screen when launched from the home
// screen, and no double-tap zoom, text selection or grey tap flashes in play.
const phoneHead = `
    <meta name="theme-color" content="#140F2A" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-title" content="Brainrot Blender" />
    <link rel="apple-touch-icon" href="${icon('apple-touch-icon.png')}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${icon('icon-192.png')}" />
    <style>
      html, body {
        background: #140F2A;
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
    </style>
  `;

html = html
  .replace(/<link rel="icon"[^>]*>/, '')
  .replace(/<title>[^<]*<\/title>/, '<title>Brainrot Blender</title>')
  .replace('</head>', () => `${phoneHead}</head>`);

fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
