/* ============================================================
   AURA. — Site JS v5 — Glassmorphism + WOW + Form async (12/05)
   ============================================================ */

/* ── Navbar scroll ───────────────────────────────────────── */
(function(){
  var nav = document.querySelector('.nav');
  if(!nav) return;
  window.addEventListener('scroll', function(){
    if(window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, {passive:true});
})();

/* ── Mobile hamburger ────────────────────────────────────── */
(function(){
  var btn = document.getElementById('nav-hamburger');
  var menu = document.getElementById('nav-mobile');
  if(!btn || !menu) return;
  btn.addEventListener('click', function(){
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ── Scroll reveal ───────────────────────────────────────── */
/* 04/10/2026: o CSS só esconde .reveal-pending. A primeira tela aparece já;
   o resto anima uma vez ao entrar (unobserve). Rede de segurança: sem
   IntersectionObserver, com movimento reduzido, ou se ele não disparar
   (aba em segundo plano, painel embutido), scroll/visibilitychange e
   load + 1,2 s revelam o que estiver na tela ou acima dela. */
(function(){
  var els = document.querySelectorAll('.reveal, .reveal-scale');
  if(!els.length) return;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var obs = null, pending = [], timer = 0;
  function vh(){ return window.innerHeight || document.documentElement.clientHeight; }
  function show(el){
    el.classList.add('visible');
    el.classList.remove('reveal-pending');
    if(obs) obs.unobserve(el);
  }
  function sweep(){
    var h = vh();
    pending = pending.filter(function(el){
      if(el.getBoundingClientRect().top < h * 0.92){ show(el); return false; }
      return true;
    });
    if(!pending.length) stop();
  }
  function onSafety(){
    if(timer) return;
    timer = setTimeout(function(){ timer = 0; sweep(); }, 160);
  }
  function stop(){
    window.removeEventListener('scroll', onSafety);
    window.removeEventListener('resize', onSafety);
    document.removeEventListener('visibilitychange', onSafety);
  }
  if(typeof window.IntersectionObserver !== 'function' || reduce){
    els.forEach(show);
    return;
  }
  obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        show(e.target);
        pending = pending.filter(function(el){ return el !== e.target; });
      }
    });
  }, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
  var h = vh();
  els.forEach(function(el){
    var r = el.getBoundingClientRect();
    if(r.top < h && r.bottom > 0){ show(el); return; }
    el.classList.add('reveal-pending');
    pending.push(el);
    obs.observe(el);
  });
  if(!pending.length) return;
  window.addEventListener('scroll', onSafety, {passive:true});
  window.addEventListener('resize', onSafety, {passive:true});
  document.addEventListener('visibilitychange', onSafety);
  function late(){ setTimeout(sweep, 1200); }
  if(document.readyState === 'complete') late();
  else window.addEventListener('load', late, {once:true});
})();

/* ── Count-up animation ─────────────────────────────────── */
(function(){
  var nums = document.querySelectorAll('[data-count]');
  if(!nums.length || typeof window.IntersectionObserver !== 'function') return;
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      obs.unobserve(e.target);
      var target = parseInt(e.target.dataset.count);
      var suffix = e.target.dataset.suffix || '';
      var dur = 1800, start = performance.now();
      function tick(now){
        var p = Math.min((now - start) / dur, 1);
        e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, {threshold:0.3});
  nums.forEach(function(n){ obs.observe(n); });
})();

/* ── Cursor glow ─────────────────────────────────────────── */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  // 04/10/2026: um quadro por movimento do mouse, em vez de laço eterno.
  var mx = -200, my = -200, raf = 0;
  function paint(){ raf = 0; glow.style.transform = 'translate(' + (mx - 200) + 'px,' + (my - 200) + 'px)'; }
  document.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; if(!raf) raf = requestAnimationFrame(paint); }, {passive:true});
  requestAnimationFrame(paint);
})();

/* ── Floating particles ──────────────────────────────────── */
(function(){
  var canvas = document.getElementById('hero-particles');
  if(!canvas) return;
  var ctx = canvas.getContext('2d'), particles = [], count = 40;
  function resize(){ canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
  resize(); window.addEventListener('resize', resize);
  for(var i = 0; i < count; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, a: Math.random() * 0.4 + 0.1 });
  function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(var i = 0; i < particles.length; i++){
      var p = particles[i]; p.x += p.vx; p.y += p.vy;
      if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0;
      if(p.y < 0) p.y = canvas.height; if(p.y > canvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(167,139,250,' + p.a + ')'; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 3D tilt on cards ────────────────────────────────────── */
(function(){
  if(window.matchMedia('(hover:none)').matches) return;
  document.querySelectorAll('.glass-card, .bento-card').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
  });
})();

/* ── FAQ toggle ──────────────────────────────────────────── */
function toggleFaq(btn){
  var item = btn.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i){ i.classList.remove('open'); });
  if(!wasOpen) item.classList.add('open');
}

