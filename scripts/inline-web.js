// Turns an Expo web export into one self-contained HTML file.
// Usage: node inline.js <distDir> <out.html>
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
html = html.replace(/<link rel="icon"[^>]*>/, '').replace(/<title>[^<]*<\/title>/, '<title>Brainrot Blender (prototype)</title>');
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
