window.AuraPages = window.AuraPages || {};

window.AuraPages.dashboard = () => `
<div class="hero">
  <div class="hero-eyebrow">${I.alert} Março · 2026</div>
  <h1>Bom dia, Caio. Sua empresa está saudável.</h1>
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
    <div class="kpi-label">
      <svg class="ic" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"/></svg>
      Receita do mês
    </div>
    <div class="kpi-val">R$ 18.420</div>
    <div class="kpi-delta up">▲ 12% vs mês anterior</div>
  </div>

  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--re)"></div>
    <div class="kpi-label">
      <svg class="ic" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      Despesas
    </div>
    <div class="kpi-val">R$ 7.840</div>
    <div class="kpi-delta down">▲ 3% vs mês anterior</div>
  </div>

  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--v2)"></div>
    <div class="kpi-label">
      <svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Saldo líquido
    </div>
    <div class="kpi-val">R$ 10.580</div>
    <div class="kpi-delta up">▲ 18% vs mês anterior</div>
  </div>

  <div class="kpi-card">
    <div class="kpi-glow" style="background:var(--am)"></div>
    <div class="kpi-label">
      <svg class="ic" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Vendas hoje
    </div>
    <div class="kpi-val">47</div>
    <div class="kpi-delta neutral">Até agora · atualizado</div>
  </div>
</div>

<div class="grid-31" style="margin-bottom:16px">
  <div class="card">
    <div class="sec-head">
      <div>
        <div class="sec-title">Receita — últimas semanas</div>
      </div>
      <div class="tabs" style="margin-bottom:0">
        <div class="tab on" onclick="switchDashboardChart(this,'week')">Semana</div>
        <div class="tab" onclick="switchDashboardChart(this,'month')">Mês</div>
      </div>
    </div>

    <div class="chart-area" id="dash-chart-bars">${chartBars(weekData)}</div>
    <div class="chart-labels" id="dash-chart-labels">${chartLabels(weekData)}</div>
  </div>

  <div class="card">
    <div class="sec-title" style="margin-bottom:14px">A receber</div>

    <div class="list-item" style="margin-bottom:6px">
      <div class="list-icon list-icon-g">
        <svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="list-main">
        <div class="list-name">Clínica Bem-Estar</div>
        <div class="list-detail">Vence em 3 dias</div>
      </div>
      <div class="list-end">
        <div class="list-val text-g">R$ 1.200</div>
      </div>
    </div>

    <div class="list-item" style="margin-bottom:6px">
      <div class="list-icon list-icon-a">
        <svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="list-main">
        <div class="list-name">Loja do Pedro</div>
        <div class="list-detail">Vence hoje</div>
      </div>
      <div class="list-end">
        <div class="list-val text-am">R$ 680</div>
      </div>
    </div>

    <div class="list-item">
      <div class="list-icon list-icon-r">
        <svg class="ic" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="list-main">
        <div class="list-name">Maria Costureira</div>
        <div class="list-detail">Venceu há 2 dias</div>
      </div>
      <div class="list-end">
        <div class="list-val text-re">R$ 320</div>
      </div>
    </div>
  </div>
</div>
`;
