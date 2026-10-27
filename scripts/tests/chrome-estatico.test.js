// Menu e rodapé no HTML bruto (fase 2, PR 2). Sem dependência e sem rede.
//   node scripts/tests/chrome-estatico.test.js
//
// Garante que:
//   - toda página pública tem menu e rodapé no HTML, sem precisar de JS
//     (as que usavam o js/chrome.js têm o bloco gravado pelo
//     scripts/inject-chrome.py; a home, o Studio e o Dojô têm os seus; as
//     páginas legais continuam sem, como hoje);
//   - o bloco gravado é exatamente o navHTML/footerHTML do js/chrome.js, com
//     os links das verticais e do produto;
//   - rodar o script duas vezes não muda nada, e o resultado é o commitado;
//   - o js/chrome.js não injeta de novo quando o menu já está na página.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + String(e.message).replace(/\n/g, '\n       ')); }
}

// Páginas públicas: as 34 da raiz, fora Casamento* e as internas _*.
const PUBLICAS = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !f.startsWith('Casamento') && !f.startsWith('_'))
  .sort();
// Menu e rodapé próprios, escritos à mão no HTML (não vêm do chrome.js).
const PROPRIOS = ['index.html', 'studio.html', 'dojo.html'];
// Páginas legais: hoje não têm menu nem rodapé do site; continuam sem.
const LEGAIS = ['termos.html', 'privacidade.html', 'dpa.html'];

const chromeJs = read('js/chrome.js');
const template = (v) => {
  const m = chromeJs.match(new RegExp('const ' + v + ' = `([\\s\\S]*?)`;'));
  assert.ok(m, 'js/chrome.js sem ' + v);
  return m[1];
};
const NAV = template('navHTML');
const FOOTER = template('footerHTML');

const RE_BLOCO = (parte) => new RegExp('<!-- chrome:' + parte + ':start\\b[^>]*-->([\\s\\S]*?)\\n<!-- chrome:' + parte + ':end -->', 'g');
const blocos = (html, parte) => [...html.matchAll(RE_BLOCO(parte))].map((m) => m[1]);
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

const COMPARTILHADAS = PUBLICAS.filter((f) => !PROPRIOS.includes(f) && !LEGAIS.includes(f));

teste('34 páginas públicas, cada uma numa categoria', () => {
  assert.equal(PUBLICAS.length, 34, 'páginas: ' + PUBLICAS.join(', '));
  for (const f of [...PROPRIOS, ...LEGAIS]) assert.ok(PUBLICAS.includes(f), 'sumiu ' + f);
  assert.equal(COMPARTILHADAS.length, 28);
});

teste('nenhuma página pública depende de data-mount para ter menu ou rodapé', () => {
  const restos = PUBLICAS.filter((f) => /data-mount="(nav|footer)"/.test(read(f)));
  assert.deepEqual(restos, [], 'rode python scripts/inject-chrome.py e commite: ' + restos.join(', '));
});

teste('as 28 páginas do chrome.js têm o menu e o rodapé gravados, iguais ao js/chrome.js', () => {
  for (const f of COMPARTILHADAS) {
    const html = read(f);
    const nav = blocos(html, 'nav'), foot = blocos(html, 'footer');
    assert.equal(nav.length, 1, f + ': ' + nav.length + ' bloco(s) de menu');
    assert.equal(foot.length, 1, f + ': ' + foot.length + ' bloco(s) de rodapé');
    assert.equal(nav[0], NAV, f + ': menu diferente do navHTML do js/chrome.js (rode o script)');
    assert.equal(foot[0], FOOTER, f + ': rodapé diferente do footerHTML do js/chrome.js (rode o script)');
    assert.equal((html.match(/<nav class="site-nav"/g) || []).length, 1, f + ': menu duplicado');
    assert.equal((html.match(/<footer class="site-footer"/g) || []).length, 1, f + ': rodapé duplicado');
  }
});

teste('o HTML bruto dessas páginas traz os links das verticais e do produto', () => {
  const noMenu = ['/negocio', '/studio', '/dojo', '/planos', '/sobre', '/comecar'];
  const noRodape = ['/negocio', '/studio', '/dojo', '/planos', '/comparativo', '/erp-para-pequenas-empresas', '/sobre', '/privacidade', '/dpa'];
  for (const f of COMPARTILHADAS) {
    const html = read(f);
    const hNav = hrefs(blocos(html, 'nav')[0] || ''), hFoot = hrefs(blocos(html, 'footer')[0] || '');
    for (const h of noMenu) assert.ok(hNav.includes(h), f + ': menu sem ' + h);
    for (const h of noRodape) assert.ok(hFoot.includes(h), f + ': rodapé sem ' + h);
  }
});

