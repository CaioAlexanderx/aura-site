/* =========================================================
   AURA — Contato só por WhatsApp.
   Dois modos, ambos EXPLÍCITOS (a pessoa clica um botão):
     1) Bloco [data-wa-lead]: botão "Chamar no WhatsApp" (wa.me, funciona
        sem JS) + campo único "Quero que me chamem" (aparece só com JS).
     2) Exit-intent (#exitIntentModal): popup ao sair pedindo o WhatsApp.
   Ambos postam em /api/lead-partial (Worker) -> CRM como lead parcial.
   Validação do celular: js/phone-br.js (mesma regra do Worker).
   Envia `t` = ms desde o carregamento da página (time trap anti-robô).
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

  function postPartial(phone, hpValue) {
    return fetch("/api/lead-partial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp: phone,
        _empresa: hpValue || "",
        t: elapsed(),
        page: location.pathname
      })
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
  function submitPhone(input, btn, errEl, hp, onOk) {
    clearErr(errEl, input);
    var phone = input.value;
    if (!Phone.isValid(phone)) { showErr(errEl, input, Phone.ERROR_MSG); return; }
    var orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = "Enviando...";
    postPartial(phone, hp ? hp.value : "")
      .then(function (res) {
        btn.disabled = false; btn.innerHTML = orig;
        if (res.status >= 200 && res.status < 300 && res.data && res.data.ok) {
          ssSet(DONE_KEY, "1");
          onOk();
        } else {
          showErr(errEl, input, (res.data && res.data.error) || "Não rolou agora. Tenta de novo ou chama a gente no WhatsApp.");
        }
      })
      .catch(function () {
        btn.disabled = false; btn.innerHTML = orig;
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

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitPhone(input, btn, errEl, hp, function () {
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
      submitPhone(input, submitBtn, errEl, hp, function () {
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
