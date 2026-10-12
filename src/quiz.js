// ============================================================
// Quiz do casamento (Caio e Lorena, 31/10/2026)
//
//   GET  /api/quiz        → estado (antes | aberto | encerrado), horários e ranking
//   POST /api/quiz/jogar  → { nome, respostas: { c1: 'B', ... }, tempo_ms, ensaio? }
//
// O gabarito, os horários e o token de ensaio ficam no D1 (binding QUIZ_DB),
// não no código: este repositório é público.
//   gabarito(id, resposta)       → c1..c10 (Caio), l1..l10 (Lorena)
//   config(chave, valor)         → abre_em, fecha_em (ISO UTC), token_ensaio
//   jogadas(nome, nome_chave UNIQUE, acertos, tempo_ms, respostas, criado_em)
//
// Ensaio: ?ensaio=<token> na página → joga fora do horário, calcula a nota
// e NÃO grava no ranking (serve para testar antes da festa).
// ============================================================

const ALLOWED_ORIGINS = ['https://www.getaura.com.br', 'https://getaura.com.br'];
const DEV_ORIGIN_RE = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
const RANKING_LIMIT = 50;
const MIN_TEMPO_MS = 20000; // ninguém responde 20 perguntas em menos de 20 s
const MAX_TEMPO_MS = 3 * 60 * 60 * 1000;
const LETRAS = new Set(['A', 'B', 'C', 'D']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function originOk(request) {
  let origin = request.headers.get('origin') || '';
  if (!origin || origin === 'null') {
    try { origin = new URL(request.headers.get('referer') || '').origin; } catch { origin = ''; }
  }
  return ALLOWED_ORIGINS.includes(origin) || DEV_ORIGIN_RE.test(origin);
}

// "  Tia   Ângela " → "Tia Ângela" (exibição) e "tia angela" (chave única)
function limparNome(raw) {
  const nome = String(raw || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const chave = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return { nome, chave };
}

async function lerConfig(db) {
  const { results } = await db.prepare('SELECT chave, valor FROM config').all();
  const c = Object.fromEntries(results.map((r) => [r.chave, r.valor]));
  return { abre: Date.parse(c.abre_em), fecha: Date.parse(c.fecha_em), abreEm: c.abre_em, fechaEm: c.fecha_em, token: c.token_ensaio || '' };
}

function estado(cfg, agora = Date.now()) {
  if (agora < cfg.abre) return 'antes';
  if (agora >= cfg.fecha) return 'encerrado';
  return 'aberto';
}

async function ranking(db) {
  const { results } = await db
    .prepare('SELECT nome, acertos, tempo_ms FROM jogadas ORDER BY acertos DESC, tempo_ms ASC, id ASC LIMIT ?')
    .bind(RANKING_LIMIT)
    .all();
  return results;
}

async function handleStatus(env) {
  const db = env.QUIZ_DB;
  const cfg = await lerConfig(db);
  const est = estado(cfg);
  const total = await db.prepare('SELECT COUNT(*) AS n FROM jogadas').first('n');
  return json({
    estado: est,
    abre_em: cfg.abreEm,
    fecha_em: cfg.fechaEm,
    jogadores: total,
    ranking: est === 'antes' ? [] : await ranking(db),
  });
}

async function handleJogar(request, env) {
  if (!originOk(request)) return json({ ok: false, erro: 'Origem não permitida.' }, 403);

  let body;
  try {
    const txt = await request.text();
    if (txt.length > 4000) return json({ ok: false, erro: 'Pedido grande demais.' }, 413);
    body = JSON.parse(txt);
  } catch {
    return json({ ok: false, erro: 'Não entendi as respostas. Tente de novo.' }, 400);
  }

  const db = env.QUIZ_DB;
  const cfg = await lerConfig(db);
  const ensaio = Boolean(body.ensaio) && cfg.token && body.ensaio === cfg.token;

  if (!ensaio) {
    const est = estado(cfg);
    if (est === 'antes') return json({ ok: false, erro: 'O quiz ainda não abriu.' }, 403);
    if (est === 'encerrado') return json({ ok: false, erro: 'O quiz já foi encerrado.' }, 403);
  }

  const { nome, chave } = limparNome(body.nome);
  if (nome.length < 2) return json({ ok: false, erro: 'Escreva seu nome (pelo menos 2 letras).' }, 400);

  const { results: gab } = await db.prepare('SELECT id, resposta FROM gabarito').all();
  const respostas = body.respostas && typeof body.respostas === 'object' ? body.respostas : {};
  const limpas = {};
  let acertos = 0;
  for (const { id, resposta } of gab) {
    const r = String(respostas[id] || '').toUpperCase();
    if (!LETRAS.has(r)) return json({ ok: false, erro: 'Faltou responder alguma pergunta.' }, 400);
    limpas[id] = r;
    if (r === resposta) acertos++;
  }

  const t = Number(body.tempo_ms);
  const tempo = Math.min(MAX_TEMPO_MS, Math.max(MIN_TEMPO_MS, Number.isFinite(t) ? Math.round(t) : MAX_TEMPO_MS));

  if (ensaio) {
    const pos = await db
      .prepare('SELECT COUNT(*) AS n FROM jogadas WHERE acertos > ? OR (acertos = ? AND tempo_ms < ?)')
      .bind(acertos, acertos, tempo)
      .first('n');
    return json({ ok: true, ensaio: true, acertos, total: gab.length, posicao: pos + 1 });
  }

  try {
    await db
      .prepare('INSERT INTO jogadas (nome, nome_chave, acertos, tempo_ms, respostas) VALUES (?, ?, ?, ?, ?)')
      .bind(nome, chave, acertos, tempo, JSON.stringify(limpas))
      .run();
  } catch (e) {
    if (String(e && e.message).includes('UNIQUE')) {
      return json({ ok: false, erro: 'Esse nome já jogou. Se for outra pessoa, coloque o sobrenome.' }, 409);
    }
    console.error('[quiz] insert falhou', e);
    return json({ ok: false, erro: 'Não consegui salvar. Tente de novo em instantes.' }, 500);
  }

  const pos = await db
    .prepare('SELECT COUNT(*) AS n FROM jogadas WHERE acertos > ? OR (acertos = ? AND tempo_ms < ?)')
    .bind(acertos, acertos, tempo)
    .first('n');
  return json({ ok: true, acertos, total: gab.length, posicao: pos + 1, ranking: await ranking(db) });
}

export async function handleQuiz(request, env, url) {
  if (!env.QUIZ_DB) return json({ ok: false, erro: 'Quiz indisponível.' }, 503);
  try {
    if (url.pathname === '/api/quiz' && request.method === 'GET') return await handleStatus(env);
    if (url.pathname === '/api/quiz/jogar' && request.method === 'POST') return await handleJogar(request, env);
    return json({ ok: false, erro: 'Rota não encontrada.' }, 404);
  } catch (e) {
    console.error('[quiz] erro', e);
    return json({ ok: false, erro: 'Algo deu errado. Tente de novo em instantes.' }, 500);
  }
}
