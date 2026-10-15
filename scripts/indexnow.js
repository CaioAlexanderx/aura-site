#!/usr/bin/env node
/**
 * Avisa os buscadores (via IndexNow) que paginas do site mudaram.
 * Node puro, sem dependencia. Versao em Node do scripts/indexnow.py, com o
 * modo "so o que mudou no ultimo commit".
 *
 * IndexNow e um protocolo aberto aceito por Bing, Yandex, Seznam, Naver e Yep.
 * O indice do Bing alimenta ChatGPT (busca), Copilot e parte do Perplexity.
 * O Google nao usa IndexNow (usa sitemap.xml + Search Console).
 *
 * Uso (na raiz do repo, DEPOIS do deploy chegar em producao):
 *   node scripts/indexnow.js                    # URLs do sitemap que mudaram no ultimo commit
 *   node scripts/indexnow.js /planos /llms.txt  # so essas (caminho ou URL completa)
 *   node scripts/indexnow.js --all              # todas as URLs do sitemap + /llms.txt
 *   node scripts/indexnow.js --dry-run          # mostra o que enviaria, sem enviar
 *
 * A chave e o arquivo <32 hex>.txt na raiz do site (publico por desenho: o
 * Bing o busca em https://www.getaura.com.br/<chave>.txt para validar).
 * O script confere que a chave esta no ar antes de enviar; nao rode antes do deploy.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const HOST = 'www.getaura.com.br';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000; // limite do protocolo por envio

/** Acha o arquivo-chave: <32 hex>.txt na raiz, com o proprio nome como conteudo. */
function findKey(root = ROOT) {
  for (const f of fs.readdirSync(root)) {
    if (!/^[0-9a-f]{32}\.txt$/.test(f)) continue;
    const key = fs.readFileSync(path.join(root, f), 'utf8').trim();
    if (key === f.slice(0, -4)) return key;
  }
  throw new Error('Chave IndexNow nao encontrada: esperado um arquivo <32 hex>.txt na raiz com o proprio nome como conteudo.');
}

/** URLs do sitemap.xml (texto) -> lista de <loc>. */
function sitemapUrls(xml) {
  const out = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

/** Caminho ou URL passada na linha de comando -> URL completa. */
function toUrl(arg) {
  if (/^https?:\/\//i.test(arg)) return arg;
  return `https://${HOST}${arg.startsWith('/') ? arg : '/' + arg}`;
}

/** Arquivo do repo -> URL publica, ou null se nao e pagina publica. */
function fileToUrl(file) {
  const f = file.replace(/\\/g, '/');
  if (f === 'llms.txt') return `https://${HOST}/llms.txt`;
  if (f === 'index.html') return `https://${HOST}/`;
  if (/^[^/]+\.html$/.test(f)) return `https://${HOST}/${f.slice(0, -5)}`;
  return null;
}

/**
 * Dado o que mudou no ultimo commit, devolve as URLs a enviar: so paginas que
 * estao no sitemap (fica de fora o que e noindex/nao listado, ex.: casamento)
 * mais o /llms.txt, que nao e pagina mas as IAs leem.
 */
function urlsFromChangedFiles(files, sitemap) {
  const no = new Set(sitemap);
  const out = [];
  for (const file of files) {
    const url = fileToUrl(file);
    if (!url) continue;
    if (url.endsWith('/llms.txt') || no.has(url)) {
      if (!out.includes(url)) out.push(url);
    }
  }
  return out;
}

function buildPayload(key, urls) {
  return { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls };
}

function changedFilesInLastCommit() {
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=AMR', 'HEAD~1', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return out.split('\n').map((s) => s.trim()).filter(Boolean);
}

async function main(argv) {
  const dry = argv.includes('--dry-run');
  const all = argv.includes('--all');
  const args = argv.filter((a) => !a.startsWith('--'));

  const key = findKey();
  const sitemap = sitemapUrls(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'));

  let urls;
  if (args.length) urls = args.map(toUrl);
  else if (all) urls = [...sitemap, `https://${HOST}/llms.txt`];
  else urls = urlsFromChangedFiles(changedFilesInLastCommit(), sitemap);

  urls = [...new Set(urls)].slice(0, MAX_URLS);
  if (!urls.length) {
    console.log('Nenhuma URL publica mudou no ultimo commit. Nada a enviar (passe URLs ou use --all).');
    return 0;
  }

  const payload = buildPayload(key, urls);
  if (dry) {
    console.log(`[dry-run] enviaria ${urls.length} URL(s) para ${ENDPOINT}:`);
    for (const u of urls) console.log('  ' + u);
    return 0;
  }

  // confere que a chave esta publicada antes de gastar a chamada
  const keyUrl = payload.keyLocation;
  try {
    const r = await fetch(keyUrl);
    const body = (await r.text()).trim();
    if (!r.ok || body !== key) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    console.error(`Nao consegui ler a chave em ${keyUrl} (${e.message}). Fez o deploy?`);
    return 1;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  console.log(`IndexNow: HTTP ${res.status} para ${urls.length} URL(s)`);
  for (const u of urls) console.log('  ' + u);
  // 200 e 202 = aceito (202: chave ainda sendo validada)
  if (res.status !== 200 && res.status !== 202) {
    console.error((await res.text()).slice(0, 300));
    return 1;
  }
  return 0;
}

module.exports = { findKey, sitemapUrls, toUrl, fileToUrl, urlsFromChangedFiles, buildPayload };

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => { console.error(e.message); process.exit(1); },
  );
}
