// ============================================================
// AURA. — Worker entry-point (Workers + Static Assets)
//
// Rotas:
//   POST /api/contact       → captura lead (CRM + Resend)
//   POST /api/lead-partial  → captura parcial (CRM, sem email)
//   *                       → static assets (HTML, CSS, JS, imagens)
//
// Anti-bot (10/07/2026) — camadas:
//   1. Honeypot _empresa (já existia; 200 fake, não envia)
//   2. Cloudflare Turnstile — valida o token quando TURNSTILE_SECRET
//      está configurada. SEM a secret o check é PULADO (fail-open),
//      então dá pra deployar este código ANTES de criar as chaves.
//   3. Telefone BR de verdade (10-11 dígitos, DDD real, celular c/ 9)
//   4. URL em nome/mensagem → descarte silencioso (200 fake)
//   5. cf-ipcountry ≠ BR → descarte silencioso (200 fake)
//
// Setup necessario no Cloudflare Dashboard:
//   Workers & Pages > aura-site > Settings > Variables and Secrets
//     RESEND_API_KEY   = re_xxxxxxxxxx  (Secret)
//     SITE_LEADS_TOKEN = xxxxxxxxxx     (Secret)
//     TURNSTILE_SECRET = 0x4AAA...      (Secret — criar widget Turnstile
//                        p/ www.getaura.com.br em Turnstile > Add widget;
//                        a SITE KEY vai nos 3 arquivos JS do front:
//                        site.js, js/site.js e js/lead-capture.js)
//
//   Dominio "getaura.com.br" precisa estar verificado no Resend
//   (DNS records ja apontam — sistema de relatorios usa o mesmo).
// ============================================================

const ALLOWED_TIPOS = ['MEI', 'Microempresa', 'Ainda nao tenho CNPJ', ''];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// ── Anti-bot helpers ────────────────────────────────────────

// Telefone BR: 10-11 dígitos (com 55 opcional na frente), DDD real
// (11-99, segundo dígito ≠ 0), celular de 11 dígitos começa com 9.
function isValidBrPhone(v) {
  let d = (v || '').replace(/\D/g, '');
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || d[1] === '0') return false;
  if (d.length === 11 && d[2] !== '9') return false;
  if (/^(\d)\1+$/.test(d.slice(2))) return false; // 999999999 etc
  return true;
}

// Spam clássico: link em campo de texto livre.
function hasSpamContent(...fields) {
  const s = fields.filter(Boolean).join(' ');
  return /(https?:\/\/|www\.|\[url|<a\s|href\s*=)/i.test(s);
}

// Turnstile siteverify. Sem TURNSTILE_SECRET → pula (deploy antes das
// chaves não quebra os forms). Com secret e sem/inválido token → falha.
// Erro de rede na API do Turnstile → fail-open (não derruba lead real).
async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: 'missing-token' };
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || undefined }),
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: !!data.success, reason: (data['error-codes'] || []).join(',') };
  } catch (err) {
    console.error('[turnstile] verify error:', err.message);
    return { ok: true, degraded: true };
  }
}

// Roda as camadas anti-bot comuns aos dois endpoints.
// Retorna null se passou, ou uma Response pronta se deve parar.
async function antiBotGate(request, env, { honeypot, tsToken, tag }) {
  const ip = request.headers.get('cf-connecting-ip') || '';

  // Honeypot — responde 200 mas nao envia (nao revela detecção)
  if (honeypot) {
    console.log(`[${tag}] honeypot triggered, ignoring. ip:`, ip);
    return jsonResp({ ok: true, message: 'Recebido' });
  }

  // Turnstile
  const ts = await verifyTurnstile(env, tsToken, ip);
  if (!ts.ok) {
    console.log(`[${tag}] turnstile fail (${ts.reason || '?'}). ip:`, ip);
    return jsonResp({ ok: false, error: 'Não conseguimos confirmar que você não é um robô. Recarrega a página e tenta de novo — ou nos chama no WhatsApp.' }, 403);
  }

  // País — cliente é loja brasileira; fora do BR = descarte silencioso
  const reqCountry = request.headers.get('cf-ipcountry') || '';
  if (reqCountry && reqCountry !== 'BR') {
    console.log(`[${tag}] non-BR discarded:`, reqCountry, 'ip:', ip);
    return jsonResp({ ok: true, message: 'Recebido' });
  }

  return null;
}

