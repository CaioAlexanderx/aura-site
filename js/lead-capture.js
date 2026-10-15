/* =========================================================
   AURA — Contato só por WhatsApp.
   Dois modos, ambos EXPLÍCITOS (a pessoa clica um botão):
     1) Bloco [data-wa-lead]: botão "Chamar no WhatsApp" (wa.me, funciona
        sem JS) + campo único "Quero que me chamem" (aparece só com JS).
     2) Exit-intent (#exitIntentModal): popup ao sair pedindo o WhatsApp.
   Ambos postam em /api/lead-partial (Worker) -> CRM como lead parcial.
   Validação do celular: js/phone-br.js (mesma regra do Worker).
   Anti-robô (t2-12): envia `hp` (honeypot, campo invisível) e `elapsed_ms`
   (ms desde o carregamento da página; menos de 3 s = robô). Cloudflare
   Turnstile só entra se o bloco (ou o modal) tiver data-turnstile-sitekey
   PREENCHIDO; vazio, nada é carregado e o formulário funciona como antes.
   O token vai como `turnstile_token`.
   ========================================================= */
(function () {
  "use strict";

  var Phone = window.AuraPhone;
  if (!Phone) return; // sem a regra de telefone, fica só o botão wa.me

  var DONE_KEY = "aura_lc_done";      // já capturou algum lead nesta sessão
  var EXIT_KEY = "aura_lc_exit_shown"; // exit-intent já apareceu nesta sessão
  var SUCCESS_MSG = "Anotado! A gente te chama no WhatsApp em horário comercial.";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function elapsed() {
    return Math.round(window.performance && performance.now ? performance.now() : 0);
  }

  function postPartial(phone, hpValue, token) {
    var payload = {
      whatsapp: phone,
      hp: hpValue || "",
      elapsed_ms: elapsed(),
      page: location.pathname
    };
    if (token) payload.turnstile_token = token;
    return fetch("/api/lead-partial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        return { status: r.status, data: d };
      });
    });
  }

  function showErr(el, input, msg) {
    if (el) { el.textContent = msg; el.classList.add("show"); }
    if (input) { input.setAttribute("aria-invalid", "true"); try { input.focus(); } catch (e) {} }
  }
  function clearErr(el, input) {
    if (el) { el.textContent = ""; el.classList.remove("show"); }
    if (input) input.removeAttribute("aria-invalid");
  }

  // ── Cloudflare Turnstile (opcional) ──────────────────────
  // Só existe se o host (bloco ou modal) tiver data-turnstile-sitekey
  // preenchido. O script do Cloudflare só é baixado quando a pessoa foca no
  // campo do celular. Se não carregar (bloqueador), o envio segue sem token e
  // o servidor decide.
  var TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var tsLoading = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!tsLoading) {
      tsLoading = new Promise(function (resolve, reject) {
        var s = document.createElement("script");
        s.src = TS_SRC; s.async = true; s.defer = true;
        s.onload = function () { window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")); };
        s.onerror = function () { tsLoading = null; reject(new Error("turnstile")); };
        document.head.appendChild(s);
      });
    }
    return tsLoading;
  }
  function setupTurnstile(host, before, input) {
    var sitekey = ((host && host.getAttribute("data-turnstile-sitekey")) || "").replace(/\s+/g, "");
    if (!sitekey || !before || !before.parentNode) return null;
    var box = document.createElement("div");
    box.className = "lc-turnstile";
    box.setAttribute("data-lc-keep", "");
    before.parentNode.insertBefore(box, before);
    var state = { token: "", widget: null, started: false, failed: false };
    state.start = function () {
      if (state.started) return;
      state.started = true;
      loadTurnstile().then(function (ts) {
        state.widget = ts.render(box, {
          sitekey: sitekey,
          theme: "dark",
          callback: function (t) { state.token = t; },
          "expired-callback": function () { state.token = ""; },
          "error-callback": function () { state.token = ""; state.failed = true; }
        });
      }).catch(function () { state.failed = true; });
    };
    state.reset = function () {
      state.token = "";
      if (state.widget !== null && window.turnstile) { try { window.turnstile.reset(state.widget); } catch (e) {} }
    };
    input.addEventListener("focus", state.start);
    return state;
  }

  // Máscara (11) 99999-9999 — só reformata com o cursor no fim, pra não
  // atrapalhar quem está corrigindo um dígito no meio.
  function attachMask(input) {
    input.addEventListener("input", function () {
      if (input.selectionStart !== input.value.length) return;
      var formatted = Phone.format(input.value);
      if (formatted !== input.value) input.value = formatted;
    });
    input.addEventListener("blur", function () { input.value = Phone.format(input.value); });
  }

  // Valida + envia. onOk() assume depois do sucesso.
  function submitPhone(input, btn, errEl, hp, ts, onOk) {
    clearErr(errEl, input);
    var phone = input.value;
    if (!Phone.isValid(phone)) { showErr(errEl, input, Phone.ERROR_MSG); return; }
    if (ts && !ts.token && !ts.failed) {
      ts.start();
      showErr(errEl, null, "Confirme a verificação acima e envie de novo.");
      return;
    }
    var orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = "Enviando...";
    postPartial(phone, hp ? hp.value : "", ts ? ts.token : "")
      .then(function (res) {
        btn.disabled = false; btn.innerHTML = orig;
        if (res.status >= 200 && res.status < 300 && res.data && res.data.ok) {
          ssSet(DONE_KEY, "1");
          onOk();
        } else {
          if (ts) ts.reset();
          showErr(errEl, input, (res.data && res.data.error) || "Não rolou agora. Tenta de novo ou chama a gente no WhatsApp.");
        }
      })
      .catch(function () {
        btn.disabled = false; btn.innerHTML = orig;
        if (ts) ts.reset();
        showErr(errEl, input, "Sem conexão. Tenta de novo ou chama a gente no WhatsApp.");
      });
  }

  // ── 1) Blocos WhatsApp das páginas ───────────────────────
  function setupBlock(block) {
    var form = $("[data-wa-callback]", block);
    if (!form) return;
    var input = $('input[type="tel"]', form);
    var btn = $('button[type="submit"]', form);
    var errEl = $("[data-wa-error]", form);
    var hp = $("[data-wa-hp]", form);
    var success = $("[data-wa-success]", block);
    if (!input || !btn) return;

    form.hidden = false; // sem JS o campo fica oculto e sobra o botão wa.me
    attachMask(input);
    var ts = setupTurnstile(block, btn, input);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitPhone(input, btn, errEl, hp, ts, function () {
        form.hidden = true;
        if (success) {
          success.textContent = SUCCESS_MSG;
          success.hidden = false;
          try { success.focus(); } catch (err) {}
        }
      });
    });
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
    var lastFocus = null;
    var opened = false;
    if (!input || !submitBtn) return;
    attachMask(input);
    var ts = setupTurnstile(modal, submitBtn, input);

    function canOpen() {
      return !opened && ssGet(EXIT_KEY) !== "1" && ssGet(DONE_KEY) !== "1";
    }
    function open() {
      if (!canOpen()) return;
      opened = true; ssSet(EXIT_KEY, "1");
      lastFocus = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add("open"); });
      try { input.focus(); } catch (e) {}
    }
    function close() {
      modal.classList.remove("open");
      setTimeout(function () { modal.hidden = true; }, 250);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }

    function doSubmit() {
      submitPhone(input, submitBtn, errEl, hp, ts, function () {
        var keep = modal.querySelectorAll("[data-lc-keep]");
        for (var i = 0; i < keep.length; i++) keep[i].style.display = "none";
        if (successEl) { successEl.textContent = SUCCESS_MSG; successEl.hidden = false; }
        setTimeout(close, 3200);
      });
    }

    // Cliques no modal (fechar / enviar) por delegação
    modal.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== modal && !(t.getAttribute && t.getAttribute("data-action"))) t = t.parentNode;
      var act = t && t.getAttribute && t.getAttribute("data-action");
      if (act === "exit-close") close();
      else if (act === "exit-submit") doSubmit();
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doSubmit(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });

    // Gatilho desktop: mouse sai pelo topo da janela
    document.addEventListener("mouseout", function (e) {
      if (e.clientY <= 0 && !e.relatedTarget && !e.toElement) open();
    });
    // Fallback (mobile / quem não tira o mouse): 35s na página
    setTimeout(open, 35000);
  }

  function init() {
    var blocks = document.querySelectorAll("[data-wa-lead]");
    for (var i = 0; i < blocks.length; i++) setupBlock(blocks[i]);
    setupExitIntent();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
