// Teste de fumaça da pele 2026 (fase 2, PR 1). Sem dependência e sem rede.
//   node scripts/tests/skin-2026.test.js
//
// Garante que a pele fica dormente: toda regra de css/skin-2026.css tem escopo
// em [data-skin="2026"], nada vem do Google, as fontes citadas existem, e a
// página de demonstração fica fora do sitemap, do llms.txt e dos buscadores.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const CSS = 'css/skin-2026.css';
const DEMO = '_skin-2026-demo.html';

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

// Seletores de cada bloco "seletor { ... }", fora de @font-face.
function seletores(css) {
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let profundidade = 0, buf = '', dentroFontFace = false;
  for (const ch of semComentario) {
    if (ch === '{') {
      const cab = buf.trim();
      if (profundidade === 0 && cab.startsWith('@font-face')) dentroFontFace = true;
      else if (!cab.startsWith('@') && !dentroFontFace) out.push(...cab.split(',').map((s) => s.trim()).filter(Boolean));
      profundidade++; buf = '';
    } else if (ch === '}') {
      profundidade--; buf = '';
      if (profundidade === 0) dentroFontFace = false;
    } else if (ch === ';' ) {
      buf = '';
    } else buf += ch;
  }
  return out;
}

teste('toda regra da pele tem escopo em [data-skin="2026"]', () => {
  const sel = seletores(read(CSS));
  assert.ok(sel.length > 50, 'poucos seletores lidos: ' + sel.length);
  const soltos = sel.filter((s) => !s.includes('[data-skin="2026"]'));
  assert.deepEqual(soltos, []);
});

teste('nada de Google nem @import na pele', () => {
  const css = read(CSS);
  assert.ok(!/@import/i.test(css));
  assert.ok(!/googleapis|gstatic/i.test(css));
});

teste('nomes de família próprios (não colidem com o DM Sans do tokens.css)', () => {
  const familias = [...read(CSS).matchAll(/font-family:\s*"([^"]+)"\s*;\s*font-style/g)].map((m) => m[1]);
  assert.ok(familias.length >= 16);
  for (const f of familias) assert.match(f, /^Aura /, f);
});

teste('toda fonte citada existe em assets/fonts, com a licença OFL ao lado', () => {
  const urls = [...read(CSS).matchAll(/url\("\/(assets\/fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 16);
  for (const u of urls) assert.ok(fs.existsSync(path.join(ROOT, u)), u);
  for (const l of ['OFL-DMSans.txt', 'OFL-DMMono.txt', 'OFL-InstrumentSerif.txt']) {
    assert.match(read('assets/fonts/' + l), /SIL Open Font License/, l);
  }
});

teste('nenhuma página pública carrega a pele (só a demo)', () => {
  const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  const comPele = paginas.filter((f) => /skin-2026\.css|data-skin=/.test(read(f)));
  assert.deepEqual(comPele, [DEMO]);
});

teste('demo: noindex, data-skin no <html>, fora do sitemap, do llms.txt e sem JSON-LD', () => {
  const html = read(DEMO);
  assert.match(html, /<html[^>]*data-skin="2026"/);
  assert.match(html, /<meta name="robots" content="noindex/);
  assert.ok(!html.includes('jsonld:start'));
  assert.ok(!read('sitemap.xml').includes('skin-2026'));
  assert.ok(!read('llms.txt').includes('skin-2026'));
  assert.match(read('_headers'), /\/_skin-2026-demo\n\s+X-Robots-Tag: noindex/);
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
