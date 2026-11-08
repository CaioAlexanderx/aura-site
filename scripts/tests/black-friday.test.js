// Teste de fumaça da página /black-friday (b-mk-29). Sem dependência e sem rede.
//   node scripts/tests/black-friday.test.js
//
// Garante que:
//   - title, meta, H1 e o texto da oferta estão no HTML bruto, exatamente
//     como aprovados (texto do Léo + mockup v3);
//   - o FAQPage do JSON-LD tem as 4 perguntas idênticas às do HTML, e o JSON-LD
//     não traz preço promocional nem Offer;
//   - os "Começar grátis" da página levam a /comecar com o UTM da campanha, e o
//     js/origem.js (que grava o primeiro toque) está na página;
//   - a janela é a mesma da faixa (02/11 a 30/11, Brasília) e, fora dela, o
//     js/black-friday.js troca a oferta pelo aviso de encerramento;
//   - /black-friday está no sitemap e tem o redirect do .html.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const B = require(path.join(ROOT, 'js', 'black-friday.js'));
const F = require(path.join(ROOT, 'js', 'faixa-bf.js'));

const PAGINA = 'black-friday.html';
const HTML = read(PAGINA);
const LINK = '/comecar?utm_source=site&utm_campaign=bf2026';

// Instantes em UTC. Brasília = UTC-3 (sem horário de verão desde 2019).
const T = (iso) => Date.parse(iso);
const ANTES = T('2026-11-02T02:59:59.999Z');    // 01/11 23:59:59 em Brasília
const ABRE = T('2026-11-02T03:00:00.000Z');     // 02/11 00:00 em Brasília
const HOJE = T('2026-11-15T15:00:00.000Z');
const ULTIMO = T('2026-12-01T02:59:59.999Z');   // 30/11 23:59:59 em Brasília
const FECHA = T('2026-12-01T03:00:00.000Z');    // 01/12 00:00 em Brasília

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + String(e.message).replace(/\n/g, '\n       ')); }
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
// Texto como o leitor vê: tag de trecho (em, b, s, small, strong, i) some; as outras viram espaço.
const texto = (s) => decode(s.replace(/<\/?(?:em|b|s|small|strong|i)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/ ([,.;:?])/g, '$1').trim();
const MAIN = HTML.slice(HTML.indexOf('<main'), HTML.indexOf('</main>'));
const TEXTO_MAIN = texto(MAIN);

// ───────────── textos exatos ─────────────
const TITLE = 'Black Friday na Aura: 50% na primeira mensalidade';
const META = 'Do sistema para loja Aura, 50% de desconto na primeira mensalidade com o código BLACK50, até 30/11 ou enquanto houver cupons. Veja as regras e como usar.';

teste('head: title, meta description, canonical e og exatamente como aprovados', () => {
  assert.equal((HTML.match(/<title>([\s\S]*?)<\/title>/) || [])[1], TITLE);
  assert.ok(HTML.includes('<meta name="description" content="' + META + '">'));
  assert.ok(HTML.includes('<link rel="canonical" href="https://www.getaura.com.br/black-friday">'));
  assert.ok(HTML.includes('<meta property="og:title" content="' + TITLE + '">'));
  assert.ok(HTML.includes('<meta property="og:description" content="' + META + '">'));
  assert.ok(HTML.includes('<meta property="og:url" content="https://www.getaura.com.br/black-friday">'));
  assert.ok(!/<meta name="robots"[^>]*noindex/.test(HTML), 'página pública: sem noindex');
});

teste('H1 único, igual ao title', () => {
  const h1 = [...HTML.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => texto(m[1]));
  assert.deepEqual(h1, [TITLE]);
});

teste('oferta no HTML bruto: abertura, valores, passos, regras e assinantes, palavra por palavra', () => {
  const trechos = [
    'Black Friday · até 30/11',
    'Crie sua conta, teste a Aura e, na hora de assinar, digite o código BLACK50 no pagamento. A primeira mensalidade sai com 50% de desconto, em qualquer plano. Vale até 30/11 ou enquanto houver cupons.',
    'Seu código BLACK50',
    'Sem cartão para começar o teste. O desconto vale ao assinar.',
    'Quanto fica a primeira mensalidade',
    'Plano mensal. Depois da primeira, o preço é o de lista e não sobe quando você vende mais.',
    'Plano Essencial de R$ 89 por R$ 44,50 na primeira mensalidade',
    'Plano Negócio de R$ 169 por R$ 84,50 na primeira mensalidade',
    'No plano anual, o desconto vale na primeira das mensalidades.',
    'Como usar, em 3 passos',
    '1 Crie a conta e use a Aura no teste Sem cartão. O teste dura 7 dias contados a partir da sua primeira venda, com limite de 15 dias desde o cadastro.',
    '2 Na hora de assinar, escolha o plano Essencial ou Negócio, mensal ou anual.',
    '3 Digite BLACK50 no pagamento Use o campo de cupom do pagamento; o valor com desconto aparece antes de confirmar.',
    'Regras, sem letra miúda',
    'O desconto é só da primeira mensalidade. Vale para uma assinatura nova, uma vez por conta. O código tem um número limitado de usos e pode acabar antes de 30/11. Ao assinar, o período de teste termina e a primeira mensalidade é cobrada. Não há fidelidade mínima.',
    'E quem já assina a Aura?',
    'O desconto é da primeira mensalidade de uma assinatura nova, então não muda a mensalidade de quem já paga. Para quem já assina, a campanha tem outro presente: indique um lojista e ganhe 1 mensalidade grátis quando ele pagar a primeira. Quem você indicar também ganha os 50% com o BLACK50. Valem até 3 indicações por ano, para contas em dia; se muitas indicações pagarem no mesmo mês, o mês grátis pode ficar para o mês seguinte.',
    'Veja a Aura funcionando na sua loja antes de assinar',
    'BLACK50 até 30/11 ou enquanto houver cupons.',
  ];
  for (const t of trechos) assert.ok(TEXTO_MAIN.includes(t), 'falta: ' + t);
});

teste('fora de propósito: sem contagem regressiva, "últimas vagas", número de lojas, Mercado Pago nem Expansão', () => {
  for (const proibido of [/faltam/i, /últimas vagas/i, /contagem/i, /Mercado Pago/i, /Expans[ãa]o/i, /\b\d+\s+(lojas|clientes|lojistas)\b/i]) {
    assert.ok(!proibido.test(TEXTO_MAIN), String(proibido));
  }
  const js = read('js/black-friday.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/setInterval/.test(js), 'nada de relógio');
});

// ───────────── FAQ = JSON-LD ─────────────
const FAQ = [
  ['O código vale no plano anual?', 'Sim, na primeira mensalidade; o anual é cobrado mês a mês.'],
  ['Perco os dias de teste se assinar antes do fim?', 'Sim: ao assinar, o teste termina e a primeira cobrança é feita; por isso, assine quando já tiver visto a Aura funcionar na sua loja. O teste dura 7 dias contados a partir da sua primeira venda, com limite de 15 dias desde o cadastro.'],
  ['Posso juntar o BLACK50 com outro código?', 'Não: o pagamento aceita um código por vez.'],
  ['Até quando vale?', 'Até 30/11/2026 ou enquanto houver cupons; depois disso o preço volta ao de lista.'],
];

function jsonLd() {
  const m = HTML.match(/<!-- jsonld:start -->\s*<script type="application\/ld\+json">([\s\S]*?)<\/script>\s*<!-- jsonld:end -->/);
  assert.ok(m, 'sem bloco JSON-LD (rode python scripts/inject-jsonld.py black-friday.html)');
  return JSON.parse(m[1]);
}

teste('FAQ do HTML: as 4 perguntas aprovadas, na ordem', () => {
  const itens = [...HTML.matchAll(/<div class="lp-faq-item"><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/div>/g)].map((m) => [texto(m[1]), texto(m[2])]);
  assert.deepEqual(itens, FAQ);
});

teste('FAQPage do JSON-LD idêntico ao HTML', () => {
  const g = jsonLd()['@graph'];
  const faq = g.filter((x) => x['@type'] === 'FAQPage');
  assert.equal(faq.length, 1);
  assert.equal(faq[0].url, 'https://www.getaura.com.br/black-friday');
  const qa = faq[0].mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
  assert.deepEqual(qa, FAQ);
});

teste('JSON-LD sem preço promocional e sem Offer (oferta com validade só no HTML visível)', () => {
  const g = jsonLd()['@graph'];
  assert.deepEqual(g.map((x) => x['@type']).sort(), ['BreadcrumbList', 'FAQPage', 'WebPage']);
  const s = JSON.stringify(g);
  for (const p of ['44,50', '44.50', '84,50', '84.50', '"Offer"', 'priceValidUntil']) assert.ok(!s.includes(p), 'JSON-LD com ' + p);
  const web = g.find((x) => x['@type'] === 'WebPage');
  assert.equal(web.name, TITLE);
  assert.equal(web.description, META);
});

// ───────────── links e UTM ─────────────
teste('os "Começar grátis" da página levam a /comecar com utm_source=site e utm_campaign=bf2026', () => {
  const links = [...MAIN.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((m) => [decode(m[1]), m[2].trim()]);
  const comecar = links.filter(([, t]) => t === 'Começar grátis');
  assert.equal(comecar.length, 2, 'topo e chamada final');
  for (const [href] of comecar) assert.equal(href, LINK);
  assert.deepEqual(links.filter(([, t]) => t !== 'Começar grátis'), [['#regras', 'Ver as regras']]);
  const u = new URL(LINK, 'https://www.getaura.com.br');
  assert.equal(u.pathname, '/comecar');
  assert.equal(u.searchParams.get('utm_source'), 'site');
  assert.equal(u.searchParams.get('utm_campaign'), 'bf2026');
  assert.ok(MAIN.includes('id="regras"'), 'âncora de "Ver as regras"');
});

teste('origem gravada pelo fluxo de sempre: js/origem.js com defer, uma vez', () => {
  assert.equal((HTML.match(/<script src="\/js\/origem\.js" defer><\/script>/g) || []).length, 1);
  // o js/origem.js lê o utm_campaign (o /comecar grava o primeiro toque e o manda no register)
  const O = require(path.join(ROOT, 'js', 'origem.js'));
  assert.deepEqual(O.parseUtm(new URL(LINK, 'https://x').search), { utm_source: 'site', utm_campaign: 'bf2026' });
});

teste('js/black-friday.js no <head>, uma vez, sem defer nem async; faixa-bf.js fora desta página', () => {
  const head = HTML.slice(0, HTML.indexOf('</head>'));
  assert.equal((HTML.match(/js\/black-friday\.js/g) || []).length, 1);
  assert.match(head, /<script src="\/js\/black-friday\.js\?v=\d+"><\/script>/);
  assert.ok(head.indexOf('/js/black-friday.js') < head.indexOf('<style>'), 'antes do CSS da página');
  assert.ok(!HTML.includes('faixa-bf.js'));
  assert.ok(HTML.includes('html.bf-encerrada main[data-bf-oferta] { display: none !important; }'), 'CSS esconde a oferta antes do JS trocar');
});

teste('menu e rodapé do site no HTML bruto (gravados pelo inject-chrome.py)', () => {
  assert.ok(!/data-mount="(nav|footer)"/.test(HTML));
  assert.equal((HTML.match(/<!-- chrome:nav:start/g) || []).length, 1);
  assert.equal((HTML.match(/<!-- chrome:footer:start/g) || []).length, 1);
});

teste('o aviso de encerramento não está no HTML bruto durante a campanha', () => {
  assert.ok(!/terminou/i.test(HTML));
});

// ───────────── janela em Brasília ─────────────
teste('janela: a mesma da faixa (02/11 a 30/11/2026)', () => {
  assert.equal(B.INICIO, F.INICIO);
  assert.equal(B.FIM, F.FIM);
  assert.equal(B.INICIO, '2026-11-02');
  assert.equal(B.FIM, '2026-11-30');
});

teste('janela: de 02/11 00:00 a 30/11 23:59:59 (Brasília), fora disso não', () => {
  assert.equal(B.dataSP(ULTIMO), '2026-11-30');
  assert.equal(B.dataSP(FECHA), '2026-12-01');
  assert.equal(B.dentroDaJanela(ANTES), false);
  assert.equal(B.dentroDaJanela(ABRE), true);
  assert.equal(B.dentroDaJanela(HOJE), true);
  assert.equal(B.dentroDaJanela(ULTIMO), true);
  assert.equal(B.dentroDaJanela(FECHA), false);
  assert.equal(B.dentroDaJanela(T('2027-11-15T15:00:00Z')), false); // ano que vem não reabre
  assert.equal(B.dentroDaJanela(NaN), false);
});

teste('aviso de encerramento: texto exato num H1', () => {
  assert.equal(B.TEXTO_FIM, 'A Black Friday da Aura terminou, volte na próxima');
  assert.ok(B.HTML_FIM.includes('<h1 class="bf-h1">A Black Friday da Aura terminou, volte na próxima</h1>'));
  assert.ok(!/BLACK50|50%|bf2026/.test(B.HTML_FIM), 'nada de oferta no aviso');
});

// ───────────── no navegador (DOM de mentira) ─────────────
function navegador({ agora = HOJE, readyState = 'complete', semIntl = false, clipboard = true } = {}) {
  const classes = new Set();
  const listeners = {};
  const botao = { hidden: true, textContent: 'Copiar', listeners: {}, addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); } };
  const parent = { children: [], insertBefore(n, ref) { this.children.splice(this.children.indexOf(ref), 0, n); n.parentNode = this; }, removeChild(n) { this.children = this.children.filter((x) => x !== n); n.parentNode = null; } };
  const oferta = { tag: 'main', oferta: true, parentNode: parent };
  parent.children.push(oferta);
  const doc = {
    readyState, title: TITLE,
    documentElement: { classList: { add: (c) => classes.add(c), contains: (c) => classes.has(c) } },
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    createElement: (tag) => ({ tag, className: '', id: '', innerHTML: '', parentNode: null }),
    querySelector(sel) {
      if (sel === 'main[data-bf-oferta]') return parent.children.find((n) => n.oferta) || null;
      if (sel === '[data-bf-copiar]') return botao;
      return null;
    },
  };
  const copiados = [];
  const nav = clipboard ? { clipboard: { writeText: (t) => { copiados.push(t); return Promise.resolve(); } } } : {};
  const win = {};
  const RealDate = Date;
  const FakeDate = class extends RealDate { constructor(...a) { super(...(a.length ? a : [agora])); } static now() { return agora; } };
  vm.runInNewContext(read('js/black-friday.js'), { self: win, window: win, document: doc, navigator: nav, Date: FakeDate, Intl: semIntl ? undefined : Intl, Math, isFinite, setTimeout: () => 0 });
  const pronto = () => (listeners.DOMContentLoaded || []).forEach((f) => f());
  return { classes, doc, parent, oferta, botao, copiados, pronto };
}

teste('navegador: dentro da janela a oferta fica, sem classe de encerrada, e o "Copiar" aparece', () => {
  for (const agora of [ABRE, HOJE, ULTIMO]) {
    const n = navegador({ agora });
    assert.ok(!n.classes.has('bf-encerrada'));
    assert.equal(n.doc.title, TITLE);
    assert.deepEqual(n.parent.children, [n.oferta]);
    assert.equal(n.botao.hidden, false);
  }
});

teste('navegador: "Copiar" copia BLACK50; sem Clipboard API o botão fica escondido', () => {
  const n = navegador();
  n.botao.listeners.click[0]();
  assert.deepEqual(n.copiados, ['BLACK50']);
  assert.equal(navegador({ clipboard: false }).botao.hidden, true);
});

teste('navegador: a partir de 01/12 marca o <html> na hora e troca a oferta pelo aviso', () => {
  for (const agora of [FECHA, T('2026-12-25T12:00:00Z'), T('2027-11-20T12:00:00Z'), ANTES]) {
    const n = navegador({ agora, readyState: 'loading' });
    assert.ok(n.classes.has('bf-encerrada'), 'classe já no <head>');
    assert.equal(n.doc.title, B.TEXTO_FIM);
    assert.deepEqual(n.parent.children, [n.oferta], 'espera o DOMContentLoaded');
    n.pronto();
    assert.equal(n.parent.children.length, 1);
    const novo = n.parent.children[0];
    assert.equal(novo.tag, 'main');
    assert.equal(novo.innerHTML, B.HTML_FIM);
    assert.equal(n.oferta.parentNode, null, 'oferta removida');
    assert.equal(n.botao.hidden, true, 'Copiar não aparece');
  }
});

teste('navegador: sem Intl com fuso, usa UTC-3 e respeita as mesmas bordas', () => {
  assert.ok(!navegador({ semIntl: true, agora: ULTIMO }).classes.has('bf-encerrada'));
  assert.ok(navegador({ semIntl: true, agora: FECHA }).classes.has('bf-encerrada'));
});

// ───────────── sitemap e redirect ─────────────
teste('sitemap: /black-friday uma vez; _redirects: .html para a URL limpa', () => {
  const sm = read('sitemap.xml');
  assert.equal((sm.match(/<loc>https:\/\/www\.getaura\.com\.br\/black-friday<\/loc>/g) || []).length, 1);
  assert.match(read('_redirects'), /^\/black-friday\.html \/black-friday 301$/m);
});

teste('arquivos novos e editados com LF', () => {
  for (const f of [PAGINA, 'js/black-friday.js', 'scripts/tests/black-friday.test.js', 'sitemap.xml', '_redirects']) {
    assert.ok(!read(f).includes('\r'), f + ' com CRLF');
  }
});

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
console.log('\ntodos os testes passaram');
