/* =========================================================
   AURA SITE — Shared chrome injection (nav + footer + WA)
   Used by all sub-pages so we don't repeat 200 lines of HTML.
   ========================================================= */
(function() {
  const navHTML = `
<nav class="site-nav" data-cursor="hover">
  <a href="/" class="brand">
    <span class="glyph"></span>
    <span class="brand-name">Aura</span>
  </a>
  <div class="nav-links">
    <a href="/">Início</a>
    <div class="nav-dropdown">
      <button>Verticais ▾</button>
      <div class="nav-dropdown-panel">
        <a class="nav-dropdown-item" href="/negocio" style="--v-accent:#7c3aed; --v-glow:rgba(124,58,237,0.4)"><span class="v-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4l8 16H4z"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/></svg></span><span><div class="v-name">Aura Negócio</div><div class="v-tag">Carro-chefe · varejo geral</div></span></a>
        <a class="nav-dropdown-item" href="/studio" style="--v-accent:#E11D74; --v-glow:rgba(225,29,116,0.4)"><span class="v-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l6-6M14 4l6 6M14 4l-9 9 5 5 9-9zM14 4l2-2 4 4-2 2"/></svg></span><span><div class="v-name">Aura Studio</div><div class="v-tag">Customização, impressão, ateliês</div></span></a>
        <a class="nav-dropdown-item" href="/dojo" style="--v-accent:#b8463a; --v-glow:rgba(184,70,58,0.4)"><span class="v-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-5 9 5M5 10v6M19 10v6M3 16h18M3 9h18"/></svg></span><span><div class="v-name">Aura Dojô</div><div class="v-tag">Federações e academias · Karatê</div></span></a>
      </div>
    </div>
    <a href="/planos">Planos</a>
    <a href="/sobre">Sobre</a>
    <a href="/#contato">Contato</a>
    <span class="nav-cta-row">
      <a href="https://app.getaura.com.br" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Entrar</a>
      <a href="/comecar" class="btn btn-primary btn-sm">Começar grátis</a>
    </span>
  </div>
  <button class="nav-mobile-toggle" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h14M3 10h14M3 14h14"/></svg></button>
  <div class="nav-mobile-panel">
    <a href="/">Início</a>
    <div class="nav-mobile-section">Verticais</div>
    <a href="/negocio" class="nav-mobile-vert"><span class="vdot" style="background:#7c3aed"></span>Aura Negócio</a>
    <a href="/studio" class="nav-mobile-vert"><span class="vdot" style="background:#E11D74"></span>Aura Studio</a>
    <a href="/dojo" class="nav-mobile-vert"><span class="vdot" style="background:#b8463a"></span>Aura Dojô</a>
    <a href="/planos">Planos</a>
    <a href="/sobre">Sobre</a>
    <a href="/#contato">Contato</a>
    <div class="nav-mobile-ctas">
      <a href="https://app.getaura.com.br" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">Entrar</a>
      <a href="/comecar" class="btn btn-primary btn-lg">Começar grátis</a>
    </div>
  </div>
</nav>`;

  const footerHTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <img src="/Icon.png" alt="Aura" style="width: 38px; height: 38px; border-radius: 9px; box-shadow: 0 6px 18px rgba(124,58,237,0.5);" />
          <span style="font-family: var(--font-heading); font-size: 26px; color: white; letter-spacing: -0.02em;">Aura<span style="color: #a78bfa;">.</span></span>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: rgba(196,181,253,0.7); max-width: 280px;">Tecnologia para Negócios. Três produtos especialistas, uma plataforma única, feita no Brasil.</p>
        <p style="font-family: var(--font-heading); font-style: italic; font-size: 17px; line-height: 1.4; color: #fff; max-width: 300px; margin-top: 20px; letter-spacing: -0.01em;">"Aura, a plataforma do empreendedor brasileiro."</p>
        <div style="margin-top: 24px; display: flex; gap: 10px;">
          <a href="https://instagram.com/aura_tecnologia" target="_blank" rel="noopener" aria-label="Instagram" style="width: 36px; height: 36px; padding: 0; border-radius: 10px; background: rgba(124,58,237,0.18); display: grid; place-items: center; color: #c4b5fd;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg></a>
          <a href="https://tiktok.com/@aura_tecnologia" target="_blank" rel="noopener" aria-label="TikTok" style="width: 36px; height: 36px; padding: 0; border-radius: 10px; background: rgba(124,58,237,0.18); display: grid; place-items: center; color: #c4b5fd;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 6.7c-1.7-.4-3-1.6-3.6-3.2-.1-.4-.2-.7-.2-1H12v13.4c0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9 1.3-2.9 2.9-2.9c.3 0 .6 0 .9.1V8.5c-.3 0-.6-.1-.9-.1-3.7 0-6.7 3-6.7 6.7s3 6.7 6.7 6.7 6.7-3 6.7-6.7V9.5c1.4 1 3 1.6 4.7 1.6V7.3c-.3 0-.6-.2-.9-.6z"/></svg></a>
          <a href="https://wa.me/5511956305269" target="_blank" rel="noopener" aria-label="WhatsApp" style="width: 36px; height: 36px; padding: 0; border-radius: 10px; background: rgba(37,211,102,0.18); display: grid; place-items: center; color: #6ee7a8;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg></a>
        </div>
      </div>
      <div>
        <h5>Verticais</h5>
        <a href="/negocio">Aura Negócio</a><a href="/studio">Aura Studio</a><a href="/dojo">Aura Dojô</a>
      </div>
      <div>
        <h5>Produto</h5>
        <a href="/planos">Planos</a><a href="https://app.getaura.com.br" target="_blank" rel="noopener">Entrar</a><a href="https://app.getaura.com.br/cadastro" target="_blank" rel="noopener">Criar conta</a><a href="/sobre">Sobre a Aura</a>
      </div>
      <div>
        <h5>Contato</h5>
        <a href="https://wa.me/5511956305269" target="_blank" rel="noopener">(11) 95630-5269</a><a href="/#contato">Formulário</a><a href="https://instagram.com/aura_tecnologia" target="_blank" rel="noopener">@aura_tecnologia</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 Aura Tecnologia · Jacareí, SP</div>
      <div class="row" style="gap: 24px;"><a href="/privacidade" style="opacity: 0.6;">Privacidade</a><a href="/dpa" style="opacity: 0.6;">DPA</a></div>
    </div>
  </div>
</footer>`;

  const waHTML = `
<a href="https://wa.me/5511956305269?text=Vim%20pelo%20site%20da%20Aura" target="_blank" rel="noopener" class="wa-float" aria-label="WhatsApp">
  <span class="wa-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 14.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.5-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg></span>
  <span class="wa-num">(11) 95630-5269</span>
</a>`;

  // Inject into placeholders
  const navMount = document.querySelector('[data-mount="nav"]');
  const footerMount = document.querySelector('[data-mount="footer"]');
  const waMount = document.querySelector('[data-mount="wa"]');
  if (navMount) navMount.outerHTML = navHTML;
  if (footerMount) footerMount.outerHTML = footerHTML;
  if (waMount) waMount.outerHTML = waHTML;
})();
