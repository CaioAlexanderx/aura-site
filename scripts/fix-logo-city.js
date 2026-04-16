// ============================================================
// Fix index.html: replace inline SVG logos with Icon.png + remove city
// Run:
//   cp ~/aura-app/assets/Icon.png ~/aura-site/Icon.png
//   cd ~/aura-site && node scripts/fix-logo-city.js
//   git add -A && git commit -m "fix: Icon.png logo + remove city" && git push
// ============================================================
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const before = html.length;

// 1. Replace all inline SVG logos (32px) with Icon.png
html = html.replace(
  /<svg viewBox="0 0 200 200" width="32" height="32" xmlns="http:\/\/www\.w3\.org\/2000\/svg"><rect width="200" height="200" rx="44" fill="#110a2e"\/><circle cx="100" cy="100" r="14" fill="#a855f7"\/><circle cx="100" cy="100" r="5" fill="#fff" opacity="\.95"\/><\/svg>/g,
  '<img src="/Icon.png" width="32" height="32" alt="Aura" style="border-radius:8px">'
);

// 2. Replace footer SVG logo (28px) with Icon.png
html = html.replace(
  /<svg viewBox="0 0 200 200" width="28" height="28" xmlns="http:\/\/www\.w3\.org\/2000\/svg"><rect width="200" height="200" rx="44" fill="#110a2e"\/><circle cx="100" cy="100" r="14" fill="#a855f7"\/><circle cx="100" cy="100" r="5" fill="#fff" opacity="\.95"\/><\/svg>/g,
  '<img src="/Icon.png" width="28" height="28" alt="Aura" style="border-radius:6px">'
);

// 3. Remove city from footer brand text
html = html.replace(/complicação\. Jacareí, SP\./g, 'complicação.');

// 4. Remove city from footer copyright
html = html.replace(/Negócios\. Jacareí, SP\./g, 'Negócios.');

// 5. Update favicon to Icon.png
html = html.replace(
  /href="\/aura_icon\.svg" type="image\/svg\+xml"/g,
  'href="/Icon.png" type="image/png"'
);

fs.writeFileSync(file, html, 'utf8');
console.log('index.html fixed:', before, '->', html.length, 'bytes');
console.log('');
console.log('IMPORTANT: Make sure Icon.png exists in the repo root:');
console.log('  cp ~/aura-app/assets/Icon.png ~/aura-site/Icon.png');
