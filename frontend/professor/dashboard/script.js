(() => {
  const api = () => window.OminiSaber;
  const teacher = () => window.OminiProfessor;
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  const requestedType = new URLSearchParams(location.search).get("tipo");
  const profiles = {
    matematica: {
      name: "Marcos Nogueira", short: "Matemática", title: "Professor de Matemática", icon: "calculate", navIcon: "function", navLabel: "Laboratório matemático", subtitle: "Diagnósticos, habilidades e desafios matemáticos das suas turmas.", metric: ["12", "habilidades em atenção", "functions"], primary: ["add_chart", "Criar desafio"],
      workspace: `<div class="specialty-header"><div class="specialty-heading"><span class="material-symbols-outlined">calculate</span><div><h2>Radar de aprendizagem matemática</h2><p>Veja onde intervir antes da próxima aula.</p></div></div><button class="button primary" type="button" data-specialty-action>Montar lista adaptativa</button></div><div class="specialty-layout"><div class="specialty-board"><h3>Domínio por habilidade · 2º ano</h3><div class="skill-list"><div class="skill-row"><span>Função quadrática</span><i style="--value:58%"></i><strong>58%</strong></div><div class="skill-row"><span>Geometria espacial</span><i style="--value:72%"></i><strong>72%</strong></div><div class="skill-row"><span>Probabilidade</span><i style="--value:64%"></i><strong>64%</strong></div><div class="skill-row"><span>Estatística</span><i style="--value:81%"></i><strong>81%</strong></div></div></div><aside class="specialty-tools"><h3>Ferramentas da disciplina</h3><div class="specialty-tool-grid"><button type="button"><span class="material-symbols-outlined">function</span>Editor de fórmulas</button><button type="button"><span class="material-symbols-outlined">monitoring</span>Gráficos interativos</button><button type="button"><span class="material-symbols-outlined">quiz</span>Banco de questões</button><button type="button"><span class="material-symbols-outlined">calculate</span>Simulador matemático</button></div></aside></div>`,
      priorities: [["functions","7 alunos abaixo de 50% em funções","2º B · resultado do diagnóstico de sexta","Abrir diagnóstico"],["query_stats","Revisar atividade adaptativa","Geometria espacial · 18 respostas novas","Analisar respostas"],["event","Publicar desafio da semana","Probabilidade aplicada · prazo amanhã","Revisar desafio"]],
      planning: [["function","Desafio matemático","Combine problema, dica e resolução."],["monitoring","Exploração gráfica","Crie uma atividade visual com funções."],["quiz","Diagnóstico rápido","Identifique lacunas antes da aula."]]
    },
    portugues: {
      name: "Helena Costa", short: "Português", title: "Professora de Português", icon: "edit_note", navIcon: "edit_note", navLabel: "Produção textual", subtitle: "Leitura, linguagem e produção textual com devolutivas orientadoras.", metric: ["18", "redações para corrigir", "rate_review"], primary: ["edit_note", "Criar proposta"],
      workspace: `<div class="specialty-header"><div class="specialty-heading"><span class="material-symbols-outlined">edit_note</span><div><h2>Oficina de linguagem e escrita</h2><p>Acompanhe competências de leitura, argumentação e autoria.</p></div></div><a class="button primary" href="../redacoes/index.html">Abrir correções</a></div><div class="specialty-layout"><div class="specialty-board"><h3>Competências em desenvolvimento · 3º C</h3><div class="skill-list"><div class="skill-row"><span>Interpretação</span><i style="--value:78%"></i><strong>78%</strong></div><div class="skill-row"><span>Argumentação</span><i style="--value:66%"></i><strong>66%</strong></div><div class="skill-row"><span>Coesão textual</span><i style="--value:73%"></i><strong>73%</strong></div><div class="skill-row"><span>Repertório</span><i style="--value:61%"></i><strong>61%</strong></div></div></div><aside class="specialty-tools"><h3>Ferramentas da disciplina</h3><div class="specialty-tool-grid"><button type="button"><span class="material-symbols-outlined">edit_note</span>Proposta de redação</button><button type="button"><span class="material-symbols-outlined">menu_book</span>Leitura orientada</button><button type="button"><span class="material-symbols-outlined">spellcheck</span>Oficina de linguagem</button><button type="button"><span class="material-symbols-outlined">forum</span>Debate argumentativo</button></div></aside></div>`,
      priorities: [["edit_note","8 redações do 3º C aguardam correção","Educação midiática · enviadas ontem","Corrigir agora"],["menu_book","6 alunos com leitura pendente","2º B · crônica brasileira","Ver alunos"],["schedule","Publicar oficina de repertório","Prazo amanhã às 18h","Revisar oficina"]],
      planning: [["edit_note","Proposta de redação","Crie tema, textos motivadores e critérios."],["menu_book","Leitura orientada","Combine texto, perguntas e discussão."],["forum","Debate argumentativo","Organize teses e evidências da turma."]]
    },
    tecnico_administracao: {
      name: "Renata Alves", short: "Administração", title: "Professora Técnica em Administração", icon: "business_center", navIcon: "account_tree", navLabel: "Projetos de gestão", subtitle: "Projetos, estudos de caso e competências profissionais em movimento.", metric: ["7", "projetos para revisar", "assignment"], primary: ["add_business", "Novo projeto"],
      workspace: `<div class="specialty-header"><div class="specialty-heading"><span class="material-symbols-outlined">business_center</span><div><h2>Estúdio de projetos de gestão</h2><p>Acompanhe entregas como um fluxo de trabalho profissional.</p></div></div><button class="button primary" type="button" data-specialty-action>Novo estudo de caso</button></div><div class="specialty-layout"><div class="specialty-board"><h3>Pipeline dos projetos · Técnico em Administração</h3><div class="project-pipeline"><div class="pipeline-column"><strong>Descoberta · 4</strong><div class="pipeline-item">Pesquisa de público</div><div class="pipeline-item">Mapa de custos</div></div><div class="pipeline-column"><strong>Em execução · 6</strong><div class="pipeline-item">Plano de marketing</div><div class="pipeline-item">Fluxo de caixa</div></div><div class="pipeline-column"><strong>Para avaliar · 7</strong><div class="pipeline-item">Modelo de negócio</div><div class="pipeline-item">Pitch da solução</div></div></div></div><aside class="specialty-tools"><h3>Ferramentas profissionais</h3><div class="specialty-tool-grid"><button type="button"><span class="material-symbols-outlined">table_chart</span>Plano financeiro</button><button type="button"><span class="material-symbols-outlined">groups</span>Gestão de equipes</button><button type="button"><span class="material-symbols-outlined">campaign</span>Canvas de marketing</button><button type="button"><span class="material-symbols-outlined">storefront</span>Simulador de negócio</button></div></aside></div>`,
      priorities: [["assignment","3 equipes entregaram o plano de negócio","Módulo de Empreendedorismo · ontem","Avaliar projetos"],["payments","Fluxos de caixa com inconsistências","Turma ADM 2 · 5 planilhas sinalizadas","Revisar dados"],["groups","Definir banca de apresentação","Pitch final · sexta às 14h","Organizar banca"]],
      planning: [["assignment","Estudo de caso","Construa uma situação profissional realista."],["account_tree","Projeto em equipe","Defina etapas, papéis e entregáveis."],["storefront","Simulação empresarial","Configure decisões e indicadores."]]
    },
    tecnico_informatica: {
      name: "Caio Martins", short: "Informática", title: "Professor Técnico em Informática", icon: "terminal", navIcon: "code", navLabel: "Laboratórios de código", subtitle: "Laboratórios, projetos de software e evolução técnica das turmas.", metric: ["14", "códigos para avaliar", "code"], primary: ["code", "Novo laboratório"],
      workspace: `<div class="specialty-header"><div class="specialty-heading"><span class="material-symbols-outlined">terminal</span><div><h2>Central de laboratórios de informática</h2><p>Acompanhe código, infraestrutura e projetos sem perder o contexto.</p></div></div><button class="button primary" type="button" data-specialty-action>Criar laboratório</button></div><div class="specialty-layout"><div class="specialty-board"><h3>Status técnico das turmas</h3><div class="lab-status"><article><strong>86%</strong><span>testes aprovados</span></article><article><strong>14</strong><span>pull requests</span></article><article><strong>5</strong><span>labs em execução</span></article><article><strong>9</strong><span>alunos em atenção</span></article><article><strong>28</strong><span>projetos ativos</span></article><article><strong>72%</strong><span>documentação</span></article></div></div><aside class="specialty-tools"><h3>Ferramentas técnicas</h3><div class="specialty-tool-grid"><button type="button"><span class="material-symbols-outlined">code</span>Desafio de código</button><button type="button"><span class="material-symbols-outlined">dns</span>Laboratório de redes</button><button type="button"><span class="material-symbols-outlined">database</span>Banco de dados</button><button type="button"><span class="material-symbols-outlined">bug_report</span>Revisão de código</button></div></aside></div>`,
      priorities: [["code","14 entregas aguardam revisão","Programação Web · pull requests abertos","Revisar código"],["bug_report","5 projetos com testes falhando","Turma INF 2 · pipeline da manhã","Ver falhas"],["dns","Preparar laboratório de redes","Topologias e endereçamento · amanhã","Configurar lab"]],
      planning: [["code","Desafio de código","Defina problema, testes e critérios."],["dns","Laboratório técnico","Organize ambiente, roteiro e evidências."],["account_tree","Projeto de software","Planeje sprint, papéis e entregáveis."]]
    }
  };
  const normalizeType = (value) => profiles[value] ? value : value === "administracao" ? "tecnico_administracao" : value === "informatica" ? "tecnico_informatica" : "portugues";
  const showState = (state) => {
    document.querySelector('[data-state="loading"]')?.classList.toggle("is-hidden", state !== "loading");
    document.querySelector('[data-state="error"]')?.classList.toggle("is-hidden", state !== "error");
    document.querySelector("[data-dashboard]")?.classList.toggle("is-hidden", state !== "ready");
  };
  const applyProfile = (type, userName) => {
    const config = profiles[type];
    const name = userName || config.name;
    document.body.dataset.specialty = type;
    document.querySelector("[data-specialty-icon]").textContent = config.icon;
    document.querySelector("[data-specialty-short]").textContent = config.short;
    document.querySelector("[data-specialty-name]").textContent = config.title;
    document.querySelector("[data-tool-nav-icon]").textContent = config.navIcon;
    document.querySelector("[data-tool-nav-label]").textContent = config.navLabel;
    document.querySelector("[data-specialty-subtitle]").textContent = config.subtitle;
    document.querySelectorAll("[data-profile-name]").forEach((node) => node.textContent = name);
    document.querySelector("[data-first-name]").textContent = name.split(" ")[0];
    document.querySelectorAll("[data-portuguese-only]").forEach((node) => node.hidden = type !== "portugues");
    const metricCard = document.querySelector(".summary-grid article:nth-child(2)");
    metricCard.querySelector(".summary-icon").textContent = config.metric[2];
    metricCard.querySelector("strong").textContent = config.metric[0];
    metricCard.querySelector("p").textContent = config.metric[1];
    const primary = document.querySelector("[data-primary-tool]");
    primary.querySelector(".material-symbols-outlined").textContent = config.primary[0];
    primary.querySelector("span:last-child").textContent = config.primary[1];
    primary.href = type === "portugues" ? "../redacoes/index.html#nova" : "#especialidade";
    document.querySelector("[data-specialty-workspace]").innerHTML = config.workspace;
    const priorityList = document.querySelector("[data-priority-list]");
    priorityList.innerHTML = config.priorities.map((item, index) => `<article data-priority><span class="priority-icon ${index === 0 ? "coral" : index === 1 ? "amber" : "indigo"} material-symbols-outlined">${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div><button type="button" data-context-action>${item[3]}<span class="material-symbols-outlined">arrow_forward</span></button></article>`).join("");
    const subjectLabels = { matematica: "Matemática", portugues: "Português", tecnico_administracao: "Administração", tecnico_informatica: "Informática" };
    document.querySelectorAll(".class-grid header small").forEach((node) => node.textContent = subjectLabels[type]);
    const planning = document.querySelector(".planning-grid");
    planning.innerHTML = config.planning.map((item) => `<button type="button" data-context-action><span class="material-symbols-outlined">${item[0]}</span><div><strong>${item[1]}</strong><p>${item[2]}</p></div><i class="material-symbols-outlined">arrow_forward</i></button>`).join("");
    document.querySelectorAll("[data-context-action], [data-specialty-action], .specialty-tool-grid button").forEach((button) => button.addEventListener("click", () => teacher()?.showToast(`${button.textContent.trim()} aberto em modo de planejamento.`)));
  };
  const dialog = document.querySelector("[data-activity-dialog]");
  document.querySelectorAll("[data-activity-open]").forEach((button) => button.addEventListener("click", () => dialog?.showModal()));
  dialog?.addEventListener("close", () => { if (dialog.returnValue === "create") teacher()?.showToast("Rascunho criado para sua especialidade."); });
  document.querySelector("[data-clear-priorities]")?.addEventListener("click", () => { document.querySelectorAll("[data-priority]").forEach((item) => item.classList.add("resolved")); teacher()?.showToast("Prioridades marcadas como revisadas."); });
  document.querySelector("[data-focus-start]")?.addEventListener("click", (event) => { event.currentTarget.innerHTML = '<span class="material-symbols-outlined">timer</span>45:00 · Foco ativo'; teacher()?.showToast("Bloco de foco iniciado."); });
  document.querySelector("[data-notifications]")?.addEventListener("click", () => teacher()?.showToast("Você tem novas entregas e um prazo atualizado."));
  const load = async () => {
    showState("loading");
    try {
      if (preview || !api()?.configured) {
        applyProfile(normalizeType(requestedType || "portugues"));
        showState("ready");
        return;
      }
      const session = await api().getSession();
      if (!session) return location.href = "../../login/index.html";
      const [profile, summary] = await Promise.all([api().getProfile(session.user.id), api().getTeacherSummary?.()]);
      const specialtyRoutes = {
        matematica: "../professor_matematica/dashboard/index.html",
        portugues: "../professor_portugues/dashboard/index.html",
        tecnico_administracao: "../professor_tecnico_administracao/dashboard/index.html",
        tecnico_informatica: "../professor_tecnico_informatica/dashboard/index.html"
      };
      if (profile?.role === "professor" && specialtyRoutes[profile.tipo_professor]) {
        location.replace(specialtyRoutes[profile.tipo_professor]);
        return;
      }
      applyProfile(normalizeType(profile?.tipo_professor), profile?.nome);
      if (summary) {
        document.querySelector("[data-students-count]").textContent = summary.students;
        document.querySelector("[data-progress-average]").textContent = `${summary.averageProgress}%`;
      }
      showState("ready");
    } catch (error) {
      document.querySelector("[data-error-message]").textContent = error.message || "Tente novamente.";
      showState("error");
    }
  };
  const previewSelector = document.querySelector("[data-preview-specialty]");
  if (previewSelector) {
    previewSelector.hidden = !preview;
    previewSelector.value = normalizeType(requestedType || "portugues");
    previewSelector.addEventListener("change", () => applyProfile(previewSelector.value));
  }
  document.querySelector("[data-retry]")?.addEventListener("click", load);
  document.querySelector('[aria-label="Abrir calendário"]')?.addEventListener("click", () => { window.location.href = "../agenda/index.html"; });
  load();
})();
