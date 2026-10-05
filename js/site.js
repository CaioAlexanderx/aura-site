/* =========================================================
   AURA SITE — Shared JS: cursor, reveal, type-in, nav, tilt, form
   ========================================================= */
(function() {
  'use strict';

  // ----- CURSOR HALO -----
  const dot = document.createElement('div');
  const halo = document.createElement('div');
  dot.className = 'cursor-dot';
  halo.className = 'cursor-halo';
  document.body.appendChild(dot);
  document.body.appendChild(halo);

  // 04/10/2026: o laço do halo só roda enquanto o halo está alcançando o
  // mouse (antes rodava 60x/s para sempre, inclusive no celular).
  let mx = -100, my = -100, hx = mx, hy = my, haloRaf = 0;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    if (!haloRaf) haloRaf = requestAnimationFrame(tickHalo);
  }, { passive: true });
  function tickHalo() {
    hx += (mx - hx) * 0.18;
    hy += (my - hy) * 0.18;
    halo.style.transform = `translate(${hx}px, ${hy}px) translate(-50%,-50%)`;
    haloRaf = (Math.abs(mx - hx) > 0.3 || Math.abs(my - hy) > 0.3) ? requestAnimationFrame(tickHalo) : 0;
  }
  tickHalo();
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .tilt, [data-cursor=hover]')) halo.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .tilt, [data-cursor=hover]')) halo.classList.remove('hover');
  });

  // ----- NAV scroll state -----
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ----- REVEAL on scroll -----
  // 04/10/2026: o CSS só esconde blocos com .reveal-pending. Aqui:
  //  1. o que já está na primeira tela ganha .in na hora, sem transição;
  //  2. o resto fica pendente e anima uma vez ao entrar (unobserve);
  //  3. rede de segurança: sem IntersectionObserver, com movimento reduzido,
  //     ou se o observer não disparar (aba em segundo plano, painel embutido),
  //     um verificador barato (scroll/visibilitychange/load + 1,2 s) revela
  //     o que estiver na tela ou acima dela.
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hasIO = typeof window.IntersectionObserver === 'function';
  const vh = () => window.innerHeight || document.documentElement.clientHeight;
  let pending = [];
  let io = null;

  // Quem nunca ficou pendente (primeira tela) não tem o que animar: já está
  // com opacidade 1; o .in só fixa o estado de repouso.
  function reveal(el) {
    el.classList.add('in');
    el.classList.remove('reveal-pending');
    if (io) io.unobserve(el);
  }
  function sweep(includeAbove) {
    if (!pending.length) return;
    const h = vh();
    pending = pending.filter((el) => {
      const r = el.getBoundingClientRect();
      const inView = r.top < h * 0.92 && (includeAbove || r.bottom > 0);
      if (inView) { reveal(el); return false; }
      return true;
    });
    if (!pending.length) stopSafety();
  }
  let sweepTimer = 0;
  function onSafety() {
    if (sweepTimer) return;
    sweepTimer = setTimeout(() => { sweepTimer = 0; sweep(true); }, 160);
  }
  function stopSafety() {
    window.removeEventListener('scroll', onSafety);
    window.removeEventListener('resize', onSafety);
    document.removeEventListener('visibilitychange', onSafety);
  }

  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!hasIO || reduceMotion) {
    revealEls.forEach((el) => reveal(el));
  } else {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          pending = pending.filter((el) => el !== entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    const h = vh();
    revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      // Na primeira tela (ou acima dela): aparece já, sem depender de animação.
      if (r.top < h && r.bottom > 0) { reveal(el); return; }
      el.classList.add('reveal-pending');
      pending.push(el);
      io.observe(el);
    });
    if (pending.length) {
      window.addEventListener('scroll', onSafety, { passive: true });
      window.addEventListener('resize', onSafety, { passive: true });
      document.addEventListener('visibilitychange', onSafety);
      const late = () => setTimeout(() => sweep(true), 1200);
      if (document.readyState === 'complete') late();
      else window.addEventListener('load', late, { once: true });
    }
  }

  // ----- TYPE-IN: split [data-typein] into words -----
  document.querySelectorAll('[data-typein]').forEach((el) => {
    const html = el.innerHTML;
    const wrapped = html.replace(/(<[^>]+>)|(\s+)|([^\s<]+)/g, (m, tag, ws, word) => {
      if (tag) return tag;
      if (ws) return '<span class="word space">&nbsp;</span>';
      return `<span class="word">${word}</span>`;
    });
    el.innerHTML = wrapped;
    el.classList.add('type-in');
    const words = el.querySelectorAll('.word:not(.space)');
    // Cascata curta: 15 ms por palavra, teto de 100 ms (legível em ~300 ms).
    words.forEach((w, i) => {
      w.style.animationDelay = Math.min(i * 0.015, 0.1).toFixed(3) + 's';
    });
  });

  // ----- TILT cards -----
  document.querySelectorAll('.tilt').forEach((card) => {
    const inner = card.querySelector('.tilt-inner') || card;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const rx = py * -10;
      const ry = px * 14;
      inner.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => {
      inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });

  // ----- MARQUEE: duplicate content for seamless loop -----
  document.querySelectorAll('.marquee-track').forEach((track) => {
    if (track.dataset.duplicated) return;
    track.dataset.duplicated = '1';
    const clone = track.innerHTML;
    track.innerHTML = clone + clone;
  });

  // ----- ORBS: drift with offsets via inline style -----
  document.querySelectorAll('.orb').forEach((orb, i) => {
    orb.style.animationDelay = (i * 1.7) + 's';
    orb.style.animationDuration = (12 + (i % 3) * 4) + 's';
  });

  // ----- LOOPS: pausa orbs/marquee/levitate/radar/brilho do hero fora da tela -----
  if (hasIO) {
    const loopIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('anim-off', !entry.isIntersecting));
    }, { rootMargin: '100px 0px' });
    document.querySelectorAll('.orbs, .marquee, .phone.levitate, .aura-radar, .v-hero')
      .forEach((el) => loopIO.observe(el));
  }

  // ----- COUNT-UP for [data-count] -----
  // Sem IntersectionObserver o número já vem escrito no HTML; só não conta.
  const countObs = !hasIO ? { observe() {}, unobserve() {} } : new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const dur = parseInt(el.dataset.countDur || '1400', 10);
      const decimals = parseInt(el.dataset.countDecimals || '0', 10);
      const start = performance.now();
      const fmt = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(target * eased);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-count]').forEach((el) => countObs.observe(el));


  // =========================================================
  // MOBILE NAV TOGGLE — abre/fecha menu mobile
  // =========================================================
  var navToggle = document.querySelector('.nav-mobile-toggle');
  var siteNav = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function() {
      siteNav.classList.toggle('nav-open');
    });
  }

})();
