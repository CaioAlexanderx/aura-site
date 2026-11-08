// Teste de fumaça da faixa da Black Friday 2026 (home e /planos). Sem dependência.
//   node scripts/tests/faixa-bf.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const F = require(path.join(ROOT, 'js', 'faixa-bf.js'));

// Instantes em UTC. Brasília = UTC-3 (sem horário de verão desde 2019).
const T = (iso) => Date.parse(iso);
const ANTES = T('2026-11-02T02:59:59.999Z');    // 01/11 23:59:59 em Brasília
const ABRE = T('2026-11-02T03:00:00.000Z');     // 02/11 00:00 em Brasília
const HOJE = T('2026-11-15T15:00:00.000Z');
const ULTIMO = T('2026-12-01T02:59:59.999Z');   // 30/11 23:59:59 em Brasília
const FECHA = T('2026-12-01T03:00:00.000Z');    // 01/12 00:00 em Brasília

const TEXTO_FAIXA = '<b>Black Friday na Aura:</b> 50% na primeira mensalidade com o código <b>BLACK50</b>, até 30/11 ou enquanto houver cupons.';
const TEXTO_PLANO = '50% de desconto na primeira mensalidade, com o código BLACK50 digitado no pagamento. Vale até 30/11 ou enquanto houver cupons. Ao assinar, o período de teste termina e a primeira mensalidade é cobrada.';

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

// ───────────── textos exatos (do Marketing) ─────────────
teste('textos: faixa, link e linha dos planos exatamente como aprovados', () => {
  assert.equal(F.TEXTO_FAIXA, TEXTO_FAIXA);
  assert.equal(F.TEXTO_LINK, 'Ver a oferta →');
  assert.equal(F.TEXTO_PLANO, TEXTO_PLANO);
  assert.equal(F.LINK, '/black-friday?utm_source=site&utm_campaign=bf2026');
});

teste('textos: sem contagem regressiva, "últimas vagas" nem "grátis"', () => {
  const src = read('js/faixa-bf.js');
  for (const proibido of [/setInterval/, /faltam/i, /últimas vagas/i, /gr[aá]tis/i, /gr\\u00e1tis/i]) {
    assert.ok(!proibido.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), String(proibido));
  }
});

// ───────────── janela em Brasília ─────────────
teste('dataSP: dia de hoje em America/Sao_Paulo, qualquer que seja o fuso do aparelho', () => {
  assert.equal(F.dataSP(ANTES), '2026-11-01');
  assert.equal(F.dataSP(ABRE), '2026-11-02');
  assert.equal(F.dataSP(ULTIMO), '2026-11-30');
  assert.equal(F.dataSP(FECHA), '2026-12-01');
});

teste('janela: de 02/11 00:00 a 30/11 23:59:59 (Brasília), fora disso não', () => {
  assert.equal(F.dentroDaJanela(ANTES), false);
  assert.equal(F.dentroDaJanela(ABRE), true);
  assert.equal(F.dentroDaJanela(HOJE), true);
  assert.equal(F.dentroDaJanela(ULTIMO), true);
  assert.equal(F.dentroDaJanela(FECHA), false);
  assert.equal(F.dentroDaJanela(T('2027-11-15T15:00:00Z')), false); // ano que vem não reabre
  assert.equal(F.dentroDaJanela(NaN), false);
});

