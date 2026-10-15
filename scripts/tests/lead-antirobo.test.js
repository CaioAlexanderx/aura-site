// Teste de fumaça do anti-robô do formulário de lead (t2-12, parte do site).
// Sem dependência e sem rede: o Worker roda com fetch simulado e o
// js/lead-capture.js roda num DOM de mentira.
//   node scripts/tests/lead-antirobo.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const tick = () => new Promise((r) => setImmediate(r));

const tests = [];
const teste = (nome, fn) => tests.push([nome, fn]);

// ───────────── Worker (src/worker.js) ─────────────
const PHONE = '(11) 99999-1234';

function lead(body, { origin = 'https://www.getaura.com.br' } = {}) {
  return new Request('https://www.getaura.com.br/api/lead-partial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

// Simula backend (CRM) e Turnstile siteverify; devolve as chamadas feitas.
function stubFetch({ turnstileOk = true } = {}) {
  const calls = { crm: [], verify: [] };
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u.includes('/public/leads')) {
      calls.crm.push(JSON.parse(init.body));
      return new Response('{"ok":true}', { status: 200 });
    }
    if (u.includes('turnstile/v0/siteverify')) {
      calls.verify.push(Object.fromEntries(new URLSearchParams(String(init.body))));
      return new Response(JSON.stringify({ success: turnstileOk }), { status: 200 });
    }
    return new Response('{}', { status: 200 }); // Resend etc. (sem chave não é chamado)
  };
  return calls;
}

const ENV = { SITE_LEADS_TOKEN: 'token-de-teste' };
let worker;
const call = (body, env = ENV, opts) => worker.fetch(lead(body, opts), env, {});

teste('honeypot (hp) preenchido: 200 e nada vai ao backend', async () => {
  const c = stubFetch();
  const r = await call({ whatsapp: PHONE, hp: 'x', elapsed_ms: 9000 });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(c.crm.length, 0);
});

teste('honeypot com o nome antigo (_empresa, cache velho do JS) continua valendo', async () => {
  const c = stubFetch();
  const r = await call({ whatsapp: PHONE, _empresa: 'x', t: 9000 });
  assert.equal(r.status, 200);
  assert.equal(c.crm.length, 0);
});

teste('elapsed_ms abaixo de 3000: 200 silencioso, nada vai ao backend', async () => {
  const c = stubFetch();
  for (const ms of [0, 1600, 2999]) {
    const r = await call({ whatsapp: PHONE, hp: '', elapsed_ms: ms });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  }
  assert.equal(c.crm.length, 0);
});

teste('sem elapsed_ms (ou com t antigo abaixo de 3 s) também é descartado', async () => {
  const c = stubFetch();
  await call({ whatsapp: PHONE });
  await call({ whatsapp: PHONE, t: 2000 });
  assert.equal(c.crm.length, 0);
});

teste('elapsed_ms = 3000 passa e o backend recebe hp e elapsed_ms (sem token)', async () => {
  const c = stubFetch();
  const r = await call({ whatsapp: PHONE, hp: '', elapsed_ms: 3000, page: '/planos' });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
  assert.equal(c.crm.length, 1);
  assert.equal(c.crm[0].whatsapp, PHONE);
  assert.equal(c.crm[0].hp, '');
  assert.equal(c.crm[0].elapsed_ms, 3000);
  assert.equal(c.crm[0].source, 'site_partial');
  assert.ok(!('turnstile_token' in c.crm[0]));
});

teste('celular inválido: 400; origem de fora: 403', async () => {
  stubFetch();
  const r1 = await call({ whatsapp: '123', elapsed_ms: 9000 });
  assert.equal(r1.status, 400);
  const r2 = await call({ whatsapp: PHONE, elapsed_ms: 9000 }, ENV, { origin: 'https://outro-site.com' });
  assert.equal(r2.status, 403);
});

teste('sem TURNSTILE_SECRET o token segue ao backend, que valida (e o Worker não consulta o Cloudflare)', async () => {
  const c = stubFetch();
  const r = await call({ whatsapp: PHONE, elapsed_ms: 9000, turnstile_token: 'tok-abc' });
  assert.equal(r.status, 200);
  assert.equal(c.verify.length, 0);
  assert.equal(c.crm[0].turnstile_token, 'tok-abc');
});

teste('com TURNSTILE_SECRET: sem token = 400 e nada vai ao backend', async () => {
  const c = stubFetch();
  const r = await call({ whatsapp: PHONE, elapsed_ms: 9000 }, { ...ENV, TURNSTILE_SECRET: 'segredo' });
  assert.equal(r.status, 400);
  assert.equal(c.crm.length, 0);
  assert.equal(c.verify.length, 0);
});

