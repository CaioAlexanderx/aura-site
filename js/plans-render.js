/* =========================================================
   AURA — Renderiza cards de planos em qualquer container.
   Uso:
     <div data-plans-render="full"></div>     => 3 cards completos (planos.html)
     <div data-plans-render="preview"></div>  => 3 cards compactos (landing)

   14/05/2026 (revisão): 5 planos -> 3 planos. As 4 bolinhas
   coloridas agora indicam "modulo vertical disponivel" em
   planos com hasVerticalAddon (Negocio + Expansao).
   ========================================================= */
(function() {
  if (!window.AURA_PLANS) return;
  var WA_BASE = 'https://wa.me/5511956305269?text=';

  function waLink(plan) {
    var msg = 'Quero%20conhecer%20o%20plano%20' + encodeURIComponent(plan.label) + '%20da%20Aura';
    return WA_BASE + msg;
  }

  /* Anual em destaque (2 meses grátis = desconto de 1/6, igual ao checkout
     do app), com o mensal cheio logo abaixo como referência. */
  var ANNUAL_DISCOUNT = 1 / 6;
  function annualMonthly(monthly) { return Math.round(monthly * (1 - ANNUAL_DISCOUNT) * 100) / 100; }

  function priceHTML(plan) {
    var mo = plan.price;
    var an = annualMonthly(mo).toFixed(2).split('.'); // ex.: ["140","83"]
    return '<span class="plan-badge-annual">2 meses grátis</span>' +
      '<span class="plan-price-main">' +
        '<span class="amt">R$ ' + an[0] + '</span>' +
        '<span class="cents">,' + an[1] + '</span>' +
        '<span class="per">/mês</span>' +
      '</span>' +
      '<span class="plan-price-ref">no plano anual · ou R$ ' + mo + '/mês no mensal</span>';
  }

  function featuresHTML(features) {
    return '<ul class="plan-feat-list">' +
      features.map(function(f) {
        if (f.startsWith('Tudo do')) {
          return '<li class="plan-feat-heading">' + f + '</li>';
        }
        return '<li>' + f + '</li>';
      }).join('') +
    '</ul>';
  }

  function verticalAddonHTML() {
    return '<div class="plan-vertical-addon" title="Vertical do seu setor já incluída no plano">' +
      '<div class="plan-vertical-dots">' +
        '<span style="background:#E11D74;" title="Studio"></span>' +
        '<span style="background:#b8463a;" title="Dojô"></span>' +
      '</div>' +
      '<div class="plan-vertical-addon-label">Vertical do seu setor incluída</div>' +
    '</div>';
  }

  function cardHTML(key, plan, opts) {
    opts = opts || {};
    var classes = ['plan-card'];
    if (plan.featured) classes.push('featured');

    var idAttr = ' id="' + key + '"';

    var html = '<div class="' + classes.join(' ') + '"' + idAttr + ' data-reveal data-reveal-delay="' + (opts.idx || 0) + '">';
    if (plan.badge) html += '<div class="plan-popular">' + plan.badge + '</div>';
    html += '<div class="plan-name">' + plan.label + '</div>';
    html += '<div class="plan-price">' + priceHTML(plan) + '</div>';
    html += '<div class="plan-tagline">' + plan.tagline + '</div>';
    if (plan.hasVerticalAddon) html += verticalAddonHTML();
    if (!opts.compact) {
      html += featuresHTML(plan.features);
    } else {
      var preview = plan.features.slice(0, 5);
      html += featuresHTML(preview);
      html += '<a href="/planos#' + key + '" class="plan-see-more">Ver tudo →</a>';
    }
    html += '<a href="' + waLink(plan) + '" target="_blank" rel="noopener" class="plan-cta">Falar no WhatsApp</a>';
    html += '</div>';
    return html;
  }

  function render(container) {
    var mode = container.getAttribute('data-plans-render');
    var compact = mode === 'preview';
    var order = ['essencial', 'negocio', 'expansao'];
    var html = '<div class="plan-grid">';
    order.forEach(function(key, i) {
      var plan = window.AURA_PLANS[key];
      if (plan) html += cardHTML(key, plan, { compact: compact, idx: i });
    });
    html += '</div>';
    container.innerHTML = html;
  }

  document.querySelectorAll('[data-plans-render]').forEach(render);
})();
