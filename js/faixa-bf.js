/* =========================================================
   AURA — Faixa da Black Friday 2026 (home e /planos).

   Mockup aprovado: claude.ai/artifact/GHKbwPaKvxPhXrAEDvffwC (OK do Caio, 02/11).
   Textos do Marketing, exatos. Oferta: 50% na primeira mensalidade, BLACK50.

   • Janela: de 02/11/2026 00:00 a 30/11/2026 23:59, horário de Brasília. A data
     é decidida no navegador (dia de hoje em America/Sao_Paulo), então a faixa sai
     sozinha em 01/12 sem novo deploy. Fora da janela nada é montado: nem faixa,
     nem linha nos planos, nem <style>.
   • Nada disto está no HTML: a faixa e as linhas só existem se o JS rodar dentro
     da janela. Sem JS, ou depois de 30/11, o HTML bruto não traz a oferta (nem
     escondida), para buscadores e IAs não lerem uma promoção vencida.
   • Faixa no topo do <body>, acima do menu, rolando com a página (não gruda).
     Na pele de hoje o menu é fixo (position: fixed); enquanto a faixa aparece, o
     menu desce o quanto a faixa ainda está na tela (--bf-top). Na pele 2026 o
     menu já fica no fluxo, e a faixa só entra antes dele.
   • Fechar (botão de 44 px) fica lembrado no aparelho (localStorage) até 30/11;
     depois da janela a chave é apagada. Sem localStorage, fecha só nesta página.
   • Em /planos, a mesma linha de condição no fim do cartão do Essencial e do
     Negócio (cartões do js/plans-render.js, ids "essencial" e "negocio").
   • "Ver a oferta" leva a /black-friday?utm_source=site&utm_campaign=bf2026
     (página com a oferta e as regras, b-mk-29): o js/origem.js da página grava
     o UTM como primeiro toque (regra de sempre: não sobrescreve um primeiro
     toque válido), e o "Começar grátis" de lá segue para /comecar.

   Mesmo padrão do js/origem.js: no navegador vira window.AuraFaixaBF e já monta;
   no Node (teste) exporta as funções puras.
   ========================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.AuraFaixaBF = api; api.init(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var INICIO = "2026-11-02"; // primeiro dia (inclusive), horário de Brasília
  var FIM = "2026-11-30";    // último dia (inclusive), até 23:59
  var TZ = "America/Sao_Paulo";
  var KEY = "aura_bf2026_fechada";
  var LINK = "/black-friday?utm_source=site&utm_campaign=bf2026";

  // Strings com escape \u: o arquivo é servido sem charset garantido.
  var TEXTO_FAIXA = "<b>Black Friday na Aura:</b> 50% na primeira mensalidade com o código <b>BLACK50</b>, até 30/11 ou enquanto houver cupons.";
  var TEXTO_LINK = "Ver a oferta →";
  var TEXTO_PLANO = "50% de desconto na primeira mensalidade, com o código BLACK50 digitado no pagamento. Vale até 30/11 ou enquanto houver cupons. Ao assinar, o período de teste termina e a primeira mensalidade é cobrada.";
  var PLANOS = ["essencial", "negocio"];

  var CSS =
    ".bf-faixa{position:relative;z-index:1;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 14px;" +
      "box-sizing:border-box;min-height:44px;margin:0;padding:9px 52px 9px 20px;" +
      "background:linear-gradient(90deg,#2e1457,#351c61);border-bottom:1px solid rgba(167,139,250,.35);" +
      "color:#ede9fe;font-family:inherit;font-size:14px;line-height:1.35;text-align:center}" +
    ".bf-faixa .bf-tx b{font-weight:700;color:#fff}" +
    ".bf-faixa .bf-ver{color:#fff;font-weight:700;white-space:nowrap;text-decoration:underline;" +
      "text-decoration-color:rgba(255,255,255,.4);text-underline-offset:4px}" +
    ".bf-faixa .bf-ver:hover{text-decoration-color:#fff}" +
    ".bf-faixa .bf-x{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:44px;height:44px;" +
      "display:flex;align-items:center;justify-content:center;margin:0;padding:0;background:none;border:0;border-radius:8px;" +
      "color:#c4b5fd;font:22px/1 system-ui,sans-serif;cursor:pointer}" +
    ".bf-faixa .bf-x:hover{color:#fff;background:rgba(255,255,255,.06)}" +
    ".bf-faixa .bf-ver:focus-visible,.bf-faixa .bf-x:focus-visible{outline:2px solid #c4b5fd;outline-offset:2px;border-radius:6px}" +
    "@media (max-width:700px){.bf-faixa{flex-direction:column;gap:2px;padding:8px 48px 8px 14px;font-size:13px}}" +
    // pele de hoje: menu fixo desce junto com a faixa (sem animar o "top")
    "html.bf-faixa-on:not([data-skin=\"2026\"]) .site-nav{top:var(--bf-top,0px);" +
      "transition-property:background,background-color,color,border-color,box-shadow,padding,opacity,transform}" +
    // linha de condição nos cartões de /planos
    ".plan-card .bf-plano{margin:16px 0 0;padding-top:12px;border-top:1px dashed rgba(124,58,237,.3);" +
      "font-size:13px;line-height:1.45;color:#5b21b6}" +
    ".plan-card.featured .bf-plano{border-top-color:rgba(255,255,255,.35);color:rgba(255,255,255,.92)}";

  // Dia de hoje em Brasília, "AAAA-MM-DD". Sem Intl com fuso, usa UTC-3
  // (o Brasil não tem horário de verão desde 2019).
  function dataSP(now) {
    try {
      var partes = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date(now));
      var o = {};
      for (var i = 0; i < partes.length; i++) o[partes[i].type] = partes[i].value;
      if (/^\d{4}$/.test(o.year) && /^\d{2}$/.test(o.month) && /^\d{2}$/.test(o.day)) return o.year + "-" + o.month + "-" + o.day;
    } catch (e) {}
    return new Date(now - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  function dentroDaJanela(now) {
    if (typeof now !== "number" || !isFinite(now)) return false;
    var d = dataSP(now);
    return d >= INICIO && d <= FIM;
  }

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function fechada() {
    try { var s = storage(); return !!(s && s.getItem(KEY)); } catch (e) { return false; }
  }

  function lembrarFechada() {
    try { var s = storage(); if (s) s.setItem(KEY, FIM); } catch (e) {}
  }

  function esquecer() {
    try { var s = storage(); if (s && s.getItem(KEY)) s.removeItem(KEY); } catch (e) {}
  }

  function injetarEstilo() {
    if (document.getElementById("bf-faixa-css")) return;
    var st = document.createElement("style");
    st.id = "bf-faixa-css";
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  var faixa = null;
  var agendado = false;

  // Pele de hoje: o menu fixo fica logo abaixo do que ainda aparece da faixa.
  function posicionarMenu() {
    agendado = false;
    var h = 0;
    if (faixa) {
      try { h = Math.max(0, Math.round(faixa.getBoundingClientRect().bottom)); } catch (e) { h = 0; }
    }
    document.documentElement.style.setProperty("--bf-top", h + "px");
  }

  function agendar() {
    if (agendado) return;
    agendado = true;
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(posicionarMenu);
    else posicionarMenu();
  }

  function fechar() {
    lembrarFechada();
    if (faixa && faixa.parentNode) faixa.parentNode.removeChild(faixa);
    faixa = null;
    window.removeEventListener("scroll", agendar);
    window.removeEventListener("resize", agendar);
    document.documentElement.classList.remove("bf-faixa-on");
    document.documentElement.style.removeProperty("--bf-top");
  }

  function montarFaixa() {
    var body = document.body;
    if (!body || document.querySelector(".bf-faixa")) return;
    faixa = document.createElement("div");
    faixa.className = "bf-faixa";
    faixa.setAttribute("role", "region");
    faixa.setAttribute("aria-label", "Black Friday na Aura");
    faixa.innerHTML =
      '<span class="bf-tx">' + TEXTO_FAIXA + "</span>" +
      '<a class="bf-ver" href="' + LINK + '">' + TEXTO_LINK + "</a>" +
      '<button class="bf-x" type="button" data-bf-fechar aria-label="Fechar o aviso da Black Friday">×</button>';
    faixa.addEventListener("click", function (e) {
      var alvo = e && e.target;
      if (alvo && typeof alvo.closest === "function" && alvo.closest("[data-bf-fechar]")) fechar();
    });
    body.insertBefore(faixa, body.firstChild);
    document.documentElement.classList.add("bf-faixa-on");
    posicionarMenu();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar, { passive: true });
  }

  function linhasDosPlanos() {
    for (var i = 0; i < PLANOS.length; i++) {
      var card = document.getElementById(PLANOS[i]);
      if (!card || !card.classList || !card.classList.contains("plan-card")) continue;
      if (card.querySelector(".bf-plano")) continue;
      var p = document.createElement("p");
      p.className = "bf-plano";
      p.textContent = TEXTO_PLANO;
      card.appendChild(p);
    }
  }

  function init() {
    try {
      if (!dentroDaJanela(Date.now())) { esquecer(); return; }
      injetarEstilo();
      if (!fechada()) montarFaixa();
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", linhasDosPlanos);
      else linhasDosPlanos();
    } catch (e) {}
  }

  return {
    init: init,
    // funções puras e constantes (teste)
    dataSP: dataSP, dentroDaJanela: dentroDaJanela,
    INICIO: INICIO, FIM: FIM, KEY: KEY, LINK: LINK,
    TEXTO_FAIXA: TEXTO_FAIXA, TEXTO_LINK: TEXTO_LINK, TEXTO_PLANO: TEXTO_PLANO,
  };
});