teste('com TURNSTILE_SECRET: token inválido = 400', async () => {
  const c = stubFetch({ turnstileOk: false });
  const r = await call({ whatsapp: PHONE, elapsed_ms: 9000, turnstile_token: 'ruim' }, { ...ENV, TURNSTILE_SECRET: 'segredo' });
  assert.equal(r.status, 400);
  assert.equal(c.verify.length, 1);
  assert.equal(c.crm.length, 0);
});

teste('com TURNSTILE_SECRET: token válido passa, o Worker valida e NÃO repassa o token (uso único)', async () => {
  const c = stubFetch({ turnstileOk: true });
  const r = await call({ whatsapp: PHONE, elapsed_ms: 9000, turnstile_token: 'bom' }, { ...ENV, TURNSTILE_SECRET: 'segredo' });
  assert.equal(r.status, 200);
  assert.equal(c.verify.length, 1);
  assert.equal(c.verify[0].secret, 'segredo');
  assert.equal(c.verify[0].response, 'bom');
  assert.equal(c.crm.length, 1);
  assert.ok(!('turnstile_token' in c.crm[0]));
});

teste('honeypot e tempo valem antes do Turnstile (robô não gasta siteverify)', async () => {
  const c = stubFetch();
  await call({ whatsapp: PHONE, hp: 'x', elapsed_ms: 9000, turnstile_token: 'a' }, { ...ENV, TURNSTILE_SECRET: 's' });
  await call({ whatsapp: PHONE, elapsed_ms: 100, turnstile_token: 'a' }, { ...ENV, TURNSTILE_SECRET: 's' });
  assert.equal(c.verify.length, 0);
});

// ───────────── HTML ─────────────
teste('HTML: honeypot invisível, fora da tela, sem nome que o navegador preenche', () => {
  for (const f of ['contato.html', 'index.html', 'planos.html']) {
    const html = read(f);
    assert.ok(!html.includes('name="_empresa"'), f + ' ainda usa name="_empresa"');
    const m = html.match(/<input[^>]*data-wa-hp[^>]*>/);
    assert.ok(m, f + ' sem honeypot');
    assert.match(m[0], /tabindex="-1"/);
    assert.match(m[0], /autocomplete="off"/);
    assert.match(m[0], /left:-9999px/);
    assert.match(m[0], /aria-hidden="true"/);
  }
  const modal = read('index.html').match(/<input[^>]*data-exit-hp[^>]*>/);
  assert.ok(modal && /tabindex="-1"/.test(modal[0]) && /autocomplete="off"/.test(modal[0]) && /left:-9999px/.test(modal[0]));
});

teste('HTML: data-turnstile-sitekey existe e está VAZIO nos três blocos e no modal', () => {
  const vistos = [];
  for (const f of ['contato.html', 'index.html', 'planos.html']) {
    for (const m of read(f).matchAll(/data-turnstile-sitekey="([^"]*)"/g)) vistos.push([f, m[1]]);
  }
  assert.equal(vistos.length, 4); // contato, planos, home (bloco) e home (modal)
  for (const [f, v] of vistos) assert.equal(v, '', f + ' com sitekey preenchida');
});

// ───────────── Cliente (js/lead-capture.js) num DOM de mentira ─────────────
function fakeEl(attrs = {}) {
  const el = {
    attrs: { ...attrs }, hidden: false, value: '', innerHTML: 'Quero que me chamem', textContent: '',
    disabled: false, style: {}, listeners: {}, parentNode: null, kids: [], map: {},
    classList: { add() {}, remove() {} },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    querySelector(sel) { return this.map[sel] || null; },
    focus() {},
    insertBefore(n, ref) { n.parentNode = this; this.kids.splice(this.kids.indexOf(ref), 0, n); },
    get selectionStart() { return this.value.length; },
  };
  return el;
}

function montaPagina(sitekeyAttr) {
  const block = fakeEl(sitekeyAttr === null ? {} : { 'data-turnstile-sitekey': sitekeyAttr });
  const form = fakeEl();
  const input = fakeEl();
  const btn = fakeEl();
  const err = fakeEl();
  const hp = fakeEl();
  const success = fakeEl();
  btn.parentNode = form; form.kids = [input, btn];
  form.map = { 'input[type="tel"]': input, 'button[type="submit"]': btn, '[data-wa-error]': err, '[data-wa-hp]': hp };
  block.map = { '[data-wa-callback]': form, '[data-wa-success]': success };
  form.hidden = true;

  const scripts = [];
  const fetches = [];
  const win = { AuraPhone: require(path.join(ROOT, 'js', 'phone-br.js')), performance: { now: () => 12345.6 } };
  const doc = {
    readyState: 'complete',
    querySelector() { return null; }, // sem #exitIntentModal
    querySelectorAll(sel) { return sel === '[data-wa-lead]' ? [block] : []; },
    createElement() { return fakeEl(); },
    head: { appendChild(s) { scripts.push(s); } },
    addEventListener() {},
  };
  const sandbox = {
    window: win, document: doc, location: { pathname: '/planos' }, performance: { now: () => 12345.6 },
    sessionStorage: { getItem: () => null, setItem() {} },
    Promise, setTimeout, console,
    fetch: (url, init) => {
      fetches.push({ url, body: JSON.parse(init.body) });
      return Promise.resolve({ status: 200, json: () => Promise.resolve({ ok: true }) });
    },
  };
  vm.runInNewContext(read('js/lead-capture.js'), sandbox);
  const submit = () => form.listeners.submit[0]({ preventDefault() {} });
  return { form, input, err, hp, btn, scripts, fetches, win, submit, block };
}

