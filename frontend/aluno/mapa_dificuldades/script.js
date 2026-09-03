(() => {
  const api = () => window.OminiSaber;
  const subjectMeta = {
    matematica: { label: "Matemática", icon: "functions" },
    fisica: { label: "Física", icon: "experiment" },
    portugues: { label: "Português e Literatura", icon: "menu_book" },
    redacao: { label: "Redação", icon: "edit_note" },
    tecnico_administracao: {
      label: "Matérias Administrativas",
      icon: "business_center",
    },
    tecnico_informatica: { label: "Matérias de Informática", icon: "terminal" },
  };
  const baseSubjects = ["matematica", "fisica", "portugues", "redacao"];
  const elements = {
    loading: document.querySelector('[data-state="loading"]'),
    error: document.querySelector('[data-state="error"]'),
    errorMessage: document.querySelector("[data-error-message]"),
    content: document.querySelector("[data-map-content]"),
    select: document.querySelector("[data-subject-select]"),
    mapTitle: document.querySelector("[data-map-title]"),
    network: document.querySelector("[data-network]"),
    priorityList: document.querySelector("[data-priority-list]"),
    attention: document.querySelector("[data-attention-count]"),
    progress: document.querySelector("[data-progress-count]"),
    strong: document.querySelector("[data-strong-count]"),
  };
  let trails = [];
  let allowedSubjects = [];

  const escapeHTML = (value = "") =>
    String(value).replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  const normalizeSubject = (item = {}) => {
    if (item.materia_codigo && subjectMeta[item.materia_codigo])
      return item.materia_codigo;
    const value = String(item.materia || "").toLocaleLowerCase("pt-BR");
    if (/redaç|redac/.test(value)) return "redacao";
    if (/portugu|literat|linguag/.test(value)) return "portugues";
    if (/físic|fisic/.test(value)) return "fisica";
    if (/matem|álgebr|algebr|geometr|estat/.test(value)) return "matematica";
    if (/admin|gest|empreend|marketing|finan/.test(value))
      return "tecnico_administracao";
    if (/inform|program|tecnolog|banco de dados|redes/.test(value))
      return "tecnico_informatica";
    return "";
  };
  const statusFor = (trail) => {
    const total = trail.atividades?.length || 0;
    const score = total
      ? Math.round(((trail.concluidas || 0) / total) * 100)
      : null;
    if (score === null) return { score, className: "", label: "Sem evidência" };
    if (score >= 80)
      return { score, className: "success", label: "Domínio forte" };
    if (score >= 60)
      return { score, className: "warning", label: "Em evolução" };
    return { score, className: "danger", label: "Precisa de atenção" };
  };
  const showState = (state) => {
    elements.loading.classList.toggle("is-hidden", state !== "loading");
    elements.error.classList.toggle("is-hidden", state !== "error");
    elements.content.classList.toggle("is-hidden", state !== "ready");
  };
  const getPosition = (index, count) => {
    if (count <= 8) {
      const angle = ((-90 + (360 / count) * index) * Math.PI) / 180;
      return { x: 50 + Math.cos(angle) * 37, y: 50 + Math.sin(angle) * 36 };
    }
    const rows = Math.ceil(count / 2);
    const row = Math.floor(index / 2);
    return { x: index % 2 ? 82 : 18, y: ((row + 1) / (rows + 1)) * 100 };
  };
  const updateQuery = (code) => {
    const url = new URL(window.location.href);
    url.searchParams.set("materia", code);
    history.replaceState({}, "", url);
  };
  const renderMap = (code) => {
    const visible = trails.filter((trail) => normalizeSubject(trail) === code);
    const statuses = visible.map((trail) => ({ trail, ...statusFor(trail) }));
    const totalActivities = visible.reduce(
      (sum, trail) => sum + (trail.atividades?.length || 0),
      0,
    );
    const totalCompleted = visible.reduce(
      (sum, trail) => sum + Number(trail.concluidas || 0),
      0,
    );
    const general = totalActivities
      ? Math.round((totalCompleted / totalActivities) * 100)
      : null;
    elements.mapTitle.textContent = `Descritores de ${subjectMeta[code].label}`;
    elements.attention.textContent = statuses.filter(
      (item) => item.className === "danger",
    ).length;
    elements.progress.textContent = statuses.filter(
      (item) => item.className === "warning",
    ).length;
    elements.strong.textContent = statuses.filter(
      (item) => item.className === "success",
    ).length;
    updateQuery(code);

    if (!visible.length) {
      elements.network.style.removeProperty("--network-height");
      elements.network.innerHTML = `<div class="empty-network"><span class="material-symbols-outlined" aria-hidden="true">route</span><h3>Nenhuma trilha publicada nesta matéria</h3><p>Assim que um professor publicar um descritor para sua turma, ele aparecerá aqui conectado ao resultado geral.</p></div>`;
      elements.priorityList.innerHTML =
        '<div class="priority-empty"><strong>Nada para priorizar agora</strong><p>Não existem dados publicados para esta matéria.</p></div>';
      return;
    }

    elements.network.style.setProperty(
      "--network-height",
      `${Math.max(620, Math.ceil(visible.length / 2) * 170)}px`,
    );
    const positions = visible.map((_, index) =>
      getPosition(index, visible.length),
    );
    const lines = positions
      .map(
        (position) =>
          `<line x1="50%" y1="50%" x2="${position.x}%" y2="${position.y}%"></line>`,
      )
      .join("");
    const nodes = statuses
      .map((item, index) => {
        const position = positions[index];
        const codeLabel = item.trail.descritor_sedu || `Trilha ${index + 1}`;
        const progressText = item.score === null ? "—" : `${item.score}%`;
        const href = `../modulo_de_trilhas/trilha/index.html?trilha=${encodeURIComponent(item.trail.id)}`;
        return `<a class="descriptor-node ${item.className}" style="--x:${position.x}%;--y:${position.y}%" href="${href}" aria-label="${escapeHTML(codeLabel)}: ${escapeHTML(item.trail.titulo)}. ${item.label}, ${progressText}."><span class="node-code">${escapeHTML(codeLabel)}</span><strong>${escapeHTML(item.trail.titulo)}</strong><b>${progressText}</b><small>${escapeHTML(item.label)}</small><span class="arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>`;
      })
      .join("");
    elements.network.innerHTML = `<svg class="network-lines" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="50" cy="50" r="18"></circle>${lines}</svg><div class="general-node" style="--x:50%;--y:50%"><small>Geral</small><strong>${general === null ? "—" : `${general}%`}</strong><span>${totalCompleted} de ${totalActivities} etapas concluídas</span></div>${nodes}`;

    const priority = statuses
      .filter((item) => item.score !== null && item.score < 80)
      .sort((a, b) => a.score - b.score);
    elements.priorityList.innerHTML = priority.length
      ? priority
          .map(
            (item, index) =>
              `<a class="priority-item" href="../modulo_de_trilhas/trilha/index.html?trilha=${encodeURIComponent(item.trail.id)}"><span class="priority-rank">${index + 1}</span><span><strong>${escapeHTML(item.trail.descritor_sedu || item.trail.titulo)}</strong><small>${escapeHTML(item.trail.titulo)} · ${item.trail.atividades.length} etapa(s)</small></span><span class="priority-score">${item.score}%</span></a>`,
          )
          .join("")
      : '<div class="priority-empty"><strong>Excelente avanço</strong><p>Nenhuma trilha com evidência está abaixo de 80% nesta matéria.</p></div>';
  };
  const load = async () => {
    showState("loading");
    try {
      if (!api()?.configured)
        throw new Error("A conexão com o Supabase não está configurada.");
      const [profile, catalog] = await Promise.all([
        api().getProfile(),
        api().listStudyCatalog(),
      ]);
      if (!profile?.curso_tecnico)
        throw new Error(
          "Seu curso técnico ainda não foi definido pela escola.",
        );
      allowedSubjects = [
        ...baseSubjects,
        profile.curso_tecnico === "administracao"
          ? "tecnico_administracao"
          : "tecnico_informatica",
      ];
      trails = catalog;
      elements.select.innerHTML = allowedSubjects
        .map(
          (code) =>
            `<option value="${code}">${escapeHTML(subjectMeta[code].label)}</option>`,
        )
        .join("");
      const requested = new URLSearchParams(window.location.search).get(
        "materia",
      );
      const initial = allowedSubjects.includes(requested)
        ? requested
        : allowedSubjects[0];
      elements.select.value = initial;
      renderMap(initial);
      showState("ready");
    } catch (error) {
      elements.errorMessage.textContent =
        error.message || "Tente novamente em alguns instantes.";
      showState("error");
    }
  };

  elements.select.addEventListener("change", (event) =>
    renderMap(event.target.value),
  );
  document.querySelector("[data-retry]")?.addEventListener("click", load);
  load();
})();
