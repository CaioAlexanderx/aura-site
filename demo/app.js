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

// ══ ICONS HELPER ══════════════════════════════════════════════
const I = {
  plus:`<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  check:`<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert:`<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  arrow:`<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  ext:`<svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 0 1 0h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
};

// ══ NAVIGATION ════════════════════════════════════════════════
function nav(page, el) {
  state.page = page;

  document.querySelectorAll('#nav-client .sb-item').forEach(i => i.classList.remove('on'));

  if (el) {
    el.classList.add('on');
  } else {
    const navMap = {
      dashboard: "#nav-client .sb-item[onclick*=\"dashboard\"]",
      financeiro: "#nav-client .sb-item[onclick*=\"financeiro\"]",
      nfe: "#nav-client .sb-item[onclick*=\"nfe\"]",
      contabil: "#nav-client .sb-item[onclick*=\"contabil\"]",
      analista: "#nav-client .sb-item[onclick*=\"analista\"]",
      documentos: "#nav-client .sb-item[onclick*=\"documentos\"]",
      pdv: "#nav-client .sb-item[onclick*=\"pdv\"]",
      estoque: "#nav-client .sb-item[onclick*=\"estoque\"]",
      canal: "#nav-client .sb-item[onclick*=\"canal\"]",
      folha: "#nav-client .sb-item[onclick*=\"folha\"]",
      clientes: "#nav-client .sb-item[onclick*=\"clientes\"]",
      whatsapp: "#nav-client .sb-item[onclick*=\"whatsapp\"]",
      ia: "#nav-client .sb-item[onclick*=\"ia\"]",
      vertical: "#sb-vertical"
    };

    const target = navMap[page] ? document.querySelector(navMap[page]) : null;
    if (target) target.classList.add('on');
  }

  renderPage(page);
  closeDropdown();
}
function navG(page, el) {
  state.page = page;
  document.querySelectorAll('#nav-gestao .sb-item').forEach(i=>i.classList.remove('on'));
  if(el) el.classList.add('on');
  renderPage(page);
}
function navO(page, el) {
  state.page = page;
  document.querySelectorAll('#nav-onboarding .sb-item').forEach(i=>i.classList.remove('on'));
  if(el) el.classList.add('on');
  renderPage(page);
}
function setMode(m, btn) {
  state.mode = m;
  document.querySelectorAll('.tb-mode-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('nav-client').style.display = m==='client'?'block':'none';
  document.getElementById('nav-gestao').style.display = m==='gestao'?'block':'none';
  document.getElementById('nav-onboarding').style.display = m==='onboarding'?'block':'none';
  if(m==='client') nav('dashboard', document.querySelector('#nav-client .sb-item'));
  if(m==='gestao') navG('g-central', document.querySelector('#nav-gestao .sb-item'));
  if(m==='onboarding') navO('onboarding', document.querySelector('#nav-onboarding .sb-item'));
}
function setVertical(v, btn) {
  state.vertical = v;
  document.querySelectorAll('.sb-demo-btn').forEach(b=>b.classList.remove('on'));
  const off = document.getElementById('demo-off');
  const sbV = document.getElementById('sb-vertical');
  const sbVN = document.getElementById('sb-vertical-name');
  if(v) {
    btn.classList.add('on');
    off.style.display='inline-flex';
    sbV.classList.remove('hidden');
    sbVN.textContent = v==='odonto'?'🦷 Odontologia':'✂️ Salão/Barbearia';
    nav('vertical', sbV);
  } else {
    off.style.display='none';
    sbV.classList.add('hidden');
    nav('dashboard', document.querySelector('#nav-client .sb-item'));
  }
}

// ══ THEME ══════════════════════════════════════════════════════
function toggleTheme() {
  state.theme = state.theme==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('theme-label').textContent = state.theme==='dark'?'Modo claro':'Modo escuro';
}
function initTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  state.theme = current;

  const label = document.getElementById('theme-label');
  if (label) {
    label.textContent = current === 'dark' ? 'Modo claro' : 'Modo escuro';
  }
}

// ══ DROPDOWN / MODAL ══════════════════════════════════════════
function toggleDropdown(){ document.getElementById('sb-dropdown').classList.toggle('open'); }
function closeDropdown(){ document.getElementById('sb-dropdown').classList.remove('open'); }
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function openSlideOver(title,sub,body){
  document.getElementById('so-title').textContent=title;
  document.getElementById('so-sub').textContent=sub;
  document.getElementById('so-body').innerHTML=body;
  document.getElementById('so-bg').classList.add('open');
  document.getElementById('slide-over').classList.add('open');
}
function closeSlideOver(){
  document.getElementById('so-bg').classList.remove('open');
  document.getElementById('slide-over').classList.remove('open');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.sb-avatar')) closeDropdown();
});

// ══ TABS ══════════════════════════════════════════════════════
function switchTab(el, key) {
  const parent = el.closest('.tabs');
  parent.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  state.activeTab[key] = el.textContent;
}
function switchDashboardChart(el, mode) {

  const parent = el.closest('.tabs');
  parent.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');

  const data = mode === 'month' ? monthData.slice(-6) : weekData;
  const todayIndex = mode === 'month' ? data.length - 1 : 6;

  document.getElementById('dash-chart-bars').innerHTML =
    chartBars(data, todayIndex);

  document.getElementById('dash-chart-labels').innerHTML =
    chartLabels(data);
}
function getPaymentTabContent(tab){

  if(tab === 'pix'){
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
    `
  }


  if(tab === 'link'){
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
    `
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
  `
}



function switchPaymentTab(el, tab){

  const parent = el.closest('.tabs')

  parent.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'))

  el.classList.add('on')

  const container = document.getElementById('payment-content')

  if(container){
    container.innerHTML = getPaymentTabContent(tab)
  }

}
// ══ TOPBAR UPDATE ══════════════════════════════════════════════
const pageTitles = {
  dashboard:['Painel','Visão geral da empresa'],
  financeiro:['Financeiro','Lançamentos, DRE e Retirada'],
  nfe:['NF-e / NFS-e','Emissão e histórico de notas'],
  contabil:['Contabilidade','Obrigações e checkpoints fiscais'],
  analista:['Meu Analista','Canal direto com o CRC'],
  documentos:['Documentos','Arquivos e comprovantes'],
  pdv:['PDV','Ponto de Venda'],
  estoque:['Estoque','Produtos e movimentações'],
  canal:['Canal Digital','Site, Loja e Analytics'],
  folha:['Folha de Pagamento','Funcionários e holerites'],
  clientes:['Clientes','CRM e relacionamento'],
  whatsapp:['WhatsApp','Automações e campanhas'],
  ia:['Assistente IA','Posts, previsões e cobranças'],
  planos:['Meu Plano','Assinatura e recursos'],
  empresa:['Minha Empresa','Dados cadastrais'],
  vertical:['Módulo Vertical','Funcionalidades do segmento'],
  onboarding:['Onboarding','Configure sua empresa'],
  'g-central':['Central de Controle','Gestão Aura · Portfólio'],
  'g-honorarios':['Honorários','Gestão de recebíveis CRC'],
  'g-atendimentos':['Atendimentos','Histórico de suporte'],
  'g-relatorios':['Relatórios','Visão financeira consolidada'],
};
function updateTopbar(page) {
  const t = pageTitles[page]||[page,''];
  document.getElementById('tb-title').textContent=t[0];
  document.getElementById('tb-sub').textContent=t[1];
}

// ══ PAGE RENDERER ══════════════════════════════════════════════
function renderPage(page) {
  updateTopbar(page);
  const c = document.getElementById('content');
  const fn = pages[page];
  c.innerHTML = fn ? fn() : `<div class="hero"><div class="hero-eyebrow">Em breve</div><h1>${page}</h1><p>Esta seção está em desenvolvimento.</p></div>`;
}

// ══ CHART HELPER ══════════════════════════════════════════════
function chartBars(data, today=6) {
  const max = Math.max(...data.map(d=>d.v));
  return data.map((d,i)=>`<div class="chart-bar${i===today?' today':''}" style="height:${Math.max(10,(d.v/max)*100)}%" title="${d.l}: R$ ${d.v.toLocaleString('pt-BR')}"></div>`).join('');
}
function chartLabels(data) {
  return data.map(d=>`<span>${d.l}</span>`).join('');
}
const weekData=[
  {l:'Seg',v:1820},{l:'Ter',v:2340},{l:'Qua',v:1950},{l:'Qui',v:3100},{l:'Sex',v:2780},{l:'Sáb',v:3420},{l:'Dom',v:890}
];
const monthData=[
  {l:'Jan',v:18400},{l:'Fev',v:21200},{l:'Mar',v:19800},{l:'Abr',v:24600},{l:'Mai',v:22100},{l:'Jun',v:28900},
  {l:'Jul',v:25400},{l:'Ago',v:31200},{l:'Set',v:29800},{l:'Out',v:33500},{l:'Nov',v:30100},{l:'Dez',v:36800}
];

// ══ PAGES OBJECT ══════════════════════════════════════════════
const pages = {};

