/* ============================================================
   Aura Dojô — landing interactions
   Shoji entrance · reveal-on-scroll · count-up · nav state
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- SHOJI ENTRANCE -----
  var enter = document.getElementById('shoji-enter');
  function closeEnter() {
    if (!enter || enter.classList.contains('done')) return;
    enter.classList.add('done');
  }
  if (enter) {
    if (reduce) {
      enter.classList.add('done');
    } else {
      // panels finish sliding at ~0.9s delay + 1s = 1.9s
      setTimeout(closeEnter, 2050);
      enter.addEventListener('click', closeEnter);
    }
  }

  // ----- NAV scroll state -----
  var nav = document.querySelector('.dj-nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 16) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ----- COUNT-UP (run on load; IO is unreliable inside the preview iframe) -----
  var countEls = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = parseInt(el.getAttribute('data-count-dur') || '1600', 10);
    var dec = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    var start = performance.now();
    function fmt(n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function step(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + fmt(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (reduce) {
    countEls.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      el.textContent = (el.getAttribute('data-count-prefix') || '') +
        target.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
        (el.getAttribute('data-count-suffix') || '');
    });
  } else {
    setTimeout(function () { countEls.forEach(runCount); }, 700);
  }

  // ----- smooth anchor scroll (offset for sticky nav) -----
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