// ───────────── no navegador (DOM de mentira) ─────────────
function el(tag) {
  const e = {
    tagName: tag.toUpperCase(), id: '', className: '', textContent: '', innerHTML: '', children: [], parentNode: null,
    attrs: {}, listeners: {}, style: { props: {}, setProperty(k, v) { this.props[k] = v; }, removeProperty(k) { delete this.props[k]; } },
    get firstChild() { return this.children[0] || null; },
    classList: {
      set: new Set(),
      add(c) { this.set.add(c); }, remove(c) { this.set.delete(c); }, contains(c) { return this.set.has(c); },
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    insertBefore(c, ref) { c.parentNode = this; const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    querySelector(sel) { return achar(this, sel); },
    getBoundingClientRect() { return { bottom: 44 }; },
  };
  return e;
}
function casa(e, sel) {
  if (sel.startsWith('.')) return e.className.split(/\s+/).includes(sel.slice(1)) || e.classList.contains(sel.slice(1));
  if (sel.startsWith('#')) return e.id === sel.slice(1);
  return false;
}
function achar(raiz, sel) {
  for (const c of raiz.children) {
    if (casa(c, sel)) return c;
    const r = achar(c, sel);
    if (r) return r;
  }
  return null;
}

function cartao(id, featured) {
  const c = el('div');
  c.id = id;
  c.className = 'plan-card' + (featured ? ' featured' : '');
  c.classList.add('plan-card');
  if (featured) c.classList.add('featured');
  return c;
}

function navegador({ agora = HOJE, storage = {}, quebrado = false, comPlanos = false, readyState = 'complete', semIntl = false } = {}) {
  const html = el('html');
  const head = el('head');
  const body = el('body');
  const nav = el('nav'); nav.className = 'site-nav';
  body.appendChild(nav);
  html.appendChild(head); html.appendChild(body);
  if (comPlanos) {
    const grid = el('div'); grid.className = 'plan-grid';
    for (const [id, f] of [['essencial', false], ['negocio', true], ['expansao', false]]) grid.appendChild(cartao(id, f));
    body.appendChild(grid);
  }
  const doc = {
    readyState, documentElement: html, head, body, listeners: {},
    createElement: el,
    getElementById: (id) => (html.id === id ? html : achar(html, '#' + id)),
    querySelector: (sel) => achar(html, sel),
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
  };
  const ls = quebrado
    ? { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } }
    : { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); }, removeItem: (k) => { delete storage[k]; } };
  const win = {
    listeners: {},
    get localStorage() { return ls; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); },
    requestAnimationFrame: (f) => f(),
  };
  const RealDate = Date;
  const FakeDate = class extends RealDate { constructor(...a) { super(...(a.length ? a : [agora])); } static now() { return agora; } };
  vm.runInNewContext(read('js/faixa-bf.js'), { self: win, window: win, document: doc, Date: FakeDate, Intl: semIntl ? undefined : Intl, Math, JSON, isFinite });
  const faixa = () => achar(body, '.bf-faixa');
  return { win, doc, html, head, body, nav, storage, faixa };
}

teste('navegador: dentro da janela monta a faixa no topo do body, antes do menu, com texto e link', () => {
  const n = navegador();
  const f = n.faixa();
  assert.ok(f, 'faixa montada');
  assert.equal(n.body.children[0], f, 'primeiro filho do body');
  assert.equal(n.body.children[1], n.nav, 'menu logo depois');
  assert.ok(f.innerHTML.includes('<span class="bf-tx">' + TEXTO_FAIXA + '</span>'));
  assert.ok(f.innerHTML.includes('<a class="bf-ver" href="/black-friday?utm_source=site&utm_campaign=bf2026">Ver a oferta →</a>'));
  assert.match(f.innerHTML, /<button class="bf-x" type="button" data-bf-fechar aria-label="[^"]+">×<\/button>/);
  assert.equal(f.getAttribute('role'), 'region');
  assert.ok(n.html.classList.contains('bf-faixa-on'));
  assert.equal(n.html.style.props['--bf-top'], '44px', 'menu fixo desce a altura da faixa');
  assert.ok(n.head.children.some((c) => c.id === 'bf-faixa-css'), 'estilo injetado');
});

