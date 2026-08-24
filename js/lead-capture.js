/* =========================================================
   AURA — Captura de lead "antes do envio".
   Dois pontos, ambos EXPLÍCITOS (a pessoa clica um botão):
     1) Form progressivo: passo 1 = só WhatsApp + "Quero que me chamem".
        Captura parcial; revela o resto do form pra completar.
     2) Exit-intent: popup ao sair da página pedindo o WhatsApp.
   Ambos postam em /api/lead-partial (Worker) -> CRM como lead parcial.
   Progressive enhancement: sem este JS, o form completo funciona normal.

   Anti-bot (10/07/2026): Cloudflare Turnstile invisível por envio.
   Preencha TURNSTILE_SITE_KEY abaixo (mesma key de site.js e js/site.js).
   Vazia = envia sem token (worker só exige token se TURNSTILE_SECRET
   estiver configurada lá — deploy em qualquer ordem não quebra).
   ========================================================= */
(function () {
  "use strict";

  var TURNSTILE_SITE_KEY = ""; // TODO: cole aqui a Site Key do widget Turnstile

  var DONE_KEY = "aura_lc_done";      // já capturou algum lead nesta sessão
  var EXIT_KEY = "aura_lc_exit_shown"; // exit-intent já apareceu nesta sessão

  function $(sel, root) { return (root || document).querySelector(sel); }
  function digits(v) { return (v || "").replace(/\D/g, ""); }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  /* ── Turnstile: widget invisível, um token por envio ───── */
  var tsLoader = null;
  function loadTurnstile() {
    if (!TURNSTILE_SITE_KEY) return Promise.resolve(null);
    if (tsLoader) return tsLoader;
    tsLoader = new Promise(function (resolve) {
      if (window.turnstile) return resolve(window.turnstile);
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = function () { resolve(window.turnstile || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return tsLoader;
  }

  // Renderiza um widget ancorado perto do botão (visível só se o
  // Turnstile exigir interação) e resolve com o token — ou null
  // (falha/timeout: envia sem token; o worker decide).
  function getTsToken(anchorEl) {
    return loadTurnstile().then(function (ts) {
      if (!ts) return null;
      return new Promise(function (resolve) {
        var holder = document.createElement("div");
        var parent = anchorEl && anchorEl.parentNode ? anchorEl.parentNode : document.body;
        parent.appendChild(holder);
        var widgetId = null, done = false;
        function finish(tok) {
          if (done) return;
          done = true;
          try { if (widgetId !== null) ts.remove(widgetId); } catch (e) {}
          if (holder.parentNode) holder.parentNode.removeChild(holder);
          resolve(tok);
        }
        try {
          widgetId = ts.render(holder, {
            sitekey: TURNSTILE_SITE_KEY,
            appearance: "interaction-only",
            callback: function (token) { finish(token); },
            "error-callback": function () { finish(null); }
          });
        } catch (e) { finish(null); }
        setTimeout(function () { finish(null); }, 12000);
      });
    });
  }

  function postPartial(payload) {
    return fetch("/api/lead-partial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (d) { return { status: r.status, data: d }; });
    });
  }

  function showErr(el, msg) { if (el) { el.textContent = msg; el.classList.add("show"); } }
  function clearErr(el) { if (el) { el.textContent = ""; el.classList.remove("show"); } }

  // ── 1) Form progressivo ────────────────────────────────────
  function setupProgressive() {
    var form = $("#homeContactForm");
    if (!form) return;
    var cta = $("[data-lc-step1-cta]", form);
    var step2 = $("[data-lc-step2]", form);
    var btn = cta && $('[data-action="lead-step1"]', cta);
    if (!cta || !step2 || !btn) return; // markup antigo: não mexe

    var errEl = $('[data-lc-error="step1"]', cta);
    var intro = $("[data-lc-intro]", step2);
    var whats = form.querySelector('[name="whatsapp"]');

    // Liga o modo progressivo: esconde o passo 2, mostra o CTA do passo 1.
    step2.hidden = true;
    cta.hidden = false;

    // Pré-carrega o script do Turnstile (não bloqueia nada)
    loadTurnstile();

    function revealStep2() {
      step2.hidden = false;
      cta.style.display = "none";
      if (intro) intro.hidden = false;
      var nome = step2.querySelector('[name="nome"]');
      if (nome) { try { nome.focus(); } catch (e) {} }
    }

    function submitStep1() {
      clearErr(errEl);
      var phone = whats ? whats.value : "";
      if (digits(phone).length < 8) {
        showErr(errEl, "Coloca um WhatsApp válido com DDD.");
        if (whats) whats.focus();
        return;
      }
      var orig = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = "Enviando...";
      var hp = form.querySelector('[name="_empresa"]');
      getTsToken(btn)
        .then(function (tok) {
          return postPartial({ whatsapp: phone, _empresa: hp ? hp.value : "", turnstile_token: tok || "" });
        })
        .then(function (res) {
          btn.disabled = false; btn.innerHTML = orig;
          if (res.status >= 200 && res.status < 300 && res.data && res.data.ok) {
            ssSet(DONE_KEY, "1");
            revealStep2();
          } else {
            showErr(errEl, (res.data && res.data.error) || "Não rolou agora. Tenta de novo.");
          }
        })
        .catch(function () {
          btn.disabled = false; btn.innerHTML = orig;
          showErr(errEl, "Sem conexão. Tenta de novo em instantes.");
        });
    }

    btn.addEventListener("click", submitStep1);
    // Enter no campo de WhatsApp dispara o passo 1 (não o submit do form)
    if (whats) {
      whats.addEventListener("keydown", function (e) {
        // No passo 1 (passo 2 ainda escondido), Enter dispara a captura — não o submit do form.
        if (e.key === "Enter" && step2.hidden) { e.preventDefault(); submitStep1(); }
      });
    }
  }

  // ── 2) Exit-intent ───────────────────────────────────────
  function setupExitIntent() {
    var modal = $("#exitIntentModal");
    if (!modal) return;
    var input = $("#exitWhats", modal);
    var submitBtn = $('[data-action="exit-submit"]', modal);
    var errEl = $('[data-lc-error="exit"]', modal);
    var successEl = $(".lc-modal-success", modal);
    var hp = $("[data-exit-hp]", modal);
    var opened = false;

    function canOpen() {
      return !opened && ssGet(EXIT_KEY) !== "1" && ssGet(DONE_KEY) !== "1";
    }
    function open() {
      if (!canOpen()) return;
      opened = true; ssSet(EXIT_KEY, "1");
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add("open"); });
      if (input) { try { input.focus(); } catch (e) {} }
    }
    function close() {
      modal.classList.remove("open");
      setTimeout(function () { modal.hidden = true; }, 250);
    }

    function doSubmit() {
      clearErr(errEl);
      var phone = input ? input.value : "";
      if (digits(phone).length < 8) {
        showErr(errEl, "Coloca um WhatsApp válido com DDD.");
        if (input) input.focus();
        return;
      }
      var orig = submitBtn.innerHTML;
      submitBtn.disabled = true; submitBtn.innerHTML = "Enviando...";
      getTsToken(submitBtn)
        .then(function (tok) {
          return postPartial({ whatsapp: phone, _empresa: hp ? hp.value : "", turnstile_token: tok || "" });
        })
        .then(function (res) {
          submitBtn.disabled = false; submitBtn.innerHTML = orig;
          if (res.status >= 200 && res.status < 300 && res.data && res.data.ok) {
            ssSet(DONE_KEY, "1");
            var keep = modal.querySelectorAll("[data-lc-keep]");
            for (var i = 0; i < keep.length; i++) keep[i].style.display = "none";
            clearErr(errEl);
            if (successEl) successEl.hidden = false;
            setTimeout(close, 2600);
          } else {
            showErr(errEl, (res.data && res.data.error) || "Não rolou agora. Tenta de novo.");
          }
        })
        .catch(function () {
          submitBtn.disabled = false; submitBtn.innerHTML = orig;
          showErr(errEl, "Sem conexão. Tenta de novo em instantes.");
        });
    }

    // Cliques no modal (fechar / enviar) por delegação
    modal.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== modal && !t.getAttribute("data-action")) t = t.parentNode;
      var act = t && t.getAttribute && t.getAttribute("data-action");
      if (act === "exit-close") close();
      else if (act === "exit-submit") doSubmit();
    });
    if (input) {
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doSubmit(); } });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });

    // Gatilho desktop: mouse sai pelo topo da janela
    document.addEventListener("mouseout", function (e) {
      if (e.clientY <= 0 && !e.relatedTarget && !e.toElement) open();
    });
    // Fallback (mobile / quem não tira o mouse): 35s na página
    setTimeout(open, 35000);
  }

  function init() { setupProgressive(); setupExitIntent(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
