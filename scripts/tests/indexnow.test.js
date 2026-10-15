// Teste de fumaça do scripts/indexnow.js (t4-01). Sem dependência e sem rede.
//   node scripts/tests/indexnow.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ix = require('../indexnow.js');

const ROOT = path.join(__dirname, '..', '..');
let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

teste('a chave do repositório tem 32 hex e o arquivo traz a própria chave', () => {
  const key = ix.findKey();
  assert.match(key, /^[0-9a-f]{32}$/);
  assert.equal(fs.readFileSync(path.join(ROOT, key + '.txt'), 'utf8').trim(), key);
});

teste('sitemapUrls lê os <loc> do sitemap real', () => {
  const urls = ix.sitemapUrls(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'));
  assert.ok(urls.length >= 30);
  assert.ok(urls.includes('https://www.getaura.com.br/'));
  assert.ok(urls.includes('https://www.getaura.com.br/planos'));
  assert.ok(urls.every((u) => u.startsWith('https://www.getaura.com.br')));
});

teste('toUrl aceita caminho, caminho sem barra e URL completa', () => {
  assert.equal(ix.toUrl('/planos'), 'https://www.getaura.com.br/planos');
  assert.equal(ix.toUrl('planos'), 'https://www.getaura.com.br/planos');
  assert.equal(ix.toUrl('https://www.getaura.com.br/llms.txt'), 'https://www.getaura.com.br/llms.txt');
});

teste('fileToUrl: html vira URL limpa, index vira a raiz, o resto é ignorado', () => {
  assert.equal(ix.fileToUrl('planos.html'), 'https://www.getaura.com.br/planos');
  assert.equal(ix.fileToUrl('index.html'), 'https://www.getaura.com.br/');
  assert.equal(ix.fileToUrl('llms.txt'), 'https://www.getaura.com.br/llms.txt');
  assert.equal(ix.fileToUrl('js/site.js'), null);
  assert.equal(ix.fileToUrl('css/site.css'), null);
  assert.equal(ix.fileToUrl('docs/tutorial.html'), null);
});

teste('urlsFromChangedFiles: só o que está no sitemap (mais llms.txt), sem duplicar', () => {
  const sitemap = ['https://www.getaura.com.br/', 'https://www.getaura.com.br/planos'];
  const urls = ix.urlsFromChangedFiles(
    ['planos.html', 'js/site.js', 'Casamento-caio-e-lorena.html', 'index.html', 'llms.txt', 'planos.html', 'pagina-fora-do-sitemap.html'],
    sitemap,
  );
  assert.deepEqual(urls, [
    'https://www.getaura.com.br/planos',
    'https://www.getaura.com.br/',
    'https://www.getaura.com.br/llms.txt',
  ]);
  assert.deepEqual(ix.urlsFromChangedFiles(['js/site.js', 'css/site.css'], sitemap), []);
});

teste('buildPayload no formato do IndexNow', () => {
  const p = ix.buildPayload('a'.repeat(32), ['https://www.getaura.com.br/planos']);
  assert.deepEqual(p, {
    host: 'www.getaura.com.br',
    key: 'a'.repeat(32),
    keyLocation: 'https://www.getaura.com.br/' + 'a'.repeat(32) + '.txt',
    urlList: ['https://www.getaura.com.br/planos'],
  });
});

teste('--dry-run com URLs passadas imprime e não envia nada (sem rede)', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'indexnow.js'), '--dry-run', '/planos', '/llms.txt'], { encoding: 'utf8' });
  assert.match(out, /\[dry-run\] enviaria 2 URL/);
  assert.match(out, /https:\/\/www\.getaura\.com\.br\/planos/);
});

teste('--dry-run --all lista o sitemap inteiro mais o llms.txt', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'indexnow.js'), '--dry-run', '--all'], { encoding: 'utf8' });
  assert.match(out, /llms\.txt/);
  assert.match(out, /\[dry-run\] enviaria \d+ URL/);
});

teste('arquivos novos com LF', () => {
  for (const f of ['scripts/indexnow.js', 'scripts/tests/indexnow.test.js', 'README.md']) {
    assert.ok(!fs.readFileSync(path.join(ROOT, f), 'utf8').includes('\r'), f + ' com CRLF');
  }
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
