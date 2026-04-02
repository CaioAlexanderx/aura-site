/* ============================================================
   AURA. — Site Interactions v2
   S-01: Navbar scroll, mobile nav, scroll animations, FAQ
   ============================================================ */

(function() {
  'use strict';

  // ── Navbar scroll behavior ────────────────────────────────
  var nav = document.querySelector('.nav');
  if (nav) {
    var lastScroll = 0;
    window.addEventListener('scroll', function() {
      var y = window.scrollY;
      if (y > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
      lastScroll = y;
    }, { passive: true });
  }

  // ── Mobile nav ──────────────────────────────────────────
  var hamburger = document.getElementById('nav-hamburger');
  var mobileNav = document.getElementById('nav-mobile');

  function closeMobileNav() {
    if (hamburger) hamburger.classList.remove('open');
    if (mobileNav) mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function() {
      var isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', closeMobileNav);
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav') && !e.target.closest('.nav-mobile')) {
        closeMobileNav();
      }
    });
  }

  // Expose for inline onclick
  window.closeMobileNav = closeMobileNav;

  // ── Scroll reveal (IntersectionObserver) ─────────────────
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-scale').forEach(function(el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything
    document.querySelectorAll('.reveal, .reveal-scale').forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // ── Smooth scroll for anchor links ──────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        closeMobileNav();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── FAQ accordion ───────────────────────────────────────
  window.toggleFaq = function(btn) {
    var item = btn.parentElement;
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(el) {
      el.classList.remove('open');
    });
    if (!isOpen) item.classList.add('open');
  };

  // ── Count-up animation ─────────────────────────────────
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(function(el) {
      countObserver.observe(el);
    });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var decimals = el.getAttribute('data-decimals') || 0;
    var duration = 1500;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var current = start + (target - start) * eased;
      el.textContent = prefix + current.toFixed(decimals).replace('.', ',') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Form handling ──────────────────────────────────────
  window.setupForm = function(formId, successId) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var originalText = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      try {
        var res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.style.display = 'none';
          var success = document.getElementById(successId);
          if (success) success.style.display = 'block';
        } else {
          btn.textContent = 'Tente novamente';
          btn.disabled = false;
        }
      } catch (err) {
        btn.textContent = 'Sem conexao. Tente novamente.';
        btn.disabled = false;
      }
    });
  };

  // ── Re-observe reveals after dynamic content ────────────
  window.refreshReveals = function() {
    if (!('IntersectionObserver' in window)) return;
    document.querySelectorAll('.reveal:not(.visible), .reveal-scale:not(.visible)').forEach(function(el) {
      revealObserver.observe(el);
    });
  };

})();
