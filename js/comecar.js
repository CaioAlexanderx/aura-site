/* =========================================================
   AURA — /comecar · Checkout trial (wizard 3 passos)
   CNPJ → Ramo → Conta → Sucesso (redireciona pro app)

   Integração (T3.4, 09/06/2026):
   • POST {API}/onboarding/cnpj-lookup  { cnpj }
   • POST {API}/auth/register           { name, email, password, phone,
                                          company_name, cnpj, access_code,
                                          terms_accepted, terms_version }
   • access_code COMECAR (criado no T3.1): plan=negocio · trial_days=7.
     O backend NÃO aceita `plan` direto — o trial vem 100% do code.
   • terms_version 'v2' = Termos de Uso v2 publicados em 21/05/2026.
   • Vertical NÃO é escolhida aqui (decisão v3.1) — ativação é no app.
   • Frente (05/10/2026, backend #786): passo "Ramo" entre CNPJ e Conta.
     O lookup devolve cnae_codigo, cnae_descricao e suggested_segment;
     o register recebe segment, segment_source ('cnae' | 'landing' |
     'user'), extras (só ["os"]), cnae_principal, cnae_descricao e
     segment_suggested. ?ramo= na URL (páginas de segmento) pré-marca a
     opção e prevalece sobre a sugestão do CNAE. Nada disso vai pro
     localStorage: fica só em memória.
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
    ramo: $('[data-step="ramo"]'),
    conta: $('[data-step="conta"]'),
    sucesso: $('[data-step="sucesso"]'),
  };
  if (!steps.cnpj || !steps.ramo || !steps.conta || !steps.sucesso) return;
  var STEP_ORDER = ["cnpj", "ramo", "conta"];

  // Frentes aceitas pelo backend (services/segment.js).
  var SEGMENTS = ["varejo", "matcon", "otica", "assistencia", "studio", "outro"];
  // Nome e descrição do cartão de sugestão. "outro" nunca é sugerido.
  var SEGMENT_INFO = {
    varejo: { name: "Loja em geral", desc: "Caixa, estoque com grade, troca e fiado já ligados." },
    matcon: { name: "Material de construção", desc: "Orçamento que vira venda, entrega e venda por m², kg e metro já ligados." },
    otica: { name: "Ótica", desc: "Receitas, laboratório e garantia de lente já ligados." },
    assistencia: { name: "Assistência técnica", desc: "Ordem de serviço e garantia já ligadas." },
    studio: { name: "Personalizados (Aura Studio)", desc: "Orçamento com arte, produção e mockup 3D. Abre no Aura Studio." },
    outro: { name: "Outro", desc: "" },
  };
  // Frentes que já têm OS (ou não usam): sem a pergunta extra.
  var NO_EXTRA_OS = { assistencia: true, studio: true };

  function validSegment(v) {
    v = typeof v === "string" ? v.trim().toLowerCase() : "";
    return SEGMENTS.indexOf(v) >= 0 ? v : null;
  }

  // ?ramo= vindo das páginas de segmento do site
  var landingSegment = null;
  try { landingSegment = validSegment(new URLSearchParams(window.location.search).get("ramo")); } catch (_) {}

  // estado do wizard (só em memória)
  var state = {
    cnpj: null, company_name: null, skippedCnpj: false,
    cnae_codigo: null, cnae_descricao: null, suggested_segment: null,
    // passo Ramo
    ramoKey: null,          // de qual CNPJ/sem-CNPJ o passo foi montado
    segment: null,          // opção marcada
    initialSegment: null,   // opção que veio pré-marcada
    initialSource: null,    // 'cnae' | 'landing' | null
    extraOs: false,
  };

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
    var idx = name === "done" ? STEP_ORDER.length : STEP_ORDER.indexOf(name);
    STEP_ORDER.forEach(function (k, i) {
      var el = $('[data-progress-for="' + k + '"]');
      if (el) {
        el.classList.remove("active", "done");
        if (i < idx) el.classList.add("done");
        else if (i === idx) el.classList.add("active");
      }
      var conn = $('[data-connector="' + k + '"]');
      if (conn) conn.classList.toggle("fill", i <= idx && i > 0);
    });
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
          state.cnae_codigo = typeof d.cnae_codigo === "string" && d.cnae_codigo ? d.cnae_codigo : null;
          state.cnae_descricao = typeof d.cnae_descricao === "string" && d.cnae_descricao.trim() ? d.cnae_descricao.trim() : null;
          var sug = validSegment(d.suggested_segment);
          state.suggested_segment = sug && sug !== "outro" ? sug : null;
          var atvRow = $('[data-row="atividade"]', resultCard);
          if (atvRow) atvRow.hidden = !state.cnae_descricao;
          var setField = function (key, val) {
            var el = $('[data-field="' + key + '"]', resultCard);
            if (el) el.textContent = val || "—";
          };
          setField("legal_name", d.legal_name);
          setField("trade_name", d.trade_name || d.legal_name);
          setField("city_uf", d.address_city && d.address_state ? d.address_city + " / " + d.address_state : (d.address_city || d.address_state || "—"));
          setField("cnae_descricao", state.cnae_descricao);
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
    goRamo();
  });

  function clearLookup() {
    state.cnpj = null; state.company_name = null;
    state.cnae_codigo = null; state.cnae_descricao = null; state.suggested_segment = null;
  }

  var resetLink = $('[data-action="cnpj-reset"]');
  if (resetLink) resetLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (resultCard) resultCard.hidden = true;
    clearLookup();
    cnpjInput.value = "";
    cnpjInput.focus();
  });

  var skipLink = $('[data-action="skip-cnpj"]');
  if (skipLink) skipLink.addEventListener("click", function (e) {
    e.preventDefault();
    clearLookup();
    state.skippedCnpj = true;
    goRamo();
  });

  var backCnpj = $('[data-action="back-cnpj"]');
  if (backCnpj) backCnpj.addEventListener("click", function (e) {
    e.preventDefault();
    showStep("cnpj");
  });

  var backRamo = $('[data-action="back-ramo"]');
  if (backRamo) backRamo.addEventListener("click", function (e) {
    e.preventDefault();
    showStep("ramo");
  });

  /* ---------- Passo 2 · Ramo ---------- */
  var ramoOpts = $$(".ramo-opt", steps.ramo);
  var ramoSug = $("[data-ramo-sug]", steps.ramo);
  var ramoNote = $("[data-ramo-note]", steps.ramo);
  var ramoExtra = $("[data-ramo-extra]", steps.ramo);
  var ramoBtn = $('[data-action="ramo-confirm"]', steps.ramo);
  var ramoBtnLabel = $("[data-ramo-btn-label]", steps.ramo);
  var extraBtns = $$("[data-extra-os]", steps.ramo);

  // Monta o passo a partir do CNPJ atual (ou do "sem CNPJ"). Se o cliente
  // volta do passo Conta com o mesmo CNPJ, a escolha dele é mantida.
  function goRamo() {
    var key = state.cnpj || "sem-cnpj";
    if (state.ramoKey !== key) {
      state.ramoKey = key;
      var sug = state.suggested_segment;
      if (landingSegment) {
        state.initialSegment = landingSegment;
        state.initialSource = "landing";
      } else if (sug) {
        state.initialSegment = sug;
        state.initialSource = "cnae";
      } else {
        state.initialSegment = null;
        state.initialSource = null;
      }
      state.segment = state.initialSegment;
      state.extraOs = false;

      // Cartão grande: só quando a sugestão do CNAE é a opção pré-marcada.
      var showCard = !!sug && sug === state.initialSegment;
      if (ramoSug) {
        ramoSug.hidden = !showCard;
        if (showCard) {
          $("[data-ramo-sug-name]", ramoSug).textContent = SEGMENT_INFO[sug].name;
          $("[data-ramo-sug-desc]", ramoSug).textContent = SEGMENT_INFO[sug].desc;
        }
      }
      // Veio da página de um segmento e o CNAE aponta outro: avisa em texto pequeno.
      var showNote = !!sug && !!landingSegment && sug !== landingSegment;
      if (ramoNote) {
        ramoNote.hidden = !showNote;
        if (showNote) {
          ramoNote.textContent = "";
          ramoNote.appendChild(document.createTextNode("Pelo CNPJ parece "));
          var b = document.createElement("b");
          b.textContent = SEGMENT_INFO[sug].name;
          ramoNote.appendChild(b);
          ramoNote.appendChild(document.createTextNode("; confira."));
        }
      }
    }
    clearError("ramo");
    renderRamo();
    showStep("ramo");
  }

  function renderRamo() {
    ramoOpts.forEach(function (o, i) {
      var on = o.getAttribute("data-segment") === state.segment;
      o.setAttribute("aria-checked", on ? "true" : "false");
      // roving tabindex: a marcada (ou a primeira) recebe o foco do Tab
      o.tabIndex = on || (!state.segment && i === 0) ? 0 : -1;
    });
    var showExtra = !!state.segment && !NO_EXTRA_OS[state.segment];
    if (ramoExtra) ramoExtra.hidden = !showExtra;
    extraBtns.forEach(function (b) {
      var sim = b.getAttribute("data-extra-os") === "sim";
      b.setAttribute("aria-pressed", (sim ? state.extraOs : !state.extraOs) ? "true" : "false");
    });
    if (ramoBtn) ramoBtn.disabled = !state.segment;
    if (ramoBtnLabel) {
      var confirming = !!state.initialSegment && state.segment === state.initialSegment;
      ramoBtnLabel.textContent = confirming ? "É isso, continuar" : "Continuar";
    }
  }

  function selectSegment(seg, focus) {
    state.segment = seg;
    clearError("ramo");
    renderRamo();
    if (focus) {
      var el = $('.ramo-opt[data-segment="' + seg + '"]', steps.ramo);
      if (el) el.focus();
    }
  }

  ramoOpts.forEach(function (o, i) {
    o.addEventListener("click", function (e) {
      e.preventDefault();
      selectSegment(o.getAttribute("data-segment"), false);
    });
    // setas navegam e marcam, como num radiogroup nativo
    o.addEventListener("keydown", function (e) {
      var d = 0;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") d = 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") d = -1;
      else if (e.key === "Home") d = -i;
      else if (e.key === "End") d = ramoOpts.length - 1 - i;
      else if (e.key === " ") { e.preventDefault(); selectSegment(o.getAttribute("data-segment"), false); return; }
      if (!d) return;
      e.preventDefault();
      var n = (i + d + ramoOpts.length) % ramoOpts.length;
      selectSegment(ramoOpts[n].getAttribute("data-segment"), true);
    });
  });

  extraBtns.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      state.extraOs = b.getAttribute("data-extra-os") === "sim";
      clearError("ramo");
      renderRamo();
    });
  });

  if (ramoBtn) ramoBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (!state.segment) return showError("ramo", "Escolha o ramo que mais combina com a sua loja.");
    showStep("conta");
  });

  // Campos de frente que vão no /auth/register
  function segmentPayload() {
    var seg = state.segment;
    var source = seg === state.initialSegment && state.initialSource ? state.initialSource : "user";
    return {
      segment: seg,
      segment_source: source,
      extras: seg && !NO_EXTRA_OS[seg] && state.extraOs ? ["os"] : [],
      cnae_principal: state.cnae_codigo,
      cnae_descricao: state.cnae_descricao,
      segment_suggested: state.suggested_segment,
    };
  }

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
    if (!state.segment) {
      showStep("ramo");
      return showError("ramo", "Escolha o ramo que mais combina com a sua loja.");
    }
    var seg = segmentPayload();
    Object.keys(seg).forEach(function (k) { body[k] = seg[k]; });

    setLoading(btn, true);
    post("/auth/register", body, 15000)
      .then(function (r) {
        setLoading(btn, false);
        if (r.status === 201 || (r.ok && r.data && r.data.token)) {
          showStep("sucesso");
          setTimeout(function () {
            window.location.href = APP_LOGIN + "?email=" + encodeURIComponent(email) + "&from=comecar";
          }, 2600);
        } else if (r.status === 400 && r.data && (r.data.code === "SEGMENT_INVALID" || r.data.code === "EXTRAS_INVALID")) {
          showStep("ramo");
          showError("ramo", "Não deu pra salvar o ramo escolhido. Marca de novo e continua — se repetir, chama a gente no WhatsApp.");
        } else if (r.status === 409 && r.data && r.data.code === "STUDIO_PLAN_REQUIRED") {
          showStep("ramo");
          showError("ramo", "Personalizados abre no Aura Studio, que precisa de outro plano. Escolha outro ramo pra começar agora ou chama a gente no WhatsApp que a gente monta junto.");
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
