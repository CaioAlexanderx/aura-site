// ============================================================
// AURA. — E-mail do "quero que me chamem" (Resend)
//
// Montagem separada do envio para dar pra testar sem rede:
// buildLeadEmail() só monta o payload; sendLeadEmail() faz o POST.
// ============================================================

const RESEND_URL = 'https://api.resend.com/emails';

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// lead = { phone: '(11) 99999-8888', digits: '11999998888', page, country }
export function buildLeadEmail(lead, now = new Date()) {
  const phone = String(lead.phone || '');
  const digits = String(lead.digits || '').replace(/\D/g, '');
  const page = String(lead.page || '') || '(não informada)';
  const country = String(lead.country || '') || '?';
  const waUrl = `https://wa.me/55${digits}`;
  const when = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const subject = `Novo pedido de contato: ${phone}`;

  const row = (label, value) =>
    `<tr><td style="background:#f5f3ff;font-weight:600;width:140px">${label}</td><td>${value}</td></tr>`;

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a2e">
      <h2 style="color:#7c3aed;margin:0 0 8px;font-size:22px">Pediram para ser chamados no WhatsApp</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#444">Alguém deixou o número no site e quer que a equipe chame.</p>
      <table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
        ${row('WhatsApp', escapeHtml(phone))}
        ${row('Página', escapeHtml(page))}
        ${row('Quando', escapeHtml(when))}
        ${row('País', escapeHtml(country))}
      </table>
      <p style="margin:24px 0 0">
        <a href="${escapeHtml(waUrl)}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px">Abrir conversa no WhatsApp</a>
      </p>
    </div>
  `;

  const text = [
    'Pediram para ser chamados no WhatsApp',
    '',
    `WhatsApp: ${phone}`,
    `Abrir conversa no WhatsApp: ${waUrl}`,
    `Página:   ${page}`,
    `Quando:   ${when}`,
    `País:     ${country}`,
  ].join('\n');

  return {
    from: 'Aura Site <site@getaura.com.br>',
    to: ['contato@getaura.com.br'],
    subject,
    html,
    text,
    tags: [{ name: 'source', value: 'site-partial' }],
  };
}

export async function sendLeadEmail(env, lead) {
  if (!env.RESEND_API_KEY) {
    console.warn('[lead] RESEND_API_KEY ausente — pulando e-mail');
    return false;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const resp = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildLeadEmail(lead)),
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      console.error('[lead] resend api status:', resp.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[lead] resend error:', err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
