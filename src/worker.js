// ============================================================
// AURA. — Worker entry-point (Workers + Static Assets)
//
// Rotas:
//   POST /api/lead-partial → "quero que me chamem": só o WhatsApp,
//                            encaminhado ao CRM (ProspecaoAdmin)
//   *    /api/contact      → 410: o formulário completo foi desativado
//                            (o site só tem contato por WhatsApp)
//   *                      → static assets (HTML, CSS, JS, imagens)
//
// Variáveis (Workers & Pages > aura-site > Settings > Variables and Secrets):
//   SITE_LEADS_TOKEN  — token do endpoint público de leads do backend
//   AURA_API_URL      — opcional; base da API (default: produção)
// ============================================================

import AuraPhone from '../js/phone-br.js';

// Origens que podem postar lead. localhost/127.0.0.1 em qualquer porta (dev).
const ALLOWED_ORIGINS = ['https://www.getaura.com.br', 'https://getaura.com.br'];
const DEV_ORIGIN_RE = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

// Time trap: humano leva mais que isso entre abrir a página e clicar.
const MIN_ELAPSED_MS = 1500;

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function requestOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== 'null') return origin;
  const referer = request.headers.get('referer');
  if (!referer) return '';
  try { return new URL(referer).origin; } catch { return ''; }
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) || DEV_ORIGIN_RE.test(origin);
}

// O formulário completo (nome, cargo, empresa, e-mail...) foi desativado:
// metade dos leads dele em 30 dias era bot. Contato agora é só WhatsApp.
function handleContact() {
  return jsonResp({ ok: false, error: 'Formulário desativado. Fale com a gente pelo WhatsApp.' }, 410);
}

// ── Encaminha o lead pro backend (CRM ProspecaoAdmin) ──
async function forwardLeadToCrm(env, f) {
  const apiBase = env.AURA_API_URL || 'https://aura-backend-production-f805.up.railway.app/api/v1';
  if (!env.SITE_LEADS_TOKEN) {
    console.warn('[lead] SITE_LEADS_TOKEN ausente — pulando CRM');
    return false;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const resp = await fetch(`${apiBase}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-site-token': env.SITE_LEADS_TOKEN },
      body: JSON.stringify({
        nome: '', whatsapp: f.whatsapp, email: '',
        empresa: '', cargo: '', tipo: '',
        vertical: '', mensagem: f.mensagem,
        partial: true, source: 'site_partial',
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      console.error('[lead] crm api status:', resp.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[lead] crm forward error:', err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// ── "Quero que me chamem" (bloco WhatsApp das páginas + exit-intent) ──
// Só o WhatsApp. Vai pro CRM como lead parcial (source='site_partial').
async function handlePartial(request, env) {
  if (request.method !== 'POST') {
    return jsonResp({ ok: false, error: 'Metodo nao suportado' }, 405);
  }

  // (ii) Só aceita post vindo do próprio site
  const origin = requestOrigin(request);
  if (!isAllowedOrigin(origin)) {
    console.log('[lead] origem recusada:', origin || '(sem origin/referer)');
    return jsonResp({ ok: false, error: 'Origem nao permitida' }, 403);
  }

  let whatsapp = '', honeypot = '', elapsed = NaN, page = '';
  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = {};
      for (const [k, v] of form.entries()) body[k] = v;
    }
    whatsapp = (body.whatsapp || body.telefone || body.phone || '').toString().trim();
    honeypot = (body._empresa || body.honeypot || '').toString().trim();
    elapsed  = Number(body.t);
    page     = (body.page || '').toString().replace(/[^\w\-/]/g, '').slice(0, 80);
  } catch (err) {
    return jsonResp({ ok: false, error: 'Formato invalido' }, 400);
  }

  // Honeypot — responde 200 sem capturar (não revela a detecção)
  if (honeypot) {
    console.log('[lead] honeypot preenchido — ignorando');
    return jsonResp({ ok: true });
  }

  // (iii) Time trap — clique rápido demais (ou sem t) = robô; 200 sem capturar
  if (!Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) {
    console.log('[lead] time trap (t=' + fmtElapsed(elapsed) + ') — ignorando');
    return jsonResp({ ok: true });
  }

  // (i)/(iv) WhatsApp é obrigatório e precisa ser celular brasileiro válido
  if (!AuraPhone.isValid(whatsapp)) {
    return jsonResp({ ok: false, error: AuraPhone.ERROR_MSG }, 400);
  }

  const ok = await forwardLeadToCrm(env, {
    whatsapp: AuraPhone.format(whatsapp),
    mensagem: 'Pediu para ser chamado no WhatsApp' + (page ? ' (site: ' + page + ')' : ''),
  });
  return ok
    ? jsonResp({ ok: true, message: 'Anotado! A gente te chama no WhatsApp em horário comercial.' })
    : jsonResp({ ok: false, error: 'Nao foi possivel agora. Tenta de novo ou chama a gente no WhatsApp.' }, 502);
}

function fmtElapsed(v) { return Number.isFinite(v) ? v : 'ausente'; }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // SEO: host canonico = www. Apex (getaura.com.br) responde 301 limpo
    // pro mesmo path/query em www (audit 06/2026: apex voltava vazio).
    if (url.hostname === 'getaura.com.br') {
      url.hostname = 'www.getaura.com.br';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/lead-partial') {
      return handlePartial(request, env);
    }

    if (url.pathname === '/api/contact') {
      return handleContact();
    }

    // Tudo mais: static assets
    return env.ASSETS.fetch(request);
  },
};