async function handleContact(request, env) {
  if (request.method === 'GET') {
    return jsonResp({ ok: false, error: 'Use POST com nome + whatsapp pra enviar contato' }, 405);
  }
  if (request.method !== 'POST') {
    return jsonResp({ ok: false, error: 'Metodo nao suportado' }, 405);
  }

  // Parse body (JSON, form-urlencoded ou multipart) — campos canônicos do
  // form da home E aliases do form antigo (/site/index.html ainda em cache
  // ou outras integrações)
  let nome = '', whatsapp = '', tipo = '', mensagem = '', honeypot = '';
  let cargo = '', empresa = '', vertical = '', email = '', tsToken = '';
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
    nome     = (body.nome || body.name || '').toString().trim();
    // aceita "whatsapp" OU "telefone" (form antigo usa telefone)
    whatsapp = (body.whatsapp || body.telefone || body.phone || '').toString().trim();
    tipo     = (body.tipo || '').toString().trim();
    mensagem = (body.mensagem || body.message || '').toString().trim();
    cargo    = (body.cargo || '').toString().trim();
    empresa  = (body.empresa || '').toString().trim();
    vertical = (body.vertical || body['vertical-de-interesse'] || '').toString().trim();
    email    = (body.email || body['e-mail'] || '').toString().trim();
    honeypot = (body._empresa || body.honeypot || '').toString().trim();
    tsToken  = (body['cf-turnstile-response'] || body.turnstile_token || '').toString().trim();
  } catch (err) {
    return jsonResp({ ok: false, error: 'Formato invalido' }, 400);
  }

  // ── Anti-bot: honeypot + turnstile + país ──
  const blocked = await antiBotGate(request, env, { honeypot, tsToken, tag: 'contact' });
  if (blocked) return blocked;

  // Validacao basica
  if (!nome || nome.length < 2) {
    return jsonResp({ ok: false, error: 'Nome obrigatorio' }, 400);
  }
  if (!isValidBrPhone(whatsapp)) {
    return jsonResp({ ok: false, error: 'Coloca um WhatsApp válido com DDD (ex.: 11 91234-5678).' }, 400);
  }
  if (mensagem.length > 2000) {
    return jsonResp({ ok: false, error: 'Mensagem muito longa' }, 400);
  }
  if (tipo && !ALLOWED_TIPOS.includes(tipo)) {
    tipo = '';
  }
  // Link em campo livre = spam → descarte silencioso
  if (hasSpamContent(nome, mensagem, empresa, cargo)) {
    console.log('[contact] spam content discarded. ip:', request.headers.get('cf-connecting-ip') || '');
    return jsonResp({ ok: true, message: 'Recebido' });
  }

  // ── 1) Encaminha pro CRM (ProspecaoAdmin) — destino primario ──
  let crmOk = false;
  try {
    crmOk = await forwardLeadToCrm(env, { nome, whatsapp, email, empresa, cargo, tipo, vertical, mensagem });
  } catch (err) {
    console.error('[contact] crm forward error:', err.message);
  }

  // ── 2) E-mail (Resend) — registro/fallback (so se configurado) ──
  let emailOk = false;
  if (!env.RESEND_API_KEY) {
    return crmOk
      ? jsonResp({ ok: true, message: 'Recebido! Entraremos em contato pelo WhatsApp em minutos.' })
      : jsonResp({ ok: false, error: 'Nao foi possivel enviar agora. Tente em alguns minutos ou nos chame no WhatsApp.' }, 502);
  }

  // Montar email
  const now = new Date();
  const dataBr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const ipHeader = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'desconhecido';
  const country = request.headers.get('cf-ipcountry') || '?';
  const userAgent = request.headers.get('user-agent') || 'desconhecido';

  const subject = `Novo lead do site: ${nome}${empresa ? ' · ' + empresa : ''}`;
  const waDigits = whatsapp.replace(/\D/g, '');
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e">
      <h2 style="color:#7c3aed;margin:0 0 16px;font-size:22px">Novo lead pelo site</h2>
      <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="background:#f5f3ff;font-weight:600;width:140px">Nome</td><td>${escapeHtml(nome)}</td></tr>
        ${cargo ? `<tr><td style="background:#f5f3ff;font-weight:600">Cargo</td><td>${escapeHtml(cargo)}</td></tr>` : ''}
        ${empresa ? `<tr><td style="background:#f5f3ff;font-weight:600">Empresa</td><td>${escapeHtml(empresa)}</td></tr>` : ''}
        ${vertical ? `<tr><td style="background:#f5f3ff;font-weight:600">Interesse</td><td>${escapeHtml(vertical)}</td></tr>` : ''}
        <tr><td style="background:#f5f3ff;font-weight:600">WhatsApp</td><td><a href="https://wa.me/55${waDigits}" style="color:#7c3aed">${escapeHtml(whatsapp)}</a></td></tr>
        ${email ? `<tr><td style="background:#f5f3ff;font-weight:600">E-mail</td><td><a href="mailto:${escapeHtml(email)}" style="color:#7c3aed">${escapeHtml(email)}</a></td></tr>` : ''}
        ${tipo ? `<tr><td style="background:#f5f3ff;font-weight:600">Tipo</td><td>${escapeHtml(tipo)}</td></tr>` : ''}
        ${mensagem ? `<tr><td style="background:#f5f3ff;font-weight:600;vertical-align:top">Mensagem</td><td style="white-space:pre-wrap">${escapeHtml(mensagem)}</td></tr>` : ''}
        <tr><td colspan="2" style="padding-top:18px;color:#666;font-size:12px;border-top:1px solid #eee">
          Enviado em ${dataBr} · IP ${ipHeader} (${country})<br>
          UA: ${escapeHtml(userAgent.slice(0, 120))}
        </td></tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#666">
        Lead capturado em <a href="https://getaura.com.br" style="color:#7c3aed">getaura.com.br</a>.
        Responda em minutos pelo WhatsApp pra maior taxa de conversao.
      </p>
    </div>
  `;

  const text = [
    'Novo lead pelo site',
    '',
    `Nome:     ${nome}`,
    cargo ? `Cargo:    ${cargo}` : null,
    empresa ? `Empresa:  ${empresa}` : null,
    vertical ? `Interesse: ${vertical}` : null,
    `WhatsApp: ${whatsapp}`,
    email ? `E-mail:   ${email}` : null,
    tipo ? `Tipo:     ${tipo}` : null,
    mensagem ? `Mensagem: ${mensagem}` : null,
    '',
    `Em: ${dataBr} | IP: ${ipHeader} (${country})`,
  ].filter(Boolean).join('\n');

  // Enviar via Resend
  try {
    const resendPayload = {
      from: 'Aura Site <site@getaura.com.br>',
      to: ['contato@getaura.com.br'],
      subject,
      html,
      text,
      tags: [{ name: 'source', value: 'site-contact-form' }],
    };
    if (email) resendPayload.reply_to = email;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('[contact] resend api error:', resp.status, errText);
      if (!crmOk) return jsonResp({ ok: false, error: 'Nao foi possivel enviar agora. Tente em alguns minutos ou nos chame no WhatsApp.' }, 502);
    } else {
      const result = await resp.json().catch(() => ({}));
      console.log('[contact] email enviado:', result?.id, 'nome:', nome, 'crm:', crmOk);
      emailOk = true;
    }
  } catch (err) {
    console.error('[contact] email fatal:', err.message);
    if (!crmOk) return jsonResp({ ok: false, error: 'Erro inesperado. Tente novamente.' }, 500);
  }

  return jsonResp({
    ok: true,
    message: 'Recebido! Entraremos em contato pelo WhatsApp em minutos.',
    crm: crmOk,
    email: emailOk,
  });
}

// ── Encaminha o lead pro backend (CRM ProspecaoAdmin), best-effort ──
async function forwardLeadToCrm(env, f) {
  const apiBase = env.AURA_API_URL || 'https://aura-backend-production-f805.up.railway.app/api/v1';
  if (!env.SITE_LEADS_TOKEN) {
    console.warn('[contact] SITE_LEADS_TOKEN ausente — pulando CRM');
    return false;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const resp = await fetch(`${apiBase}/public/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-site-token': env.SITE_LEADS_TOKEN },
      body: JSON.stringify({
        nome: f.nome, whatsapp: f.whatsapp, email: f.email,
        empresa: f.empresa, cargo: f.cargo, tipo: f.tipo,
        vertical: f.vertical, mensagem: f.mensagem,
        partial: !!f.partial, source: f.partial ? 'site_partial' : 'site',
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      console.error('[contact] crm api status:', resp.status);
      return false;
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

// ── Captura PARCIAL (form progressivo passo 1 / exit-intent) ──
// Pessoa deixou o contato mas ainda NAO enviou o formulario completo.
// Vai pro CRM como lead parcial (source='site_partial'); SEM e-mail.
async function handlePartial(request, env) {
  if (request.method !== 'POST') {
    return jsonResp({ ok: false, error: 'Metodo nao suportado' }, 405);
  }
  let whatsapp = '', email = '', vertical = '', nome = '', honeypot = '', tsToken = '';
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
    email    = (body.email || body['e-mail'] || '').toString().trim();
    vertical = (body.vertical || '').toString().trim();
    nome     = (body.nome || body.name || '').toString().trim();
    honeypot = (body._empresa || body.honeypot || '').toString().trim();
    tsToken  = (body['cf-turnstile-response'] || body.turnstile_token || '').toString().trim();
  } catch (err) {
    return jsonResp({ ok: false, error: 'Formato invalido' }, 400);
  }

  // ── Anti-bot: honeypot + turnstile + país ──
  const blocked = await antiBotGate(request, env, { honeypot, tsToken, tag: 'partial' });
  if (blocked) return blocked;

  // Parcial precisa de telefone BR válido OU e-mail válido
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidBrPhone(whatsapp) && !emailValido) {
    return jsonResp({ ok: false, error: 'Informe um WhatsApp com DDD ou um e-mail valido.' }, 400);
  }
  // Link em campo livre = spam → descarte silencioso
  if (hasSpamContent(nome, vertical)) {
    console.log('[partial] spam content discarded');
    return jsonResp({ ok: true });
  }

  const ok = await forwardLeadToCrm(env, { nome, whatsapp, email, vertical, partial: true });
  return ok
    ? jsonResp({ ok: true, message: 'Recebido! A gente te chama no WhatsApp.' })
    : jsonResp({ ok: false, error: 'Nao foi possivel agora. Tenta de novo ou chama no WhatsApp.' }, 502);
}

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
      return handleContact(request, env);
    }

    // Tudo mais: static assets
    return env.ASSETS.fetch(request);
  },
};