teste('navegador: o estilo tem o botão de 44 px, corte de celular e menu só na pele de hoje', () => {
  const css = navegador().head.children.find((c) => c.id === 'bf-faixa-css').textContent;
  assert.match(css, /\.bf-x\{[^}]*width:44px;height:44px/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /@media \(max-width:700px\)/);
  assert.match(css, /html\.bf-faixa-on:not\(\[data-skin="2026"\]\) \.site-nav\{top:var\(--bf-top,0px\)/);
  assert.ok(!/position:(sticky|fixed)/.test(css.split('html.bf-faixa-on')[0]), 'faixa não gruda no topo');
});

teste('navegador: antes de 02/11 e a partir de 01/12 não monta nada (nem estilo, nem linha dos planos)', () => {
  for (const agora of [ANTES, FECHA, T('2026-12-25T12:00:00Z')]) {
    const n = navegador({ agora, comPlanos: true });
    assert.equal(n.faixa(), null);
    assert.equal(n.head.children.length, 0, 'sem <style>');
    assert.equal(achar(n.body, '.bf-plano'), null);
    assert.ok(!n.html.classList.contains('bf-faixa-on'));
  }
});

teste('navegador: nas bordas da janela monta (02/11 00:00 e 30/11 23:59:59)', () => {
  assert.ok(navegador({ agora: ABRE }).faixa());
  assert.ok(navegador({ agora: ULTIMO }).faixa());
});

teste('navegador: sem Intl com fuso, usa UTC-3 e respeita as mesmas bordas', () => {
  assert.equal(navegador({ semIntl: true, agora: ANTES }).faixa(), null);
  assert.ok(navegador({ semIntl: true, agora: ABRE }).faixa());
  assert.ok(navegador({ semIntl: true, agora: ULTIMO }).faixa());
  assert.equal(navegador({ semIntl: true, agora: FECHA }).faixa(), null);
});

teste('navegador: fechar tira a faixa, devolve o menu ao topo e lembra no aparelho', () => {
  const storage = {};
  const n = navegador({ storage });
  const f = n.faixa();
  f.listeners.click[0]({ target: { closest: (s) => (s === '[data-bf-fechar]' ? {} : null) } });
  assert.equal(n.faixa(), null);
  assert.equal(storage[F.KEY], '2026-11-30');
  assert.ok(!n.html.classList.contains('bf-faixa-on'));
  assert.ok(!('--bf-top' in n.html.style.props));
  assert.equal((n.win.listeners.scroll || []).length, 0, 'sem ouvinte de rolagem');

  // clicar no texto ou no link não fecha
  const n2 = navegador();
  n2.faixa().listeners.click[0]({ target: { closest: () => null } });
  assert.ok(n2.faixa());

  // próxima visita, ainda na janela: não volta
  const n3 = navegador({ storage, agora: HOJE + 3 * 24 * 3600 * 1000 });
  assert.equal(n3.faixa(), null);
});

teste('navegador: depois de 30/11 a escolha de fechar é apagada do aparelho', () => {
  const storage = { [F.KEY]: '2026-11-30' };
  navegador({ storage, agora: FECHA });
  assert.equal(storage[F.KEY], undefined);
});

teste('navegador: localStorage bloqueado não quebra; a faixa aparece e fecha nesta página', () => {
  const n = navegador({ quebrado: true });
  assert.ok(n.faixa());
  n.faixa().listeners.click[0]({ target: { closest: () => ({}) } });
  assert.equal(n.faixa(), null);
});

teste('navegador: em /planos a linha vai no fim do cartão do Essencial e do Negócio, não no Expansão', () => {
  const n = navegador({ comPlanos: true });
  for (const id of ['essencial', 'negocio']) {
    const c = n.doc.getElementById(id);
    const ultimo = c.children[c.children.length - 1];
    assert.equal(ultimo.className, 'bf-plano', id);
    assert.equal(ultimo.textContent, TEXTO_PLANO, id);
  }
  assert.equal(achar(n.doc.getElementById('expansao'), '.bf-plano'), null);
});

teste('navegador: linha dos planos espera o DOMContentLoaded quando o script roda no começo do body', () => {
  const n = navegador({ comPlanos: true, readyState: 'loading' });
  assert.equal(achar(n.body, '.bf-plano'), null, 'cartões ainda não renderizados');
  n.doc.listeners.DOMContentLoaded.forEach((f) => f());
  assert.equal(n.doc.getElementById('essencial').children.length, 1);
  assert.equal(n.doc.getElementById('negocio').children.length, 1);
});

teste('navegador: a linha dos planos continua com a faixa fechada', () => {
  const n = navegador({ comPlanos: true, storage: { [F.KEY]: '2026-11-30' } });
  assert.equal(n.faixa(), null);
  assert.ok(achar(n.doc.getElementById('negocio'), '.bf-plano'));
});

// ───────────── HTML ─────────────
teste('HTML: script só na home e em /planos, uma vez, logo depois do <body>, sem defer nem async', () => {
  const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  for (const f of paginas) {
    const html = read(f);
    const n = (html.match(/js\/faixa-bf\.js/g) || []).length;
    if (f === 'index.html' || f === 'planos.html') {
      assert.equal(n, 1, f);
      assert.match(html, /<body[^>]*>\n<script src="\/js\/faixa-bf\.js\?v=\d+"><\/script>\n/, f);
    } else {
      assert.equal(n, 0, f);
    }
  }
});

teste('HTML: a oferta não está no HTML bruto (só existe se o JS montar dentro da janela)', () => {
  for (const f of ['index.html', 'planos.html']) {
    const html = read(f);
    assert.ok(!html.includes('BLACK50'), f);
    assert.ok(!html.includes('bf2026'), f);
  }
});

teste('HTML: em /planos o script vem antes dos cartões (que o plans-render.js monta no fim do body)', () => {
  const html = read('planos.html');
  assert.ok(html.indexOf('/js/faixa-bf.js') < html.indexOf('/js/plans-render.js'));
  assert.ok(html.includes('data-plans-render="full"'));
});

teste('arquivos novos e editados com LF', () => {
  for (const f of ['js/faixa-bf.js', 'scripts/tests/faixa-bf.test.js', 'index.html', 'planos.html']) {
    assert.ok(!read(f).includes('\r'), f + ' com CRLF');
  }
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
