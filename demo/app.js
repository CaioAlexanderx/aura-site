// ══ STATE ═════════════════════════════════════════════════════
const state = {
  page: 'dashboard',
  theme: 'dark',
  mode: 'client',
  vertical: null,
  cartItems: [],
  retiradaPct: 40,
  activeTab: {},
};

// ══ CONSTANTS / ICONS ═════════════════════════════════════════
const I = {
  plus: `<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check: `<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  arrow: `<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  ext: `<svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 1 0h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
};

const pageTitles = {
  dashboard: ['Painel', 'Visão geral da empresa'],
  financeiro: ['Financeiro', 'Lançamentos, DRE e Retirada'],
  nfe: ['NF-e / NFS-e', 'Emissão e histórico de notas'],
  contabil: ['Contabilidade', 'Obrigações e checkpoints fiscais'],
  analista: ['Meu Analista', 'Canal direto com o CRC'],
  documentos: ['Documentos', 'Arquivos e comprovantes'],
  pdv: ['PDV', 'Ponto de Venda'],
  estoque: ['Estoque', 'Produtos e movimentações'],
  canal: ['Canal Digital', 'Site, Loja e Analytics'],
  folha: ['Folha de Pagamento', 'Funcionários e holerites'],
  clientes: ['Clientes', 'CRM e relacionamento'],
  whatsapp: ['WhatsApp', 'Automações e campanhas'],
  ia: ['Assistente IA', 'Posts, previsões e cobranças'],
  planos: ['Meu Plano', 'Assinatura e recursos'],
  empresa: ['Minha Empresa', 'Dados cadastrais'],
  vertical: ['Módulo Vertical', 'Funcionalidades do segmento'],
  onboarding: ['Onboarding', 'Configure sua empresa'],
  'g-central': ['Central de Controle', 'Gestão Aura · Portfólio'],
  'g-honorarios': ['Honorários', 'Gestão de recebíveis CRC'],
  'g-atendimentos': ['Atendimentos', 'Histórico de suporte'],
  'g-relatorios': ['Relatórios', 'Visão financeira consolidada'],
};

const weekData = [
  { l: 'Seg', v: 1820 },
  { l: 'Ter', v: 2340 },
  { l: 'Qua', v: 1950 },
  { l: 'Qui', v: 3100 },
  { l: 'Sex', v: 2780 },
  { l: 'Sáb', v: 3420 },
  { l: 'Dom', v: 890 },
];

const monthData = [
  { l: 'Jan', v: 18400 },
  { l: 'Fev', v: 21200 },
  { l: 'Mar', v: 19800 },
  { l: 'Abr', v: 24600 },
  { l: 'Mai', v: 22100 },
  { l: 'Jun', v: 28900 },
  { l: 'Jul', v: 25400 },
  { l: 'Ago', v: 31200 },
  { l: 'Set', v: 29800 },
  { l: 'Out', v: 33500 },
  { l: 'Nov', v: 30100 },
  { l: 'Dez', v: 36800 },
];

// ══ PAGE REGISTRY ═════════════════════════════════════════════
const pages = {};

// ══ HELPERS ═══════════════════════════════════════════════════
function chartBars(data, today = 6) {
  const max = Math.max(...data.map((d) => d.v));

  return data
    .map(
      (d, i) =>
        `<div class="chart-bar${i === today ? ' today' : ''}" style="height:${Math.max(
          10,
          (d.v / max) * 100
        )}%" title="${d.l}: R$ ${d.v.toLocaleString('pt-BR')}"></div>`
    )
    .join('');
}

function chartLabels(data) {
  return data.map((d) => `<span>${d.l}</span>`).join('');
}

