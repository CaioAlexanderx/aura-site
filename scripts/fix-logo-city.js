// ============================================================
// Fix index.html: replace inline SVG logos with <img> + remove city
// Run: cd aura-site && node scripts/fix-logo-city.js && git add -A && git commit -m 'fix: logo img + remove city' && git push
// ============================================================
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;

// 1. Replace all inline SVG logos (32px) with <img> tag
html = html.replace(
  /<svg viewBox="0 0 200 200" width="32" height="32" xmlns="http:\/\/www\.w3\.org\/2000\/svg"><rect width="200" height="200" rx="44" fill="#110a2e"\/><circle cx="100" cy="100" r="14" fill="#a855f7"\/><circle cx="100" cy="100" r="5" fill="#fff" opacity="\.95"\/><\/svg>/g,
  '<img src="/aura_icon.svg" width="32" height="32" alt="Aura">'
);

// 2. Replace footer SVG logo (28px) with <img> tag
html = html.replace(
  /<svg viewBox="0 0 200 200" width="28" height="28" xmlns="http:\/\/www\.w3\.org\/2000\/svg"><rect width="200" height="200" rx="44" fill="#110a2e"\/><circle cx="100" cy="100" r="14" fill="#a855f7"\/><circle cx="100" cy="100" r="5" fill="#fff" opacity="\.95"\/><\/svg>/g,
  '<img src="/aura_icon.svg" width="28" height="28" alt="Aura">'
);

// 3. Remove city from footer brand text
html = html.replace(/complicação\. Jacareí, SP\./g, 'complicação.');

// 4. Remove city from footer copyright
html = html.replace(/Negócios\. Jacareí, SP\./g, 'Negócios.');

fs.writeFileSync(file, html, 'utf8');
console.log('index.html fixed:', before, '->', html.length, 'bytes');
console.log('Changes: SVG->img logo, removed Jacarei/SP from footer');
