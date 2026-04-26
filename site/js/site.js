/* =========================================================
   AURA SITE — Shared JS: cursor, reveal, type-in, nav, tilt
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

  let mx = -100, my = -100, hx = mx, hy = my;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  });
  function tickHalo() {
    hx += (mx - hx) * 0.18;
    hy += (my - hy) * 0.18;
    halo.style.transform = `translate(${hx}px, ${hy}px) translate(-50%,-50%)`;
    requestAnimationFrame(tickHalo);
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
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  // ----- TYPE-IN: split [data-typein] into words -----
  document.querySelectorAll('[data-typein]').forEach((el) => {
    const html = el.innerHTML;
    // Split on words but preserve <span class="acc"> and <em>
    const wrapped = html.replace(/(<[^>]+>)|(\s+)|([^\s<]+)/g, (m, tag, ws, word) => {
      if (tag) return tag;
      if (ws) return '<span class="word space">&nbsp;</span>';
      return `<span class="word">${word}</span>`;
    });
    el.innerHTML = wrapped;
    el.classList.add('type-in');
    const words = el.querySelectorAll('.word:not(.space)');
    words.forEach((w, i) => {
      w.style.animationDelay = (i * 0.04) + 's';
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

  // ----- COUNT-UP for [data-count] -----
  const countObs = new IntersectionObserver((entries) => {
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

  // ----- Mobile menu toggle -----
  const mobileBtn = document.querySelector('.nav-mobile-toggle');
  const mobilePanel = document.querySelector('.nav-mobile-panel');
  if (mobileBtn && mobilePanel) {
    mobileBtn.addEventListener('click', () => {
      mobilePanel.classList.toggle('open');
    });
  }
})();
