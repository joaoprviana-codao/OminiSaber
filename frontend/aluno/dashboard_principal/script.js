(() => {
  const api = () => window.OminiSaber;
  const elements = {
    loading: document.querySelector('[data-state="loading"]'),
    error: document.querySelector('[data-state="error"]'),
    errorMessage: document.querySelector("[data-error-message]"),
    dashboard: document.querySelector("[data-dashboard]"),
    nextStep: document.querySelector("[data-next-step]"),
    map: document.querySelector("[data-mastery-map]"),
    detail: document.querySelector("[data-subject-detail]"),
    filter: document.querySelector("[data-subject-filter]"),
    weeklyDays: document.querySelector("[data-weekly-days]"),
    weeklyTotal: document.querySelector("[data-weekly-total]"),
    toast: document.querySelector("[data-toast]"),
    transition: document.querySelector("[data-difficulty-transition]"),
  };

  const subjectMeta = {
    matematica: {
      label: "Matemática",
      icon: "functions",
      experienceTotal: 3,
      route: "../modulo_de_trilhas/matematica/index.html",
    },
    fisica: { label: "Física", icon: "experiment" },
    portugues: {
      label: "Português e Literatura",
      icon: "menu_book",
      experienceTotal: 3,
      route: "../modulo_de_trilhas/portugues/index.html",
    },
    redacao: { label: "Redação", icon: "edit_note" },
    tecnico_administracao: {
      label: "Matérias Administrativas",
      icon: "business_center",
    },
    tecnico_informatica: { label: "Matérias de Informática", icon: "terminal" },
  };
  const baseSubjects = ["matematica", "fisica", "portugues", "redacao"];
  const positions = [
    ["50%", "17%"],
    ["21%", "42%"],
    ["79%", "42%"],
    ["31%", "78%"],
    ["69%", "78%"],
  ];
  let dashboardData;
  let subjects = [];
  let selectedCode = "";
  let openingDifficultyMap = false;
  const draggedPositions = new Map();

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
  const initials = (name = "") =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AL";
  const average = (values) =>
    values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        )
      : null;
  const showState = (state) => {
    elements.loading?.classList.toggle("is-hidden", state !== "loading");
    elements.error?.classList.toggle("is-hidden", state !== "error");
    elements.dashboard?.classList.toggle("is-hidden", state !== "ready");
  };
  const notify = (message) => {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(elements.toast.timer);
    elements.toast.timer = window.setTimeout(
      () => elements.toast.classList.remove("visible"),
      3200,
    );
  };
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
  const statusFor = (score) => {
    if (score === null) return { label: "Sem registros", className: "" };
    if (score >= 80) return { label: "Domínio forte", className: "" };
    if (score >= 60) return { label: "Em evolução", className: "attention" };
    return { label: "Precisa de atenção", className: "danger" };
  };
  const generalScore = () =>
    average(
      subjects
        .map((subject) => subject.score)
        .filter((score) => score !== null),
    );
  const generalStatus = () => statusFor(generalScore());
  const subjectAccess = (profile) => [
    ...baseSubjects,
    profile.curso_tecnico === "administracao"
      ? "tecnico_administracao"
      : "tecnico_informatica",
  ];

  const buildSubjects = (data) =>
    subjectAccess(data.profile).map((code) => {
      const trails = data.trails.filter(
        (trail) => normalizeSubject(trail) === code,
      );
      const activities = trails.flatMap((trail) => trail.atividades || []);
      const experiences = (data.experiences || []).filter(
        (item) => item.materia_codigo === code && item.concluida,
      );
      const completedActivities = activities.filter(
        (activity) => activity.progresso?.concluida,
      ).length;
      const completed = completedActivities + experiences.length;
      const notes = data.notes
        .filter((note) => normalizeSubject(note) === code)
        .map((note) => Number(note.valor) * 10);
      const essayScores =
        code === "redacao"
          ? data.essays
              .filter(
                (essay) => essay.status === "corrigida" && essay.nota !== null,
              )
              .map((essay) => Number(essay.nota) / 10)
          : [];
      const experienceTotal = Number(subjectMeta[code].experienceTotal || 0);
      const score = average(
        essayScores.length
          ? essayScores
          : notes.length
            ? notes
            : activities.length
              ? [(completedActivities / activities.length) * 100]
              : experienceTotal
                ? [(experiences.length / experienceTotal) * 100]
                : [],
      );
      const nextTrail =
        trails.find((trail) =>
          trail.atividades.some((activity) => !activity.progresso?.concluida),
        ) ||
        trails[0] ||
        null;
      const nextActivity =
        nextTrail?.atividades.find(
          (activity) => !activity.progresso?.concluida,
        ) ||
        nextTrail?.atividades[0] ||
        null;
      return {
        code,
        ...subjectMeta[code],
        trails,
        activities,
        experiences,
        completed,
        score,
        nextTrail,
        nextActivity,
      };
    });

  const renderProfile = (profile) => {
    const name = profile.nome;
    const course =
      profile.curso_tecnico === "administracao"
        ? "Técnico em Administração"
        : "Técnico em Informática";
    document.querySelector("[data-profile-name]").textContent = name;
    document.querySelector("[data-greeting]").textContent =
      `Olá, ${name.split(/\s+/)[0]}`;
    document.querySelector("[data-initials]").textContent = initials(name);
    document.querySelector("[data-profile-context]").textContent = [
      profile.turmas?.serie ? `${profile.turmas.serie}º ano` : null,
      course,
    ]
      .filter(Boolean)
      .join(" · ");
    document.querySelector("[data-current-date]").textContent =
      new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date());
  };

  const renderNextStep = () => {
    const options = subjects
      .flatMap((subject) =>
        subject.trails.map((trail) => ({
          subject,
          trail,
          activity: trail.atividades.find((item) => !item.progresso?.concluida),
        })),
      )
      .filter((item) => item.activity);
    const next = options[0];
    if (!next) {
      elements.nextStep.innerHTML =
        '<div class="lesson-summary"><p class="section-kicker">Seu próximo passo</p><h2 id="next-step-title">Nenhuma atividade pendente</h2><p>Quando um professor publicar uma etapa para sua turma, ela aparecerá aqui.</p></div>';
      return;
    }
    const done = next.trail.atividades.filter(
      (item) => item.progresso?.concluida,
    ).length;
    const total = next.trail.atividades.length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    elements.nextStep.innerHTML = `<div class="lesson-summary"><p class="section-kicker">Seu próximo passo</p><div class="lesson-title-row"><span class="subject-icon material-symbols-outlined">${next.subject.icon}</span><div><h2 id="next-step-title">${escapeHTML(next.activity.titulo)}</h2><p>${escapeHTML(next.trail.titulo)} · etapa ${Number(next.activity.ordem || done + 1)} de ${total}</p></div></div><div class="lesson-progress"><div class="progress-track" role="progressbar" aria-label="Progresso da trilha" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><strong>${progress}% concluído</strong></div></div><div class="lesson-meta"><span><span class="material-symbols-outlined">schedule</span>${Number(next.activity.duracao_minutos || 0)} min</span><span><span class="material-symbols-outlined">school</span>${escapeHTML(next.subject.label)}</span><a class="button lesson-action" href="../modulo_de_trilhas/${["atividade", "quiz", "projeto"].includes(next.activity.tipo_conteudo) ? "atividade" : "aula"}/index.html?atividade=${encodeURIComponent(next.activity.id)}">Continuar aprendendo<span class="material-symbols-outlined">arrow_forward</span></a></div>`;
  };

  const renderSubjectDetail = (code) => {
    const subject = subjects.find((item) => item.code === code);
    if (!subject) return;
    selectedCode = code;
    elements.map.querySelectorAll("[data-subject]").forEach((node) => {
      const selected = node.dataset.subject === code;
      node.classList.toggle("selected", selected);
      node.setAttribute("aria-pressed", String(selected));
    });
    const status = statusFor(subject.score);
    const link =
      code === "redacao"
        ? "../laboratorio_de_redacao/index.html"
        : subject.nextTrail
          ? `../modulo_de_trilhas/trilha/index.html?trilha=${encodeURIComponent(subject.nextTrail.id)}`
          : subject.route || "../modulo_de_trilhas/index.html";
    elements.detail.innerHTML = `<header><span class="detail-icon material-symbols-outlined">${subject.icon}</span><div><h3>${escapeHTML(subject.label)}</h3><p>Desempenho: <strong>${subject.score === null ? "sem registros" : `${subject.score}%`}</strong></p></div></header><div class="detail-section"><p class="detail-label"><span class="material-symbols-outlined">route</span>Conteúdo disponível</p><h4>${subject.trails.length} trilha(s) publicada(s)</h4><p>${subject.activities.length} etapa(s) e ${subject.experiences.length} experiência(s) interativa(s) concluída(s).</p></div><div class="detail-section"><p class="detail-label"><span class="material-symbols-outlined">monitoring</span>Estado atual</p><p>${escapeHTML(status.label)}</p><div class="mini-progress"><span style="width:${subject.score || 0}%"></span></div></div><div class="recommendation"><p><span class="material-symbols-outlined">target</span>Próximo conteúdo real</p><span>${escapeHTML(subject.nextActivity?.titulo || (subject.route ? "Continuar nas experiências da matéria." : "Nenhuma atividade pendente publicada."))}</span></div><div class="suggested-activity"><p class="detail-label"><span class="material-symbols-outlined">assignment</span>Trilha</p><h4>${escapeHTML(subject.nextTrail?.titulo || (subject.route ? "Laboratórios interativos" : "Aguardando publicação"))}</h4><small>${subject.nextActivity ? `${Number(subject.nextActivity.duracao_minutos || 0)} min · ${Number(subject.nextActivity.recompensa_xp || 0)} XP` : "Sem estimativa disponível"}</small><a class="button primary" href="${link}">${subject.nextTrail || code === "redacao" || subject.route ? "Abrir" : "Ver catálogo"}<span class="material-symbols-outlined">arrow_forward</span></a></div>`;
  };

  const renderSubjects = () => {
    elements.filter.innerHTML =
      '<option value="all">Todas as matérias</option>' +
      subjects
        .map(
          (subject) =>
            `<option value="${subject.code}">${escapeHTML(subject.label)}</option>`,
        )
        .join("");
    const score = generalScore();
    const status = generalStatus();
    const generalNode = `<div class="subject-node general-node" aria-label="Geral. ${score === null ? "Sem registros" : `${score}% de desempenho`}"><span class="node-icon material-symbols-outlined">insights</span><strong>Geral</strong><b>${score === null ? "—" : `${score}%`}</b><small>${escapeHTML(status.label)}</small></div>`;
    elements.map.innerHTML = `<svg class="map-links" aria-hidden="true" preserveAspectRatio="none"><line x1="50%" y1="50%" x2="50%" y2="17%"></line><line x1="50%" y1="50%" x2="21%" y2="42%"></line><line x1="50%" y1="50%" x2="79%" y2="42%"></line><line x1="50%" y1="50%" x2="31%" y2="78%"></line><line x1="50%" y1="50%" x2="69%" y2="78%"></line></svg>${generalNode}${subjects
      .map((subject, index) => {
        const status = statusFor(subject.score);
        const saved = draggedPositions.get(subject.code);
        const [x, y] = saved || positions[index];
        return `<button class="subject-node ${index === 0 ? "selected" : ""} ${status.className}" style="--x:${x};--y:${y}" data-subject="${subject.code}" aria-pressed="${index === 0}" aria-label="${escapeHTML(subject.label)}. ${subject.score === null ? "Sem registros" : `${subject.score}% de desempenho`}. Clique duas vezes ou pressione Enter para abrir o mapa de dificuldades."><span class="node-icon material-symbols-outlined">${subject.icon}</span><strong>${escapeHTML(subject.label)}</strong><b>${subject.score === null ? "—" : `${subject.score}%`}</b><small>${escapeHTML(status.label)}</small><span class="double-click-cue" aria-hidden="true">2×</span></button>`;
      })
      .join("")}`;
    renderSubjectDetail(subjects[0].code);
  };

  const openDifficultyMap = (code) => {
    if (openingDifficultyMap) return;
    const subject = subjects.find((item) => item.code === code);
    if (!subject) return;
    openingDifficultyMap = true;
    elements.transition.querySelector("[data-transition-icon]").textContent =
      subject.icon;
    elements.transition.querySelector("[data-transition-subject]").textContent =
      subject.label;
    elements.transition.hidden = false;
    requestAnimationFrame(() => elements.transition.classList.add("visible"));
    window.setTimeout(
      () => {
        window.location.href = `../mapa_dificuldades/index.html?materia=${encodeURIComponent(code)}`;
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 850,
    );
  };

  const renderWeek = () => {
    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const count = dashboardData.history.filter((item) => {
        const itemDate = new Date(item.created_at);
        const itemKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}-${String(itemDate.getDate()).padStart(2, "0")}`;
        return itemKey === key;
      }).length;
      return { date, count, today: offset === 6 };
    });
    const total = days.reduce((sum, day) => sum + day.count, 0);
    elements.weeklyDays.innerHTML = days
      .map(
        (day) =>
          `<li class="${day.count ? "done" : ""} ${day.today ? "today" : ""}"><span>${new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day.date).replace(".", "")}</span><b>${day.count}</b></li>`,
      )
      .join("");
    elements.weeklyTotal.innerHTML = `<span class="ring-progress">${total}<small>registros</small></span><p><strong>${dashboardData.xp} XP acumulados</strong><span>Calculados pelo Supabase</span></p>`;
  };

  const bindInteractions = () => {
    let drag = null;
    const updateDraggedPosition = (event) => {
      if (!drag) return;
      const rect = elements.map.getBoundingClientRect();
      const radius = drag.node.offsetWidth / 2;
      const x = Math.min(
        Math.max(event.clientX - rect.left, radius),
        rect.width - radius,
      );
      const y = Math.min(
        Math.max(event.clientY - rect.top, radius),
        rect.height - radius,
      );
      const xPercent = `${(x / rect.width) * 100}%`;
      const yPercent = `${(y / rect.height) * 100}%`;
      drag.node.style.setProperty("--x", xPercent);
      drag.node.style.setProperty("--y", yPercent);
      draggedPositions.set(drag.node.dataset.subject, [xPercent, yPercent]);
      drag.moved = true;
    };
    elements.map.addEventListener("pointerdown", (event) => {
      const node = event.target.closest("[data-subject]");
      if (!node || event.button === 2) return;
      drag = {
        node,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      node.classList.add("dragging");
      node.setPointerCapture?.(event.pointerId);
    });
    elements.map.addEventListener("pointermove", (event) => {
      if (!drag) return;
      if (
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <=
        4
      )
        return;
      event.preventDefault();
      updateDraggedPosition(event);
    });
    elements.map.addEventListener("pointerup", (event) => {
      if (!drag) return;
      drag.node.classList.remove("dragging");
      drag.node.releasePointerCapture?.(event.pointerId);
      if (drag.moved) drag.node.dataset.suppressClick = "true";
      drag = null;
    });
    elements.map.addEventListener("pointercancel", () => {
      drag?.node.classList.remove("dragging");
      drag = null;
    });
    elements.map.addEventListener("click", (event) => {
      const node = event.target.closest("[data-subject]");
      if (!node) return;
      if (node.dataset.suppressClick) {
        delete node.dataset.suppressClick;
        return;
      }
      renderSubjectDetail(node.dataset.subject);
      if (event.detail >= 2) openDifficultyMap(node.dataset.subject);
    });
    elements.map.addEventListener("dblclick", (event) => {
      const node = event.target.closest("[data-subject]");
      if (node) openDifficultyMap(node.dataset.subject);
    });
    elements.map.addEventListener("keydown", (event) => {
      const node = event.target.closest("[data-subject]");
      if (node && event.key === "Enter") {
        event.preventDefault();
        openDifficultyMap(node.dataset.subject);
      }
    });
    elements.filter.addEventListener("change", (event) => {
      const code = event.target.value;
      elements.map.querySelectorAll("[data-subject]").forEach((node) => {
        node.hidden = code !== "all" && node.dataset.subject !== code;
      });
      if (code !== "all") renderSubjectDetail(code);
      else renderSubjectDetail(selectedCode || subjects[0].code);
    });
    document
      .querySelector("[data-notification-toggle]")
      ?.addEventListener("click", () => {
        window.location.href = "../notificacoes/index.html";
      });
    const notificationButton = document.querySelector(
      "[data-notification-toggle]",
    );
    if (
      notificationButton &&
      !document.querySelector("[data-agenda-shortcut]")
    ) {
      const agenda = document.createElement("a");
      agenda.className = "icon-button";
      agenda.dataset.agendaShortcut = "true";
      agenda.href = "../agenda/index.html";
      agenda.setAttribute("aria-label", "Abrir agenda");
      agenda.innerHTML =
        '<span class="material-symbols-outlined">calendar_month</span>';
      notificationButton.before(agenda);
    }
    const dialog = document.querySelector("[data-focus-dialog]");
    document
      .querySelector("[data-focus-open]")
      ?.addEventListener("click", () => dialog.showModal());
    document.querySelectorAll("[data-focus-minutes]").forEach((button) =>
      button.addEventListener("click", () => {
        document
          .querySelectorAll("[data-focus-minutes]")
          .forEach((item) =>
            item.classList.toggle("selected", item === button),
          );
        dialog.querySelector("h2").textContent =
          `${button.dataset.focusMinutes}:00`;
      }),
    );
    dialog?.addEventListener("close", () => {
      if (dialog.returnValue === "start") notify("Sessão de foco iniciada.");
    });
    const menuButton = document.querySelector("[data-menu-toggle]");
    menuButton?.addEventListener("click", () => {
      document.body.classList.toggle("menu-open");
      menuButton.setAttribute(
        "aria-expanded",
        String(document.body.classList.contains("menu-open")),
      );
    });
  };

  const loadDashboard = async () => {
    showState("loading");
    try {
      if (!api()?.configured)
        throw new Error("A conexão com o Supabase não está configurada.");
      dashboardData = await api().getStudentDashboard();
      subjects = buildSubjects(dashboardData);
      renderProfile(dashboardData.profile);
      renderNextStep();
      renderSubjects();
      renderWeek();
      showState("ready");
    } catch (error) {
      elements.errorMessage.textContent =
        error.message || "Tente novamente em alguns instantes.";
      showState("error");
    }
  };

  document
    .querySelector("[data-retry]")
    ?.addEventListener("click", loadDashboard);
  bindInteractions();
  loadDashboard();
})();
