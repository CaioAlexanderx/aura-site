/* ============================================================
   AURA. — Site JS v4 — Glassmorphism + WOW
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
(function(){
  var els = document.querySelectorAll('.reveal, .reveal-scale');
  if(!els.length) return;
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
  els.forEach(function(el){ obs.observe(el); });
})();

/* ── Count-up animation ─────────────────────────────────── */
(function(){
  var nums = document.querySelectorAll('[data-count]');
  if(!nums.length) return;
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
  var mx = -200, my = -200;
  document.addEventListener('mousemove', function(e){ mx = e.clientX; my = e.clientY; }, {passive:true});
  function loop(){ glow.style.transform = 'translate(' + (mx - 200) + 'px,' + (my - 200) + 'px)'; requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
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

/* ── Form submit ─────────────────────────────────────────── */
function setupForm(formId, successId){
  var form = document.getElementById(formId);
  var success = document.getElementById(successId);
  if(!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    fetch(form.action, {method:'POST', body:data, headers:{'Accept':'application/json'}})
    .then(function(r){ if(r.ok){ form.style.display='none'; if(success) success.style.display='block'; }})
    .catch(function(){});
  });
}
