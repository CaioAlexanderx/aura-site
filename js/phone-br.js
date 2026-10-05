/* =========================================================
   AURA — Celular brasileiro: fonte ÚNICA da regra.
   Usado no navegador (window.AuraPhone, via <script>) e no
   Worker (src/worker.js importa este arquivo). Mudou a regra?
   Muda só aqui.

   Regra: tira tudo que não é dígito e um "55" inicial opcional;
   sobram 11 dígitos = DDD real do Brasil + 9 + 8 dígitos.
   (Bots mandavam 11 dígitos com DDD 81–89 sem o 9 de celular.)
   ========================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AuraPhone = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // DDDs em uso no Brasil (Anatel):
  // 11-19 · 21 22 24 27 28 · 31-35 37 38 · 41-49 · 51 53 54 55 ·
  // 61-69 · 71 73 74 75 77 79 · 81-89 · 91-99
  var MOBILE_RE = /^(?:1[1-9]|2[12478]|3[1-578]|4[1-9]|5[1345]|6[1-9]|7[13-579]|8[1-9]|9[1-9])9\d{8}$/;

  var ERROR_MSG = "Confere o número: precisa ser um celular com DDD, tipo (11) 99999-9999.";

  function normalize(value) {
    var d = String(value == null ? "" : value).replace(/\D/g, "");
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    return d;
  }

  function isValid(value) {
    return MOBILE_RE.test(normalize(value));
  }

  // Máscara progressiva: (11) 99999-9999
  function format(value) {
    var d = normalize(value).slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return "(" + d;
    if (d.length <= 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  return { MOBILE_RE: MOBILE_RE, ERROR_MSG: ERROR_MSG, normalize: normalize, isValid: isValid, format: format };
});
