(() => {
  const themes = {
    "inclusao-digital": {
      title:
        "Os desafios da inclusão digital e da inteligência artificial no cotidiano brasileiro",
      category: "Tecnologia",
      motivators: [
        [
          "Texto I",
          "A conectividade amplia o acesso a serviços e oportunidades, mas ainda convive com desigualdades de infraestrutura, renda e letramento digital.",
        ],
        [
          "Texto II",
          "O avanço da inteligência artificial exige formação crítica para que seus benefícios não aprofundem exclusões já existentes.",
        ],
      ],
    },
    "infraestrutura-climatica": {
      title:
        "Os impactos das mudanças climáticas na infraestrutura urbana do Brasil",
      category: "Meio ambiente",
      motivators: [
        [
          "Texto I",
          "Eventos climáticos extremos expõem a fragilidade de sistemas urbanos e atingem de modo desproporcional áreas com menor infraestrutura.",
        ],
        [
          "Texto II",
          "Planejamento preventivo, adaptação e participação social são elementos centrais para construir cidades mais resilientes.",
        ],
      ],
    },
    "acesso-cultura": {
      title:
        "A democratização do acesso à cultura e ao lazer nas periferias brasileiras",
      category: "Sociedade",
      motivators: [
        [
          "Texto I",
          "Equipamentos culturais concentrados e custos de deslocamento limitam a participação de moradores das periferias na vida cultural.",
        ],
        [
          "Texto II",
          "Iniciativas comunitárias mostram que políticas públicas contínuas podem fortalecer a produção cultural local e a cidadania.",
        ],
      ],
    },
  };
  const state = {
    step: 1,
    selectedTheme: null,
    invalid: false,
    submitting: false,
  };
  const elements = {
    steps: [...document.querySelectorAll("[data-step]")],
    stepButtons: [...document.querySelectorAll("[data-step-target]")],
    feedback: document.querySelector("[data-feedback]"),
    selectedTheme: document.querySelector("[data-selected-theme]"),
    motivators: document.querySelector("[data-motivators]"),
    planner: document.querySelector("[data-planning-notes]"),
    plannerCount: document.querySelector("[data-planning-count]"),
    title: document.querySelector("[data-official-title]"),
    text: document.querySelector("[data-official-text]"),
    wordCount: document.querySelector("[data-word-count]"),
    lineCount: document.querySelector("[data-line-count]"),
    saveStatus: document.querySelector("[data-save-status]"),
    submit: document.querySelector("[data-submit]"),
    integrityStatus: document.querySelector("[data-integrity-status]"),
    invalidAttempt: document.querySelector("[data-invalid-attempt]"),
    restart: document.querySelector("[data-restart]"),
  };

  const api = () => window.OminiSaber;
  const showFeedback = (message, type = "") => {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback${type ? ` is-${type}` : ""}`;
  };
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  const setStep = (step) => {
    if (step === 2 && !state.selectedTheme) {
      showFeedback("Escolha um tema antes de continuar.", "error");
      return;
    }
    if (step === 3 && !state.selectedTheme) {
      showFeedback(
        "Escolha um tema antes de abrir a redação oficial.",
        "error",
      );
      return;
    }
    state.step = step;
    elements.steps.forEach((panel) =>
      panel.classList.toggle("is-hidden", Number(panel.dataset.step) !== step),
    );
    elements.stepButtons.forEach((button) => {
      const active = Number(button.dataset.stepTarget) === step;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    if (step === 3) {
      elements.title.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const renderPlanning = () => {
    const theme = themes[state.selectedTheme];
    elements.selectedTheme.innerHTML = `<span class="material-symbols-outlined">topic</span><span>Tema selecionado: <strong>${escapeHTML(theme.title)}</strong></span>`;
    elements.motivators.innerHTML = theme.motivators
      .map(
        ([title, text]) =>
          `<div class="motivator"><h4>${escapeHTML(title)}</h4><p>${escapeHTML(text)}</p></div>`,
      )
      .join("");
    elements.title.value = theme.title;
  };
  const updatePlanningCount = () => {
    elements.plannerCount.textContent = `${elements.planner.value.length} caracteres`;
  };
  const updateOfficialCount = () => {
    const text = elements.text.value.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const lines = text ? text.split(/\n/).length : 0;
    elements.wordCount.textContent = words;
    elements.lineCount.textContent = lines;
    elements.saveStatus.textContent = text
      ? "Texto em edição"
      : "Pronto para começar";
  };
  const invalidateAttempt = () => {
    if (state.step !== 3 || state.invalid) return;
    state.invalid = true;
    elements.invalidAttempt.classList.remove("is-hidden");
    elements.integrityStatus.classList.add("is-invalid");
    elements.integrityStatus.innerHTML =
      '<span class="material-symbols-outlined">gpp_bad</span>Tentativa inválida';
    elements.title.disabled = true;
    elements.text.disabled = true;
    elements.submit.disabled = true;
    showFeedback("A tentativa foi bloqueada por troca de tela.", "error");
  };
  const handleIntegrityEvent = (event) => {
    if (state.step !== 3 || state.invalid) return;
    if (["copy", "paste", "cut", "contextmenu"].includes(event.type)) {
      event.preventDefault();
      showFeedback(
        "Esta ação está desabilitada durante a redação oficial.",
        "error",
      );
    }
  };
  const handleKeydown = (event) => {
    if (state.step !== 3 || state.invalid) return;
    const key = event.key.toLowerCase();
    const blockedShortcut =
      event.key === "F12" ||
      (event.ctrlKey && event.shiftKey && ["i", "j"].includes(key)) ||
      (event.ctrlKey && ["u", "c", "v"].includes(key));
    if (blockedShortcut) {
      event.preventDefault();
      showFeedback(
        "Este atalho está desabilitado durante a redação oficial.",
        "error",
      );
    }
  };
  const resetFlow = () => {
    state.step = 1;
    state.selectedTheme = null;
    state.invalid = false;
    state.submitting = false;
    elements.title.disabled = false;
    elements.text.disabled = false;
    elements.submit.disabled = false;
    elements.title.value = "";
    elements.text.value = "";
    elements.planner.value = "";
    updatePlanningCount();
    updateOfficialCount();
    elements.invalidAttempt.classList.add("is-hidden");
    elements.integrityStatus.classList.remove("is-invalid");
    elements.integrityStatus.innerHTML =
      '<span class="material-symbols-outlined">shield</span>Ambiente protegido';
    showFeedback("");
    setStep(1);
  };
  const submitEssay = async () => {
    if (state.invalid || state.submitting) return;
    const title = elements.title.value.trim();
    const text = elements.text.value.trim();
    if (!title || !text) {
      showFeedback(
        "Preencha o título e o texto final antes de enviar.",
        "error",
      );
      return;
    }
    if (text.split(/\s+/).filter(Boolean).length < 20) {
      showFeedback(
        "Escreva pelo menos 20 palavras para enviar sua redação.",
        "error",
      );
      return;
    }
    state.submitting = true;
    elements.submit.disabled = true;
    elements.submit.innerHTML =
      '<span class="material-symbols-outlined">progress_activity</span>Enviando...';
    try {
      if (!api()?.configured)
        throw new Error("O Supabase não está configurado para este ambiente.");
      const session = await api().getSession();
      if (!session) {
        window.location.href = "../../login/code.html";
        return;
      }
      await api().createRedacao({ titulo: title, texto: text, trilhaId: null });
      showFeedback("Redação enviada com sucesso para avaliação.", "success");
      elements.saveStatus.textContent = "Enviada para avaliação";
    } catch (error) {
      showFeedback(
        error.message || "Não foi possível enviar sua redação.",
        "error",
      );
      state.submitting = false;
      elements.submit.disabled = false;
    } finally {
      if (!state.submitting)
        elements.submit.innerHTML =
          'Enviar para avaliação <span class="material-symbols-outlined">send</span>';
    }
  };

  document.querySelectorAll("[data-theme-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-theme-filter]")
        .forEach((item) => item.classList.toggle("is-active", item === button));
      document
        .querySelectorAll("[data-theme-card]")
        .forEach((card) =>
          card.classList.toggle(
            "is-filtered",
            button.dataset.themeFilter !== "todos" &&
              card.dataset.category !== button.dataset.themeFilter,
          ),
        );
    }),
  );
  document
    .querySelectorAll("[data-theme-card] .select-theme")
    .forEach((button) =>
      button.addEventListener("click", (event) => {
        state.selectedTheme =
          event.currentTarget.closest("[data-theme-card]").dataset.themeId;
        renderPlanning();
        setStep(2);
      }),
    );
  elements.stepButtons.forEach((button) =>
    button.addEventListener("click", () =>
      setStep(Number(button.dataset.stepTarget)),
    ),
  );
  document
    .querySelectorAll("[data-back-step], [data-next-step]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setStep(Number(button.dataset.backStep || button.dataset.nextStep)),
      ),
    );
  elements.planner.addEventListener("input", updatePlanningCount);
  elements.text.addEventListener("input", updateOfficialCount);
  elements.submit.addEventListener("click", submitEssay);
  elements.restart.addEventListener("click", resetFlow);
  ["copy", "paste", "cut", "contextmenu"].forEach((eventName) =>
    document.addEventListener(eventName, handleIntegrityEvent),
  );
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) invalidateAttempt();
  });
  document.addEventListener("DOMContentLoaded", async () => {
    if (api()?.configured) {
      const profile = await api()
        .getProfile()
        .catch(() => null);
      const name = profile?.nome || "Aluno";
      document.querySelectorAll("[data-initials]").forEach((element) => {
        element.textContent = name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
      });
    }
    updatePlanningCount();
    updateOfficialCount();
  });
})();