teste('cliente sem sitekey (vazio): não baixa o Turnstile e envia hp, elapsed_ms e page', async () => {
  const p = montaPagina('');
  assert.equal(p.form.hidden, false);
  p.input.value = PHONE;
  (p.input.listeners.focus || []).forEach((f) => f());
  p.submit();
  await tick();
  assert.equal(p.scripts.length, 0, 'baixou script sem sitekey');
  assert.equal(p.fetches.length, 1);
  assert.equal(p.fetches[0].url, '/api/lead-partial');
  assert.deepEqual(p.fetches[0].body, { whatsapp: PHONE, hp: '', elapsed_ms: 12346, page: '/planos' });
});

teste('cliente sem o atributo: idem (nada de Turnstile)', async () => {
  const p = montaPagina(null);
  p.input.value = PHONE;
  p.submit();
  await tick();
  assert.equal(p.scripts.length, 0);
  assert.equal(p.fetches.length, 1);
  assert.ok(!('turnstile_token' in p.fetches[0].body));
});

teste('cliente com sitekey: só baixa o script ao focar, exige o token e o envia', async () => {
  const p = montaPagina('0xCHAVE');
  assert.equal(p.scripts.length, 0, 'baixou antes de a pessoa focar');
  assert.equal(p.form.kids.length, 3, 'o espaço do widget entra antes do botão');
  assert.equal(p.form.kids[1].className, 'lc-turnstile');
  p.input.listeners.focus.forEach((f) => f());
  assert.equal(p.scripts.length, 1);
  assert.match(p.scripts[0].src, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);

  // enviou antes de resolver o desafio: não posta e avisa
  p.input.value = PHONE;
  p.submit();
  await tick();
  assert.equal(p.fetches.length, 0);
  assert.match(p.err.textContent, /Confirme a verificação/);

  // o script carrega e o widget devolve o token
  let renderOpts;
  p.win.turnstile = { render(box, opts) { renderOpts = opts; return 'w1'; }, reset() {} };
  p.scripts[0].onload();
  await tick();
  assert.equal(renderOpts.sitekey, '0xCHAVE');
  renderOpts.callback('tok-123');
  p.submit();
  await tick();
  assert.equal(p.fetches.length, 1);
  assert.equal(p.fetches[0].body.turnstile_token, 'tok-123');
  assert.equal(p.fetches[0].body.hp, '');
});

teste('cliente com sitekey mas script bloqueado: o envio segue sem token (o servidor decide)', async () => {
  const p = montaPagina('0xCHAVE');
  p.input.listeners.focus.forEach((f) => f());
  p.scripts[0].onerror();
  await tick();
  p.input.value = PHONE;
  p.submit();
  await tick();
  assert.equal(p.fetches.length, 1);
  assert.ok(!('turnstile_token' in p.fetches[0].body));
});

teste('arquivos com fim de linha LF', () => {
  for (const f of ['src/worker.js', 'js/lead-capture.js', 'css/site.css', 'contato.html', 'index.html', 'planos.html', 'scripts/tests/lead-antirobo.test.js']) {
    assert.ok(!read(f).includes('\r'), f + ' com CRLF');
  }
});

(async () => {
  worker = (await import(path.join(ROOT, 'src', 'worker.js').replace(/\\/g, '/').replace(/^([A-Za-z]):/, 'file:///$1:'))).default;
  const realFetch = globalThis.fetch;
  const realLog = console.log;
  let falhas = 0;
  console.log = () => {}; // o Worker loga cada descarte; aqui só o resultado dos testes interessa
  console.error = () => {};
  console.warn = () => {};
  for (const [nome, fn] of tests) {
    try { await fn(); realLog('ok   - ' + nome); }
    catch (e) { falhas++; realLog('FAIL - ' + nome + '\n       ' + (e && e.message)); }
  }
  globalThis.fetch = realFetch;
  if (falhas) { realLog(`\n${falhas} falha(s)`); process.exit(1); }
  realLog('\ntodos os testes passaram');
})();
