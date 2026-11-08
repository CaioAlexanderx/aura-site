/* =========================================================
   AURA — Página /black-friday (card b-mk-29, BLACK50 até 30/11/2026).

   Mockup aprovado: claude.ai/artifact/BnYg3nZVMiNPdXpWTpyfBS (v3, OK do Caio).

   A oferta está no HTML bruto da página (black-friday.html), para buscadores e
   IAs lerem sem rodar JS. Este script só faz duas coisas:

   • Encerramento: fora da janela (de 02/11/2026 00:00 a 30/11/2026 23:59,
     horário de Brasília, a mesma do js/faixa-bf.js), a página mostra "A Black
     Friday da Aura terminou, volte na próxima" no lugar da oferta, no mesmo
     endereço. Roda no <head>, sem defer: põe a classe "bf-encerrada" no <html>
     antes de o corpo aparecer (o CSS da página esconde a oferta com ela, sem
     piscar) e, no DOMContentLoaded, troca o <main> da oferta pelo aviso.
     Como o HTML é estático, o HTML bruto é trocado por um commit em 01/12
     (descrito no PR desta página); isto cobre o navegador até lá.
   • Copiar: dentro da janela, mostra o botão "Copiar" ao lado do código (sem
     JS ele fica escondido e o código continua legível).

   Mesmo padrão do js/faixa-bf.js: no navegador vira window.AuraBlackFriday e já
   roda; no Node (teste) exporta as funções puras.
   ========================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.AuraBlackFriday = api; api.init(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var INICIO = "2026-11-02"; // primeiro dia (inclusive), horário de Brasília
  var FIM = "2026-11-30";    // último dia (inclusive), até 23:59
  var TZ = "America/Sao_Paulo";
  var CODIGO = "BLACK50";
  var CLASSE = "bf-encerrada";

  var TEXTO_FIM = "A Black Friday da Aura terminou, volte na próxima";
  var TEXTO_COPIADO = "Copiado";
  // Mesma marcação que o commit de 01/12 grava no HTML bruto.
  var HTML_FIM =
    '<section class="bf-hero bf-fim" data-bf-fim><div class="bf-in">' +
      '<h1 class="bf-h1">' + TEXTO_FIM + "</h1>" +
    "</div></section>";

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

  function quandoPronto(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Troca o <main> da oferta pelo aviso de encerramento.
  function encerrar() {
    var oferta = document.querySelector("main[data-bf-oferta]");
    if (!oferta || !oferta.parentNode) return;
    var main = document.createElement("main");
    main.className = "bf";
    main.id = "conteudo";
    main.innerHTML = HTML_FIM;
    oferta.parentNode.insertBefore(main, oferta);
    oferta.parentNode.removeChild(oferta);
  }

  function copiar(botao, codigo) {
    function ok() {
      botao.textContent = TEXTO_COPIADO;
      setTimeout(function () { botao.textContent = "Copiar"; }, 1800);
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(codigo).then(ok, function () {});
      }
    } catch (e) {}
  }

  function ligarCopiar() {
    var botao = document.querySelector("[data-bf-copiar]");
    if (!botao) return;
    if (!(typeof navigator !== "undefined" && navigator.clipboard)) return; // sem Clipboard API: o código segue legível
    botao.hidden = false;
    botao.addEventListener("click", function () { copiar(botao, CODIGO); });
  }

  function init() {
    try {
      if (!dentroDaJanela(Date.now())) {
        document.documentElement.classList.add(CLASSE);
        document.title = TEXTO_FIM;
        quandoPronto(encerrar);
        return;
      }
      quandoPronto(ligarCopiar);
    } catch (e) {}
  }

  return {
    init: init,
    // funções puras e constantes (teste)
    dataSP: dataSP, dentroDaJanela: dentroDaJanela,
    INICIO: INICIO, FIM: FIM, CODIGO: CODIGO, CLASSE: CLASSE,
    TEXTO_FIM: TEXTO_FIM, HTML_FIM: HTML_FIM,
  };
});
