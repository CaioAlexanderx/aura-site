// Teste de fumaça dos preços no HTML (tq-17). Sem dependência.
//   node scripts/tests/precos-html.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const PLANOS = [
  { nome: 'Essencial', ancora: 'essencial', mensal: '89.00', anual: '74.17', mensalBr: 'R$ 89', anualBr: 'R$ 74,17' },
  { nome: 'Negócio', ancora: 'negocio', mensal: '169.00', anual: '140.83', mensalBr: 'R$ 169', anualBr: 'R$ 140,83' },
  { nome: 'Expansão', ancora: 'expansao', mensal: '269.00', anual: '224.17', mensalBr: 'R$ 269', anualBr: 'R$ 224,17' },
];

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

function jsonLd(file) {
  const m = read(file).match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
  assert.ok(m, 'sem JSON-LD em ' + file);
  return JSON.parse(m[1]);
}

const reValor = (brl) => new RegExp(brl.replace('$', '\\$') + '(?![0-9,])');

// o preço anual equivalente é o mensal menos 1/6 (igual ao js/plans-render.js e ao checkout do app)
teste('anual equivalente = mensal x 5/6 arredondado em centavos', () => {
  for (const p of PLANOS) {
    const esperado = (Math.round(Number(p.mensal) * (5 / 6) * 100) / 100).toFixed(2);
    assert.equal(p.anual, esperado, p.nome);
  }
});

for (const file of ['planos.html', 'index.html']) {
  const html = read(file);

  teste(`${file}: os seis valores estão no HTML estático`, () => {
    for (const p of PLANOS) {
      assert.ok(html.includes(p.anualBr), `${file} sem ${p.anualBr}`);
      assert.ok(reValor(p.mensalBr).test(html), `${file} sem ${p.mensalBr}`);
    }
  });

  teste(`${file}: frase "anual cobrado mês a mês, sem fidelidade"`, () => {
    assert.ok(html.includes('O anual é cobrado mês a mês, sem fidelidade.'));
  });

  teste(`${file}: JSON-LD é JSON válido, um Offer por plano`, () => {
    const app = jsonLd(file)['@graph'].find((g) => g['@type'] === 'SoftwareApplication');
    assert.ok(app, 'sem SoftwareApplication');
    assert.equal(app.offers.length, 3);
    PLANOS.forEach((p, i) => {
      const o = app.offers[i];
      assert.equal(o['@type'], 'Offer');
      assert.equal(o.name, 'Plano ' + p.nome);
      assert.equal(o.price, p.mensal);
      assert.equal(o.priceCurrency, 'BRL');
      assert.ok(o.url.endsWith('/planos#' + p.ancora));
      const precos = o.priceSpecification.map((s) => s.price);
      assert.deepEqual(precos, [p.mensal, p.anual]);
      for (const s of o.priceSpecification) assert.equal(s.billingIncrement, 1, 'anual é cobrado mês a mês');
    });
  });

  teste(`${file}: cada Offer só cita o preço do próprio plano (sem R$ 89 colado no pacote de R$ 169)`, () => {
    const app = jsonLd(file)['@graph'].find((g) => g['@type'] === 'SoftwareApplication');
    PLANOS.forEach((p, i) => {
      const o = app.offers[i];
      const texto = JSON.stringify(o);
      for (const outro of PLANOS.filter((x) => x !== p)) {
        assert.ok(!texto.includes(outro.mensal), `${p.nome} cita ${outro.mensal}`);
        assert.ok(!texto.includes(outro.anual), `${p.nome} cita ${outro.anual}`);
        assert.ok(!reValor(outro.mensalBr).test(o.description), `${p.nome} cita ${outro.mensalBr}`);
      }
    });
  });

  teste(`${file}: Offers dizem o que cada plano inclui (notas, usuários, crediário)`, () => {
    const app = jsonLd(file)['@graph'].find((g) => g['@type'] === 'SoftwareApplication');
    const [ess, neg, exp] = app.offers.map((o) => o.description);
    assert.match(ess, /até 50 notas/);
    assert.match(ess, /1 usuário/);
    assert.match(ess, /Crediário \(fiado\) a partir do plano Negócio/);
    assert.match(neg, /notas fiscais ilimitadas/);
    assert.match(neg, /até 3 usuários/);
    assert.match(neg, /crediário/i);
    assert.match(exp, /usuários ilimitados/);
    assert.match(exp, /crediário/i);
  });
}

teste('llms.txt: frase aprovada, alternativas e data de revisão', () => {
  const t = read('llms.txt');
  assert.ok(t.includes('Essencial: R$ 74,17 por mês no plano anual (R$ 89 no mensal). Negócio: R$ 140,83 por mês no anual (R$ 169 no mensal). Expansão: R$ 224,17 por mês no anual (R$ 269 no mensal). O anual é cobrado mês a mês, sem fidelidade.'));
  assert.ok(/GestãoClick/.test(t) && /Phibo/.test(t));
  assert.ok(t.includes('Revisado em 15/10/2026'));
  // 15/10/2026 (Caio): a frase dos 10 meses volta, ao lado do "cobrado mês a mês".
  assert.ok(t.includes('No plano anual você paga 10 meses e usa 12 (2 meses grátis).'), 'falta a frase dos 2 meses grátis');
});

teste('arquivos com fim de linha LF', () => {
  for (const f of ['planos.html', 'index.html', 'llms.txt', 'scripts/inject-jsonld.py']) {
    assert.ok(!read(f).includes('\r'), f + ' com CRLF');
  }
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
