// Teste de fumaça do lastmod do sitemap pela data do último commit (b-mk-15).
//   node scripts/tests/sitemap-lastmod.test.js
//
// Garante que:
//   - cada URL do sitemap aponta para um .html que existe na raiz;
//   - o lastmod só anda para a frente (nunca volta uma data);
//   - URL sem histórico ou fora do www fica como está;
//   - a data é a de Brasília (commit às 22h de Brasília = mesmo dia);
//   - o deploy roda o script pelo build do wrangler.jsonc, em modo --build.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const S = require(path.join(ROOT, 'scripts', 'sitemap-lastmod.js'));

const xml = [
  '<urlset>',
  '  <url><loc>https://www.getaura.com.br/</loc><lastmod>2026-10-05</lastmod><priority>1.0</priority></url>',
  '  <url><loc>https://www.getaura.com.br/planos</loc><lastmod>2026-06-09</lastmod></url>',
  '  <url><loc>https://www.getaura.com.br/dojo</loc><lastmod>2026-11-01</lastmod></url>',
  '  <url><loc>https://www.getaura.com.br/sem-historico</loc><lastmod>2026-01-01</lastmod></url>',
  '  <url><loc>https://outro.com.br/x</loc><lastmod>2026-01-01</lastmod></url>',
  '</urlset>',
].join('\n');

const datas = { 'index.html': '2026-11-08', 'planos.html': '2026-11-08', 'dojo.html': '2026-10-15', 'x.html': '2026-12-01' };
const pedidos = [];
const { xml: novo, mudancas } = S.atualizarSitemap(xml, (f) => { pedidos.push(f); return datas[f] || null; });

assert.deepEqual(mudancas.map((m) => m.loc), ['https://www.getaura.com.br/', 'https://www.getaura.com.br/planos']);
assert.match(novo, /<loc>https:\/\/www\.getaura\.com\.br\/<\/loc><lastmod>2026-11-08<\/lastmod><priority>1\.0<\/priority>/);
assert.match(novo, /planos<\/loc><lastmod>2026-11-08</);
assert.match(novo, /dojo<\/loc><lastmod>2026-11-01</, 'nunca volta a data');
assert.match(novo, /sem-historico<\/loc><lastmod>2026-01-01</);
assert.match(novo, /outro\.com\.br\/x<\/loc><lastmod>2026-01-01</, 'fora do www fica como está');
assert.ok(!pedidos.includes('x.html'));

assert.equal(S.arquivoDaUrl('https://www.getaura.com.br/'), 'index.html');
assert.equal(S.arquivoDaUrl('https://www.getaura.com.br/sistema-para-otica'), 'sistema-para-otica.html');
assert.equal(S.arquivoDaUrl('https://www.getaura.com.br/../x'), null);

// 17/11/2026 22:30 em Brasília = 18/11 01:30 UTC: vale o dia de Brasília.
assert.equal(S.dataEmBrasilia(Date.parse('2026-11-18T01:30:00Z')), '2026-11-17');

// Toda URL do sitemap real tem o .html na raiz.
const real = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...real.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.ok(locs.length > 30);
for (const loc of locs) {
  const f = S.arquivoDaUrl(loc);
  assert.ok(f && fs.existsSync(path.join(ROOT, f)), 'sem arquivo para ' + loc);
}

// O deploy (Workers Builds roda `wrangler deploy`) passa pelo build.
const wrangler = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
assert.match(wrangler, /"command":\s*"node scripts\/sitemap-lastmod\.js --build"/);

console.log('sitemap-lastmod: ok');
