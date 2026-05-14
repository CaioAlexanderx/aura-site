/* =========================================================
   AURA — Renderiza cards de planos em qualquer container.
   Uso:
     <div data-plans-render="full"></div>     => 5 cards completos (planos.html)
     <div data-plans-render="preview"></div>  => 5 cards compactos (landing)
   Le de window.AURA_PLANS e window.AURA_ADDONS.
   ========================================================= */
(function() {
  if (!window.AURA_PLANS) return;
  var WA_BASE = 'https://wa.me/5511956305269?text=';

  function waLink(plan) {
    var msg = 'Quero%20conhecer%20o%20plano%20' + encodeURIComponent(plan.label) + '%20da%20Aura';
    return WA_BASE + msg;
  }

  function priceHTML(plan) {
    if (plan.priceCents != null) {
      return '<span class="amt">R$ ' + plan.price + '</span>' +
        '<span class="cents">,' + plan.priceCents + '</span>' +
        '<span class="per">/mês</span>';
    }
    return '<span class="amt">R$ ' + plan.price + '</span><span class="per">/mês</span>';
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

  function vDotsHTML() {
    return '<div class="plan-vertical-dots">' +
      '<span style="background:#06B6D4; color:#06B6D4;"></span>' +
      '<span style="background:#F472B6; color:#F472B6;"></span>' +
      '<span style="background:#F97316; color:#F97316;"></span>' +
      '<span style="background:#10B981; color:#10B981;"></span>' +
    '</div>';
  }

  function cardHTML(key, plan, opts) {
    opts = opts || {};
    var isVertical = key.includes('Vertical');
    var classes = ['plan-card'];
    if (plan.featured) classes.push('featured');
    classes.push('reveal-' + (opts.idx || 0));

    var idAttr = ' id="' + (
      key === 'negocioVertical' ? 'negocio-vertical' :
      key === 'expansaoVertical' ? 'expansao-vertical' :
      key
    ) + '"';

    var html = '<div class="' + classes.join(' ') + '"' + idAttr + ' data-reveal data-reveal-delay="' + (opts.idx || 0) + '">';
    if (plan.badge) html += '<div class="plan-popular">' + plan.badge + '</div>';
    if (isVertical) html += vDotsHTML();
    html += '<div class="plan-name">' + plan.label + '</div>';
    html += '<div class="plan-price">' + priceHTML(plan) + '</div>';
    html += '<div class="plan-tagline">' + plan.tagline + '</div>';
    if (!opts.compact) html += featuresHTML(plan.features);
    else {
      var preview = plan.features.slice(0, 4);
      html += featuresHTML(preview);
      html += '<a href="/planos#' + (key === 'negocioVertical' ? 'negocio-vertical' : key === 'expansaoVertical' ? 'expansao-vertical' : key) + '" class="plan-see-more">Ver tudo →</a>';
    }
    html += '<a href="' + waLink(plan) + '" target="_blank" rel="noopener" class="plan-cta">Falar no WhatsApp</a>';
    html += '</div>';
    return html;
  }

  function render(container) {
    var mode = container.getAttribute('data-plans-render');
    var compact = mode === 'preview';
    var order = ['essencial', 'negocio', 'negocioVertical', 'expansao', 'expansaoVertical'];
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