teste('home, Studio e Dojô seguem com menu e rodapé próprios no HTML; legais seguem sem', () => {
  for (const f of PROPRIOS) {
    const html = read(f);
    assert.match(html, /<nav\b/, f + ' sem <nav>');
    assert.match(html, /<footer\b/, f + ' sem <footer>');
    assert.ok(!html.includes('chrome:nav:start'), f + ' não deveria ter o bloco do chrome.js');
  }
  const home = hrefs(read('index.html'));
  for (const h of ['/negocio', '/studio', '/dojo']) assert.ok(home.includes(h), 'home sem ' + h);
  for (const f of LEGAIS) {
    const html = read(f);
    assert.ok(!html.includes('chrome:nav:start') && !html.includes('js/chrome.js') && !html.includes('site-nav'), f + ' ganhou o menu do site');
  }
});

teste('a demo da pele 2026 usa o mesmo menu e rodapé', () => {
  const html = read('_skin-2026-demo.html');
  assert.deepEqual(blocos(html, 'nav'), [NAV]);
  assert.deepEqual(blocos(html, 'footer'), [FOOTER]);
});

// --- O script: idempotente, e o resultado é o que está commitado ---
function python() {
  for (const py of ['python3', 'python']) {
    const r = spawnSync(py, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return py;
  }
  return null;
}

teste('scripts/inject-chrome.py: partindo dos data-mount, gera o commitado; a segunda rodada não muda nada', () => {
  const py = python();
  if (!py) { console.log('       (sem python no PATH: pulado)'); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-chrome-'));
  try {
    fs.mkdirSync(path.join(tmp, 'scripts'));
    fs.mkdirSync(path.join(tmp, 'js'));
    fs.copyFileSync(path.join(ROOT, 'scripts', 'inject-chrome.py'), path.join(tmp, 'scripts', 'inject-chrome.py'));
    fs.copyFileSync(path.join(ROOT, 'js', 'chrome.js'), path.join(tmp, 'js', 'chrome.js'));
    const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
    // Volta ao estado de antes: cada bloco vira o data-mount de novo.
    for (const f of htmls) {
      const antes = read(f)
        .replace(RE_BLOCO('nav'), '<div data-mount="nav"></div>')
        .replace(RE_BLOCO('footer'), '<div data-mount="footer"></div>');
      fs.writeFileSync(path.join(tmp, f), antes);
    }
    const roda = () => {
      const r = spawnSync(py, [path.join(tmp, 'scripts', 'inject-chrome.py')], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      return Object.fromEntries(htmls.map((f) => [f, fs.readFileSync(path.join(tmp, f), 'utf8')]));
    };
    const r1 = roda();
    for (const f of htmls) assert.equal(r1[f], read(f), f + ': o script gera algo diferente do commitado');
    const r2 = roda();
    for (const f of htmls) assert.equal(r2[f], r1[f], f + ': a segunda rodada mudou o arquivo');
    const check = spawnSync(py, [path.join(tmp, 'scripts', 'inject-chrome.py'), '--check'], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    assert.equal(check.status, 0, '--check acusou mudança: ' + check.stdout);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// --- O js/chrome.js no navegador (documento de mentira, sem dependência) ---
function rodaChrome(presentes) {
  const mounts = {};
  for (const p of ['nav', 'footer', 'wa']) {
    mounts[p] = { removido: false, html: null, remove() { this.removido = true; }, set outerHTML(v) { this.html = v; } };
  }
  const document = {
    querySelector(sel) {
      const m = sel.match(/^\[data-mount="(\w+)"\]$/);
      if (m) return mounts[m[1]];
      return presentes.includes(sel) ? {} : null;
    },
  };
  vm.runInNewContext(chromeJs, { document });
  return mounts;
}

teste('js/chrome.js: com o menu e o rodapé já na página, não injeta de novo', () => {
  const m = rodaChrome(['.site-nav', '.site-footer']);
  assert.equal(m.nav.html, null); assert.equal(m.nav.removido, true);
  assert.equal(m.footer.html, null); assert.equal(m.footer.removido, true);
  assert.ok(m.wa.html && m.wa.html.includes('wa-float'), 'o botão do WhatsApp continua vindo do JS');
});

teste('js/chrome.js: sem o bloco (página antiga ou em cache), injeta como antes', () => {
  const m = rodaChrome([]);
  assert.equal(m.nav.html, NAV);
  assert.equal(m.footer.html, FOOTER);
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