function getPaymentTabContent(tab) {
  if (tab === 'pix') {
    return `
      <div style="background:var(--bg3);border-radius:var(--r-lg);padding:20px;text-align:center;margin-bottom:12px">
        <div style="font-size:11px;color:var(--ink3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.08em">
          QR Code Pix
        </div>

        <div style="width:120px;height:120px;background:var(--bg4);border-radius:var(--r-sm);margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ink3)">
          QR Code
        </div>

        <div style="font-size:20px;font-weight:800;margin:12px 0 4px;letter-spacing:-.03em">
          R$ 150,00
        </div>

        <div class="badge badge-a" style="margin:0 auto">Aguardando</div>
      </div>

      <button class="btn btn-g" style="width:100%;justify-content:center">
        Copiar chave Pix
      </button>
    `;
  }

  if (tab === 'link') {
    return `
      <div class="card-inner" style="margin-bottom:12px">
        <div class="text-xs text-ink3 mb-8">Link de pagamento</div>
        <div class="text-sm" style="word-break:break-all">
          https://aura.pag/link/abc123
        </div>
      </div>

      <button class="btn btn-g" style="width:100%;justify-content:center">
        Copiar link
      </button>
    `;
  }

  return `
    <div class="card-inner" style="margin-bottom:12px">
      <div class="field" style="margin-bottom:10px">
        <div class="label">Número do cartão</div>
        <input type="text" class="input" placeholder="0000 0000 0000 0000">
      </div>

      <div class="grid-2 gap-12">
        <div class="field">
          <div class="label">Validade</div>
          <input type="text" class="input" placeholder="MM/AA">
        </div>

        <div class="field">
          <div class="label">CVV</div>
          <input type="text" class="input" placeholder="123">
        </div>
      </div>
    </div>

    <button class="btn btn-p" style="width:100%;justify-content:center">
      Cobrar no cartão
    </button>
  `;
}

// ══ THEME ═════════════════════════════════════════════════════
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('theme-label').textContent =
    state.theme === 'dark' ? 'Modo claro' : 'Modo escuro';
}

function initTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  state.theme = current;

  const label = document.getElementById('theme-label');
  if (label) {
    label.textContent = current === 'dark' ? 'Modo claro' : 'Modo escuro';
  }
}

// ══ DROPDOWN / MODAL / SLIDE-OVER ═════════════════════════════
function toggleDropdown() {
  document.getElementById('sb-dropdown').classList.toggle('open');
}

