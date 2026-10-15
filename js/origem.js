/* =========================================================
   AURA — Origem do cadastro (primeiro toque), t2-09.

   Guarda no localStorage ("aura_origem", validade de 30 dias) de onde a
   pessoa veio na PRIMEIRA página do site com UTM ou com referrer externo.
   js/comecar.js manda esse objeto em `origem` no POST /auth/register.

   O que é guardado (sem dado pessoal; chaves ausentes não entram):
     utm_source, utm_medium, utm_campaign, utm_content, utm_term  (≤ 100)
     landing_page   só o caminho da página (sem query nem #), ≤ 300
     referrer       só o host do document.referrer (ex.: "www.google.com"), ≤ 200
     first_seen_at  ISO da primeira página

   Regras:
   • Só grava se a página tem UTM ou referrer de fora do site.
   • Não sobrescreve um primeiro toque ainda válido (menos de 30 dias).
   • Sem localStorage (navegação privada, bloqueado), segue em memória na
     página atual e nunca quebra a página.
   • Não mexe em ?ref= (indicação) nem em ?ramo=: não lê nem grava nenhum dos dois.

   Mesmo padrão do js/phone-br.js: no navegador vira window.AuraOrigem e já
   captura; no Node (teste) exporta as funções puras.
   ========================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.AuraOrigem = api; api.init(); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "aura_origem";
  var TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var MAX_UTM = 100, MAX_PATH = 300, MAX_HOST = 200;
  var OWN_DOMAIN = "getaura.com.br";

  var memo = null; // fallback quando o localStorage não está disponível

  // texto curto e seguro: sem caracteres de controle, espaços colapsados, cortado
  function clean(v, max) {
    return String(v == null ? "" : v)
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  // ?utm_source=...&utm_medium=... -> { utm_source: "...", ... } (só os não vazios)
  function parseUtm(search) {
    var out = {};
    var params;
    try { params = new URLSearchParams(search || ""); } catch (e) { return out; }
    UTM_KEYS.forEach(function (k) {
      var v = clean(params.get(k), MAX_UTM);
      if (v) out[k] = v;
    });
    return out;
  }

  // Host do referrer se ele vem de FORA do site; "" se é do próprio site,
  // se está vazio ou se não é http(s).
  function externalReferrerHost(referrer, ownHost) {
    if (!referrer) return "";
    var u;
    try { u = new URL(referrer); } catch (e) { return ""; }
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    var host = u.hostname.toLowerCase();
    if (!host) return "";
    var own = String(ownHost || "").toLowerCase();
    if (host === own || host === OWN_DOMAIN || host.slice(-(OWN_DOMAIN.length + 1)) === "." + OWN_DOMAIN) return "";
    return host.slice(0, MAX_HOST);
  }

  // Só o caminho: sem query, sem #, sem host.
  function landingPath(pathname) {
    var p = clean(pathname, MAX_PATH);
    return p || "/";
  }

  // Regrava o objeto só com as chaves e tamanhos do contrato (vale também para
  // o que veio do localStorage, que o usuário pode ter mexido).
  function sanitize(o) {
    if (!o || typeof o !== "object") return null;
    var out = {};
    UTM_KEYS.forEach(function (k) {
      var v = clean(o[k], MAX_UTM);
      if (v) out[k] = v;
    });
    var lp = clean(o.landing_page, MAX_PATH);
    if (lp) out.landing_page = lp;
    var rf = clean(o.referrer, MAX_HOST);
    if (rf) out.referrer = rf;
    var fs = clean(o.first_seen_at, 40);
    if (fs) out.first_seen_at = fs;
    return out;
  }

  // Primeiro toque ainda dentro dos 30 dias?
  function isValid(o, now) {
    if (!o || typeof o !== "object" || typeof o.first_seen_at !== "string") return false;
    var t = Date.parse(o.first_seen_at);
    if (!isFinite(t)) return false;
    if (t > now + 24 * 60 * 60 * 1000) return false; // data no futuro: relógio errado ou adulterado
    return now - t < TTL_MS;
  }

  function build(utm, refHost, pathname, now) {
    var o = {};
    UTM_KEYS.forEach(function (k) { if (utm && utm[k]) o[k] = utm[k]; });
    o.landing_page = landingPath(pathname);
    if (refHost) o.referrer = refHost;
    o.first_seen_at = new Date(now).toISOString();
    return o;
  }

  // Decide se esta página vira o primeiro toque. Devolve o objeto novo ou null.
  function decide(existing, utm, refHost, pathname, now) {
    var temSinal = (utm && Object.keys(utm).length > 0) || !!refHost;
    if (!temSinal) return null;
    if (isValid(existing, now)) return null; // não sobrescreve primeiro toque válido
    return build(utm, refHost, pathname, now);
  }

  function read() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) {}
    if (raw) {
      try { return sanitize(JSON.parse(raw)); } catch (e) {}
    }
    return memo;
  }

  function write(o) {
    memo = o;
    try { window.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  // Primeiro toque válido, pronto para ir em `origem` no register; ou null.
  function get() {
    var o = read();
    return o && isValid(o, Date.now()) ? o : null;
  }

  function init() {
    try {
      var o = decide(read(), parseUtm(window.location.search),
        externalReferrerHost(document.referrer, window.location.hostname),
        window.location.pathname, Date.now());
      if (o) write(o);
    } catch (e) {}
  }

  return {
    get: get, init: init,
    // funções puras (teste)
    parseUtm: parseUtm, externalReferrerHost: externalReferrerHost, landingPath: landingPath,
    sanitize: sanitize, isValid: isValid, build: build, decide: decide,
    KEY: KEY, TTL_MS: TTL_MS,
  };
});
