// ============================================================
// AURA. — Worker entry-point (Workers + Static Assets)
//
// Rotas:
//   POST /api/contact  → captura lead via Resend
//   *                  → static assets (HTML, CSS, JS, imagens)
//
// Setup necessario no Cloudflare Dashboard:
//   Workers & Pages > aura-site > Settings > Variables and Secrets
//     RESEND_API_KEY = re_xxxxxxxxxx   (Secret, encrypted)
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
  let cargo = '', empresa = '', vertical = '', email = '';
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
  } catch (err) {
    return jsonResp({ ok: false, error: 'Formato invalido' }, 400);
  }

  // Honeypot — responde 200 mas nao envia (nao revela detecção)
  if (honeypot) {
    console.log('[contact] honeypot triggered, ignoring submission');
    return jsonResp({ ok: true, message: 'Recebido' });
  }

  // Validacao basica
  if (!nome || nome.length < 2) {
    return jsonResp({ ok: false, error: 'Nome obrigatorio' }, 400);
  }
  if (!whatsapp || !/\d/.test(whatsapp)) {
    return jsonResp({ ok: false, error: 'Telefone/WhatsApp obrigatorio' }, 400);
  }
  if (mensagem.length > 2000) {
    return jsonResp({ ok: false, error: 'Mensagem muito longa' }, 400);
  }
  if (tipo && !ALLOWED_TIPOS.includes(tipo)) {
    tipo = '';
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
        vertical: f.vertical, mensagem: f.mensagem, source: 'site',
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // SEO: host canonico = www. Apex (getaura.com.br) responde 301 limpo
    // pro mesmo path/query em www (audit 06/2026: apex voltava vazio).
    if (url.hostname === 'getaura.com.br') {
      url.hostname = 'www.getaura.com.br';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/contact') {
      return handleContact(request, env);
    }

    // Tudo mais: static assets
    return env.ASSETS.fetch(request);
  },
};
