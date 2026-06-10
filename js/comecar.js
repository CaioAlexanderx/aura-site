/* =========================================================
   AURA — /comecar · Checkout trial (wizard 2 passos)
   CNPJ → Conta → Sucesso (redireciona pro app)

   Integração (T3.4, 09/06/2026):
   • POST {API}/onboarding/cnpj-lookup  { cnpj }
   • POST {API}/auth/register           { name, email, password, phone,
                                          company_name, cnpj, access_code,
                                          terms_accepted, terms_version }
   • access_code COMECAR (criado no T3.1): plan=negocio · trial_days=7.
     O backend NÃO aceita `plan` direto — o trial vem 100% do code.
   • terms_version 'v2' = Termos de Uso v2 publicados em 21/05/2026.
   • Vertical NÃO é escolhida aqui (decisão v3.1) — ativação é no app.
   • Handoff (T3.2): app não aceita sessão externa cross-origin
     (token vive no localStorage de app.getaura.com.br). Fallback v1:
     redirect pro login do app com ?email= pré-preenchido.
   ⚠️ Deploy: garantir https://www.getaura.com.br em ALLOWED_ORIGINS
     (Railway) — sem isso o navegador bloqueia por CORS.
   ========================================================= */
(function () {
  "use strict";

  var API = "https://aura-backend-production-f805.up.railway.app/api/v1";
  var APP_LOGIN = "https://app.getaura.com.br/login";
  var ACCESS_CODE = "COMECAR";
  var TERMS_VERSION = "v2";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var steps = {
    cnpj: $('[data-step="cnpj"]'),
    conta: $('[data-step="conta"]'),
    sucesso: $('[data-step="sucesso"]'),
  };
  if (!steps.cnpj || !steps.conta || !steps.sucesso) return;

  // estado do wizard
  var state = { cnpj: null, company_name: null, skippedCnpj: false };

  /* ---------- UI helpers ---------- */
  function showStep(name) {
    Object.keys(steps).forEach(function (k) {
      var el = steps[k];
      if (k === name) {
        el.hidden = false;
        el.classList.remove("entering");
        void el.offsetWidth; // re-trigger animation
        el.classList.add("entering");
      } else {
        el.hidden = true;
      }
    });
    setProgress(name === "sucesso" ? "done" : name);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) { window.scrollTo(0, 0); }
  }

  function setProgress(name) {
    var pCnpj = $('[data-progress-for="cnpj"]');
    var pConta = $('[data-progress-for="conta"]');
    var conn = $("[data-connector]");
    if (!pCnpj || !pConta) return;
    pCnpj.classList.remove("active", "done");
    pConta.classList.remove("active", "done");
    if (conn) conn.classList.remove("done");
    if (name === "cnpj") {
      pCnpj.classList.add("active");
    } else if (name === "conta") {
      pCnpj.classList.add("done");
      pConta.classList.add("active");
      if (conn) conn.classList.add("done");
    } else { // done
      pCnpj.classList.add("done");
      pConta.classList.add("done");
      if (conn) conn.classList.add("done");
    }
  }

  function setLoading(btn, on) {
    if (!btn) return;
    btn.classList.toggle("loading", !!on);
    btn.disabled = !!on;
  }

  function showError(key, msg) {
    var box = $('.form-error[data-error="' + key + '"]');
    if (!box) return;
    var span = $("[data-error-msg]", box);
    if (span) span.textContent = msg;
    box.classList.add("show");
  }

  function clearError(key) {
    var box = $('.form-error[data-error="' + key + '"]');
    if (box) box.classList.remove("show");
  }

  /* ---------- máscaras ---------- */
  function maskCnpj(v) {
    v = v.replace(/\D/g, "").slice(0, 14);
    if (v.length > 12) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*$/, "$1.$2.$3/$4-$5");
    if (v.length > 8) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4}).*$/, "$1.$2.$3/$4");
    if (v.length > 5) return v.replace(/^(\d{2})(\d{3})(\d{0,3}).*$/, "$1.$2.$3");
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,3}).*$/, "$1.$2");
    return v;
  }

  function maskPhone(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{0,4}).*$/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*$/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*$/, "($1) $2");
    return v;
  }

  // validação de dígitos verificadores do CNPJ
  function isValidCnpj(digits) {
    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
    var calc = function (slice) {
      var pos = slice.length - 7, sum = 0;
      for (var i = 0; i < slice.length; i++) {
        sum += parseInt(slice.charAt(i), 10) * pos--;
        if (pos < 2) pos = 9;
      }
      var r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(digits.slice(0, 12)) === parseInt(digits.charAt(12), 10) &&
           calc(digits.slice(0, 13)) === parseInt(digits.charAt(13), 10);
  }

  /* ---------- API ---------- */
  function post(path, body, timeoutMs) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 12000) : null;
    return fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    });
  }

  /* ---------- Passo 1 · CNPJ ---------- */
  var cnpjInput = $('input[name="cnpj"]');
  var resultCard = $("[data-cnpj-result]");

  if (cnpjInput) {
    cnpjInput.addEventListener("input", function () {
      this.value = maskCnpj(this.value);
      clearError("cnpj");
    });
    cnpjInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); doLookup(); }
    });
  }

  function doLookup() {
    clearError("cnpj");
    var btn = $('[data-action="cnpj-lookup"]');
    var digits = (cnpjInput.value || "").replace(/\D/g, "");
    if (digits.length !== 14) return showError("cnpj", "Digite o CNPJ completo (14 dígitos).");
    if (!isValidCnpj(digits)) return showError("cnpj", "Esse CNPJ não bate. Confere os números?");

    setLoading(btn, true);
    post("/onboarding/cnpj-lookup", { cnpj: digits })
      .then(function (r) {
        setLoading(btn, false);
        if (r.ok) {
          var d = r.data || {};
          state.cnpj = digits;
          state.skippedCnpj = false;
          state.company_name = (d.trade_name || d.legal_name || "").trim() || null;
          var setField = function (key, val) {
            var el = $('[data-field="' + key + '"]', resultCard);
            if (el) el.textContent = val || "—";
          };
          setField("legal_name", d.legal_name);
          setField("trade_name", d.trade_name || d.legal_name);
          setField("city_uf", d.address_city && d.address_state ? d.address_city + " / " + d.address_state : (d.address_city || d.address_state || "—"));
          if (resultCard) resultCard.hidden = false;
        } else if (r.status === 422) {
          showError("cnpj", "Esse CNPJ consta como irregular na Receita. Dá pra continuar sem CNPJ pelo link abaixo — a gente resolve junto depois.");
        } else if (r.status === 404) {
          showError("cnpj", "CNPJ não encontrado na Receita. Confere os números ou continua sem CNPJ.");
        } else if (r.status === 429) {
          showError("cnpj", "Muitas consultas agora. Espera uns minutos — ou continua sem CNPJ pelo link abaixo.");
        } else {
          showError("cnpj", (r.data && r.data.error) || "CNPJ inválido. Confere os números?");
        }
      })
      .catch(function () {
        setLoading(btn, false);
        showError("cnpj", "Sem conexão com o servidor. Tenta de novo em instantes.");
      });
  }

  var lookupBtn = $('[data-action="cnpj-lookup"]');
  if (lookupBtn) lookupBtn.addEventListener("click", function (e) { e.preventDefault(); doLookup(); });

  var confirmBtn = $('[data-action="cnpj-confirm"]');
  if (confirmBtn) confirmBtn.addEventListener("click", function (e) {
    e.preventDefault();
    showStep("conta");
  });

  var resetLink = $('[data-action="cnpj-reset"]');
  if (resetLink) resetLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (resultCard) resultCard.hidden = true;
    state.cnpj = null; state.company_name = null;
    cnpjInput.value = "";
    cnpjInput.focus();
  });

  var skipLink = $('[data-action="skip-cnpj"]');
  if (skipLink) skipLink.addEventListener("click", function (e) {
    e.preventDefault();
    state.cnpj = null;
    state.company_name = null;
    state.skippedCnpj = true;
    showStep("conta");
  });

  var backLink = $('[data-action="back-cnpj"]');
  if (backLink) backLink.addEventListener("click", function (e) {
    e.preventDefault();
    showStep("cnpj");
  });

  /* ---------- Passo 2 · Conta ---------- */
  var phoneInput = $('input[name="phone"]');
  if (phoneInput) phoneInput.addEventListener("input", function () { this.value = maskPhone(this.value); });

  ["name", "email", "password"].forEach(function (n) {
    var el = $('input[name="' + n + '"]');
    if (el) el.addEventListener("input", function () { clearError("register"); });
  });

  function doRegister() {
    clearError("register");
    var btn = $('[data-action="register"]');
    var name = ($('input[name="name"]').value || "").trim();
    var email = ($('input[name="email"]').value || "").trim().toLowerCase();
    var phone = ($('input[name="phone"]').value || "").replace(/\D/g, "");
    var password = $('input[name="password"]').value || "";
    var terms = $('input[name="terms_accepted"]').checked;

    if (name.length < 2) return showError("register", "Conta pra gente seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("register", "Esse e-mail não parece válido.");
    if (password.length < 8) return showError("register", "A senha precisa de pelo menos 8 caracteres.");
    if (!terms) return showError("register", "Falta aceitar os Termos de Uso e a Privacidade.");

    // Sem CNPJ: a empresa nasce com o nome do dono e ajusta depois no app.
    var companyName = state.company_name || name;

    var body = {
      name: name,
      email: email,
      password: password,
      phone: phone || null,
      company_name: companyName,
      cnpj: state.cnpj || null,
      access_code: ACCESS_CODE,
      terms_accepted: true,
      terms_version: TERMS_VERSION,
    };

    setLoading(btn, true);
    post("/auth/register", body, 15000)
      .then(function (r) {
        setLoading(btn, false);
        if (r.status === 201 || (r.ok && r.data && r.data.token)) {
          showStep("sucesso");
          setTimeout(function () {
            window.location.href = APP_LOGIN + "?email=" + encodeURIComponent(email) + "&from=comecar";
          }, 2600);
        } else if (r.status === 409) {
          showError("register", "Esse e-mail já tem conta na Aura. É só entrar: app.getaura.com.br");
        } else if (r.status === 429) {
          showError("register", "Muitas tentativas seguidas. Espera uns minutos e tenta de novo.");
        } else {
          showError("register", (r.data && r.data.error) || "Não rolou criar a conta agora. Tenta de novo — se persistir, chama no WhatsApp.");
        }
      })
      .catch(function () {
        setLoading(btn, false);
        showError("register", "Sem conexão com o servidor. Tenta de novo em instantes.");
      });
  }

  var registerBtn = $('[data-action="register"]');
  if (registerBtn) registerBtn.addEventListener("click", function (e) { e.preventDefault(); doRegister(); });

  var passInput = $('input[name="password"]');
  if (passInput) passInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); doRegister(); }
  });

  // estado inicial
  setProgress("cnpj");
})();
