// Teste de fumaça: o site publicado não pode prometer o que o produto não entrega.
//   node scripts/tests/promessas-sem-lastro.test.js
//
// Falha se algum arquivo SERVIDO tiver:
//   - a sigla TEF (palavra inteira) ou "TEF integrado";
//   - "multi-gateway" (qualquer caixa);
//   - "lotes, validade" ou "lotes e validade";
//   - "balanço" a até 3 palavras de estoque, lote(s) ou validade.
// "Balanço" de DRE, "teflon" e afins não quebram o teste.
//
// O mesmo vale para o JSON-LD: os blocos <script type="application/ld+json">
// são decodificados e varridos, a fonte deles (scripts/inject-jsonld.py) é
// varrida, e `inject-jsonld.py --check` tem de sair sem mudar nenhuma página
// (pula se não houver python no PATH).
//
// O que é servido: o Worker usa assets na raiz (wrangler.jsonc) e o
// .assetsignore deixa de fora app/, docs/, scripts/, src/ etc. Por isso a
// varredura cobre só *.html da raiz, llms.txt e js/*.js. Sem dependência e sem rede.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

// Pastas que não vão ao ar (espelha o .assetsignore). Só a raiz e js/ são lidas.
function arquivosPublicados() {
  const lista = [];
  for (const nome of fs.readdirSync(ROOT)) {
    const abs = path.join(ROOT, nome);
    if (!fs.statSync(abs).isFile()) continue;
    if (nome.endsWith('.html') || nome === 'llms.txt') lista.push(nome);
  }
  const jsDir = path.join(ROOT, 'js');
  if (fs.existsSync(jsDir)) {
    for (const nome of fs.readdirSync(jsDir)) {
      if (nome.endsWith('.js')) lista.push('js/' + nome);
    }
  }
  return lista.sort();
}

const RE_TEF = /\bTEF\b/;                      // "TEF" e "TEF integrado"; "teflon" não casa
const RE_MULTI_GATEWAY = /multi-gateway/i;
// "lotes, validade" e também "lotes e validade" (llms.txt e /erp-para-pequenas-empresas diziam assim).
const RE_LOTES_VALIDADE = /lotes?\s*(?:,|e)\s*validade/i;

const PERTO = /^(estoque|lote|lotes|validade)$/;
const JANELA = 3;

// Remove tags HTML para a "distância em palavras" não contar atributos.
function paraTexto(nome, conteudo) {
  return nome.endsWith('.html') ? conteudo.replace(/<[^>]*>/g, ' ') : conteudo;
}

function normaliza(palavra) {
  return palavra.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Devolve trechos com "balanço" a até 3 palavras de estoque|lote|lotes|validade.
function balancoPertoDeEstoque(texto) {
  const palavras = texto.match(/[\p{L}\p{N}]+/gu) || [];
  const norm = palavras.map(normaliza);
  const achados = [];
  norm.forEach((p, i) => {
    if (p !== 'balanco') return;
    const ini = Math.max(0, i - JANELA);
    const fim = Math.min(norm.length - 1, i + JANELA);
    for (let j = ini; j <= fim; j++) {
      if (j !== i && PERTO.test(norm[j])) {
        achados.push(palavras.slice(ini, fim + 1).join(' '));
        break;
      }
    }
  });
  return achados;
}

function linhaDe(conteudo, indice) {
  return conteudo.slice(0, indice).split('\n').length;
}

function verifica(nome, conteudo) {
  const problemas = [];
  for (const [rotulo, re] of [['TEF', RE_TEF], ['multi-gateway', RE_MULTI_GATEWAY], ['lotes, validade', RE_LOTES_VALIDADE]]) {
    const g = new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g');
    let m;
    while ((m = g.exec(conteudo))) {
      problemas.push(`${nome}:${linhaDe(conteudo, m.index)}  "${rotulo}"  ...${conteudo.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' ')}...`);
    }
  }
  for (const trecho of balancoPertoDeEstoque(paraTexto(nome, conteudo))) {
    problemas.push(`${nome}  "balanço" perto de estoque/lote/validade  ...${trecho}...`);
  }
  return problemas;
}

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('ok   - ' + nome); }
  catch (e) { falhas++; console.log('FAIL - ' + nome + '\n       ' + e.message.replace(/\n/g, '\n       ')); }
}