function closeDropdown() {
  document.getElementById('sb-dropdown').classList.remove('open');
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function openSlideOver(title, sub, body) {
  document.getElementById('so-title').textContent = title;
  document.getElementById('so-sub').textContent = sub;
  document.getElementById('so-body').innerHTML = body;
  document.getElementById('so-bg').classList.add('open');
  document.getElementById('slide-over').classList.add('open');
}

function closeSlideOver() {
  document.getElementById('so-bg').classList.remove('open');
  document.getElementById('slide-over').classList.remove('open');
}

// ══ NAVIGATION ════════════════════════════════════════════════
function nav(page, el) {
  state.page = page;

  document.querySelectorAll('#nav-client .sb-item').forEach((i) => i.classList.remove('on'));

  if (el) {
    el.classList.add('on');
  } else {
    const navMap = {
      dashboard: '#nav-client .sb-item[onclick*="dashboard"]',
      financeiro: '#nav-client .sb-item[onclick*="financeiro"]',
      nfe: '#nav-client .sb-item[onclick*="nfe"]',
      contabil: '#nav-client .sb-item[onclick*="contabil"]',
      analista: '#nav-client .sb-item[onclick*="analista"]',
      documentos: '#nav-client .sb-item[onclick*="documentos"]',
      pdv: '#nav-client .sb-item[onclick*="pdv"]',
      estoque: '#nav-client .sb-item[onclick*="estoque"]',
      canal: '#nav-client .sb-item[onclick*="canal"]',
      folha: '#nav-client .sb-item[onclick*="folha"]',
      clientes: '#nav-client .sb-item[onclick*="clientes"]',
      whatsapp: '#nav-client .sb-item[onclick*="whatsapp"]',
      ia: '#nav-client .sb-item[onclick*="ia"]',
      vertical: '#sb-vertical',
    };

    const target = navMap[page] ? document.querySelector(navMap[page]) : null;
    if (target) target.classList.add('on');
  }

  renderPage(page);
  closeDropdown();
}

function navG(page, el) {
  state.page = page;
  document.querySelectorAll('#nav-gestao .sb-item').forEach((i) => i.classList.remove('on'));

  if (el) {
    el.classList.add('on');
  }

  renderPage(page);
}

function navO(page, el) {
  state.page = page;
  document.querySelectorAll('#nav-onboarding .sb-item').forEach((i) => i.classList.remove('on'));

  if (el) {
    el.classList.add('on');
  }

  renderPage(page);
}

function setMode(mode, btn) {
  state.mode = mode;

  document.querySelectorAll('.tb-mode-btn').forEach((b) => b.classList.remove('on'));
  btn.classList.add('on');

  document.getElementById('nav-client').style.display = mode === 'client' ? 'block' : 'none';
  document.getElementById('nav-gestao').style.display = mode === 'gestao' ? 'block' : 'none';
  document.getElementById('nav-onboarding').style.display = mode === 'onboarding' ? 'block' : 'none';

  if (mode === 'client') {
    nav('dashboard', document.querySelector('#nav-client .sb-item'));
  }

  if (mode === 'gestao') {
    navG('g-central', document.querySelector('#nav-gestao .sb-item'));
  }

  if (mode === 'onboarding') {
    navO('onboarding', document.querySelector('#nav-onboarding .sb-item'));
  }
}

function setVertical(vertical, btn) {
  state.vertical = vertical;

  document.querySelectorAll('.sb-demo-btn').forEach((b) => b.classList.remove('on'));

  const off = document.getElementById('demo-off');
  const sbVertical = document.getElementById('sb-vertical');
  const sbVerticalName = document.getElementById('sb-vertical-name');

  if (vertical) {
    btn.classList.add('on');
    off.style.display = 'inline-flex';
    sbVertical.classList.remove('hidden');
    sbVerticalName.textContent =
      vertical === 'odonto' ? '🦷 Odontologia' : '✂️ Salão/Barbearia';
    nav('vertical', sbVertical);
  } else {
    off.style.display = 'none';
    sbVertical.classList.add('hidden');
    nav('dashboard', document.querySelector('#nav-client .sb-item'));
  }
}

function updateTopbar(page) {
  const titleData = pageTitles[page] || [page, ''];
  document.getElementById('tb-title').textContent = titleData[0];
  document.getElementById('tb-sub').textContent = titleData[1];
}

// ══ TABS / UI ACTIONS ═════════════════════════════════════════
function switchTab(el, key) {
  const parent = el.closest('.tabs');
  parent.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
  el.classList.add('on');
  state.activeTab[key] = el.textContent;
}

function switchDashboardChart(el, mode) {
  const parent = el.closest('.tabs');
  parent.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
  el.classList.add('on');

  const data = mode === 'month' ? monthData.slice(-6) : weekData;
  const todayIndex = mode === 'month' ? data.length - 1 : 6;

  document.getElementById('dash-chart-bars').innerHTML = chartBars(data, todayIndex);
  document.getElementById('dash-chart-labels').innerHTML = chartLabels(data);
}

function switchPaymentTab(el, tab) {
  const parent = el.closest('.tabs');
  parent.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
  el.classList.add('on');

  const container = document.getElementById('payment-content');
  if (container) {
    container.innerHTML = getPaymentTabContent(tab);
  }
}

function showFinTab(tab, el) {
  ['lancamentos', 'receber', 'dre', 'retirada'].forEach((t) => {
    const target = document.getElementById(`fin-${t}`);
    if (target) {
      target.style.display = t === tab ? 'block' : 'none';
    }
  });

  el.closest('.tabs').querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
  el.classList.add('on');
}

function updateRetirada(value) {
  const base = 10544;
  const retirada = Math.round((base * value) / 100);
  const reserva = base - retirada;

  document.getElementById('retirada-pct').textContent = `${value}%`;
  document.getElementById('retirada-val').textContent = `R$ ${retirada.toLocaleString('pt-BR')}`;
  document.getElementById('retirada-res').textContent = `R$ ${reserva.toLocaleString('pt-BR')}`;
}

// ══ RENDER ════════════════════════════════════════════════════
function renderPage(page) {
  updateTopbar(page);

  const content = document.getElementById('content');
  const pageRenderer = pages[page];

  content.innerHTML = pageRenderer
    ? pageRenderer()
    : `<div class="hero"><div class="hero-eyebrow">Em breve</div><h1>${page}</h1><p>Esta seção está em desenvolvimento.</p></div>`;
}
  const base = 10544;
  const retirada = Math.round(base * v / 100);
  const reserva = base - retirada;
  document.getElementById('retirada-pct').textContent = v + '%';
  document.getElementById('retirada-val').textContent = 'R$ ' + retirada.toLocaleString('pt-BR');
  document.getElementById('retirada-res').textContent = 'R$ ' + reserva.toLocaleString('pt-BR');
}

// ══ INIT ══════════════════════════════════════════════════════
initTheme();
renderPage('dashboard');
