/* =========================================================
   AURA — Origem do cadastro (primeiro toque), t2-09.

   Guarda no localStorage ("aura_origem", validade de 30 dias) de onde a
   pessoa veio na PRIMEIRA página do site. js/comecar.js manda esse objeto
   em `origem` no POST /auth/register.

   O que é guardado (sem dado pessoal; chaves ausentes não entram):
     utm_source, utm_medium, utm_campaign, utm_content, utm_term  (≤ 100)
     landing_page   só o caminho da página (sem query nem #), ≤ 300
     referrer       só o host do document.referrer (ex.: "www.google.com"), ≤ 200
     first_seen_at  ISO da primeira página

   Regras:
   • Página com UTM ou referrer de fora do site grava o toque completo.
   • Visita direta (sem UTM nem referrer de fora; b-mk-33 B, 17/11) grava só
     { landing_page, first_seen_at }.
   • Não sobrescreve um primeiro toque ainda válido (menos de 30 dias), com
     uma exceção: uma visita com UTM ou referrer de fora substitui uma visita
     direta. Nunca o contrário.
   • Sem localStorage (navegação privada, bloqueado), segue em memória na
     página atual e nunca quebra a página.
   • Não mexe em ?ref= (indicação) nem em ?ramo=: não lê nem grava nenhum dos dois.

   Links para o app (b-mk-33 A1, 17/11): o localStorage do www não é visível
   em app.getaura.com.br. Por isso os links para o app ("Entrar" e qualquer
   outro) levam o primeiro toque guardado na query: utm_* com o mesmo nome,
   origem_site (host do referrer), origem_pagina (caminho da página de
   entrada) e origem_data (first_seen_at). Sem primeiro toque, o link fica
   como está. Parâmetro que o link já tem não é trocado. O href é ajustado
   ao carregar e de novo no clique (links montados depois por JS).
   O app (aura-app, utils/origemDoCadastro.ts) lê esses nomes.

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
  var APP_HOST = "app.getaura.com.br";
  // chave do primeiro toque -> nome do parâmetro no link para o app
  var LINK_PARAMS = { referrer: "origem_site", landing_page: "origem_pagina", first_seen_at: "origem_data" };

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

  // O toque diz de onde veio (UTM ou site de origem)? Visita direta não diz.
  function hasSignal(o) {
    if (!o || typeof o !== "object") return false;
    if (o.referrer) return true;
    for (var i = 0; i < UTM_KEYS.length; i++) if (o[UTM_KEYS[i]]) return true;
    return false;
  }

  // Decide se esta página vira o primeiro toque. Devolve o objeto novo ou null.
  function decide(existing, utm, refHost, pathname, now) {
    var temSinal = (utm && Object.keys(utm).length > 0) || !!refHost;
    if (isValid(existing, now)) {
      // primeiro toque válido fica, menos a visita direta, que dá lugar a uma
      // visita com UTM ou referrer de fora
      if (hasSignal(existing) || !temSinal) return null;
    }
    return build(utm, refHost, pathname, now);
  }

  // Parâmetros do primeiro toque para o link do app (só as chaves do contrato).
  function linkParams(o) {
    var s = sanitize(o);
    var out = [];
    if (!s) return out;
    UTM_KEYS.forEach(function (k) { if (s[k]) out.push([k, s[k]]); });
    ["referrer", "landing_page", "first_seen_at"].forEach(function (k) {
      if (s[k]) out.push([LINK_PARAMS[k], s[k]]);
    });
    return out;
  }

  // href de um link para app.getaura.com.br com o primeiro toque na query.
  // Outro destino, href inválido ou sem primeiro toque: devolve o href igual.
  // Não troca parâmetro que o link já tem nem mexe no #.
  function decorateHref(href, o, base) {
    if (!href || !o) return href;
    var u;
    try { u = new URL(href, base || undefined); } catch (e) { return href; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return href;
    if (u.hostname.toLowerCase() !== APP_HOST) return href;
    var pares = linkParams(o);
    var mudou = false;
    pares.forEach(function (p) {
      if (!u.searchParams.has(p[0])) { u.searchParams.set(p[0], p[1]); mudou = true; }
    });
    return mudou ? u.toString() : href;
  }

  function decorateAnchor(a, o) {
    try {
      var href = a && a.getAttribute && a.getAttribute("href");
      if (!href) return;
      var novo = decorateHref(href, o, window.location.href);
      if (novo !== href) a.setAttribute("href", novo);
    } catch (e) {}
  }

  function decorateLinks() {
    try {
      var o = get();
      if (!o || !document.querySelectorAll) return;
      var links = document.querySelectorAll('a[href*="' + APP_HOST + '"]');
      for (var i = 0; i < links.length; i++) decorateAnchor(links[i], o);
    } catch (e) {}
  }

  // No clique (inclusive o do meio), antes de o navegador seguir o link.
  function onLinkClick(ev) {
    try {
      var el = ev && ev.target;
      while (el && el.nodeType === 1 && String(el.tagName).toUpperCase() !== "A") el = el.parentNode;
      if (!el || el.nodeType !== 1) return;
      var o = get();
      if (o) decorateAnchor(el, o);
    } catch (e) {}
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
    try {
      decorateLinks();
      if (document.addEventListener) {
        document.addEventListener("click", onLinkClick, true);
        document.addEventListener("auxclick", onLinkClick, true);
        // script com defer roda antes do DOMContentLoaded; links que outro
        // script monte até lá entram aqui
        document.addEventListener("DOMContentLoaded", decorateLinks);
      }
    } catch (e) {}
  }

  return {
    get: get, init: init,
    // funções puras (teste)
    parseUtm: parseUtm, externalReferrerHost: externalReferrerHost, landingPath: landingPath,
    sanitize: sanitize, isValid: isValid, build: build, decide: decide,
    hasSignal: hasSignal, linkParams: linkParams, decorateHref: decorateHref,
    KEY: KEY, TTL_MS: TTL_MS, LINK_PARAMS: LINK_PARAMS,
  };
});