// ── DASHBOARD ──────────────────────────────────────────────────
pages.dashboard = () => `
<div class="hero">
  <div class="hero-eyebrow">${I.alert} Março · 2026</div>
  <h1>Bom dia, João. Sua empresa está saudável.</h1>
  <p>Faturamento 12% acima da média dos últimos 3 meses. DAS vence em <strong>14 dias</strong> — estimativa preparada.</p>
  <div class="hero-badges">
    <span class="hero-badge">✓ Caixa positivo</span>
    <span class="hero-badge">✓ 0 pendências fiscais</span>
    <span class="hero-badge">⚡ Analista disponível</span>
  </div>
</div>
<div class="kpi-grid">
  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--g)"></div>
    <div class="kpi-label"><svg class="ic" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg>Receita do mês</div>
    <div class="kpi-val">R$ 18.420</div>
    <div class="kpi-delta up">▲ 12% vs mês anterior</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--re)"></div>
    <div class="kpi-label"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>Despesas</div>
    <div class="kpi-val">R$ 7.840</div>
    <div class="kpi-delta down">▲ 3% vs mês anterior</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--v2)"></div>
    <div class="kpi-label"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Saldo líquido</div>
    <div class="kpi-val">R$ 10.580</div>
    <div class="kpi-delta up">▲ 18% vs mês anterior</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--am)"></div>
    <div class="kpi-label"><svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Vendas hoje</div>
    <div class="kpi-val">47</div>
    <div class="kpi-delta neutral">Até agora · atualizado</div>
  </div>
</div>
<div class="grid-31" style="margin-bottom:16px">
  <div class="card">
    <div class="sec-head">
      <div><div class="sec-title">Receita — últimas semanas</div></div>
      <div class="tabs" style="margin-bottom:0">
  <div class="tab on" onclick="switchDashboardChart(this,'week')">Semana</div>
  <div class="tab" onclick="switchDashboardChart(this,'month')">Mês</div>
</div>
...
<div class="chart-area" id="dash-chart-bars">${chartBars(weekData)}</div>
<div class="chart-labels" id="dash-chart-labels">${chartLabels(weekData)}</div>
  </div>
  <div class="card">
    <div class="sec-title" style="margin-bottom:14px">A receber</div>
    <div class="list-item" style="margin-bottom:6px">
      <div class="list-icon list-icon-g"><svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="list-main"><div class="list-name">Clínica Bem-Estar</div><div class="list-detail">Vence em 3 dias</div></div>
      <div class="list-end"><div class="list-val text-g">R$ 1.200</div></div>
    </div>
    <div class="list-item" style="margin-bottom:6px">
      <div class="list-icon list-icon-a"><svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="list-main"><div class="list-name">Loja do Pedro</div><div class="list-detail">Vence hoje</div></div>
      <div class="list-end"><div class="list-val text-am">R$ 680</div></div>
    </div>
    <div class="list-item">
      <div class="list-icon list-icon-r"><svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div class="list-main"><div class="list-name">Maria Costureira</div><div class="list-detail">Venceu há 2 dias</div></div>
      <div class="list-end"><div class="list-val text-re">R$ 320</div></div>
    </div>
    <button class="btn btn-g btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="nav('financeiro',document.querySelectorAll('#nav-client .sb-item')[1])">Ver todos</button>
  </div>
</div>
<div class="grid-2">
  <div class="card-sm">
    <div class="sec-head"><div class="sec-title">Obrigações próximas</div><span class="streak-badge">🔥 Streak: 4</span></div>
    <div class="check-item done"><div class="check-circle"><svg class="check-ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="flex-1"><div class="list-name">DAS-MEI gerado</div><div class="list-detail">Vence 20/04 · R$ 75,90 estimado</div></div><span class="badge badge-g">Pronto</span></div>
    <div class="check-item due"><div class="check-circle"></div><div class="flex-1"><div class="list-name">PGDAS-D</div><div class="list-detail">Vence 20/04 · Analista transmite</div></div><span class="badge badge-a">14 dias</span></div>
    <div class="check-item"><div class="check-circle"></div><div class="flex-1"><div class="list-name">Folha de pagamento</div><div class="list-detail">Competência março/2026</div></div><span class="badge badge-b">Aberto</span></div>
  </div>
  <div class="card-sm">
    <div class="sec-head"><div class="sec-title">Analista · João CRC</div><span class="badge badge-g"><span class="dot"></span>Online</span></div>
    <div class="alert alert-v" style="margin-bottom:10px"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>PGDAS-D de março aguardando revisão. Dados preparados pela Aura.</div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <button class="btn btn-p btn-sm" style="width:100%;justify-content:center" onclick="nav('analista',document.querySelectorAll('#nav-client .sb-item')[4])">Abrir chat com analista</button>
      <button class="btn btn-s btn-sm" style="width:100%;justify-content:center">Ver histórico de envios</button>
    </div>
  </div>
</div>`;

// ── FINANCEIRO ─────────────────────────────────────────────────
pages.financeiro = () => `
<div class="hero">
  <div class="hero-eyebrow">💰 Core Financeiro</div>
  <h1>Financeiro — Março 2026</h1>
  <p>Lançamentos, contas a receber, DRE gerencial e cálculo da sua retirada mensal.</p>
</div>
<div class="tabs">
  <div class="tab on" onclick="showFinTab('lancamentos',this)">Lançamentos</div>
  <div class="tab" onclick="showFinTab('receber',this)">A receber</div>
  <div class="tab" onclick="showFinTab('dre',this)">DRE</div>
  <div class="tab" onclick="showFinTab('retirada',this)">Minha Retirada</div>
</div>
<div id="fin-lancamentos">
  <div class="sec-head">
    <div class="search-bar" style="min-width:260px"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar lançamentos..."></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-s btn-sm">Importar OFX</button>
      <button class="btn btn-p btn-sm" onclick="openModal('modal-lancamento')">${I.plus} Novo</button>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th></tr></thead>
      <tbody>
        ${[
          ['28/03','Venda PDV — balcão','Vendas','receita','+ R$ 340,00'],
          ['27/03','Aluguel sala comercial','Despesas fixas','despesa','- R$ 800,00'],
          ['27/03','Venda online — loja','Vendas','receita','+ R$ 220,00'],
          ['26/03','Energia elétrica','Despesas fixas','despesa','- R$ 180,00'],
          ['26/03','Venda PDV — cartão','Vendas','receita','+ R$ 560,00'],
          ['25/03','Material de escritório','Despesas variáveis','despesa','- R$ 95,00'],
          ['25/03','Serviço prestado — PJ','Serviços','receita','+ R$ 1.200,00'],
        ].map(([d,n,c,t,v])=>`<tr>
          <td class="mono text-xs">${d}</td>
          <td>${n}</td>
          <td><span class="badge badge-${t==='receita'?'g':'r'}">${c}</span></td>
          <td><span class="badge badge-${t==='receita'?'g':'r'}">${t==='receita'?'Receita':'Despesa'}</span></td>
          <td class="fw-600 ${t==='receita'?'text-g':'text-re'}">${v}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>
