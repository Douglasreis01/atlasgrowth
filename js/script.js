(function () {
  "use strict";

  /* =========================================================
     CONFIGURAÇÃO — ajuste antes de publicar
  ========================================================= */
  var WHATSAPP_NUMERO = "5511999999999"; // TODO: seu número, formato 55DDDNÚMERO
  var WHATSAPP_MENSAGEM_BASE = "Olá, meu nome é {NOME}. Acabei de fazer o Diagnóstico Nota GPS e tirei {NOTA} ({FAIXA}). Quero entender como melhorar isso.";

  // TODO (opcional, recomendado): para não perder o lead se ele preencher o
  // contato mas abandonar antes do fim do quiz, envie leadNome/leadWhats para
  // um endpoint próprio (ex: Google Sheets via Apps Script, ou Formspree)
  // dentro da função salvarLeadCapturado() logo abaixo.
  function salvarLeadCapturado(nome, whatsapp) {
    // Exemplo de integração futura:
    // fetch("https://SEU_ENDPOINT_AQUI", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ nome: nome, whatsapp: whatsapp, origem: "diagnostico-gps" })
    // });
  }

  function linkAgendamento(nota, faixa, nome) {
    var msg = WHATSAPP_MENSAGEM_BASE
      .replace("{NOME}", nome || "")
      .replace("{NOTA}", nota)
      .replace("{FAIXA}", faixa);
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
  }

  /* =========================================================
     PERGUNTAS E LÓGICA DE PONTUAÇÃO
  ========================================================= */
  var perguntas = [
    { pilar: "G", label: "Gerar demanda", texto: "Quantos pacientes novos particulares sua clínica recebe por mês, em média?",
      opcoes: ["Menos de 5", "Entre 5 e 15", "Entre 15 e 30", "Mais de 30, e crescendo mês a mês"] },
    { pilar: "G", label: "Gerar demanda", texto: "De onde vêm a maioria dos seus pacientes novos hoje?",
      opcoes: ["Só indicação boca a boca", "Indicação + convênio", "Alguma ação pontual de divulgação", "Sistema estruturado e recorrente de aquisição"] },
    { pilar: "G", label: "Gerar demanda", texto: "Quando alguém pesquisa \"dentista perto de mim\" no Google, sua clínica aparece bem posicionada e com boas avaliações?",
      opcoes: ["Não sei / não apareço", "Apareço, mas com poucas avaliações", "Apareço bem posicionado", "Apareço no topo, com muitas avaliações positivas"] },
    { pilar: "G", label: "Gerar demanda", texto: "Quando a agenda fica vazia em algum dia, o que a clínica faz?",
      opcoes: ["Nada, só espera", "Pede indicação pra pacientes atuais", "Faz alguma ação pontual pra preencher", "Tem processo definido de reativação e captação rápida"] },

    { pilar: "P", label: "Processo comercial", texto: "Quando alguém entra em contato perguntando sobre um procedimento, como isso é atendido?",
      opcoes: ["Depende de quem atende, sem padrão", "Existe um roteiro básico, informal", "Existe script definido e a equipe é treinada nele", "Processo estruturado, com CRM e acompanhamento"] },
    { pilar: "P", label: "Processo comercial", texto: "Você sabe qual a sua taxa de conversão de \"contato\" para \"paciente agendado\"?",
      opcoes: ["Não sei / não meço isso", "Sei, e está abaixo de 30%", "Sei, e está entre 30% e 50%", "Sei, e está acima de 50%"] },
    { pilar: "P", label: "Processo comercial", texto: "Quando alguém pergunta o preço e não fecha na hora, o que acontece depois?",
      opcoes: ["Nada, a gente espera ele voltar", "Às vezes alguém liga, sem processo definido", "Fazemos follow-up, mas manual e inconsistente", "Existe processo estruturado e recorrente de follow-up"] },
    { pilar: "P", label: "Processo comercial", texto: "Sua equipe sabe responder objeções comuns (preço, convênio, urgência) sem parecer despreparada?",
      opcoes: ["Não, cada um responde do seu jeito", "Mais ou menos, aprenderam na prática", "Sim, existe um roteiro de objeções", "Sim, e isso é treinado e revisado periodicamente"] },

    { pilar: "S", label: "Sustentar / retenção", texto: "Você sabe quantos pacientes retornam para uma segunda consulta ou tratamento?",
      opcoes: ["Não sei", "Tenho uma ideia, mas não acompanho de perto", "Sim, acompanho esse número informalmente", "Sim, tenho indicador claro e acompanho mês a mês"] },
    { pilar: "S", label: "Sustentar / retenção", texto: "Como está a quantidade de avaliações (reviews) da sua clínica no Google?",
      opcoes: ["Poucas avaliações, ou não pedimos isso", "Algumas, mas sem processo pra pedir", "Pedimos ocasionalmente aos pacientes", "Temos processo ativo e constante de captação de avaliações"] },
    { pilar: "S", label: "Sustentar / retenção", texto: "Pacientes que sumiram ou cancelaram, a clínica tenta reativar?",
      opcoes: ["Não, perdemos contato", "Às vezes, sem critério", "Sim, de forma manual quando alguém lembra", "Sim, existe processo de reativação recorrente"] },
    { pilar: "S", label: "Sustentar / retenção", texto: "Você acompanha algum indicador de faturamento e crescimento mês a mês (não só receita bruta)?",
      opcoes: ["Não acompanho nada estruturado", "Só olho o quanto entrou no caixa", "Acompanho alguns números, sem dashboard", "Tenho dashboard/indicadores claros de crescimento"] }
  ];

  var PONTOS_POR_OPCAO = [0, 1, 2, 3];
  var MAX_BRUTO = perguntas.length * 3;

  function obterFaixa(nota) {
    if (nota <= 30) return { nivel: "Crítico", classe: "gps-faixa-critico",
      msg: "Sua clínica está no piloto automático, dependendo de sorte e indicação. Isso significa oscilação constante de agenda e faturamento imprevisível." };
    if (nota <= 55) return { nivel: "Reativo", classe: "gps-faixa-reativo",
      msg: "Sua clínica cresce, mas sem controle real. Você reage aos problemas em vez de preveni-los — e isso custa pacientes que você nem sabe que perdeu." };
    if (nota <= 75) return { nivel: "Estruturada", classe: "gps-faixa-estruturada",
      msg: "Você já tem boas bases, mas ainda existem brechas específicas custando faturamento todo mês. É a fase onde pequenos ajustes trazem grande retorno." };
    return { nivel: "Escalável", classe: "gps-faixa-escalavel",
      msg: "Sua clínica está perto de virar uma máquina previsível de aquisição e retenção. Falta afinar os últimos pontos pra escalar com segurança." };
  }

  function calcularNotaGPS(respostas) {
    var porPilar = { G: 0, P: 0, S: 0 };
    var maxPorPilar = { G: 0, P: 0, S: 0 };
    perguntas.forEach(function (p, i) {
      porPilar[p.pilar] += respostas[i];
      maxPorPilar[p.pilar] += 3;
    });
    var totalBruto = respostas.reduce(function (s, v) { return s + v; }, 0);
    var notaFinal = Math.round((totalBruto / MAX_BRUTO) * 100);
    return {
      notaFinal: notaFinal,
      porPilar: {
        G: Math.round((porPilar.G / maxPorPilar.G) * 100),
        P: Math.round((porPilar.P / maxPorPilar.P) * 100),
        S: Math.round((porPilar.S / maxPorPilar.S) * 100)
      },
      faixa: obterFaixa(notaFinal)
    };
  }

  /* =========================================================
     ESTADO E RENDERIZAÇÃO DO QUIZ
  ========================================================= */
  var respostas = new Array(perguntas.length).fill(null);
  var atual = 0;
  var leadNome = "";
  var leadWhats = "";

  var els = {
    progress: document.getElementById("gpsProgress"),
    progressLabel: document.getElementById("gpsProgressLabel"),
    pillarTag: document.getElementById("gpsPillarTag"),
    questionText: document.getElementById("gpsQuestionText"),
    options: document.getElementById("gpsOptions"),
    backBtn: document.getElementById("gpsBackBtn"),
    nextBtn: document.getElementById("gpsNextBtn"),
    captureScreen: document.getElementById("gpsCaptureScreen"),
    quizScreen: document.getElementById("gpsQuizScreen"),
    resultScreen: document.getElementById("gpsResultScreen")
  };

  /* ---- Tela de captura (nome + WhatsApp) ---- */
  var inputNome = document.getElementById("gpsInputNome");
  var inputWhats = document.getElementById("gpsInputWhats");
  var fieldNome = document.getElementById("gpsFieldNome");
  var fieldWhats = document.getElementById("gpsFieldWhats");

  function validarCaptura() {
    var nomeOk = inputNome.value.trim().length >= 2;
    var digitos = inputWhats.value.replace(/\D/g, "");
    var whatsOk = digitos.length >= 10 && digitos.length <= 13;

    fieldNome.classList.toggle("invalid", !nomeOk && inputNome.dataset.touched === "1");
    fieldWhats.classList.toggle("invalid", !whatsOk && inputWhats.dataset.touched === "1");

    return { nomeOk: nomeOk, whatsOk: whatsOk, digitos: digitos };
  }

  inputNome.addEventListener("input", function () { inputNome.dataset.touched = "1"; validarCaptura(); });
  inputWhats.addEventListener("input", function () { inputWhats.dataset.touched = "1"; validarCaptura(); });

  document.getElementById("gpsStartBtn").addEventListener("click", function () {
    inputNome.dataset.touched = "1";
    inputWhats.dataset.touched = "1";
    var v = validarCaptura();
    if (!v.nomeOk || !v.whatsOk) return;

    leadNome = inputNome.value.trim();
    leadWhats = v.digitos;

    salvarLeadCapturado(leadNome, leadWhats);

    els.captureScreen.style.display = "none";
    els.quizScreen.style.display = "block";
    renderPergunta();
  });

  // monta os segmentos da barra de progresso (1 por pergunta)
  perguntas.forEach(function () {
    var seg = document.createElement("div");
    seg.className = "gps-progress-seg";
    var fill = document.createElement("span");
    seg.appendChild(fill);
    els.progress.appendChild(seg);
  });

  function renderPergunta() {
    var p = perguntas[atual];
    els.progressLabel.textContent = "Pergunta " + (atual + 1) + " de " + perguntas.length;
    els.pillarTag.textContent = p.pilar + " — " + p.label;
    els.questionText.textContent = p.texto;
    els.options.innerHTML = "";

    p.opcoes.forEach(function (texto, idx) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gps-option" + (respostas[atual] === idx ? " selected" : "");
      btn.textContent = texto;
      btn.addEventListener("click", function () {
        respostas[atual] = idx;
        renderPergunta();
      });
      els.options.appendChild(btn);
    });

    els.backBtn.disabled = atual === 0;
    els.nextBtn.disabled = respostas[atual] === null;
    els.nextBtn.textContent = atual === perguntas.length - 1 ? "Ver minha nota →" : "Próxima →";

    // atualiza barra de progresso
    var segs = els.progress.querySelectorAll(".gps-progress-seg > span");
    segs.forEach(function (s, i) {
      s.style.width = (i < atual || (i === atual && respostas[atual] !== null)) ? "100%" : (i === atual ? "50%" : "0%");
    });
  }

  els.backBtn.addEventListener("click", function () {
    if (atual > 0) { atual--; renderPergunta(); }
  });

  els.nextBtn.addEventListener("click", function () {
    if (respostas[atual] === null) return;
    if (atual < perguntas.length - 1) {
      atual++;
      renderPergunta();
    } else {
      mostrarResultado();
    }
  });

  function mostrarResultado() {
    var pontos = respostas.map(function (idx) { return PONTOS_POR_OPCAO[idx]; });
    var resultado = calcularNotaGPS(pontos);

    els.quizScreen.style.display = "none";
    els.resultScreen.style.display = "block";

    document.getElementById("gpsFaixaBadge").textContent = resultado.faixa.nivel;
    document.getElementById("gpsFaixaBadge").className = "gps-faixa-badge " + resultado.faixa.classe;
    var primeiroNome = (leadNome.split(" ")[0]) || "";
    document.getElementById("gpsResultMsg").textContent =
      (primeiroNome ? primeiroNome + ", " : "") + resultado.faixa.msg.charAt(0).toLowerCase() + resultado.faixa.msg.slice(1);

    var breakdown = document.getElementById("gpsBreakdown");
    breakdown.innerHTML = "";
    [["G", "Gerar demanda"], ["P", "Processo comercial"], ["S", "Sustentar"]].forEach(function (pair) {
      var val = resultado.porPilar[pair[0]];
      var item = document.createElement("div");
      item.className = "gps-breakdown-item";
      item.innerHTML =
        '<div class="gps-breakdown-label">' + pair[1] + '</div>' +
        '<div class="gps-breakdown-value">' + val + '</div>' +
        '<div class="gps-bar-track"><div class="gps-bar-fill" style="width:' + val + '%"></div></div>';
      breakdown.appendChild(item);
    });

    document.getElementById("gpsCtaLink").href = linkAgendamento(resultado.notaFinal, resultado.faixa.nivel, leadNome);

    // anima o número e o gauge
    animarNumero(resultado.notaFinal);
    var arc = document.getElementById("gpsGaugeArc");
    var offset = 283 - (283 * resultado.notaFinal / 100);
    requestAnimationFrame(function () {
      arc.style.transition = "stroke-dashoffset 0.8s ease";
      arc.style.strokeDashoffset = offset;
    });
  }

  function animarNumero(alvo) {
    var el = document.getElementById("gpsGaugeNum");
    var atual0 = 0;
    var passos = 30;
    var incremento = alvo / passos;
    var i = 0;
    var interval = setInterval(function () {
      i++;
      atual0 += incremento;
      el.textContent = Math.min(Math.round(atual0), alvo);
      if (i >= passos) { el.textContent = alvo; clearInterval(interval); }
    }, 20);
  }

  document.getElementById("gpsRestartBtn").addEventListener("click", function () {
    respostas = new Array(perguntas.length).fill(null);
    atual = 0;
    els.resultScreen.style.display = "none";
    els.quizScreen.style.display = "block";
    renderPergunta();
  });
})();