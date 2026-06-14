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
        <a class="nav-dropdown-item" href="/studio" style="--v-accent:#E11D74; --v-glow:rgba(225,29,116,0.4)"><span class="v-mark"><svg viewBox="0 0 100 100" fill="none"><path d="M50 5 C54.5 31 69 45.5 95 50 C69 54.5 54.5 69 50 95 C45.5 69 31 54.5 5 50 C31 45.5 45.5 31 50 5 Z" fill="currentColor"/><path d="M82 14 C83.4 21.6 86.4 24.6 94 26 C86.4 27.4 83.4 30.4 82 38 C80.6 30.4 77.6 27.4 70 26 C77.6 24.6 80.6 21.6 82 14 Z" fill="currentColor" opacity="0.8"/></svg></span><span><div class="v-name">Aura Studio</div><div class="v-tag">Customização, impressão, ateliês</div></span></a>
        <a class="nav-dropdown-item" href="/dojo" style="--v-accent:#b8463a; --v-glow:rgba(184,70,58,0.4)"><span class="v-mark" style="background:#f0ebe0;"><img src="/assets/karate/seal-kara.svg" alt="Aura Karate" style="width:78%;height:78%;object-fit:contain"></span><span><div class="v-name">Aura Dojô</div><div class="v-tag">Federações e academias · Karatê</div></span></a>
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
          <img src="/Icon.png" alt="Aura" style="width: 38px; height: 38px; border-radius: 50%; box-shadow: 0 6px 18px rgba(124,58,237,0.5);" />
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
        <a href="/planos">Planos</a><a href="/comparativo">Comparativo</a><a href="https://app.getaura.com.br" target="_blank" rel="noopener">Entrar</a><a href="/comecar">Criar conta grátis</a><a href="/sobre">Sobre a Aura</a>
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
  <span class="wa-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg></span>
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
