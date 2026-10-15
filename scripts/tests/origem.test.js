// Teste de fumaça da origem do cadastro (t2-09, parte do site). Sem dependência.
//   node scripts/tests/origem.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const O = require(path.join(ROOT, 'js', 'origem.js'));

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse('2026-10-20T12:00:00.000Z');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message); }
}

// ───────────── funções puras ─────────────
teste('parseUtm: só as cinco chaves, vazias fora, 100 caracteres no máximo, controle limpo', () => {
  const u = O.parseUtm('?utm_source=google&utm_medium=cpc&utm_campaign=black%20friday&utm_content=&utm_term=' + 'x'.repeat(150) + '&ref=REF-ABC&ramo=otica&fbclid=1');
  assert.deepEqual(Object.keys(u).sort(), ['utm_campaign', 'utm_medium', 'utm_source', 'utm_term']);
  assert.equal(u.utm_campaign, 'black friday');
  assert.equal(u.utm_term.length, 100);
  assert.deepEqual(O.parseUtm('?utm_source=%0A%09ig%00 story '), { utm_source: 'ig story' });
  assert.deepEqual(O.parseUtm(''), {});
  assert.deepEqual(O.parseUtm(undefined), {});
});

teste('externalReferrerHost: só o host, e só se for de fora do site', () => {
  assert.equal(O.externalReferrerHost('https://www.google.com/search?q=sistema+para+loja', 'www.getaura.com.br'), 'www.google.com');
  assert.equal(O.externalReferrerHost('https://l.instagram.com/?u=https%3A%2F%2Fx&e=1', 'www.getaura.com.br'), 'l.instagram.com');
  assert.equal(O.externalReferrerHost('https://www.getaura.com.br/planos', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('https://getaura.com.br/', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('https://app.getaura.com.br/login', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('http://localhost:8765/planos', 'localhost'), '');
  assert.equal(O.externalReferrerHost('', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('android-app://com.google.android.gm', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('isto não é url', 'www.getaura.com.br'), '');
  assert.equal(O.externalReferrerHost('https://' + 'a'.repeat(250) + '.com/', 'x').length, 200);
});

teste('landingPath: só o caminho, vazio vira "/", corta em 300', () => {
  assert.equal(O.landingPath('/planos'), '/planos');
  assert.equal(O.landingPath(''), '/');
  assert.equal(O.landingPath('/' + 'a'.repeat(400)).length, 300);
});

teste('decide: sem UTM e sem referrer externo não grava nada', () => {
  assert.equal(O.decide(null, {}, '', '/planos', AGORA), null);
});

teste('decide: com UTM grava; com só referrer externo grava; objeto no formato do contrato', () => {
  const a = O.decide(null, { utm_source: 'google', utm_medium: 'cpc' }, 'www.google.com', '/planos', AGORA);
  assert.deepEqual(a, { utm_source: 'google', utm_medium: 'cpc', landing_page: '/planos', referrer: 'www.google.com', first_seen_at: '2026-10-20T12:00:00.000Z' });
  const b = O.decide(null, {}, 'l.instagram.com', '/', AGORA);
  assert.deepEqual(b, { landing_page: '/', referrer: 'l.instagram.com', first_seen_at: '2026-10-20T12:00:00.000Z' });
  const c = O.decide(null, { utm_source: 'newsletter' }, '', '/comecar', AGORA);
  assert.ok(!('referrer' in c));
});

teste('decide: não sobrescreve um primeiro toque válido (menos de 30 dias)', () => {
  const antigo = { utm_source: 'google', landing_page: '/a', first_seen_at: new Date(AGORA - 29 * DIA).toISOString() };
  assert.equal(O.decide(antigo, { utm_source: 'instagram' }, 'l.instagram.com', '/b', AGORA), null);
});

teste('decide: primeiro toque vencido (30 dias ou mais), inválido ou no futuro é substituído', () => {
  const nova = { utm_source: 'instagram' };
  const vencido = { landing_page: '/a', first_seen_at: new Date(AGORA - 31 * DIA).toISOString() };
  assert.equal(O.decide(vencido, nova, '', '/b', AGORA).utm_source, 'instagram');
  assert.equal(O.decide({ landing_page: '/a', first_seen_at: 'lixo' }, nova, '', '/b', AGORA).utm_source, 'instagram');
  assert.equal(O.decide({ landing_page: '/a' }, nova, '', '/b', AGORA).utm_source, 'instagram');
  const futuro = { landing_page: '/a', first_seen_at: new Date(AGORA + 40 * DIA).toISOString() };
  assert.equal(O.decide(futuro, nova, '', '/b', AGORA).utm_source, 'instagram');
});

teste('sanitize: descarta chave desconhecida e corta tamanho', () => {
  const o = O.sanitize({ utm_source: 'a'.repeat(300), email: 'x@y.com', ref: 'REF-1', landing_page: '/p', referrer: 'r.com', first_seen_at: '2026-10-20T12:00:00.000Z', extra: 1 });
  assert.deepEqual(Object.keys(o).sort(), ['first_seen_at', 'landing_page', 'referrer', 'utm_source']);
  assert.equal(o.utm_source.length, 100);
  assert.equal(O.sanitize('texto'), null);
  assert.equal(O.sanitize(null), null);
});

// ───────────── no navegador (localStorage de mentira) ─────────────
function navegador({ search = '', referrer = '', pathname = '/planos', hostname = 'www.getaura.com.br', storage = {}, quebrado = false, agora = AGORA } = {}) {
  const ls = quebrado
    ? { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } }
    : { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } };
  const win = { localStorage: ls, location: { search, pathname, hostname } };
  const doc = { referrer };
  const RealDate = Date;
  const FakeDate = class extends RealDate { constructor(...a) { super(...(a.length ? a : [agora])); } static now() { return agora; } };
  vm.runInNewContext(read('js/origem.js'), { self: win, window: win, document: doc, URL, URLSearchParams, Date: FakeDate, JSON, Object, String, Math, isFinite, parseInt });
  return { win, storage };
}

teste('navegador: primeira visita com UTM grava aura_origem; a segunda não sobrescreve', () => {
  const storage = {};
  navegador({ search: '?utm_source=google&utm_medium=cpc&ref=REF-ABC123&ramo=otica', referrer: 'https://www.google.com/', pathname: '/planos', storage });
  const gravado = JSON.parse(storage.aura_origem);
  assert.deepEqual(gravado, { utm_source: 'google', utm_medium: 'cpc', landing_page: '/planos', referrer: 'www.google.com', first_seen_at: '2026-10-20T12:00:00.000Z' });
  assert.ok(!JSON.stringify(gravado).includes('REF-ABC123'), '?ref= não entra na origem');
  assert.ok(!JSON.stringify(gravado).includes('otica'), '?ramo= não entra na origem');

  navegador({ search: '?utm_source=instagram', pathname: '/contato', storage, agora: AGORA + 2 * DIA });
  assert.equal(JSON.parse(storage.aura_origem).utm_source, 'google');
});

teste('navegador: ?ref= e ?ramo= sozinhos (sem UTM, sem referrer externo) não gravam nada', () => {
  const storage = {};
  navegador({ search: '?ref=REF-ABC123&ramo=otica', referrer: 'https://www.getaura.com.br/planos', pathname: '/comecar', storage });
  assert.equal(storage.aura_origem, undefined);
});

teste('navegador: depois de 30 dias um novo toque vale', () => {
  const storage = {};
  navegador({ search: '?utm_source=google', storage });
  navegador({ search: '?utm_source=instagram', storage, agora: AGORA + 31 * DIA });
  assert.equal(JSON.parse(storage.aura_origem).utm_source, 'instagram');
});

teste('navegador: localStorage bloqueado não quebra e a página atual ainda tem a origem', () => {
  const { win } = navegador({ search: '?utm_source=google', quebrado: true });
  assert.equal(win.AuraOrigem.get().utm_source, 'google');
});

teste('navegador: get() devolve null sem primeiro toque e ignora localStorage adulterado', () => {
  assert.equal(navegador({}).win.AuraOrigem.get(), null);
  const storage = { aura_origem: '{"utm_source":"x","email":"a@b.com","first_seen_at":"2020-01-01T00:00:00Z"}' };
  assert.equal(navegador({ storage }).win.AuraOrigem.get(), null); // vencido
  const storage2 = { aura_origem: 'não é json' };
  assert.equal(navegador({ storage: storage2 }).win.AuraOrigem.get(), null);
});

// ───────────── /comecar manda `origem` e não quebra ?ref= nem ?ramo= ─────────────
function comecar({ search, origem }) {
  const memo = {};
  const fake = () => ({
    value: '', checked: false, hidden: false, disabled: false, textContent: '', tabIndex: 0, offsetWidth: 0, listeners: {}, kids: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    getAttribute() { return null; }, setAttribute() {}, focus() {}, appendChild() {},
    querySelector(sel) { return this.kids[sel] || (this.kids[sel] = fake()); },
    querySelectorAll() { return []; },
  });
  const doc = {
    querySelector(sel) { return memo[sel] || (memo[sel] = fake()); },
    querySelectorAll() { return []; },
    createElement: fake, createTextNode: () => ({}),
  };
  const posts = [];
  const win = {
    location: { search, href: '' }, scrollTo() {},
    AuraOrigem: origem === undefined ? undefined : { get: () => origem },
  };
  const sandbox = {
    window: win, document: doc, URLSearchParams, JSON, Promise, Object, String, Array, RegExp, parseInt, encodeURIComponent,
    setTimeout: () => 0, clearTimeout() {},
    fetch: (url, init) => {
      posts.push({ url, body: JSON.parse(init.body) });
      return Promise.resolve({ status: 201, ok: true, json: () => Promise.resolve({ token: 't' }) });
    },
  };
  vm.runInNewContext(read('js/comecar.js'), sandbox);
  const el = (sel) => doc.querySelector(sel);
  el('[data-action="skip-cnpj"]').listeners.click[0]({ preventDefault() {} });
  el('input[name="name"]').value = 'Maria da Silva';
  el('input[name="email"]').value = 'maria@exemplo.com.br';
  el('input[name="phone"]').value = '(11) 99999-1234';
  el('input[name="password"]').value = 'senha-forte-123';
  el('input[name="terms_accepted"]').checked = true;
  el('[data-action="register"]').listeners.click[0]({ preventDefault() {} });
  return posts;
}

const PRIMEIRO_TOQUE = { utm_source: 'google', utm_medium: 'cpc', landing_page: '/planos', referrer: 'www.google.com', first_seen_at: '2026-10-20T12:00:00.000Z' };

teste('comecar.js: o register leva origem, e ?ref= e ?ramo= seguem funcionando', async () => {
  const posts = comecar({ search: '?ref=REF-ABC123&ramo=otica', origem: PRIMEIRO_TOQUE });
  assert.equal(posts.length, 1);
  assert.match(posts[0].url, /\/auth\/register$/);
  const b = posts[0].body;
  assert.deepEqual(b.origem, PRIMEIRO_TOQUE);
  assert.equal(b.access_code, 'REF-ABC123');
  assert.equal(b.segment, 'otica');
  assert.equal(b.segment_source, 'landing');
  assert.equal(b.email, 'maria@exemplo.com.br');
});

teste('comecar.js: sem primeiro toque o campo origem nem vai; sem ?ref= usa COMECAR', () => {
  for (const origem of [null, undefined]) {
    const posts = comecar({ search: '?ramo=varejo', origem });
    assert.equal(posts.length, 1);
    assert.ok(!('origem' in posts[0].body));
    assert.equal(posts[0].body.access_code, 'COMECAR');
  }
});

// ───────────── HTML ─────────────
teste('HTML: js/origem.js em todas as páginas públicas (menos a do casamento), com defer e sem duplicar', () => {
  const paginas = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  assert.ok(paginas.length >= 30);
  for (const f of paginas) {
    const n = (read(f).match(/<script src="\/js\/origem\.js" defer><\/script>/g) || []).length;
    assert.equal(n, f.startsWith('Casamento') ? 0 : 1, f);
  }
});

teste('arquivos novos e editados com LF', () => {
  for (const f of ['js/origem.js', 'js/comecar.js', 'comecar.html', 'scripts/tests/origem.test.js']) {
    assert.ok(!read(f).includes('\r'), f + ' com CRLF');
  }
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
