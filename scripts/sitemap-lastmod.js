#!/usr/bin/env node
// ============================================================
// AURA. — lastmod do sitemap pela data do último commit da página
// (b-mk-15, 17/11/2026)
//
// O <lastmod> de cada URL do sitemap.xml era escrito à mão e ficou parado
// (a maioria em 06/10). Este script troca cada lastmod pela data, em
// Brasília, do último commit que mexeu no .html daquela URL. Nunca volta uma
// data para trás: fica a maior entre a do arquivo e a do git.
//
// Uso:
//   node scripts/sitemap-lastmod.js            # mostra o que mudaria, não grava
//   node scripts/sitemap-lastmod.js --write    # grava o sitemap.xml
//   node scripts/sitemap-lastmod.js --build    # o que o deploy roda (wrangler.jsonc)
//
// --build grava só no Workers Builds (WORKERS_CI=1), para um `wrangler dev`
// local não sujar o checkout. Ele nunca derruba o deploy: qualquer falha
// (git ausente, clone raso que não aprofunda) deixa o sitemap como está no
// commit. Clone raso: tenta `git fetch --unshallow`; se continuar raso, não
// grava nada (num clone de profundidade 1 toda página teria a data de hoje).
// ============================================================
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const ORIGEM = 'https://www.getaura.com.br';

/** URL do sitemap -> arquivo .html na raiz ("/" é o index.html). */
function arquivoDaUrl(loc) {
  if (!loc.startsWith(ORIGEM + '/')) return null;
  const caminho = loc.slice(ORIGEM.length + 1).replace(/\/+$/, '');
  if (caminho.includes('..')) return null;
  return (caminho || 'index') + '.html';
}

/** Instante (ms) -> AAAA-MM-DD em Brasília. */
function dataEmBrasilia(ms) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(ms));
}

/**
 * Troca o lastmod de cada <url>. `dataDe(arquivo)` devolve AAAA-MM-DD ou
 * null (sem histórico: mantém). Devolve { xml, mudancas }.
 */
function atualizarSitemap(xml, dataDe) {
  const mudancas = [];
  const novo = xml.replace(/<url>([\s\S]*?)<\/url>/g, (bloco, corpo) => {
    const loc = (corpo.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const atual = (corpo.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    const arquivo = loc && arquivoDaUrl(loc.trim());
    if (!arquivo || !atual) return bloco;
    const doGit = dataDe(arquivo);
    if (!doGit || !/^\d{4}-\d{2}-\d{2}$/.test(doGit) || doGit <= atual) return bloco;
    mudancas.push({ loc: loc.trim(), de: atual, para: doGit });
    return bloco.replace('<lastmod>' + atual + '</lastmod>', '<lastmod>' + doGit + '</lastmod>');
  });
  return { xml: novo, mudancas };
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).trim();
}

/** O clone tem o histórico inteiro? Tenta aprofundar se for raso. */
function historicoCompleto() {
  if (git(['rev-parse', '--is-shallow-repository']) !== 'true') return true;
  try { git(['fetch', '--unshallow', '--quiet']); } catch (_) { /* segue raso */ }
  return git(['rev-parse', '--is-shallow-repository']) !== 'true';
}

function dataDoUltimoCommit(arquivo) {
  if (!fs.existsSync(path.join(ROOT, arquivo))) return null;
  const ts = git(['log', '-1', '--format=%ct', '--', arquivo]);
  if (!/^\d+$/.test(ts)) return null;
  return dataEmBrasilia(Number(ts) * 1000);
}

function main(argv, env) {
  const build = argv.includes('--build');
  const gravar = argv.includes('--write') || (build && env.WORKERS_CI === '1');
  try {
    if (!historicoCompleto()) {
      console.log('[sitemap-lastmod] clone raso: sitemap.xml fica como está no commit.');
      return 0;
    }
    const xml = fs.readFileSync(SITEMAP, 'utf8');
    const { xml: novo, mudancas } = atualizarSitemap(xml, dataDoUltimoCommit);
    for (const m of mudancas) console.log(`[sitemap-lastmod] ${m.loc}: ${m.de} -> ${m.para}`);
    if (!mudancas.length) console.log('[sitemap-lastmod] nenhum lastmod para atualizar.');
    if (gravar && mudancas.length) {
      fs.writeFileSync(SITEMAP, novo);
      console.log(`[sitemap-lastmod] sitemap.xml gravado (${mudancas.length} URL).`);
    } else if (mudancas.length) {
      console.log('[sitemap-lastmod] nada gravado' + (build ? ' (fora do Workers Builds).' : ' (use --write).'));
    }
    return 0;
  } catch (err) {
    console.log('[sitemap-lastmod] falhou, sitemap.xml fica como está: ' + (err && err.message));
    return build ? 0 : 1;
  }
}

if (require.main === module) process.exitCode = main(process.argv.slice(2), process.env);

module.exports = { arquivoDaUrl, dataEmBrasilia, atualizarSitemap, main };