// --- O próprio detector: não pode gerar falso positivo nem deixar passar ---
teste('detector: TEF, TEF integrado, multi-gateway e lotes, validade são pegos', () => {
  if (!verifica('x.html', '<p>venda com TEF</p>').length) throw new Error('TEF passou');
  if (!verifica('x.html', '<p>TEF integrado</p>').length) throw new Error('TEF integrado passou');
  if (!verifica('x.txt', 'Multi-Gateway no Expansão').length) throw new Error('multi-gateway passou');
  if (!verifica('x.txt', 'Lotes, validade, entrada').length) throw new Error('lotes, validade passou');
  if (!verifica('x.txt', 'estoque; lotes e validade; entrada').length) throw new Error('lotes e validade passou');
});

teste('detector: balanço perto de estoque/lote/validade é pego (nos dois sentidos)', () => {
  if (!verifica('x.html', '<p>Lotes, validade, balanço, entrada via XML</p>').length) throw new Error('balanço depois de validade passou');
  if (!verifica('x.html', '<p>Faça o balanço do estoque todo mês</p>').length) throw new Error('balanço antes de estoque passou');
  if (!verifica('x.html', '<p>Balanco de estoque</p>').length) throw new Error('sem acento passou');
});

teste('detector: balanço de DRE, teflon e "tef" dentro de palavra não quebram', () => {
  const ok = [
    '<p>DRE e balanço patrimonial simples para o contador</p>',
    '<p>Panela de teflon antiaderente</p>',
    '<p>Estoque com grade de tamanho e cor. Mais abaixo, em outra seção da página, um parágrafo longo sobre contas, notas, vendas, clientes e o balanço do mês.</p>',
    '<p>O Caixa baixa o estoque a cada venda</p>',
  ];
  for (const t of ok) {
    const p = verifica('x.html', t);
    if (p.length) throw new Error('falso positivo em: ' + t + '\n' + p.join('\n'));
  }
});

// --- O site de verdade ---
const arquivos = arquivosPublicados();

