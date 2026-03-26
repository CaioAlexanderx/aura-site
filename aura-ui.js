/*
  AURA. — JS Compartilhado
  UI-01: Sidebar mobile (drawer)
  UI-07: Toast + Confetti
  Inclua no final do <body> com: <script src="/aura-ui.js"></script>
*/
(function (global) {
  'use strict';

  // ── Injeta container de toast se não existir ──────────────
  function _ensureToastWrap() {
    if (document.getElementById('au-toast-wrap')) return;
    const w = document.createElement('div');
    w.id = 'au-toast-wrap';
    document.body.appendChild(w);
  }

  // ── Toast ─────────────────────────────────────────────────
  const TOAST_ICONS = { s: '✓', e: '✕', w: '⚠', i: 'ℹ' };
  function toast(msg, type, duration) {
    type     = type     || 's';
    duration = duration || 4000;
    _ensureToastWrap();
    const wrap = document.getElementById('au-toast-wrap');
    // Máximo 3 toasts simultâneos
    while (wrap.children.length >= 3) wrap.children[0].remove();

    const t = document.createElement('div');
    t.className = 'au-toast au-toast-' + type;
    t.innerHTML =
      '<div class="au-toast-icon">' + (TOAST_ICONS[type] || 'ℹ') + '</div>' +
      '<span style="flex:1">' + msg + '</span>' +
      '<button class="au-toast-close" aria-label="Fechar">✕</button>';
    t.querySelector('.au-toast-close').addEventListener('click', function () {
      _dismiss(t);
    });
    wrap.appendChild(t);
    const tid = setTimeout(function () { _dismiss(t); }, duration);
    t._tid = tid;
    return t;
  }
  function _dismiss(el) {
    clearTimeout(el._tid);
    el.classList.add('hiding');
    setTimeout(function () { el.remove(); }, 220);
  }

  // ── Confetti (canvas leve, sem lib) ──────────────────────
  function celebrate(count) {
    count = count || 120;
    let canvas = document.getElementById('au-confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'au-confetti-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8888';
      document.body.appendChild(canvas);
    }
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');

    const COLORS = ['#8b5cf6','#c084fc','#34d399','#60a5fa','#fbbf24','#f472b6','#a78bfa','#fff'];
    const pieces = Array.from({ length: count }, function () {
      return {
        x:   Math.random() * canvas.width,
        y:   Math.random() * canvas.height * -0.5 - 10,
        w:   Math.random() * 8 + 4,
        h:   Math.random() * 5 + 2,
        r:   Math.random() * Math.PI * 2,
        dr:  (Math.random() - 0.5) * 0.18,
        vx:  (Math.random() - 0.5) * 3,
        vy:  Math.random() * 3.5 + 1.5,
        col: COLORS[Math.floor(Math.random() * COLORS.length)],
        op:  1,
      };
    });

    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      pieces.forEach(function (p) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.r  += p.dr;
        p.vy += 0.06; // gravidade
        if (p.y > canvas.height * 0.75) p.op -= 0.03;
        if (p.op <= 0) return;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.op);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive) {
        frame = requestAnimationFrame(draw);
      } else {
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
  }

  // ── Sidebar mobile drawer ────────────────────────────────
  function initSidebar() {
    const sidebar  = document.querySelector('.sidebar, .au-sidebar, #sidebar');
    const hamburger= document.querySelector('.au-hamburger, #au-hamburger');
    if (!sidebar || !hamburger) return;

    // Cria overlay se não existir
    let overlay = document.querySelector('.au-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'au-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('open');
      hamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
    function toggle() {
      sidebar.classList.contains('open') ? close() : open();
    }

    hamburger.addEventListener('click', toggle);
    overlay.addEventListener('click', close);

    // Fecha ao navegar (item da sidebar clicado)
    sidebar.querySelectorAll('.ni, .sb-item, a').forEach(function (el) {
      el.addEventListener('click', function () {
        if (window.innerWidth <= 768) close();
      });
    });

    // Fecha com Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Resize: limpa estado ao voltar para desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        close();
        document.body.style.overflow = '';
      }
    });
  }

  // ── Auto-badge: injeta tooltip via data-tip ──────────────
  // (CSS puro via ::after — sem JS necessário)
  // Mas provemos um helper para criar badges programaticamente
  function autoBadge(text, tip) {
    var b = document.createElement('span');
    b.className = 'au-auto-badge';
    b.textContent = text || 'Calculado pela Aura';
    if (tip) b.setAttribute('data-tip', tip);
    return b;
  }

  // ── Empty state builder ───────────────────────────────────
  function emptyState(opts) {
    // opts: { icon, title, sub, ctas: [{label, cls, onclick}], small }
    const wrap = document.createElement('div');
    wrap.className = 'au-empty' + (opts.small ? ' au-empty-sm' : '');
    const iconDiv = document.createElement('div');
    iconDiv.className = opts.iconCustom ? 'au-empty-icon-custom' : 'au-empty-icon';
    iconDiv.textContent = opts.icon || '📭';
    const titleEl = document.createElement('div');
    titleEl.className = 'au-empty-title';
    titleEl.textContent = opts.title || 'Nenhum registro';
    const subEl = document.createElement('div');
    subEl.className = 'au-empty-sub';
    subEl.textContent = opts.sub || '';
    wrap.appendChild(iconDiv);
    wrap.appendChild(titleEl);
    if (opts.sub) wrap.appendChild(subEl);
    if (opts.ctas && opts.ctas.length) {
      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'au-empty-cta';
      opts.ctas.forEach(function (c) {
        const btn = document.createElement('button');
        btn.className = 'au-btn ' + (c.cls || 'au-btn-p au-btn-sm');
        btn.textContent = c.label;
        if (c.onclick) btn.addEventListener('click', c.onclick);
        ctaWrap.appendChild(btn);
      });
      wrap.appendChild(ctaWrap);
    }
    return wrap;
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    _ensureToastWrap();
    initSidebar();

    // Injetado via data-attr em qualquer input numérico
    document.querySelectorAll('input[type="number"], input[type="tel"]').forEach(function (inp) {
      if (!inp.getAttribute('inputmode')) inp.setAttribute('inputmode', 'decimal');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expõe API global
  global.Aura = {
    toast:      toast,
    celebrate:  celebrate,
    autoBadge:  autoBadge,
    emptyState: emptyState,
  };

}(window));
