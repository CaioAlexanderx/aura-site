// ============================================================
// AURA. — Cloudflare Pages Function: captura de lead via Resend
//
// POST /api/contact
//
// Body (multipart/form-data ou application/x-www-form-urlencoded):
//   nome      — string obrigatorio (min 2 chars)
//   whatsapp  — string obrigatorio (algum digito)
//   tipo      — string opcional (MEI / Microempresa / etc)
//   mensagem  — string opcional (max 2000 chars)
//   _empresa  — honeypot (deve ficar vazio — preenchido = bot)
//
// Resposta:
//   { ok: true, message: "..." }     — sucesso (200)
//   { ok: false, error: "..." }      — validacao (400) ou erro (500)
//
// Setup:
//   Cloudflare Pages > Settings > Environment variables
//     RESEND_API_KEY = re_xxxxxxxxxx
//   Dominio "getaura.com.br" verificado no Resend (DNS records ja
//   apontam — sistema de relatorios usa o mesmo).
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

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── Parse body ─────────────────────────────────────────
  let nome = '', whatsapp = '', tipo = '', mensagem = '', honeypot = '';
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      nome = (body.nome || '').toString().trim();
      whatsapp = (body.whatsapp || '').toString().trim();
      tipo = (body.tipo || '').toString().trim();
      mensagem = (body.mensagem || '').toString().trim();
      honeypot = (body._empresa || '').toString().trim();
    } else {
      const form = await request.formData();
      nome = (form.get('nome') || '').toString().trim();
      whatsapp = (form.get('whatsapp') || '').toString().trim();
      tipo = (form.get('tipo') || '').toString().trim();
      mensagem = (form.get('mensagem') || '').toString().trim();
      honeypot = (form.get('_empresa') || '').toString().trim();
    }
  } catch (err) {
    return jsonResp({ ok: false, error: 'Formato invalido' }, 400);
  }

  // ── Honeypot (bot preencheu campo escondido) ───────────
  // Resposta "200 ok" pra nao revelar que detectamos — mas nao envia.
  if (honeypot) {
    console.log('[contact] honeypot triggered, ignoring submission');
    return jsonResp({ ok: true, message: 'Recebido' });
  }

  // ── Validacao basica ───────────────────────────────────
  if (!nome || nome.length < 2) {
    return jsonResp({ ok: false, error: 'Nome obrigatorio' }, 400);
  }
  if (!whatsapp || !/\d/.test(whatsapp)) {
    return jsonResp({ ok: false, error: 'WhatsApp obrigatorio' }, 400);
  }
  if (mensagem.length > 2000) {
    return jsonResp({ ok: false, error: 'Mensagem muito longa' }, 400);
  }
  if (tipo && !ALLOWED_TIPOS.includes(tipo)) {
    // Aceita silenciosamente — tipo e campo opcional, sem barrar
    tipo = '';
  }

  // ── Verificar API key ──────────────────────────────────
  if (!env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY nao configurada no env');
    return jsonResp({ ok: false, error: 'Servico de email indisponivel' }, 500);
  }

  // ── Montar email ───────────────────────────────────────
  const now = new Date();
  const dataBr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const ipHeader = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'desconhecido';
  const country = request.headers.get('cf-ipcountry') || '?';
  const userAgent = request.headers.get('user-agent') || 'desconhecido';

  const subject = `Novo lead do site: ${nome}`;
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e">
      <h2 style="color:#7c3aed;margin:0 0 16px;font-size:22px">Novo lead pelo site</h2>
      <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="background:#f5f3ff;font-weight:600;width:140px">Nome</td><td>${escapeHtml(nome)}</td></tr>
        <tr><td style="background:#f5f3ff;font-weight:600">WhatsApp</td><td><a href="https://wa.me/55${whatsapp.replace(/\D/g, '')}" style="color:#7c3aed">${escapeHtml(whatsapp)}</a></td></tr>
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
    `WhatsApp: ${whatsapp}`,
    tipo ? `Tipo:     ${tipo}` : null,
    mensagem ? `Mensagem: ${mensagem}` : null,
    '',
    `Em: ${dataBr} | IP: ${ipHeader} (${country})`,
  ].filter(Boolean).join('\n');

  // ── Enviar via Resend ──────────────────────────────────
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Aura Site <site@getaura.com.br>',
        to: ['contato@getaura.com.br'],
        reply_to: undefined, // sem reply_to — lead nao tem email, so whatsapp
        subject,
        html,
        text,
        tags: [{ name: 'source', value: 'site-contact-form' }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('[contact] resend api error:', resp.status, errText);
      return jsonResp({ ok: false, error: 'Nao foi possivel enviar agora. Tente em alguns minutos ou nos chame no WhatsApp.' }, 502);
    }

    const result = await resp.json().catch(() => ({}));
    console.log('[contact] lead enviado:', result?.id, 'nome:', nome);
    return jsonResp({ ok: true, message: 'Recebido! Entraremos em contato pelo WhatsApp em minutos.' });
  } catch (err) {
    console.error('[contact] fatal:', err.message);
    return jsonResp({ ok: false, error: 'Erro inesperado. Tente novamente.' }, 500);
  }
}

// GET nao suportado — devolve 405 com mensagem informativa
export async function onRequestGet() {
  return jsonResp({ ok: false, error: 'Use POST com nome + whatsapp pra enviar contato' }, 405);
}