teste('há arquivos publicados para varrer (html, llms.txt, js)', () => {
  if (arquivos.length < 30) throw new Error('só ' + arquivos.length + ' arquivos; a varredura quebrou');
  for (const esperado of ['index.html', 'planos.html', 'frente-de-caixa.html', 'llms.txt', 'js/plans-data.js']) {
    if (!arquivos.includes(esperado)) throw new Error('faltou ' + esperado);
  }
  if (arquivos.some((a) => /^(app|docs|node_modules|scripts|src)\//.test(a))) throw new Error('varreu pasta que não vai ao ar');
});

teste('o site publicado não promete TEF, multi-gateway, lotes/validade nem balanço de estoque', () => {
  const problemas = [];
  for (const nome of arquivos) {
    problemas.push(...verifica(nome, fs.readFileSync(path.join(ROOT, nome), 'utf8')));
  }
  if (problemas.length) throw new Error(problemas.length + ' ocorrência(s):\n' + problemas.join('\n'));
});

// --- JSON-LD (<script type="application/ld+json">) ---
// A varredura acima lê o HTML cru, mas o JSON pode trazer a palavra escapada
// ("multi-gateway") e o bloco é regerado por scripts/inject-jsonld.py, que
// fica fora do que é servido. Em 27/10 o script, rodado na main, devolvia
// "multi-gateway" ao JSON-LD de index e planos. Aqui o JSON é decodificado e
// varrido, a fonte do script é varrida, e o script tem de rodar sem mudar nada.
const RE_LDJSON = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// Todos os textos (chaves e valores) de um valor JSON, numa linha só.
function textosJson(v, saida = []) {
  if (typeof v === 'string') saida.push(v);
  else if (Array.isArray(v)) v.forEach((x) => textosJson(x, saida));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { saida.push(k); textosJson(x, saida); }
  return saida;
}

// Problemas dentro dos blocos JSON-LD de um HTML (e JSON inválido também é problema).
function verificaJsonLd(nome, conteudo) {
  const problemas = [];
  let m, n = 0;
  RE_LDJSON.lastIndex = 0;
  while ((m = RE_LDJSON.exec(conteudo))) {
    n++;
    let dados;
    try { dados = JSON.parse(m[1]); }
    catch (e) { problemas.push(`${nome}:${linhaDe(conteudo, m.index)}  JSON-LD inválido (${e.message})`); continue; }
    for (const p of verifica('x.txt', textosJson(dados).join(' \n '))) {
      problemas.push(`${nome}:${linhaDe(conteudo, m.index)} (JSON-LD #${n})  ${p.replace(/^x\.txt(:\d+)?\s+/, '')}`);
    }
  }
  return { problemas, blocos: n };
}

teste('detector JSON-LD: pega a palavra mesmo escapada no JSON e deixa passar o que é legítimo', () => {
  const bloco = (t) => `<head><script type="application/ld+json">${t}</script></head><p>texto</p>`;
  if (!verificaJsonLd('x.html', bloco('{"featureList":["Multi-CNPJ, API e multi\\u002dgateway"]}')).problemas.length) throw new Error('multi-gateway escapado passou');
  if (!verificaJsonLd('x.html', bloco('{"description":"PDV com TEF integrado"}')).problemas.length) throw new Error('TEF passou');
  if (!verificaJsonLd('x.html', bloco('{"text":"lotes e validade"}')).problemas.length) throw new Error('lotes e validade passou');
  if (!verificaJsonLd('x.html', bloco('{"text":"Balan\\u00e7o de estoque"}')).problemas.length) throw new Error('balanço de estoque escapado passou');
  if (!verificaJsonLd('x.html', bloco('{ quebrado')).problemas.length) throw new Error('JSON inválido passou');
  const ok = verificaJsonLd('x.html', bloco('{"description":"DRE e balanço patrimonial, multi-CNPJ e API"}'));
  if (ok.problemas.length || ok.blocos !== 1) throw new Error('falso positivo: ' + ok.problemas.join('\n'));
});

teste('o JSON-LD publicado não promete TEF, multi-gateway, lotes/validade nem balanço de estoque', () => {
  const problemas = [];
  let blocos = 0;
  for (const nome of arquivos.filter((a) => a.endsWith('.html'))) {
    const r = verificaJsonLd(nome, fs.readFileSync(path.join(ROOT, nome), 'utf8'));
    problemas.push(...r.problemas);
    blocos += r.blocos;
  }
  if (blocos < 25) throw new Error('só ' + blocos + ' blocos JSON-LD achados; a leitura quebrou');
  if (problemas.length) throw new Error(problemas.length + ' ocorrência(s):\n' + problemas.join('\n'));
});

const SCRIPT_JSONLD = path.join(ROOT, 'scripts', 'inject-jsonld.py');

teste('a fonte do JSON-LD (scripts/inject-jsonld.py) não promete nada disso', () => {
  const problemas = verifica('scripts/inject-jsonld.py', fs.readFileSync(SCRIPT_JSONLD, 'utf8'));
  if (problemas.length) throw new Error(problemas.length + ' ocorrência(s):\n' + problemas.join('\n'));
});

teste('scripts/inject-jsonld.py --check: rodar o script não muda nenhuma página', () => {
  const { spawnSync } = require('node:child_process');
  for (const py of ['python3', 'python']) {
    const r = spawnSync(py, [SCRIPT_JSONLD, '--check'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    if (r.error && r.error.code === 'ENOENT') continue;   // tenta o próximo nome
    if (r.status === 9009) continue;                      // atalho da Microsoft Store no Windows
    if (r.status !== 0) {
      const mudaria = (r.stdout || '').split('\n').filter((l) => l.includes('MUDARIA')).join('\n');
      throw new Error(`${py} saiu com ${r.status}; o script está defasado do HTML commitado:\n${mudaria || r.stdout + r.stderr}`);
    }
    return;
  }
  console.log('       (sem python no PATH: conferência do script pulada)');
});

if (falhas) { console.log('\n' + falhas + ' falha(s)'); process.exit(1); }
console.log('\ntudo certo');
