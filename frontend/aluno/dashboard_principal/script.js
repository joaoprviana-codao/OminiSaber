(() => {
  const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";
  const api = () => window.OminiSaber;
  const elements = {
    loading: document.querySelector('[data-state="loading"]'),
    error: document.querySelector('[data-state="error"]'),
    errorMessage: document.querySelector("[data-error-message]"),
    dashboard: document.querySelector("[data-dashboard]"),
    detail: document.querySelector("[data-subject-detail]"),
    toast: document.querySelector("[data-toast]"),
  };
  const subjectData = {
    Matemática: { score: 58, icon: "functions", concept: "Equações quadráticas", description: "Resolver equações do 2º grau completas e incompletas e interpretar as soluções.", result: "Você acertou 6 de 10 questões neste tema.", recommendation: "Este conceito prepara os próximos temas de Funções e Inequações.", activity: "Equações quadráticas: exercícios resolvidos", path: "../modulo_de_trilhas/matematica/index.html" },
    Português: { score: 78, icon: "menu_book", concept: "Interpretação de texto", description: "Reconhecer argumentos, inferências e efeitos de sentido em gêneros diversos.", result: "Você acertou 8 de 10 questões neste tema.", recommendation: "Avance para relações entre linguagem, contexto e intenção.", activity: "Leitura ativa: pistas e inferências", path: "../modulo_de_trilhas/portugues/index.html" },
    Ciências: { score: 72, icon: "science", concept: "Genética e hereditariedade", description: "Relacionar genes, cromossomos e características herdadas.", result: "Você concluiu 7 de 10 desafios deste tema.", recommendation: "Revise cruzamentos simples antes de avançar.", activity: "Genética: conceitos essenciais", path: "../modulo_de_trilhas/biologia/index.html" },
    História: { score: 64, icon: "account_balance", concept: "República Velha", description: "Compreender relações de poder, economia e sociedade no período.", result: "Você acertou 6 de 10 questões neste tema.", recommendation: "Conecte os movimentos sociais às mudanças econômicas.", activity: "Linha do tempo da República Velha", path: "../modulo_de_trilhas/historia/index.html" },
    Geografia: { score: 60, icon: "public", concept: "Urbanização brasileira", description: "Analisar crescimento urbano, redes e desigualdades socioespaciais.", result: "Você acertou 6 de 10 questões neste tema.", recommendation: "Explore mapas e indicadores das regiões metropolitanas.", activity: "Cidade em transformação", path: "../modulo_de_trilhas/geografia/index.html" },
    Inglês: { score: 85, icon: "translate", concept: "Reading strategies", description: "Usar contexto, cognatos e estrutura para compreender textos.", result: "Você acertou 9 de 10 questões neste tema.", recommendation: "Seu domínio permite avançar para textos mais longos.", activity: "Reading challenge: science news", path: "../modulo_de_trilhas/ingles-espanhol/index.html" },
    Redação: { score: 66, icon: "edit", concept: "Repertório sociocultural", description: "Selecionar referências pertinentes e produtivas para argumentar.", result: "Sua última redação alcançou 680 pontos.", recommendation: "Pratique a ligação entre repertório e tese.", activity: "Oficina de repertório produtivo", path: "../laboratorio_de_redacao/index.html" },
    Física: { score: 45, icon: "experiment", concept: "Leis de Newton", description: "Relacionar força resultante, massa e aceleração em situações reais.", result: "Você acertou 4 de 10 questões neste tema.", recommendation: "Retome diagramas de forças antes dos exercícios.", activity: "Forças em movimento", path: "../modulo_de_trilhas/fisica/index.html" },
    Química: { score: 40, icon: "deployed_code", concept: "Ligações químicas", description: "Diferenciar ligações iônicas, covalentes e metálicas.", result: "Você acertou 4 de 10 questões neste tema.", recommendation: "Revise estabilidade eletrônica e eletronegatividade.", activity: "Átomos que se conectam", path: "../modulo_de_trilhas/quimica/index.html" },
  };
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const showState = (state) => {
    elements.loading?.classList.toggle("is-hidden", state !== "loading");
    elements.error?.classList.toggle("is-hidden", state !== "error");
    elements.dashboard?.classList.toggle("is-hidden", state !== "ready");
  };
  const showToast = (message) => {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(elements.toast.timer);
    elements.toast.timer = window.setTimeout(() => elements.toast.classList.remove("visible"), 3200);
  };
  const renderProfile = (profile) => {
    const name = profile?.nome || "Marina Souza";
    setText("[data-profile-name]", name);
    setText("[data-greeting]", `Olá, ${name.split(" ")[0]}`);
    setText("[data-initials]", initials(name));
  };
  const renderScores = (notes = []) => {
    const groups = notes.reduce((all, note) => {
      const key = note.materia;
      if (!key) return all;
      (all[key] ||= []).push(Number(note.valor || 0) * 10);
      return all;
    }, {});
    Object.entries(groups).forEach(([subject, values]) => {
      const score = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      if (subjectData[subject]) subjectData[subject].score = score;
      const node = document.querySelector(`[data-subject="${CSS.escape(subject)}"]`);
      node?.querySelector("b")?.replaceChildren(`${score}%`);
    });
  };
  const selectSubject = (subject) => {
    const data = subjectData[subject];
    if (!data) return;
    document.querySelectorAll("[data-subject]").forEach((node) => {
      const selected = node.dataset.subject === subject;
      node.classList.toggle("selected", selected);
      node.setAttribute("aria-pressed", String(selected));
    });
    setText("[data-detail-subject]", subject);
    setText("[data-detail-score]", `${data.score}%`);
    setText("[data-detail-icon]", data.icon);
    setText("[data-detail-concept]", data.concept);
    setText("[data-detail-description]", data.description);
    setText("[data-detail-result]", data.result);
    setText("[data-detail-recommendation]", data.recommendation);
    setText("[data-detail-activity]", data.activity);
    document.querySelector("[data-detail-bar]").style.width = `${data.score}%`;
    document.querySelector("[data-practice-link]").href = data.path;
  };
  const bindInteractions = () => {
    const profileShortcut = document.querySelector('.sidebar-profile a');
    if (profileShortcut) { profileShortcut.href = '../perfil/index.html'; profileShortcut.setAttribute('aria-label', 'Abrir perfil'); profileShortcut.querySelector('.material-symbols-outlined').textContent = 'person'; }
    document.querySelector("[data-mastery-map]")?.addEventListener("click", (event) => {
      const node = event.target.closest("[data-subject]");
      if (node) selectSubject(node.dataset.subject);
    });
    document.querySelector("[data-subject-filter]")?.addEventListener("change", (event) => {
      const value = event.target.value;
      document.querySelectorAll("[data-subject]").forEach((node) => { node.hidden = value !== "all" && node.dataset.subject !== value; });
      if (value !== "all") selectSubject(value);
    });
    const notificationButton = document.querySelector("[data-notification-toggle]");
    notificationButton?.addEventListener("click", () => { window.location.href = "../notificacoes/index.html"; });
    if (notificationButton && !document.querySelector("[data-agenda-shortcut]")) {
      const agenda = document.createElement("a");
      agenda.className = "icon-button";
      agenda.dataset.agendaShortcut = "true";
      agenda.href = "../agenda/index.html";
      agenda.setAttribute("aria-label", "Abrir agenda");
      agenda.innerHTML = '<span class="material-symbols-outlined">calendar_month</span>';
      notificationButton.before(agenda);
    }
    const dialog = document.querySelector("[data-focus-dialog]");
    document.querySelector("[data-focus-open]")?.addEventListener("click", () => dialog.showModal());
    document.querySelectorAll("[data-focus-minutes]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-focus-minutes]").forEach((item) => item.classList.toggle("selected", item === button));
      dialog.querySelector("h2").textContent = `${button.dataset.focusMinutes}:00`;
    }));
    dialog?.addEventListener("close", () => { if (dialog.returnValue === "start") showToast("Sessão de foco iniciada. Boa jornada!"); });
    const menuButton = document.querySelector("[data-menu-toggle]");
    menuButton?.addEventListener("click", () => {
      document.body.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", String(document.body.classList.contains("menu-open")));
    });
  };
  const loadDashboard = async () => {
    showState("loading");
    try {
      if (previewMode || !api()?.configured) {
        renderProfile({ nome: "Marina Souza" });
        showState("ready");
        return;
      }
      const session = await api().getSession();
      if (!session) {
        window.location.href = "../../login/index.html";
        return;
      }
      const [profile, notes] = await Promise.all([api().getProfile(session.user.id), api().listStudentNotes()]);
      renderProfile(profile);
      renderScores(notes);
      selectSubject("Matemática");
      showState("ready");
    } catch (error) {
      elements.errorMessage.textContent = error.message || "Tente novamente em alguns instantes.";
      showState("error");
    }
  };
  document.querySelector("[data-retry]")?.addEventListener("click", loadDashboard);
  bindInteractions();
  loadDashboard();
})();