<div id="fin-receber" style="display:none">
  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi-card"><div class="kpi-label">Total a receber</div><div class="kpi-val">R$ 4.820</div><div class="kpi-delta up">6 cobranças abertas</div></div>
    <div class="kpi-card"><div class="kpi-label">Vencendo hoje</div><div class="kpi-val text-am">R$ 680</div><div class="kpi-delta neutral">1 cobrança</div></div>
    <div class="kpi-card"><div class="kpi-label">Em atraso</div><div class="kpi-val text-re">R$ 320</div><div class="kpi-delta down">1 cobrança</div></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Cliente</th><th>Descrição</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr></thead>
      <tbody>
        ${[
          ['Clínica Bem-Estar','Serviço abril','31/03','pendente','R$ 1.200'],
          ['Loja do Pedro','Venda a prazo','28/03','vence-hoje','R$ 680'],
          ['Maria Costureira','Serviço março','26/03','atrasado','R$ 320'],
          ['Consultório Dr. Ana','Consultoria','05/04','pendente','R$ 2.200'],
          ['Escola Primeiros Passos','Material','10/04','pendente','R$ 420'],
        ].map(([c,d,v,s,val])=>`<tr>
          <td class="fw-600">${c}</td>
          <td>${d}</td>
          <td class="mono text-sm">${v}</td>
          <td><span class="badge badge-${s==='atrasado'?'r':s==='vence-hoje'?'a':'b'}">${s==='atrasado'?'Atrasado':s==='vence-hoje'?'Vence hoje':'Pendente'}</span></td>
          <td class="fw-600">${val}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div style="display:flex;gap:8px;margin-top:12px">
    <button class="btn btn-p btn-sm" onclick="openModal('modal-pagamento')">Cobrar via Pix</button>
    <button class="btn btn-s btn-sm">Enviar cobrança WhatsApp</button>
  </div>
</div>
<div id="fin-dre" style="display:none">
  <div class="grid-31">
    <div class="card">
      <div class="sec-title" style="margin-bottom:16px">DRE Gerencial — Março 2026</div>
      ${[
        ['Receita bruta','R$ 18.420','income'],
        ['(-) Impostos estimados','R$ 1.382','expense'],
        ['(=) Receita líquida','R$ 17.038','result'],
        ['(-) Custos variáveis','R$ 4.200','expense'],
        ['(-) Despesas fixas','R$ 3.640','expense'],
        ['(=) EBITDA','R$ 9.198','result'],
        ['(-) Pró-labore','R$ 3.500','expense'],
        ['(=) Resultado final','R$ 5.698','result'],
      ].map(([l,v,t])=>`<div class="wf-row ${t}"><span>${l}</span><span class="fw-700">${v}</span></div>`).join('')}
      <div class="alert alert-v mt-12"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Valores são estimativas gerenciais. Transmissão oficial pelo analista CRC.</div>
    </div>
    <div>
      <div class="card-sm" style="margin-bottom:14px">
        <div class="sec-title" style="margin-bottom:12px">Evolução mensal</div>
        <div class="chart-area" style="height:120px">${chartBars(monthData.slice(-6),5)}</div>
        <div class="chart-labels">${chartLabels(monthData.slice(-6))}</div>
      </div>
      <div class="card-sm">
        <div class="sec-title" style="margin-bottom:12px">Faturamento no ano</div>
        <div class="kpi-val" style="font-size:22px">R$ 54.820</div>
        <div class="kpi-delta up mt-8">▲ Limite MEI: R$ 81.000</div>
        <div class="progress mt-8"><div class="progress-bar" style="width:67%"></div></div>
        <div class="text-xs text-ink3 mt-8">67,7% do limite anual · 9 meses restantes</div>
      </div>
    </div>
  </div>
</div>
<div id="fin-retirada" style="display:none">
  <div class="grid-2">
    <div class="card">
      <div class="sec-title" style="margin-bottom:4px">Minha Retirada Ideal</div>
      <div class="text-sm text-ink3 mb-16">Quanto você pode retirar com segurança</div>
      <div class="waterfall">
        <div class="wf-row income">Receita líquida do mês<span class="fw-700">R$ 17.038</span></div>
        <div class="wf-row expense">Reserva operacional (20%)<span class="fw-700">- R$ 3.408</span></div>
        <div class="wf-row expense">Reserva DAS estimado<span class="fw-700">- R$ 1.382</span></div>
        <div class="wf-row expense">Reserva crescimento (10%)<span class="fw-700">- R$ 1.704</span></div>
        <div class="wf-row result">Disponível para retirada<span class="fw-700">R$ 10.544</span></div>
      </div>
      <div class="slider-wrap mt-16">
        <div class="slider-label"><span>Retirar agora</span><span id="retirada-pct">40%</span></div>
        <input type="range" min="0" max="100" value="40" oninput="updateRetirada(this.value)">
        <div class="flex justify-between text-xs text-ink3 mt-8">
          <span>Retirada: <strong id="retirada-val" class="text-g">R$ 4.218</strong></span>
          <span>Reserva: <strong id="retirada-res" class="text-am">R$ 6.326</strong></span>
        </div>
      </div>
      <button class="btn btn-p" style="width:100%;justify-content:center;margin-top:14px" onclick="openModal('modal-pagamento')">Transferir para conta</button>
    </div>
    <div class="card">
      <div class="sec-title" style="margin-bottom:12px">Pró-labore</div>
      <div class="kpi-val" style="font-size:24px;margin-bottom:4px">R$ 3.500 / mês</div>
      <div class="text-xs text-ink3 mb-16">Valor registrado em folha · Incide INSS</div>
      <div class="card-inner mb-12">
        <div class="flex justify-between mb-8"><span class="text-sm text-ink3">Salário bruto</span><span class="fw-600">R$ 3.500,00</span></div>
        <div class="flex justify-between mb-8"><span class="text-sm text-ink3">INSS (11%)</span><span class="text-re">- R$ 385,00</span></div>
        <div class="flex justify-between"><span class="text-sm fw-600">Líquido</span><span class="fw-700 text-g">R$ 3.115,00</span></div>
      </div>
      <div class="alert alert-a"><svg class="ic" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Fator R: pró-labore representa 20% do faturamento. Meta ≥ 28% para Anexo III.</div>
    </div>
  </div>
</div>`;

// ── NF-e ──────────────────────────────────────────────────────
pages.nfe = () => `
<div class="hero">
  <div class="hero-eyebrow">📄 Notas Fiscais</div>
  <h1>NF-e / NFS-e — Emissão automática</h1>
  <p>Notas emitidas automaticamente a cada venda PJ. Histórico completo e download em XML/PDF.</p>
</div>
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi-card"><div class="kpi-label">Emitidas no mês</div><div class="kpi-val">34</div><div class="kpi-delta up">▲ 8 vs mês anterior</div></div>
  <div class="kpi-card"><div class="kpi-label">Valor total</div><div class="kpi-val">R$ 14.820</div><div class="kpi-delta up">▲ 12%</div></div>
  <div class="kpi-card"><div class="kpi-label">Canceladas</div><div class="kpi-val text-am">2</div><div class="kpi-delta neutral">No mês</div></div>
  <div class="kpi-card"><div class="kpi-label">Pendentes</div><div class="kpi-val text-re">0</div><div class="kpi-delta neutral">Tudo em dia</div></div>
</div>
<div class="sec-head">
  <div class="search-bar" style="min-width:260px"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar notas..."></div>
  <button class="btn btn-p btn-sm">${I.plus} Emitir nota</button>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Número</th><th>Tomador</th><th>Serviço/Produto</th><th>Emissão</th><th>Status</th><th>Valor</th></tr></thead>
    <tbody>
      ${[
        ['NFS-e 0034','Clínica Bem-Estar','Consultoria de gestão','28/03','autorizada','R$ 1.200'],
        ['NF-e 0033','Loja do Pedro','Produtos variados','27/03','autorizada','R$ 680'],
        ['NFS-e 0032','Consultório Dr. Ana','Serviço de TI','26/03','autorizada','R$ 2.200'],
        ['NF-e 0031','Escola Primeiros Passos','Material didático','25/03','cancelada','R$ 420'],
        ['NFS-e 0030','Oficina do Mario','Suporte técnico','24/03','autorizada','R$ 380'],
      ].map(([n,t,s,d,st,v])=>`<tr>
        <td class="mono fw-600 text-sm">${n}</td>
        <td>${t}</td>
        <td class="text-ink3 text-sm">${s}</td>
        <td class="mono text-xs">${d}</td>
        <td><span class="badge badge-${st==='cancelada'?'r':'g'}">${st}</span></td>
        <td class="fw-600">${v}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

// ── CONTABILIDADE ─────────────────────────────────────────────
pages.contabil = () => `
<div class="hero">
  <div class="hero-eyebrow">📅 Apoio Contábil</div>
  <h1>Contabilidade — Calendário e obrigações</h1>
  <p>A Aura prepara tudo. Seu analista CRC transmite. Linguagem sempre clara e sem juridiquês.</p>
  <div class="hero-badges">
    <span class="hero-badge">Regime: Simples Nacional</span>
    <span class="hero-badge">CNPJ: 12.345.678/0001-99</span>
  </div>
</div>
<div class="grid-31">
  <div>
    <div class="sec-head"><div class="sec-title">Checkpoints de março</div><span class="streak-badge">🔥 Streak: 4 meses</span></div>
    ${[
      ['DAS-MEI gerado','Estimativa R$ 75,90 · Vence 20/04','done','14 dias'],
      ['PGDAS-D apurado','Dados prontos · Analista transmite em breve','due','14 dias'],
      ['Notas fiscais em dia','34 NFS-e emitidas no mês','done','ok'],
      ['Folha fechada','Holerites enviados aos funcionários','done','ok'],
      ['Livro-caixa atualizado','87 lançamentos importados via OFX','open','aberto'],
      ['DEFIS 2025','Dados consolidados · Transmissão em breve','late','vencido'],
    ].map(([n,d,s,tag])=>`
      <div class="check-item ${s==='done'?'done':s==='due'?'due':s==='late'?'late':''}">
        <div class="check-circle">${s==='done'?`<svg class="check-ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`:''}</div>
        <div class="flex-1">
          <div class="list-name">${n}</div>
          <div class="list-detail">${d}</div>
        </div>
        <span class="badge badge-${s==='done'?'g':s==='due'?'a':s==='late'?'r':'b'}">${tag}</span>
      </div>`).join('')}
    <div class="alert alert-v mt-16">
      <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Todos os valores são <strong>estimativas informativas</strong>. A Aura nunca transmite declarações oficiais — isso é feito pelo seu analista CRC.
    </div>
  </div>
  <div>
    <div class="card-sm mb-16">
      <div class="sec-title mb-12">DAS estimado</div>
      <div class="kpi-val" style="font-size:24px">R$ 75,90</div>
      <div class="text-xs text-ink3 mt-8 mb-12">Estimativa · vence 20/04/2026</div>
      <div class="progress mb-8"><div class="progress-bar amber" style="width:45%"></div></div>
      <div class="text-xs text-ink3 mb-12">14 dias restantes</div>
      <button class="btn btn-p btn-sm" style="width:100%;justify-content:center">Gerar QR Code Pix</button>
    </div>
    <div class="card-sm mb-16">
      <div class="sec-title mb-8">Limite MEI</div>
      <div class="kpi-val" style="font-size:18px">R$ 54.820 / R$ 81.000</div>
      <div class="progress mt-8 mb-8"><div class="progress-bar" style="width:67%"></div></div>
      <div class="text-xs text-ink3">67,7% utilizado · 9 meses restantes</div>
    </div>
    <div class="card-sm">
      <div class="sec-title mb-8">DASN-SIMEI 2025</div>
      <div class="text-sm text-ink3 mb-12">Declaração anual · prazo: 31/05/2026</div>
      <div class="progress mb-8"><div class="progress-bar green" style="width:100%"></div></div>
      <div class="text-xs text-g mb-12">Dados consolidados pela Aura</div>
      <button class="btn btn-g btn-sm" style="width:100%;justify-content:center">Abrir portal pré-preenchido</button>
    </div>
  </div>
</div>`;

// ── ANALISTA ──────────────────────────────────────────────────
pages.analista = () => `
<div class="hero">
  <div class="hero-eyebrow">👤 Seu Analista</div>
  <h1>Meu Analista — João Mendes CRC</h1>
  <p>Analista humano incluso no seu plano. Responde em até 24h úteis. Executa transmissões oficiais.</p>
</div>
<div class="grid-2">
  <div class="card" style="display:flex;flex-direction:column">
    <div class="flex items-center gap-12 mb-16">
      <div style="width:48px;height:48px;border-radius:50%;background:var(--vg);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff;flex-shrink:0">JM</div>
      <div>
        <div class="fw-600">João Mendes</div>
        <div class="text-sm text-ink3">CRC/SP 12.345-6 · Especialista MEI/ME</div>
        <span class="badge badge-g mt-8"><span class="dot"></span>Disponível agora</span>
      </div>
    </div>
    <div style="flex:1;background:var(--bg3);border-radius:var(--r-lg);padding:14px;min-height:200px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;margin-bottom:12px">
      <div style="background:var(--vd);border:1px solid var(--border2);border-radius:12px 12px 4px 12px;padding:10px 12px;font-size:13px;max-width:80%;align-self:flex-end">
        Olá João! O PGDAS-D de março está pronto para revisão.
        <div class="text-xs text-ink3 mt-8">Hoje 14:23</div>
      </div>
      <div style="background:var(--bg4);border-radius:4px 12px 12px 12px;padding:10px 12px;font-size:13px;max-width:80%">
        Ótimo, conferi os dados. Pode transmitir. O valor do DAS ficou dentro do esperado?
        <div class="text-xs text-ink3 mt-8">Hoje 14:35</div>
      </div>
      <div style="background:var(--vd);border:1px solid var(--border2);border-radius:12px 12px 4px 12px;padding:10px 12px;font-size:13px;max-width:80%;align-self:flex-end">
        Sim! R$ 75,90 conforme estimativa da Aura. Transmitido com sucesso.
        <div class="text-xs text-ink3 mt-8">Hoje 14:42</div>
      </div>
    </div>
    <div class="flex gap-8">
      <input type="text" placeholder="Enviar mensagem..." class="input flex-1" style="background:var(--bg3)">
      <button class="btn btn-p btn-sm">Enviar</button>
    </div>
  </div>
  <div>
    <div class="card-sm mb-16">
      <div class="sec-title mb-12">Histórico de execuções</div>
      ${[
        ['PGDAS-D Fevereiro','Transmitido em 18/03/2026','g'],
        ['DEFIS 2024','Transmitido em 28/02/2026','g'],
        ['DAS Janeiro','Pago em 20/01/2026','g'],
        ['eSocial — admissão','Enviado em 15/01/2026','g'],
        ['DASN-SIMEI 2024','Transmitido em 30/05/2025','g'],
      ].map(([n,d,s])=>`<div class="list-item"><div class="list-icon list-icon-g"><svg class="ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div class="list-main"><div class="list-name">${n}</div><div class="list-detail">${d}</div></div></div>`).join('')}
    </div>
    <div class="card-sm">
      <div class="sec-title mb-12">Documentos compartilhados</div>
      <button class="btn btn-g btn-sm" style="width:100%;justify-content:center" onclick="nav('documentos',document.querySelectorAll('#nav-client .sb-item')[5])">Ver pasta de documentos</button>
    </div>
  </div>
</div>`;

// ── DOCUMENTOS ────────────────────────────────────────────────
pages.documentos = () => `
<div class="hero">
  <div class="hero-eyebrow">📁 Documentos</div>
  <h1>Documentos — Arquivo organizado</h1>
  <p>Comprovantes, declarações transmitidas, contratos e XMLs de NF-e. Tudo em um lugar.</p>
</div>
<div class="grid-2 mb-16">
  <div class="card-sm">
    <div class="flex items-center gap-8 mb-8">
      <div class="list-icon list-icon-v"><svg class="ic" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
      <div class="fw-600">Declarações fiscais</div>
    </div>
    <div class="text-xs text-ink3">8 arquivos · Atualizado hoje</div>
  </div>
  <div class="card-sm">
    <div class="flex items-center gap-8 mb-8">
      <div class="list-icon list-icon-g"><svg class="ic" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
      <div class="fw-600">XMLs NF-e / NFS-e</div>
    </div>
    <div class="text-xs text-ink3">34 arquivos · Março 2026</div>
  </div>
</div>
<div class="sec-head">
  <div class="search-bar" style="min-width:260px"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar documentos..."></div>
  <button class="btn btn-s btn-sm">${I.plus} Fazer upload</button>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Nome</th><th>Tipo</th><th>Data</th><th>Tamanho</th><th>Ação</th></tr></thead>
    <tbody>
      ${[
        ['PGDAS-D_Fev2026.pdf','Declaração','18/03/2026','124 KB'],
        ['DEFIS_2024.pdf','Declaração','28/02/2026','98 KB'],
        ['NFS-e_0034_ClínicaBemEstar.xml','NF-e XML','28/03/2026','12 KB'],
        ['Holerite_Mar2026_Ana.pdf','Folha','01/03/2026','68 KB'],
        ['Contrato_SaaS_Aura.pdf','Contrato','15/01/2026','204 KB'],
      ].map(([n,t,d,s])=>`<tr>
        <td class="fw-600 text-sm">${n}</td>
        <td><span class="badge badge-v">${t}</span></td>
        <td class="mono text-xs">${d}</td>
        <td class="text-xs text-ink3">${s}</td>
        <td><button class="btn btn-s btn-xs">Download</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

// ── PDV ────────────────────────────────────────────────────────
pages.pdv = () => {
  const cart = [
    {n:'Produto A',v:45.90,q:2},{n:'Produto B',v:120,q:1},{n:'Serviço X',v:80,q:1}
  ];
  const total = cart.reduce((a,i)=>a+i.v*i.q,0);
  return `
<div class="hero">
  <div class="hero-eyebrow">🛒 Ponto de Venda</div>
  <h1>PDV — ${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</h1>
  <p>Registro de vendas, scanner de código de barras e controle de estoque integrado.</p>
</div>
<div class="grid-13">
  <div>
    <div class="sec-head mb-16">
      <div class="search-bar flex-1"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar produto ou serviço..."></div>
      <button class="btn btn-s btn-sm">📷 Scanner</button>
    </div>
    <div class="grid-3 gap-12" style="margin-bottom:16px">
      ${[
        ['Produto A','Código: 001','R$ 45,90','g'],
        ['Produto B','Código: 002','R$ 120,00','v'],
        ['Produto C','Código: 003','R$ 89,00','b'],
        ['Serviço X','Avulso','R$ 80,00','a'],
        ['Serviço Y','Avulso','R$ 150,00','t'],
        ['Produto D','Código: 004','R$ 35,00','g'],
      ].map(([n,c,v,col])=>`
        <div class="card-sm" style="cursor:pointer;transition:.15s" onmouseover="this.style.borderColor='var(--border2)'" onmouseout="this.style.borderColor='var(--border)'">
          <div class="list-icon list-icon-${col} mb-8"><svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
          <div class="fw-600 text-sm">${n}</div>
          <div class="text-xs text-ink3">${c}</div>
          <div class="fw-700 text-v mt-8">${v}</div>
        </div>`).join('')}
    </div>
  </div>
  <div class="card" style="position:sticky;top:0;align-self:start">
    <div class="sec-title mb-16">Carrinho</div>
    ${cart.map(i=>`
      <div class="cart-item">
        <div class="flex-1"><div class="list-name">${i.n}</div><div class="list-detail">R$ ${i.v.toFixed(2)}</div></div>
        <div class="cart-qty">
          <div class="cart-qty-btn">−</div>
          <div class="cart-qty-num">${i.q}</div>
          <div class="cart-qty-btn">+</div>
        </div>
      </div>`).join('')}
    <div class="cart-total">
      <div class="cart-total-label">Total</div>
      <div class="cart-total-val">R$ ${total.toFixed(2).replace('.',',')}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
      <button class="btn btn-p" style="justify-content:center" onclick="openModal('modal-pagamento')">Cobrar · Pix / Cartão</button>
      <button class="btn btn-s btn-sm" style="justify-content:center">Limpar carrinho</button>
    </div>
    <div class="card-inner mt-12">
      <div class="flex justify-between text-sm mb-4"><span class="text-ink3">Vendas hoje</span><span class="fw-600">R$ 1.240,00</span></div>
      <div class="flex justify-between text-sm"><span class="text-ink3">Transações</span><span class="fw-600">12</span></div>
    </div>
  </div>
</div>`;
};

// ── ESTOQUE ────────────────────────────────────────────────────
pages.estoque = () => `
<div class="hero">
  <div class="hero-eyebrow">📦 Estoque</div>
  <h1>Estoque — Controle inteligente</h1>
  <p>Produtos, movimentações, curva ABC e Custo Avançado para análise de margem real.</p>
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">Produtos ativos</div><div class="kpi-val">48</div><div class="kpi-delta neutral">12 categorias</div></div>
  <div class="kpi-card"><div class="kpi-label">Valor em estoque</div><div class="kpi-val">R$ 18.400</div><div class="kpi-delta up">▲ 5% este mês</div></div>
  <div class="kpi-card"><div class="kpi-label">Alertas de estoque</div><div class="kpi-val text-am">4</div><div class="kpi-delta down">Abaixo do mínimo</div></div>
  <div class="kpi-card"><div class="kpi-label">Giro médio</div><div class="kpi-val">18 dias</div><div class="kpi-delta neutral">Últimos 30 dias</div></div>
</div>
<div class="alert alert-a mb-16"><svg class="ic" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>4 produtos abaixo do estoque mínimo. Revise para evitar ruptura.</div>
<div class="sec-head">
  <div class="tabs" style="margin-bottom:0"><div class="tab on">Todos</div><div class="tab">Curva ABC</div><div class="tab">Alertas</div></div>
  <button class="btn btn-p btn-sm">${I.plus} Novo produto</button>
</div>
<div class="table-wrap mt-12">
  <table>
    <thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Custo</th><th>Venda</th><th>Margem</th><th>Curva</th></tr></thead>
    <tbody>
      ${[
        ['Produto A','Eletrônicos',42,'R$ 28,00','R$ 45,90','63,9%','A'],
        ['Produto B','Acessórios',8,'R$ 72,00','R$ 120,00','66,7%','A'],
        ['Produto C','Vestuário',3,'R$ 55,00','R$ 89,00','61,8%','B'],
        ['Produto D','Eletrônicos',0,'R$ 21,00','R$ 35,00','66,7%','C'],
        ['Produto E','Acessórios',15,'R$ 38,00','R$ 65,00','71,2%','B'],
      ].map(([n,c,e,cu,v,m,abc])=>`<tr>
        <td class="fw-600">${n}</td>
        <td><span class="badge badge-v">${c}</span></td>
        <td class="${e===0?'text-re fw-600':e<5?'text-am fw-600':'text-g fw-600'}">${e===0?'Sem estoque':e}</td>
        <td class="text-ink3 text-sm">${cu}</td>
        <td class="fw-600">${v}</td>
        <td class="text-g fw-600">${m}</td>
        <td><span class="badge badge-${abc==='A'?'g':abc==='B'?'a':'r'}">${abc}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

// ── CLIENTES ──────────────────────────────────────────────────
pages.clientes = () => `
<div class="hero">
  <div class="hero-eyebrow">👥 CRM</div>
  <h1>Clientes — Relacionamento e retenção</h1>
  <p>Ficha completa, histórico de compras, aniversários e ranking por valor. Avaliações sem review gating.</p>
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">Total de clientes</div><div class="kpi-val">284</div><div class="kpi-delta up">▲ 18 novos este mês</div></div>
  <div class="kpi-card"><div class="kpi-label">Retorno (30 dias)</div><div class="kpi-val">68%</div><div class="kpi-delta up">▲ 4pp vs mês anterior</div></div>
  <div class="kpi-card"><div class="kpi-label">LTV médio</div><div class="kpi-val">R$ 1.840</div><div class="kpi-delta up">▲ 7%</div></div>
  <div class="kpi-card"><div class="kpi-label">Avaliação média</div><div class="kpi-val">4.8 ⭐</div><div class="kpi-delta up">48 avaliações</div></div>
</div>
<div class="grid-31">
  <div>
    <div class="sec-head">
      <div class="search-bar flex-1"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar clientes..."></div>
      <button class="btn btn-p btn-sm">${I.plus} Novo cliente</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Cliente</th><th>Última compra</th><th>Compras</th><th>LTV</th><th>Status</th></tr></thead>
        <tbody>
          ${[
            ['Ana Lima','Hoje','12','R$ 4.200','vip'],
            ['Pedro Santos','3 dias','8','R$ 2.800','ativo'],
            ['Carla Souza','Ontem','15','R$ 5.100','vip'],
            ['José Ferreira','10 dias','4','R$ 1.200','ativo'],
            ['Marina Costa','45 dias','3','R$ 890','risco'],
            ['Ricardo Nunes','60 dias','6','R$ 2.100','risco'],
          ].map(([n,u,q,l,s])=>`<tr style="cursor:pointer" onclick="openSlideOver('${n}','LTV ${l} · ${q} compras','<div class=\'text-sm text-ink3\'>Detalhes do cliente</div>')">
            <td class="fw-600">${n}</td>
            <td class="text-xs text-ink3">${u}</td>
            <td class="fw-600">${q}</td>
            <td class="fw-600 text-g">${l}</td>
            <td><span class="badge badge-${s==='vip'?'v':s==='risco'?'r':'g'}">${s==='vip'?'VIP':s==='risco'?'Em risco':'Ativo'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  <div>
    <div class="card-sm mb-14">
      <div class="sec-title mb-12">🎂 Aniversários próximos</div>
      ${[['Ana Lima','amanhã'],['Carlos Melo','em 3 dias'],['Patrícia Ramos','em 5 dias']].map(([n,d])=>`
        <div class="list-item" style="margin-bottom:6px">
          <div class="list-icon list-icon-v"><svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div class="list-main"><div class="list-name">${n}</div><div class="list-detail">${d}</div></div>
          <button class="btn btn-g btn-xs">💬</button>
        </div>`).join('')}
    </div>
    <div class="card-sm">
      <div class="sec-title mb-12">Novas avaliações</div>
      ${[['Ana Lima','5','Excelente atendimento!'],['Pedro Santos','4','Muito bom, voltarei.']].map(([n,r,c])=>`
        <div class="list-item mb-8">
          <div class="list-main">
            <div class="list-name">${n} · ${'⭐'.repeat(+r)}</div>
            <div class="list-detail">"${c}"</div>
          </div>
        </div>`).join('')}
      <div class="alert alert-g mt-8"><svg class="ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Link enviado para todos os clientes — sem review gating.</div>
    </div>
  </div>
</div>`;

// ── WHATSAPP ──────────────────────────────────────────────────
pages.whatsapp = () => `
<div class="hero">
  <div class="hero-eyebrow">💬 WhatsApp Business</div>
  <h1>WhatsApp — Automações e campanhas</h1>
  <p>Resumo diário, cobranças automáticas, aniversários e campanhas segmentadas.</p>
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">Msgs enviadas hoje</div><div class="kpi-val">24</div><div class="kpi-delta up">Automáticas</div></div>
  <div class="kpi-card"><div class="kpi-label">Taxa de abertura</div><div class="kpi-val">94%</div><div class="kpi-delta up">▲ 2% vs semana</div></div>
  <div class="kpi-card"><div class="kpi-label">Cobranças enviadas</div><div class="kpi-val">3</div><div class="kpi-delta neutral">Esta semana</div></div>
  <div class="kpi-card"><div class="kpi-label">Respostas</div><div class="kpi-val">18</div><div class="kpi-delta up">Hoje</div></div>
</div>
<div class="grid-2">
  <div class="card-sm">
    <div class="sec-title mb-12">Automações ativas</div>
    ${[
      ['Resumo diário (8h)','Enviado todo dia às 8h','ativa'],
      ['Resumo noturno (20h)','Fechamento do dia','ativa'],
      ['Cobrança automática','3 dias após vencimento','ativa'],
      ['Aniversário do cliente','No dia do aniversário','ativa'],
      ['Confirmação de venda','Após cada PDV','pausada'],
    ].map(([n,d,s])=>`
      <div class="check-item ${s==='ativa'?'done':''}">
        <div class="check-circle">${s==='ativa'?`<svg class="check-ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`:''}</div>
        <div class="flex-1"><div class="list-name">${n}</div><div class="list-detail">${d}</div></div>
        <label class="toggle"><input type="checkbox" ${s==='ativa'?'checked':''}><div class="toggle-slider"></div></label>
      </div>`).join('')}
  </div>
  <div class="card-sm">
    <div class="sec-title mb-12">Histórico de mensagens</div>
    ${[
      ['Resumo diário','Enviado às 8h00','Hoje','g'],
      ['Cobrança — Pedro','Vencimento ontem','Hoje','a'],
      ['Aniversário — Ana','Parabéns enviado','Hoje','v'],
      ['Resumo noturno','Enviado às 20h00','Ontem','g'],
    ].map(([n,d,t,c])=>`
      <div class="list-item mb-6">
        <div class="list-icon list-icon-${c}"><svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <div class="list-main"><div class="list-name">${n}</div><div class="list-detail">${d}</div></div>
        <div class="list-sub text-xs text-ink3">${t}</div>
      </div>`).join('')}
  </div>
</div>`;

// ── CANAL DIGITAL ─────────────────────────────────────────────
pages.canal = () => `
<div class="hero">
  <div class="hero-eyebrow">🌐 Canal Digital</div>
  <h1>Canal Digital — Presença e vendas online</h1>
  <p>Mini-site, loja virtual, Google Meu Negócio e analytics de acesso em um painel.</p>
</div>
<div class="tabs">
  <div class="tab on">Site</div>
  <div class="tab">Loja</div>
  <div class="tab">Analytics</div>
</div>
<div class="kpi-grid mb-16">
  <div class="kpi-card"><div class="kpi-label">Visitas este mês</div><div class="kpi-val">1.284</div><div class="kpi-delta up">▲ 22%</div></div>
  <div class="kpi-card"><div class="kpi-label">Pedidos online</div><div class="kpi-val">34</div><div class="kpi-delta up">▲ 8 vs mês ant.</div></div>
  <div class="kpi-card"><div class="kpi-label">Ticket médio</div><div class="kpi-val">R$ 148</div><div class="kpi-delta neutral">Online</div></div>
  <div class="kpi-card"><div class="kpi-label">Google · Estrelas</div><div class="kpi-val">4.8 ⭐</div><div class="kpi-delta up">48 avaliações</div></div>
</div>
<div class="grid-2">
  <div class="card-sm">
    <div class="sec-title mb-12">Seu mini-site</div>
    <div class="card-inner mb-12" style="text-align:center;padding:24px">
      <div style="font-family:var(--serif);font-size:18px;margin-bottom:4px">Empresa do João</div>
      <div class="text-xs text-ink3 mb-12">getaura.com.br/joao</div>
      <span class="badge badge-g"><span class="dot"></span>Online</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-g btn-sm flex-1" style="justify-content:center">Editar site</button>
      <button class="btn btn-s btn-sm flex-1" style="justify-content:center">${I.ext} Abrir</button>
    </div>
  </div>
  <div class="card-sm">
    <div class="sec-title mb-12">Google Meu Negócio</div>
    <div class="card-inner mb-12">
      <div class="flex justify-between mb-8"><span class="text-sm text-ink3">Buscas na semana</span><span class="fw-600">184</span></div>
      <div class="flex justify-between mb-8"><span class="text-sm text-ink3">Cliques em rota</span><span class="fw-600">42</span></div>
      <div class="flex justify-between"><span class="text-sm text-ink3">Ligações</span><span class="fw-600">18</span></div>
    </div>
    <button class="btn btn-g btn-sm" style="width:100%;justify-content:center">Atualizar informações</button>
  </div>
</div>`;

// ── FOLHA ──────────────────────────────────────────────────────
pages.folha = () => `
<div class="hero">
  <div class="hero-eyebrow">👥 Folha de Pagamento</div>
  <h1>Folha — Março 2026</h1>
  <p>Cálculo automático de INSS, FGTS e IRRF. Holerites prontos para envio.</p>
</div>
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi-card"><div class="kpi-label">Funcionários ativos</div><div class="kpi-val">3</div><div class="kpi-delta neutral">1 CLT + 2 horistas</div></div>
  <div class="kpi-card"><div class="kpi-label">Total bruto</div><div class="kpi-val">R$ 7.200</div><div class="kpi-delta neutral">Mês atual</div></div>
  <div class="kpi-card"><div class="kpi-label">FGTS gerado</div><div class="kpi-val">R$ 576</div><div class="kpi-delta neutral">8% da folha CLT</div></div>
  <div class="kpi-card"><div class="kpi-label">INSS patronal</div><div class="kpi-val">R$ 440</div><div class="kpi-delta neutral">20% CPR</div></div>
</div>
<div class="sec-head">
  <div class="sec-title">Funcionários</div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-s btn-sm" onclick="openModal('modal-funcionario')">${I.plus} Adicionar</button>
    <button class="btn btn-p btn-sm">Fechar folha</button>
  </div>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Funcionário</th><th>Cargo</th><th>Tipo</th><th>Bruto</th><th>INSS</th><th>FGTS</th><th>Líquido</th><th>Holerite</th></tr></thead>
    <tbody>
      ${[
        ['Ana Ferreira','Atendente','CLT','R$ 2.200','R$ 198','R$ 176','R$ 2.002'],
        ['Carlos Lima','Vendedor','Horista','R$ 1.800','R$ 162','R$ 144','R$ 1.638'],
        ['Patrícia Souza','Auxiliar','CLT','R$ 1.500','R$ 120','R$ 120','R$ 1.380'],
      ].map(([n,c,t,b,i,f,l])=>`<tr>
        <td class="fw-600">${n}</td>
        <td>${c}</td>
        <td><span class="badge badge-${t==='CLT'?'v':'b'}">${t}</span></td>
        <td class="fw-600">${b}</td>
        <td class="text-re text-sm">${i}</td>
        <td class="text-am text-sm">${f}</td>
        <td class="fw-700 text-g">${l}</td>
        <td><button class="btn btn-s btn-xs">PDF</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

// ── IA ─────────────────────────────────────────────────────────
pages.ia = () => `
<div class="hero">
  <div class="hero-eyebrow">✨ Assistente IA — Plano Expansão</div>
  <h1>Assistente IA — Sua empresa mais inteligente</h1>
  <p>Posts para redes sociais, previsão de caixa, cobranças automáticas e análises preditivas.</p>
</div>
<div class="grid-2 mb-16">
  <div class="card-sm">
    <div class="sec-title mb-12">Criar post para redes sociais</div>
    <div class="field mb-12"><div class="label">Tema</div><input type="text" placeholder="Ex: Promoção de fim de semana" class="input"></div>
    <div class="field mb-12"><div class="label">Tom</div>
      <select class="select"><option>Profissional</option><option>Descontraído</option><option>Urgência</option></select></div>
    <button class="btn btn-p btn-sm" style="width:100%;justify-content:center">✨ Gerar post</button>
    <div class="card-inner mt-12">
      <div class="text-xs text-ink3 mb-8">Prévia gerada:</div>
      <div class="text-sm text-ink2" style="line-height:1.7">🚀 <strong>Fim de semana especial!</strong> Aproveite condições imperdíveis em toda a loja. Qualidade garantida e atendimento que você merece. Nos veja! ✨ #promoção #qualidade</div>
    </div>
  </div>
  <div class="card-sm">
    <div class="sec-title mb-12">Previsão de caixa — 30 dias</div>
    <div class="chart-area" style="height:120px">${chartBars([
      {l:'S1',v:14200},{l:'S2',v:16800},{l:'S3',v:13400},{l:'S4',v:18200}
    ],3)}</div>
    <div class="chart-labels">${chartLabels([{l:'S1',v:0},{l:'S2',v:0},{l:'S3',v:0},{l:'S4',v:0}])}</div>
    <div class="card-inner mt-12">
      <div class="flex justify-between mb-4"><span class="text-sm text-ink3">Previsão receita</span><span class="fw-600 text-g">R$ 62.600</span></div>
      <div class="flex justify-between"><span class="text-sm text-ink3">Previsão despesas</span><span class="fw-600 text-re">R$ 28.400</span></div>
    </div>
  </div>
</div>
<div class="card-sm">
  <div class="sec-title mb-12">Chat com o Assistente</div>
  <div style="background:var(--bg3);border-radius:var(--r-lg);padding:14px;min-height:140px;display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
    <div style="background:var(--bg4);border-radius:4px 12px 12px 12px;padding:10px 12px;font-size:13px;max-width:75%">Quais produtos tenho com maior margem de lucro?</div>
    <div style="background:var(--vd);border:1px solid var(--border2);border-radius:12px 12px 4px 12px;padding:10px 12px;font-size:13px;max-width:75%;align-self:flex-end">Com base no seu estoque, <strong>Produto E</strong> tem a maior margem (71,2%), seguido de <strong>Produto B</strong> (66,7%). Quer que eu gere um relatório completo de rentabilidade?</div>
  </div>
  <div class="flex gap-8">
    <input type="text" placeholder="Pergunte algo sobre sua empresa..." class="input flex-1">
    <button class="btn btn-p btn-sm">Enviar</button>
  </div>
  <div class="alert alert-v mt-12"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Respostas são informativas e não constituem assessoria tributária ou financeira vinculante.</div>
</div>`;

// ── PLANOS ─────────────────────────────────────────────────────
pages.planos = () => `
<div class="hero">
  <div class="hero-eyebrow">💳 Assinatura</div>
  <h1>Escolha o plano ideal para o seu negócio</h1>
  <p>Analista humano CRC incluso em todos os planos pagos. Cancele quando quiser. Sem letras miúdas.</p>
  <div class="hero-badges">
    <span class="hero-badge">✓ Analista CRC incluso</span>
    <span class="hero-badge">✓ Sem taxa de setup</span>
    <span class="hero-badge">✓ Suporte via WhatsApp</span>
  </div>
</div>
<div class="grid-3 mb-20">
  ${[
    {n:'Essencial',p:'R$ 59',sub:'/mês',desc:'Para começar com o pé direito',feats:['PDV e estoque','NF-e automática','Obrigações fiscais básicas','1 usuário','Suporte WhatsApp'],cor:'b',atual:false},
    {n:'Negócio',p:'R$ 200',sub:'/mês',desc:'Para quem quer crescer com controle',feats:['Tudo do Essencial','DRE gerencial + Retirada','Analista CRC dedicado','Multi-usuário (+R$19/pessoa)','Canal digital + Loja','Folha de pagamento','Exportação PDF/CSV'],cor:'v',atual:true},
    {n:'Expansão',p:'R$ 320',sub:'/mês',desc:'Para escalar com inteligência',feats:['Tudo do Negócio','Assistente IA completo','Custo avançado (margem real)','Previsão de caixa','Cobranças automáticas IA','Módulo vertical (+R$69/mês)','API access'],cor:'g',atual:false},
  ].map(({n,p,sub,desc,feats,cor,atual})=>`
    <div class="card" style="${atual?'border-color:var(--border3);box-shadow:0 0 0 1px var(--border2),var(--sh-xl)':''}">
      ${atual?`<div class="badge badge-v" style="margin-bottom:12px">Plano atual</div>`:''}
      <div style="font-family:var(--serif);font-size:20px;margin-bottom:4px">${n}</div>
      <div style="font-size:11px;color:var(--ink3);margin-bottom:14px">${desc}</div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-.04em;margin-bottom:2px">${p}<span style="font-size:14px;font-weight:400;color:var(--ink3)">${sub}</span></div>
      <div style="height:1px;background:var(--border);margin:16px 0"></div>
      ${feats.map(f=>`<div class="flex items-center gap-8 mb-8 text-sm"><span style="color:var(--${cor==='v'?'v3':cor==='g'?'g':'bl'});flex-shrink:0">${I.check}</span>${f}</div>`).join('')}
      <button class="btn btn-${atual?'s':'p'} btn-sm" style="width:100%;justify-content:center;margin-top:16px">${atual?'Plano atual':'Fazer upgrade'}</button>
    </div>`).join('')}
</div>
<div class="card-sm">
  <div class="flex items-center justify-between mb-12">
    <div class="sec-title">Add-on: Módulo Vertical</div>
    <div style="font-size:22px;font-weight:800">R$ 69<span style="font-size:13px;font-weight:400;color:var(--ink3)">/mês</span></div>
  </div>
  <div class="grid-4">
    ${['🦷 Odontologia','✂️ Barbearia/Salão','💆 Estética','🏋️ Academia','🐾 Pet Shop','🍕 Food Service','👗 Moda/Varejo','⚡ Em breve...'].map(v=>`
      <div class="card-inner text-center" style="padding:14px;cursor:pointer">
        <div style="font-size:20px;margin-bottom:4px">${v.split(' ')[0]}</div>
        <div class="text-xs text-ink3">${v.split(' ').slice(1).join(' ')}</div>
      </div>`).join('')}
  </div>
</div>`;

// ── EMPRESA ────────────────────────────────────────────────────
pages.empresa = () => `
<div class="hero">
  <div class="hero-eyebrow">🏢 Dados cadastrais</div>
  <h1>Minha Empresa</h1>
  <p>Dados cadastrais, regime tributário e configurações da conta Aura.</p>
</div>
<div class="grid-2">
  <div class="card-sm">
    <div class="sec-title mb-16">Dados da empresa</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="field"><div class="label">Razão social</div><input type="text" value="Empresa do João Ltda." class="input"></div>
      <div class="field"><div class="label">Nome fantasia</div><input type="text" value="Empresa do João" class="input"></div>
      <div class="field"><div class="label">CNPJ</div><input type="text" value="12.345.678/0001-99" class="input" readonly style="opacity:.7"></div>
      <div class="grid-2 gap-12">
        <div class="field"><div class="label">Regime tributário</div>
          <select class="select"><option>Simples Nacional</option><option>MEI</option><option>Lucro Presumido</option><option>Lucro Real</option></select></div>
        <div class="field"><div class="label">ISS</div><input type="text" value="2%" class="input" readonly style="opacity:.7"></div>
      </div>
      <div class="field"><div class="label">Telefone</div><input type="text" value="(12) 99999-0000" class="input"></div>
      <div class="field"><div class="label">E-mail comercial</div><input type="text" value="joao@empresa.com.br" class="input"></div>
      <button class="btn btn-p btn-sm" style="width:fit-content">Salvar alterações</button>
    </div>
  </div>
  <div>
    <div class="card-sm mb-14">
      <div class="sec-title mb-12">Endereço</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="field"><div class="label">Logradouro</div><input type="text" value="Rua das Flores, 123" class="input"></div>
        <div class="grid-2 gap-12">
          <div class="field"><div class="label">Cidade</div><input type="text" value="Jacareí" class="input"></div>
          <div class="field"><div class="label">Estado</div><input type="text" value="SP" class="input"></div>
        </div>
        <div class="field"><div class="label">CEP</div><input type="text" value="12300-000" class="input"></div>
      </div>
    </div>
    <div class="card-sm">
      <div class="sec-title mb-12">CNAEs</div>
      ${[
        ['6202-3/00','Desenvolvimento de software (principal)','v'],
        ['6204-0/00','Consultoria em TI','b'],
        ['6311-9/00','Tratamento de dados e hospedagem','b'],
      ].map(([c,d,col])=>`
        <div class="list-item mb-6">
          <div class="list-main"><div class="list-name mono text-sm">${c}</div><div class="list-detail text-xs">${d}</div></div>
          <span class="badge badge-${col}">${col==='v'?'Principal':'Secundário'}</span>
        </div>`).join('')}
    </div>
  </div>
</div>`;

// ── ONBOARDING ────────────────────────────────────────────────
pages.onboarding = () => `
<div class="hero">
  <div class="hero-eyebrow">🚀 Configure sua empresa</div>
  <h1>Bem-vindo à Aura, João!</h1>
  <p>Em 4 passos simples sua empresa estará pronta. Tempo estimado: menos de 5 minutos.</p>
</div>
<div class="steps mb-24">
  <div class="step done"><div class="step-num">${I.check}</div><span>CNPJ</span></div>
  <div class="step-line"></div>
  <div class="step done"><div class="step-num">${I.check}</div><span>Regime</span></div>
  <div class="step-line"></div>
  <div class="step on"><div class="step-num">3</div><span>Perfil</span></div>
  <div class="step-line"></div>
  <div class="step"><div class="step-num">4</div><span>Vertical</span></div>
</div>
<div class="grid-2">
  <div class="card">
    <div class="sec-title mb-4">Etapa 3 — Perfil da empresa</div>
    <div class="text-sm text-ink3 mb-16">Confirme os dados encontrados na Receita Federal</div>
    <div class="alert alert-g mb-16"><svg class="ic" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>CNPJ verificado · Situação: Ativa na RF</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="field"><div class="label">Nome fantasia</div><input type="text" placeholder="Como seus clientes te conhecem" class="input"></div>
      <div class="field"><div class="label">Telefone</div><input type="text" placeholder="(12) 00000-0000" class="input"></div>
      <div class="field"><div class="label">E-mail comercial</div><input type="text" placeholder="contato@suaempresa.com.br" class="input"></div>
      <div class="field"><div class="label">Segmento (opcional)</div>
        <select class="select"><option value="">Selecione seu segmento</option><option>Comércio</option><option>Serviços</option><option>Saúde</option><option>Beleza</option><option>Alimentação</option><option>Tecnologia</option></select></div>
      <button class="btn btn-p" style="width:100%;justify-content:center">Continuar para etapa 4 ${I.arrow}</button>
    </div>
  </div>
  <div>
    <div class="card-sm mb-14">
      <div class="sec-title mb-12">Dados da RF</div>
      ${[
        ['Razão social','Empresa do João Ltda.'],
        ['CNPJ','12.345.678/0001-99'],
        ['Situação','Ativa'],
        ['Regime','Simples Nacional'],
        ['CNAE principal','6202-3/00 — Software'],
        ['Abertura','15/01/2025'],
        ['Cidade','Jacareí/SP'],
      ].map(([l,v])=>`<div class="flex justify-between mb-8 text-sm"><span class="text-ink3">${l}</span><span class="fw-600">${v}</span></div>`).join('')}
    </div>
    <div class="card-sm">
      <div class="sec-title mb-8">Progresso</div>
      <div class="progress mb-8"><div class="progress-bar" style="width:75%"></div></div>
      <div class="text-xs text-ink3">3 de 4 etapas · Quase lá!</div>
    </div>
  </div>
</div>`;

// ── VERTICAL (ODONTO + SALÃO) ─────────────────────────────────
pages.vertical = () => state.vertical === 'odonto' ? pages._odonto() : pages._salao();
pages._odonto = () => `
<div class="hero">
  <div class="hero-eyebrow">🦷 Módulo Odontologia</div>
  <h1>Clínica Odontológica — Gestão completa</h1>
  <p>Odontograma interativo, prontuário do paciente, agenda e histórico de procedimentos.</p>
</div>
<div class="grid-31">
  <div class="card">
    <div class="sec-head mb-12"><div class="sec-title">Odontograma — Maria Silva</div><span class="badge badge-g">Consulta ativa</span></div>
    <div style="margin-bottom:8px">
      <div class="text-xs text-ink3 mb-6" style="text-align:center">Superior direito → esquerdo</div>
      <div class="odonto-grid">
        ${[18,17,16,15,14,13,12,11].map((n,i)=>`<div class="tooth ${['healthy','healthy','treated','healthy','needs','healthy','healthy','healthy'][i]}"><div class="tooth-num">${n}</div><svg class="tooth-ico" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 8c0 3 1 5 2 7s2 5 2 7h2l1-5 1 5h2c0-2 1-4 2-7s2-4 2-7c0-3-3-6-7-6z"/></svg></div>`).join('')}
      </div>
      <div class="odonto-grid" style="margin-top:2px">
        ${[48,47,46,45,44,43,42,41].map((n,i)=>`<div class="tooth ${['healthy','treated','healthy','healthy','healthy','missing','healthy','healthy'][i]}"><div class="tooth-num">${n}</div><svg class="tooth-ico" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 8c0 3 1 5 2 7s2 5 2 7h2l1-5 1 5h2c0-2 1-4 2-7s2-4 2-7c0-3-3-6-7-6z"/></svg></div>`).join('')}
      </div>
      <div class="odonto-grid" style="margin-top:2px">
        ${[21,22,23,24,25,26,27,28].map((n,i)=>`<div class="tooth ${['healthy','healthy','treated','healthy','healthy','healthy','needs','healthy'][i]}"><div class="tooth-num">${n}</div><svg class="tooth-ico" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 8c0 3 1 5 2 7s2 5 2 7h2l1-5 1 5h2c0-2 1-4 2-7s2-4 2-7c0-3-3-6-7-6z"/></svg></div>`).join('')}
      </div>
      <div class="odonto-grid" style="margin-top:2px">
        ${[31,32,33,34,35,36,37,38].map((n,i)=>`<div class="tooth ${['healthy','healthy','healthy','treated','healthy','healthy','healthy','missing'][i]}"><div class="tooth-num">${n}</div><svg class="tooth-ico" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 8c0 3 1 5 2 7s2 5 2 7h2l1-5 1 5h2c0-2 1-4 2-7s2-4 2-7c0-3-3-6-7-6z"/></svg></div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <span class="badge badge-g">● Hígido</span>
      <span class="badge badge-b">● Tratado</span>
      <span class="badge badge-a">● Precisa tratar</span>
      <span class="badge badge-r">● Ausente</span>
    </div>
  </div>
  <div>
    <div class="card-sm mb-14">
      <div class="sec-title mb-12">Agenda de hoje</div>
      ${[
        ['08:30','Maria Silva','Manutenção'],
        ['10:00','José Rocha','Canal radicular'],
        ['14:00','Ana Pereira','Clareamento'],
        ['16:30','Pedro Melo','Consulta inicial'],
      ].map(([h,p,pr])=>`<div class="agenda-slot"><div class="agenda-time">${h}</div><div class="agenda-card ${pr==='Canal radicular'?'':'green'}"><div class="name">${p}</div><div class="detail">${pr}</div></div></div>`).join('')}
    </div>
    <div class="card-sm">
      <div class="sec-title mb-8">Resumo do mês</div>
      <div class="flex justify-between mb-6 text-sm"><span class="text-ink3">Consultas</span><span class="fw-600">48</span></div>
      <div class="flex justify-between mb-6 text-sm"><span class="text-ink3">Receita</span><span class="fw-600 text-g">R$ 12.400</span></div>
      <div class="flex justify-between text-sm"><span class="text-ink3">Ticket médio</span><span class="fw-600">R$ 258</span></div>
    </div>
  </div>
</div>`;

pages._salao = () => `
<div class="hero">
  <div class="hero-eyebrow">✂️ Módulo Barbearia / Salão</div>
  <h1>Salão de Beleza — Gestão completa</h1>
  <p>Agenda, fila de espera, comissões dos profissionais e histórico de serviços.</p>
</div>
<div class="grid-2">
  <div class="card-sm">
    <div class="sec-title mb-12">Agenda de hoje</div>
    ${[
      ['09:00','Carlos Melo','Corte degradê','Carlos (barbeiro)','g'],
      ['10:30','Amanda Lima','Coloração','Patrícia (estilista)','v'],
      ['11:00','—','Disponível','','b'],
      ['13:30','Renato Souza','Barba + corte','Carlos (barbeiro)','g'],
      ['15:00','Juliana Ramos','Manicure','Sandra','a'],
    ].map(([h,c,s,p,col])=>`<div class="agenda-slot"><div class="agenda-time">${h}</div><div class="agenda-card ${col==='g'?'green':col==='a'?'amber':''}"><div class="name">${c}</div><div class="detail">${s}${p?' · '+p:''}</div></div></div>`).join('')}
  </div>
  <div>
    <div class="card-sm mb-14">
      <div class="sec-title mb-12">Fila de espera</div>
      ${[['João Pereira','Corte simples','15 min'],['Maria Santos','Escova','25 min']].map(([n,s,t])=>`
        <div class="list-item mb-6">
          <div class="list-icon list-icon-v"><svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div class="list-main"><div class="list-name">${n}</div><div class="list-detail">${s}</div></div>
          <div class="list-sub text-xs text-am">~${t}</div>
        </div>`).join('')}
      <button class="btn btn-g btn-sm" style="width:100%;justify-content:center;margin-top:8px">Adicionar à fila</button>
    </div>
    <div class="card-sm">
      <div class="sec-title mb-12">Comissões do mês</div>
      ${[
        ['Carlos (barbeiro)','R$ 3.200','40%','R$ 1.280'],
        ['Patrícia (estilista)','R$ 2.800','45%','R$ 1.260'],
        ['Sandra (manicure)','R$ 1.400','50%','R$ 700'],
      ].map(([n,p,c,com])=>`
        <div class="flex justify-between items-center mb-8 text-sm">
          <span class="fw-600">${n}</span>
          <span class="text-ink3">${c}</span>
          <span class="fw-700 text-g">${com}</span>
        </div>`).join('')}
    </div>
  </div>
</div>`;

// ── GESTÃO AURA ───────────────────────────────────────────────
pages['g-central'] = () => `
<div class="hero">
  <div class="hero-eyebrow">⚙️ Gestão Aura</div>
  <h1>Central de Controle — Portfólio de clientes</h1>
  <p>Visão consolidada de toda a carteira. Pendências, MRR, planos e ativação de verticais.</p>
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">Clientes ativos</div><div class="kpi-val">47</div><div class="kpi-delta up">▲ 3 este mês</div></div>
  <div class="kpi-card"><div class="kpi-label">MRR</div><div class="kpi-val">R$ 7.840</div><div class="kpi-delta up">▲ 8%</div></div>
  <div class="kpi-card"><div class="kpi-label">Pendências</div><div class="kpi-val text-am">8</div><div class="kpi-delta down">Requer atenção</div></div>
  <div class="kpi-card"><div class="kpi-label">Inadimplentes</div><div class="kpi-val text-re">2</div><div class="kpi-delta down">30+ dias</div></div>
  <div class="kpi-card"><div class="kpi-label">Verticais ativas</div><div class="kpi-val">12</div><div class="kpi-delta up">+R$ 828/mês</div></div>
</div>
<div class="sec-head">
  <div class="tabs" style="margin-bottom:0"><div class="tab on">Todos</div><div class="tab">Com pendência</div><div class="tab">Inadimplentes</div><div class="tab">Com vertical</div></div>
  <div class="search-bar" style="min-width:200px"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input placeholder="Buscar cliente..."></div>
</div>
<div class="table-wrap mt-12">
  <table>
    <thead><tr><th>Cliente / CNPJ</th><th>Plano</th><th>Analista</th><th>Vertical</th><th>Pendências</th><th>Status</th><th>MRR</th><th></th></tr></thead>
    <tbody>
      ${[
        ['Clínica Bem-Estar','12.345.678/0001-99','Negócio','João M.','Odonto','0','ativo','R$ 269'],
        ['Barbearia do Mário','98.765.432/0001-11','Negócio','João M.','Salão','2','pendente','R$ 269'],
        ['Loja da Ana','45.678.901/0001-22','Essencial','João M.','—','0','ativo','R$ 59'],
        ['Estúdio Pilates','23.456.789/0001-33','Expansão','João M.','Academia','1','pendente','R$ 389'],
        ['Padaria Sabor Caseiro','67.890.123/0001-44','Negócio','João M.','Food','0','ativo','R$ 269'],
        ['Consultor Pereira','34.567.890/0001-55','Essencial','João M.','—','0','inadimplente','R$ 59'],
      ].map(([n,c,p,a,v,pd,s,mrr])=>`<tr style="cursor:pointer" onclick="openSlideOver('${n}','${p} · ${v}','<div class=\'flex flex-col gap-12\'><div class=\'grid-2 gap-12\'><div class=\'card-inner\'><div class=\'text-xs text-ink3 mb-4\'>CNPJ</div><div class=\'fw-600 mono text-sm\'>${c}</div></div><div class=\'card-inner\'><div class=\'text-xs text-ink3 mb-4\'>Plano</div><div class=\'fw-600\'>${p}</div></div></div><div class=\'card-inner\'><div class=\'text-xs text-ink3 mb-8\'>Vertical</div><div class=\'flex items-center justify-between\'><span>${v}</span><label class=\'toggle\'><input type=\'checkbox\' ${v!==\'—\'?\'checked\':\'\'} ><div class=\'toggle-slider\'></div></label></div></div><div class=\'flex gap-8 mt-4\'><button class=\'btn btn-g btn-sm\'>Mensagem</button><button class=\'btn btn-s btn-sm\'>Relatório</button></div></div>')">
        <td><div class="fw-600">${n}</div><div class="mono text-xs text-ink3">${c}</div></td>
        <td><span class="badge badge-v">${p}</span></td>
        <td class="text-sm">${a}</td>
        <td>${v!=='—'?`<span class="badge badge-t">${v}</span>`:`<span class="text-ink3 text-xs">—</span>`}</td>
        <td>${+pd>0?`<span class="badge badge-a">${pd}</span>`:`<span class="badge badge-g">0</span>`}</td>
        <td><span class="badge badge-${s==='ativo'?'g':s==='inadimplente'?'r':'a'}">${s}</span></td>
        <td class="fw-600">${mrr}</td>
        <td><button class="btn btn-s btn-xs">Ver</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

pages['g-honorarios'] = () => `
<div class="hero">
  <div class="hero-eyebrow">💰 Honorários</div>
  <h1>Honorários — Receita do portfólio CRC</h1>
  <p>Gestão de recebíveis, inadimplência e previsão de receita mensal do escritório.</p>
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="kpi-label">MRR total</div><div class="kpi-val">R$ 7.840</div><div class="kpi-delta up">▲ 8% vs mês ant.</div></div>
  <div class="kpi-card"><div class="kpi-label">Recebido</div><div class="kpi-val text-g">R$ 7.310</div><div class="kpi-delta up">93,2% do MRR</div></div>
  <div class="kpi-card"><div class="kpi-label">Em aberto</div><div class="kpi-val text-am">R$ 530</div><div class="kpi-delta down">2 clientes</div></div>
  <div class="kpi-card"><div class="kpi-label">Churn estimado</div><div class="kpi-val text-re">R$ 328</div><div class="kpi-delta down">1 inadimplente</div></div>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Cliente</th><th>Plano</th><th>Vencimento</th><th>Status</th><th>Valor</th></tr></thead>
    <tbody>
      ${[
        ['Clínica Bem-Estar','Negócio + Odonto','01/04','pago','R$ 269'],
        ['Barbearia do Mário','Negócio + Salão','01/04','pendente','R$ 269'],
        ['Loja da Ana','Essencial','01/04','pago','R$ 59'],
        ['Estúdio Pilates','Expansão + Academia','01/04','pendente','R$ 389'],
        ['Consultor Pereira','Essencial','01/03','inadimplente','R$ 59'],
      ].map(([n,p,v,s,val])=>`<tr>
        <td class="fw-600">${n}</td>
        <td class="text-sm text-ink3">${p}</td>
        <td class="mono text-xs">${v}</td>
        <td><span class="badge badge-${s==='pago'?'g':s==='inadimplente'?'r':'a'}">${s}</span></td>
        <td class="fw-600">${val}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

pages['g-atendimentos'] = () => `
<div class="hero">
  <div class="hero-eyebrow">💬 Atendimentos</div>
  <h1>Atendimentos — Histórico de suporte</h1>
  <p>Todos os atendimentos abertos e resolvidos da carteira de clientes.</p>
</div>
<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
  <div class="kpi-card"><div class="kpi-label">Abertos</div><div class="kpi-val text-am">3</div></div>
  <div class="kpi-card"><div class="kpi-label">Resolvidos (mês)</div><div class="kpi-val text-g">24</div></div>
  <div class="kpi-card"><div class="kpi-label">Tempo médio</div><div class="kpi-val">4h</div></div>
</div>
<div class="table-wrap">
  <table>
    <thead><tr><th>Cliente</th><th>Assunto</th><th>Aberto em</th><th>Status</th></tr></thead>
    <tbody>
      ${[
        ['Barbearia do Mário','PGDAS-D março — dúvida','26/03','aberto'],
        ['Estúdio Pilates','Integração folha de pagamento','25/03','aberto'],
        ['Clínica Bem-Estar','DEFIS 2024 transmitido','20/03','resolvido'],
        ['Loja da Ana','NF-e cancelamento','18/03','resolvido'],
      ].map(([c,a,d,s])=>`<tr>
        <td class="fw-600">${c}</td>
        <td>${a}</td>
        <td class="mono text-xs">${d}</td>
        <td><span class="badge badge-${s==='aberto'?'a':'g'}">${s}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;

pages['g-relatorios'] = () => `
<div class="hero">
  <div class="hero-eyebrow">📊 Relatórios</div>
  <h1>Relatórios — Visão consolidada da carteira</h1>
  <p>MRR, crescimento, churn e performance do portfólio de clientes CRC.</p>
</div>
<div class="grid-2 mb-16">
  <div class="card">
    <div class="sec-title mb-12">Evolução do MRR</div>
    <div class="chart-area">${chartBars([
      {l:'Set',v:4200},{l:'Out',v:5100},{l:'Nov',v:5800},{l:'Dez',v:6200},{l:'Jan',v:6900},{l:'Fev',v:7200},{l:'Mar',v:7840}
    ],6)}</div>
    <div class="chart-labels">${chartLabels([{l:'Set'},{l:'Out'},{l:'Nov'},{l:'Dez'},{l:'Jan'},{l:'Fev'},{l:'Mar'}])}</div>
  </div>
  <div class="card">
    <div class="sec-title mb-12">Mix de planos</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
      ${[['Essencial','12 clientes','26%','b'],['Negócio','28 clientes','59%','v'],['Expansão','7 clientes','15%','g']].map(([p,c,pct,col])=>`
        <div>
          <div class="flex justify-between text-sm mb-4"><span class="fw-600">${p}</span><span class="text-ink3">${c} · ${pct}</span></div>
          <div class="progress"><div class="progress-bar ${col==='g'?'green':col==='b'?'':''}" style="width:${pct};background:var(--${col==='v'?'vg':col==='g'?'g':'bl'})"></div></div>
        </div>`).join('')}
    </div>
  </div>
</div>
<div style="display:flex;gap:8px">
  <button class="btn btn-p btn-sm">Exportar relatório PDF</button>
  <button class="btn btn-s btn-sm">Exportar CSV</button>
</div>`;

// ══ HELPER FUNCTIONS ══════════════════════════════════════════
function showFinTab(tab, el) {
  ['lancamentos','receber','dre','retirada'].forEach(t=>{
    const el2 = document.getElementById('fin-'+t);
    if(el2) el2.style.display = t===tab?'block':'none';
  });
  el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
}
function updateRetirada(v) {
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
