/* ============================================================
   AURA STUDIO — landing interactions & motion
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Sticky nav ─────────────────────────────────────────── */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add('is-stuck');
    else nav.classList.remove('is-stuck');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Scroll reveal (rect-based; robust across preview hosts) ── */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var settle = function (el) {
      setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, 1100);
    };
    var checkReveals = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = reveals.length - 1; i >= 0; i--) {
        var el = reveals[i];
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.classList.add('in');
          settle(el);
          reveals.splice(i, 1);
        }
      }
      if (!reveals.length) {
        window.removeEventListener('scroll', onReveal);
        window.removeEventListener('resize', onReveal);
      }
    };
    var ticking = false;
    var onReveal = function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { checkReveals(); ticking = false; });
    };
    window.addEventListener('scroll', onReveal, { passive: true });
    window.addEventListener('resize', onReveal);
    checkReveals();
    // safety: never leave content hidden if something blocks the checks
    setTimeout(checkReveals, 400);
    window.addEventListener('load', checkReveals);
  }

  /* ── Pointer tilt (3D parallax) ─────────────────────────── */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(function (scene) {
      var card = scene.querySelector('.tilt');
      if (!card) return;
      var max = parseFloat(scene.getAttribute('data-tilt-max')) || 12;
      var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
      function frame() {
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        card.style.transform = 'rotateY(' + cx.toFixed(2) + 'deg) rotateX(' + cy.toFixed(2) + 'deg)';
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(frame);
        else raf = null;
      }
      scene.addEventListener('pointermove', function (ev) {
        var r = scene.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        tx = px * max * 2; ty = -py * max * 2;
        if (!raf) raf = requestAnimationFrame(frame);
      });
      scene.addEventListener('pointerleave', function () {
        tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(frame);
      });
    });
  }

  /* ── Product turntable: optional pointer control (auto-spins otherwise) ── */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.invcard__media, .store-prod__img').forEach(function (stage) {
      var obj = stage.querySelector('.invcard__obj');
      if (!obj) return;
      stage.addEventListener('pointermove', function (ev) {
        var r = stage.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        obj.classList.add('is-grab');
        obj.style.transform = 'rotateY(' + (px * 62).toFixed(1) + 'deg) rotateX(' + (-py * 16 + 5).toFixed(1) + 'deg)';
      });
      stage.addEventListener('pointerleave', function () {
        obj.classList.remove('is-grab');
        obj.style.transform = '';
      });
    });
  }

  /* ── Count-up stats ─────────────────────────────────────── */
  var counted = false;
  function countUp() {
    if (counted) return; counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var start = null, dur = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var band = document.querySelector('.statband');
  if (band && !reduce) {
    var checkBand = function () {
      var r = band.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.85 && r.bottom > 0) {
        countUp();
        window.removeEventListener('scroll', checkBand);
      }
    };
    window.addEventListener('scroll', checkBand, { passive: true });
    checkBand();
    setTimeout(checkBand, 500);
  } else { countUp(); }

  /* ── Customizer ─────────────────────────────────────────── */
  var prices = { caneca: 39, camiseta: 59, ecobag: 45 };
  var state = { product: 'caneca', color: '#1E3A8A', ink: '#ffffff', name: 'Ana' };

  var nameMug = document.getElementById('cz-name-mug');
  var nameShirt = document.getElementById('cz-name-shirt');
  var nameBag = document.getElementById('cz-name-bag');
  var mug = document.getElementById('cz-mug');
  var shirt = document.getElementById('cz-shirt');
  var bag = document.getElementById('cz-bag');
  var priceEl = document.getElementById('cz-price');
  var stages = document.querySelectorAll('#cz-stage [data-obj]');

  function fmt(n) { return 'R$ ' + n.toFixed(2).replace('.', ','); }

  function render() {
    if (mug) mug.style.setProperty('--mug-color', state.color);
    if (shirt) shirt.style.setProperty('--o', state.color);
    if (bag) bag.style.setProperty('--o', state.color);
    [nameMug, nameShirt, nameBag].forEach(function (n) { if (n) n.textContent = state.name || ''; });
    // ink color on light base
    var ink = state.ink;
    if (nameMug) nameMug.style.color = ink;
    if (nameShirt) nameShirt.style.color = ink;
    if (nameBag) nameBag.style.color = ink;
    if (priceEl) priceEl.textContent = fmt(prices[state.product]);
    stages.forEach(function (s) { s.hidden = s.getAttribute('data-obj') !== state.product; });
  }

  document.querySelectorAll('#cz-products .cz-prod').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#cz-products .cz-prod').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      state.product = b.getAttribute('data-product');
      render();
    });
  });
  document.querySelectorAll('#cz-colors .cz-sw').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#cz-colors .cz-sw').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      state.color = b.getAttribute('data-color');
      state.ink = b.getAttribute('data-ink') || '#ffffff';
      render();
    });
  });
  var input = document.getElementById('cz-input');
  if (input) input.addEventListener('input', function () { state.name = input.value; render(); });
  render();

  /* ── WhatsApp demo ──────────────────────────────────────── */
  var waSend = document.getElementById('wa-send');
  var waBody = document.getElementById('wa-body');
  var waField = document.getElementById('wa-field');
  var waSwitch = document.getElementById('wa-switch');
  var waCtrl = document.getElementById('wa-ctrl');
  var armed = true;
  var sent = false;

  if (waSwitch) {
    waSwitch.setAttribute('data-on', '1');
    waSwitch.addEventListener('click', function () {
      armed = !armed;
      waSwitch.setAttribute('aria-checked', String(armed));
      waSwitch.setAttribute('data-on', armed ? '1' : '0');
      if (armed) waCtrl.classList.add('is-armed'); else waCtrl.classList.remove('is-armed');
      waField.textContent = armed ? 'Arte aprovada — vamos pra produção! 🚀' : 'Ligue o envio manual pra revisar antes';
      waSend.style.opacity = armed ? '1' : '.55';
    });
  }

  function timeNow() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  if (waSend) {
    waSend.addEventListener('click', function () {
      if (sent || !armed) {
        if (!armed) { waCtrl.animate ? waCtrl.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 280 }) : null; }
        return;
      }
      sent = true;
      var b = document.createElement('div');
      b.className = 'wa-bub wa-out';
      b.style.opacity = '0';
      b.style.transform = 'translateY(8px)';
      b.innerHTML = 'Arte aprovada — entrou na produção agora! Te aviso quando estiver pronto. 🚀<span class="t">' + timeNow() + '</span>';
      waBody.appendChild(b);
      requestAnimationFrame(function () {
        b.style.transition = 'opacity .35s ease, transform .35s ease';
        b.style.opacity = '1'; b.style.transform = 'none';
      });
      waField.textContent = 'Mensagem enviada ✓';
      waSend.style.background = '#1f8a5b';
      setTimeout(function () {
        var r = document.createElement('div');
        r.className = 'wa-bub wa-in';
        r.style.opacity = '0';
        r.innerHTML = 'Maravilha! Muito obrigado 🙏<span class="t">' + timeNow() + '</span>';
        waBody.appendChild(r);
        requestAnimationFrame(function () { r.style.transition = 'opacity .35s ease'; r.style.opacity = '1'; });
      }, 900);
    });
  }
})();
