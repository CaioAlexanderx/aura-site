/*
 * Quiz "Quem conhece os noivos?" — página do casamento (Caio e Lorena).
 * Perguntas aqui (públicas); o gabarito fica só no servidor (src/quiz.js + D1).
 * Ao editar este arquivo, aumente o ?v= no <script> da página: /assets/* fica em cache.
 */
(function () {
  'use strict';

  var CAIO = [
    ['c1', 'Qual era o visual do Caio na adolescência?', ['Emo de franja', 'Metaleiro cabeludo', 'Skatista', 'Igual hoje, só que com menos boleto']],
    ['c2', 'Se o Caio fosse um vilão de filme, qual seria seu plano maligno?', ['Exterminar todos os pernilongos', 'Criar um satélite com alto-falante para tocar metal 24h por dia, audível em todo o planeta', 'Destruir o mundo porque alguém disse que Opeth é uma banda ruim', 'Proibir o consumo de vegetais']],
    ['c3', 'Qual a primeira coisa que o Caio faz quando acorda?', ['Pega o celular', 'Reclama que acordou', 'Toma café', 'Fica 15 minutos encarando o teto como um fantasma vitoriano']],
    ['c4', 'Qual série o Caio já assistiu mais de uma vez?', ['The Office', 'Breaking Bad', 'Game of Thrones', 'Supernatural (todas as temporadas, sem vergonha nenhuma)']],
    ['c5', 'Qual a comida preferida do Caio?', ['Lasanha', 'Churrasco', 'Sushi', 'Salada']],
    ['c6', 'Pra qual time o Caio torce?', ['Remo', 'Corinthians', 'Cruzeiro', 'São Paulo']],
    ['c7', 'Qual cor você NÃO encontra no guarda-roupa do Caio?', ['Amarelo', 'Rosa', 'Azul', 'Caqui']],
    ['c8', 'O que o Caio sempre perde dentro de casa?', ['A chave', 'Chinelo', 'Carteira', 'Todos os anteriores']],
    ['c9', 'Se o Caio ganhasse R$ 10 milhões amanhã, qual seria sua primeira decisão questionável?', ['Comprar uma Ferrari', 'Doar para as irmãs dele', 'Comprar um champanhe', 'Começar uma coleção de baixos']],
    ['c10', 'Daqui a 50 anos, pelo que o Caio provavelmente ainda estará discutindo com a Lorena?', ["Se Guns N' Roses é uma banda mediana", 'Quem vai lavar a louça', 'Quem vai dirigir', 'Se o vestido é dourado e branco ou preto e azul']]
  ];
  var LORENA = [
    ['l1', 'Qual a comida que a Lorena seria capaz de comer todo dia?', ['Lasanha', 'Pizza', 'Camarão', 'Arroz e feijão']],
    ['l2', 'Qual seria a pior punição possível para a Lorena?', ['Receber um áudio de 8 minutos no WhatsApp', 'O Caio atrasar para a cerimônia', 'Esquecer de provar os doces do casamento', 'Ter que usar roupa amarela por um mês']],
    ['l3', 'Qual o maior medo da Lorena?', ['Barata', 'Altura', 'Palhaço', 'Acabar o café']],
    ['l4', 'Qual estilo de música a Lorena NÃO aguenta ouvir?', ['Sertanejo', 'Funk', 'Pagode', 'Todas as opções']],
    ['l5', 'Qual a cor preferida da Lorena?', ['Preto', 'Roxo', 'Vinho', 'Laranja']],
    ['l6', 'Qual seria a profissão da Lorena numa vida passada vitoriana?', ['Bruxa que vende poções', 'Mercadora viajante', 'Costureira da realeza', 'Médium que conversa com os mortos']],
    ['l7', 'Qual a faixa da Lorena no karatê?', ['Branca', 'Marrom', 'Preta', 'Faixa de pedestre']],
    ['l8', 'Qual o gênero literário preferido da Lorena?', ['Romance', 'Suspense', 'Terror', 'Não ficção']],
    ['l9', 'Qual frase a Lorena mais repete?', ['"Tô com fome"', '"Tô com frio"', '"Não"', '"Sim, senhor"']],
    ['l10', 'Se a Lorena pudesse banir uma coisa do mundo para sempre, o que provavelmente escolheria?', ['Pessoas que dizem "é rapidinho" e levam duas horas', 'Vizinho com furadeira domingo às 8h da manhã', 'Comida japonesa', 'Café descafeinado']]
  ];
  // Misturadas: Caio, Lorena, Caio, Lorena...
  var PERGUNTAS = [];
  for (var i = 0; i < CAIO.length; i++) {
    PERGUNTAS.push({ id: CAIO[i][0], sobre: 'Caio', texto: CAIO[i][1], opcoes: CAIO[i][2] });
    PERGUNTAS.push({ id: LORENA[i][0], sobre: 'Lorena', texto: LORENA[i][1], opcoes: LORENA[i][2] });
  }
  var LETRAS = ['A', 'B', 'C', 'D'];
  var IMG = '/assets/casamento/';
  // legendas de "olhar julgador" que aparecem embaixo do rosto em cada pergunta
  var OLHAR = {
    Caio: ['O Caio tá lendo sua resposta.', 'O Caio não pisca desde 2013.', 'Pensa bem. Ele vai lembrar disso.', 'Erra essa e o Caio te manda uma planilha.', 'O Caio já sabe o que você vai marcar.'],
    Lorena: ['A Lorena tá te encarando.', 'Ela lembra de quem erra.', 'Cuidado: ela é faixa preta.', 'A Lorena só aceita uma resposta.', 'Ela tá sorrindo por dentro. Talvez.']
  };
  var KEY_PROG = 'quiz-noivos:progresso';
  var KEY_FEITO = 'quiz-noivos:feito';
  var API = '/api/quiz';

  var ensaio = (new URLSearchParams(location.search).get('ensaio') || '').trim();
  var info = null;          // GET /api/quiz
  var estado = { nome: '', idx: 0, respostas: {}, inicio: 0 };

  function $(id) { return document.getElementById(id); }
  function ls(get, k, v) {
    try {
      if (get) { var x = localStorage.getItem(k); return x ? JSON.parse(x) : null; }
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hora(iso) {
    try { return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).replace(':00', 'h').replace(':', 'h'); }
    catch (e) { return ''; }
  }
  function feito() { return ensaio ? null : ls(true, KEY_FEITO); }

  /* ---------------- cartão da seção ---------------- */
  function renderCard() {
    var st = $('quiz-status'), btn = $('quiz-jogar'), rk = $('quiz-ver-ranking');
    var f = feito();
    btn.hidden = false; rk.hidden = true;
    if (ensaio) {
      st.textContent = 'Modo ensaio: dá pra jogar a qualquer hora e a nota não entra no ranking.';
      btn.textContent = 'Jogar o ensaio'; btn.disabled = false;
      rk.hidden = !(info && info.ranking && info.ranking.length);
      return;
    }
    if (f) {
      st.innerHTML = 'Você já jogou: <b>' + f.acertos + ' de ' + f.total + '</b>' + (f.posicao ? ' · ' + f.posicao + 'º lugar quando terminou' : '') + '.';
      btn.hidden = true; rk.hidden = false;
      return;
    }
    if (!info) { st.textContent = 'Carregando…'; btn.disabled = true; return; }
    if (info.estado === 'antes') {
      st.textContent = 'Abre às ' + hora(info.abre_em) + ' do dia 31, depois da cerimônia, e fica aberto até as ' + hora(info.fecha_em) + '.';
      btn.textContent = 'Em breve'; btn.disabled = true;
    } else if (info.estado === 'aberto') {
      st.textContent = 'Aberto até as ' + hora(info.fecha_em) + '. ' + (info.jogadores ? info.jogadores + (info.jogadores === 1 ? ' pessoa já jogou.' : ' pessoas já jogaram.') : 'Ninguém jogou ainda: seja o primeiro.');
      btn.textContent = ls(true, KEY_PROG) ? 'Continuar de onde parei' : 'Jogar'; btn.disabled = false;
      rk.hidden = !info.jogadores;
    } else {
      st.textContent = 'O quiz foi encerrado. Veja quem conhece os noivos de verdade.';
      btn.hidden = true; rk.hidden = false;
    }
  }

  function carregar() {
    return fetch(API, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) { info = d; renderCard(); return d; })
      .catch(function () { $('quiz-status').textContent = 'Sem conexão com o quiz agora. Tente de novo em instantes.'; });
  }

  /* ---------------- tela cheia do jogo ---------------- */
  function abrir() {
    $('quiz').hidden = false;
    document.documentElement.classList.add('quiz-aberto');
  }
  function fechar() {
    $('quiz').hidden = true;
    document.documentElement.classList.remove('quiz-aberto');
    renderCard();
  }
  function tela(html) { $('quiz-corpo').innerHTML = html; $('quiz-corpo').scrollTop = 0; }
  function progresso(n) {
    var p = Math.round((n / PERGUNTAS.length) * 100);
    $('quiz-barra').style.width = p + '%';
    $('quiz-contador').textContent = n > 0 ? n + ' de ' + PERGUNTAS.length : '';
  }

  function telaNome() {
    progresso(0);
    tela(
      '<div class="q-intro">' +
        '<figure class="q-casal"><img src="' + IMG + 'quiz-casal.webp" alt="Caio e Lorena em versão animação gótica" width="600" height="576"><figcaption>Eles estão te observando.</figcaption></figure>' +
        '<div class="eyebrow">Jogo I</div>' +
        '<h2 class="title">Quem conhece os noivos?</h2>' +
        '<p class="lead">20 perguntas, alternando entre o Caio e a Lorena. Você joga uma vez só, então capriche. Quem acertar mais leva um prêmio surpresa. Em caso de empate, ganha quem terminou mais rápido.</p>' +
        (ensaio ? '<p class="q-aviso">Modo ensaio: a nota não entra no ranking.</p>' : '') +
        '<form id="q-form" class="q-form" novalidate>' +
          '<label for="q-nome">Seu nome</label>' +
          '<input id="q-nome" name="nome" type="text" maxlength="30" autocomplete="name" autocapitalize="words" enterkeyhint="go" placeholder="Como os noivos te conhecem" value="' + esc(estado.nome) + '">' +
          '<p class="q-erro" id="q-erro" role="alert"></p>' +
          '<button class="btn btn--solid" type="submit">Começar</button>' +
        '</form>' +
      '</div>'
    );
    $('q-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('q-nome').value.replace(/\s+/g, ' ').trim();
      if (n.length < 2) { $('q-erro').textContent = 'Escreva seu nome (pelo menos 2 letras).'; return; }
      estado = { nome: n, idx: 0, respostas: {}, inicio: Date.now() };
      salvar(); telaPergunta();
    });
  }

  function salvar() { if (!ensaio) ls(false, KEY_PROG, estado); }

  function telaPergunta() {
    var q = PERGUNTAS[estado.idx];
    progresso(estado.idx);
    var ops = q.opcoes.map(function (o, k) {
      return '<button class="q-op" type="button" data-l="' + LETRAS[k] + '"><span class="q-letra">' + LETRAS[k] + '</span><span>' + esc(o) + '</span></button>';
    }).join('');
    tela(
      '<div class="q-pergunta">' +
        '<div class="q-quem q-quem--' + q.sobre.toLowerCase() + '">' +
          '<img class="q-avatar" src="' + IMG + 'quiz-' + q.sobre.toLowerCase() + '.webp" alt="" width="240" height="240">' +
          '<div><div class="q-sobre">Sobre ' + (q.sobre === 'Caio' ? 'o Caio' : 'a Lorena') + '</div>' +
          '<div class="q-olhar">' + esc(OLHAR[q.sobre][Math.floor(estado.idx / 2) % OLHAR[q.sobre].length]) + '</div></div>' +
        '</div>' +
        '<h3>' + esc(q.texto) + '</h3>' +
        '<div class="q-ops">' + ops + '</div>' +
      '</div>'
    );
    Array.prototype.forEach.call(document.querySelectorAll('.q-op'), function (b) {
      b.addEventListener('click', function () {
        if (b.parentNode.classList.contains('is-travado')) return;
        b.parentNode.classList.add('is-travado');
        b.classList.add('is-escolhida');
        estado.respostas[q.id] = b.getAttribute('data-l');
        estado.idx++;
        salvar();
        setTimeout(function () { estado.idx < PERGUNTAS.length ? telaPergunta() : enviar(); }, 380);
      });
    });
  }

  function enviar() {
    progresso(PERGUNTAS.length);
    tela('<div class="q-intro"><figure class="q-casal q-casal--pulso"><img src="' + IMG + 'quiz-casal.webp" alt="" width="600" height="576"></figure><div class="eyebrow">Conferindo</div><h2 class="title">Consultando os espíritos…</h2><p class="lead">Os noivos estão corrigindo pessoalmente.</p></div>');
    var corpo = { nome: estado.nome, respostas: estado.respostas, tempo_ms: Date.now() - estado.inicio };
    if (ensaio) corpo.ensaio = ensaio;
    fetch(API + '/jogar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
      .then(function (res) {
        var d = res.d;
        if (!d.ok) {
          if (res.status === 409) { estado.idx = 0; telaNomeRepetido(d.erro); return; }
          telaErro(d.erro || 'Não consegui salvar. Tente de novo.');
          return;
        }
        if (!ensaio) {
          ls(false, KEY_PROG, null);
          ls(false, KEY_FEITO, { nome: estado.nome, acertos: d.acertos, total: d.total, posicao: d.posicao });
        }
        telaResultado(d);
        carregar();
      })
      .catch(function () { telaErro('Sem conexão agora. Suas respostas estão guardadas neste celular: toque em tentar de novo.'); });
  }

  function telaNomeRepetido(msg) {
    // mesmo jogo, só troca o nome — as respostas continuam guardadas
    tela(
      '<div class="q-intro"><div class="eyebrow">Quase lá</div><h2 class="title">Esse nome já jogou</h2>' +
      '<p class="lead">' + esc(msg) + '</p>' +
      '<form id="q-form2" class="q-form" novalidate><label for="q-nome2">Seu nome</label>' +
      '<input id="q-nome2" type="text" maxlength="30" autocapitalize="words" value="' + esc(estado.nome) + '">' +
      '<p class="q-erro" id="q-erro2" role="alert"></p><button class="btn btn--solid" type="submit">Enviar respostas</button></form></div>'
    );
    $('q-form2').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('q-nome2').value.replace(/\s+/g, ' ').trim();
      if (n.length < 2) { $('q-erro2').textContent = 'Escreva seu nome (pelo menos 2 letras).'; return; }
      estado.nome = n; estado.idx = PERGUNTAS.length; salvar(); enviar();
    });
  }

  function telaErro(msg) {
    tela('<div class="q-intro"><div class="eyebrow">Ops</div><h2 class="title">Algo deu errado</h2><p class="lead">' + esc(msg) + '</p>' +
      '<button class="btn btn--solid" type="button" id="q-retry">Tentar de novo</button></div>');
    $('q-retry').addEventListener('click', enviar);
  }

  function frase(a, t) {
    var p = a / t;
    if (p === 1) return 'Gabaritou. Você é da família ou é stalker profissional?';
    if (p >= 0.8) return 'Conhece os noivos melhor que a própria sogra.';
    if (p >= 0.6) return 'Nada mal. Mas tem coisa aí que só a convivência ensina.';
    if (p >= 0.4) return 'Metade certa, metade chute. Igual previsão do tempo.';
    if (p >= 0.2) return 'Você veio pelo buffet, né? Tudo bem, a gente entende.';
    return 'Você tem certeza que veio no casamento certo?';
  }

  function telaResultado(d) {
    progresso(PERGUNTAS.length);
    tela(
      '<div class="q-intro">' +
        '<figure class="q-casal ' + (d.acertos / d.total < 0.5 ? 'q-casal--zoom' : 'q-casal--festa') + '"><img src="' + IMG + 'quiz-casal.webp" alt="Os noivos reagindo ao seu resultado" width="600" height="576"><figcaption>' + esc(frase(d.acertos, d.total)) + '</figcaption></figure>' +
        '<div class="eyebrow">' + (d.ensaio ? 'Resultado do ensaio' : 'Seu resultado') + '</div>' +
        '<div class="q-nota"><b>' + d.acertos + '</b><span>de ' + d.total + '</span></div>' +
        '<p class="lead">' + (d.ensaio ? 'Com essa nota, você estaria em ' : 'Você está em ') + '<b>' + d.posicao + 'º lugar</b>' + (d.ensaio ? '.' : ' por enquanto. O vencedor é anunciado depois das ' + hora(info && info.fecha_em) + '.') + '</p>' +
        '<div class="q-ranking" id="q-ranking-res"></div>' +
        '<button class="btn" type="button" id="q-fim">Voltar para o site</button>' +
      '</div>'
    );
    renderRanking($('q-ranking-res'), d.ranking || (info && info.ranking) || [], d.ensaio ? '' : estado.nome);
    $('q-fim').addEventListener('click', fechar);
  }

  function renderRanking(el, lista, meu) {
    if (!lista.length) { el.innerHTML = '<p class="q-vazio">Ninguém no ranking ainda.</p>'; return; }
    var chave = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
    el.innerHTML = '<ol>' + lista.map(function (j, k) {
      var euSou = meu && chave(j.nome) === chave(meu);
      return '<li class="' + (euSou ? 'is-eu' : '') + (k < 3 ? ' is-podio' : '') + '"><span class="q-pos">' + (k + 1) + '</span><span class="q-nome">' + esc(j.nome) + '</span><span class="q-pts">' + j.acertos + '/20</span></li>';
    }).join('') + '</ol>';
  }

  function telaRanking() {
    abrir(); progresso(0);
    tela('<div class="q-intro"><div class="eyebrow">' + (info && info.estado === 'encerrado' ? 'Resultado final' : 'Ao vivo') + '</div><h2 class="title">Ranking</h2>' +
      '<div class="q-ranking" id="q-ranking-tela"><p class="q-vazio">Carregando…</p></div>' +
      '<button class="btn" type="button" id="q-fim">Voltar para o site</button></div>');
    $('q-fim').addEventListener('click', fechar);
    carregar().then(function () {
      var f = feito();
      renderRanking($('q-ranking-tela'), (info && info.ranking) || [], f && f.nome);
    });
  }

  function iniciar() {
    abrir();
    var p = ensaio ? null : ls(true, KEY_PROG);
    if (p && p.nome && p.idx > 0 && p.idx < PERGUNTAS.length) { estado = p; telaPergunta(); }
    else if (p && p.nome && p.idx >= PERGUNTAS.length) { estado = p; enviar(); }
    else telaNome();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('quiz-jogar')) return;
    $('quiz-jogar').addEventListener('click', iniciar);
    $('quiz-ver-ranking').addEventListener('click', telaRanking);
    $('quiz-fechar').addEventListener('click', function () {
      var noMeio = $('quiz-corpo').querySelector('.q-pergunta');
      if (noMeio && !window.confirm('Sair agora? Suas respostas ficam guardadas e você continua de onde parou.')) return;
      fechar();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('quiz').hidden) $('quiz-fechar').click(); });
    renderCard();
    carregar();
  });
})();
