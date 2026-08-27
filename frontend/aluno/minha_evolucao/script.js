(() => {
  const activeLoanStatuses = [
    "ativo",
    "devolvido",
    "atrasado",
    "pendente",
    "aguardando_retirada",
  ];
  const state = {
    notes: [],
    progress: [],
    redacoes: [],
    loans: [],
    notesChart: null,
    progressChart: null,
  };
  const elements = {
    loading: document.querySelector('[data-state="loading"]'),
    error: document.querySelector('[data-state="error"]'),
    evolution: document.querySelector("[data-evolution]"),
    errorMessage: document.querySelector("[data-error-message]"),
    medals: document.querySelector("[data-medals]"),
    history: document.querySelector("[data-history]"),
    historyEmpty: document.querySelector("[data-history-empty]"),
    notesChart: document.querySelector("[data-notes-chart]"),
    progressChart: document.querySelector("[data-progress-chart]"),
    progressLegend: document.querySelector("[data-progress-legend]"),
  };

  const api = () => window.OminiSaber;
  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
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
  const average = (values) =>
    values.length
      ? values.reduce((total, value) => total + Number(value || 0), 0) /
        values.length
      : null;
  const formatNumber = (value) =>
    Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Data não informada";
  const showState = (name) => {
    elements.loading.classList.toggle("is-hidden", name !== "loading");
    elements.error.classList.toggle("is-hidden", name !== "error");
    elements.evolution.classList.toggle("is-hidden", name !== "ready");
  };

  const getLevel = (xp) => {
    const level = Math.floor(xp / 500) + 1;
    const currentXp = xp % 500;
    return {
      level,
      currentXp,
      percentage: Math.min(100, Math.round((currentXp / 500) * 100)),
      title:
        level >= 5
          ? "Mestre das Trilhas"
          : level >= 3
            ? "Desbravador"
            : "Explorador",
    };
  };
  const getAchievements = () => {
    const completedActivities = state.progress.filter(
      (item) => item.concluida,
    ).length;
    const completedLoans = state.loans.filter(
      (item) => item.status === "devolvido",
    ).length;
    const subjectAverages = state.notes.reduce((result, note) => {
      const subject = note.materia || "Sem matéria";
      result[subject] = result[subject] || [];
      result[subject].push(note.valor);
      return result;
    }, {});
    return [
      {
        icon: "edit_note",
        name: "Primeira Redação",
        description: "Envie sua primeira produção.",
        unlocked: state.redacoes.length >= 1,
      },
      {
        icon: "local_fire_department",
        name: "Foco Total",
        description: "Média acima de 8 em uma matéria.",
        unlocked: Object.values(subjectAverages).some(
          (values) => average(values) > 8,
        ),
      },
      {
        icon: "menu_book",
        name: "Leitor Assíduo",
        description: "Conclua um empréstimo da biblioteca.",
        unlocked: completedLoans >= 1,
      },
      {
        icon: "route",
        name: "Maratonista de Trilhas",
        description: "Conclua cinco atividades.",
        unlocked: completedActivities >= 5,
      },
    ];
  };

  const renderProfile = () => {
    const firstName = window.profileName?.split(" ")[0] || "estudante";
    setText("[data-greeting]", `Sua evolução, ${firstName}`);
    setText(
      "[data-initials]",
      window.profileName
        ?.split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "AL",
    );
  };
  const renderGamification = () => {
    const completedActivities = state.progress.filter(
      (item) => item.concluida,
    ).length;
    const xp = completedActivities * 100 + state.redacoes.length * 150;
    const level = getLevel(xp);
    const achievements = getAchievements();
    const unlockedCount = achievements.filter((item) => item.unlocked).length;
    setText("[data-level-label]", `NÍVEL ${level.level}`);
    setText("[data-level-title]", level.title);
    setText("[data-next-level]", `Nível ${level.level + 1}`);
    setText("[data-xp-total]", String(xp));
    setText("[data-xp-bar]", "");
    document.querySelector("[data-xp-bar]").style.width =
      `${level.percentage}%`;
    setText(
      "[data-xp-detail]",
      `${level.currentXp} de 500 XP para o próximo nível`,
    );
    setText("[data-medal-count]", `${unlockedCount} medalhas`);
    setText("[data-completed]", String(completedActivities));
    setText(
      "[data-completed-detail]",
      `de ${state.progress.length} atividades`,
    );
    setText("[data-essays]", String(state.redacoes.length));
    setText(
      "[data-loans]",
      String(state.loans.filter((item) => item.status === "devolvido").length),
    );
    setText("[data-loan-detail]", "empréstimos concluídos");
    elements.medals.innerHTML = achievements
      .map(
        (item) => `
      <article class="medal-card ${item.unlocked ? "unlocked" : "locked"}">
        <span class="medal-icon material-symbols-outlined">${item.unlocked ? item.icon : "lock"}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <span class="medal-status">${item.unlocked ? "DESBLOQUEADA" : "BLOQUEADA"}</span>
      </article>`,
      )
      .join("");
  };
  const renderStats = () => {
    const values = state.notes.map((note) => Number(note.valor));
    const result = average(values);
    setText("[data-average]", result === null ? "--" : formatNumber(result));
    setText(
      "[data-average-detail]",
      result === null
        ? "Sem notas registradas"
        : `${state.notes.length} avaliação(ões)`,
    );
  };
  const getBimesterData = () =>
    [1, 2, 3, 4].map((bimester) => {
      const values = state.notes
        .filter((note) => Number(note.bimestre) === bimester)
        .map((note) => note.valor);
      return average(values);
    });
  const renderNotesChart = () => {
    const values = getBimesterData();
    if (!state.notes.length || typeof window.Chart !== "function") {
      elements.notesChart.classList.add("is-empty");
      return;
    }
    elements.notesChart.classList.remove("is-empty");
    state.notesChart?.destroy();
    state.notesChart = new window.Chart(
      document.querySelector("#notes-chart"),
      {
        type: "line",
        data: {
          labels: ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"],
          datasets: [
            {
              label: "Média",
              data: values,
              borderColor: "#3525cd",
              backgroundColor: "rgba(53, 37, 205, .12)",
              pointBackgroundColor: "#006c49",
              pointRadius: 5,
              borderWidth: 3,
              tension: 0.35,
              spanGaps: true,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { min: 0, max: 10, ticks: { stepSize: 2 } } },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` Média: ${formatNumber(context.raw)}`,
              },
            },
          },
        },
      },
    );
  };
  const renderProgressChart = () => {
    const completed = state.progress.filter((item) => item.concluida).length;
    const pending = Math.max(0, state.progress.length - completed);
    if (!state.progress.length || typeof window.Chart !== "function") {
      elements.progressChart.classList.add("is-empty");
      return;
    }
    elements.progressChart.classList.remove("is-empty");
    state.progressChart?.destroy();
    state.progressChart = new window.Chart(
      document.querySelector("#progress-chart"),
      {
        type: "doughnut",
        data: {
          labels: ["Concluídas", "Pendentes"],
          datasets: [
            {
              data: [completed, pending],
              backgroundColor: ["#006c49", "#d8e3fb"],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: { legend: { display: false } },
        },
      },
    );
    elements.progressLegend.innerHTML = `<span><i style="background:#006c49"></i>${completed} concluídas</span><span><i style="background:#d8e3fb"></i>${pending} pendentes</span>`;
  };
  const renderHistory = () => {
    const records = [
      ...state.notes.map((note) => ({
        type: "Nota",
        name: note.materia || "Avaliação",
        detail: `${formatNumber(note.valor)} / 10 · ${note.bimestre ? `${note.bimestre}º bimestre` : "Bimestre não informado"}`,
        status: "Registrada",
        date: note.created_at,
        className: "done",
      })),
      ...state.redacoes.map((essay) => ({
        type: "Redação",
        name: essay.titulo,
        detail: essay.feedback || "Aguardando feedback do professor.",
        status: essay.status || "Enviada",
        date: essay.enviada_em || essay.created_at,
        className: "sent",
      })),
      ...state.progress.map((item) => ({
        type: "Atividade",
        name: item.atividades?.titulo || "Atividade",
        detail: item.atividades?.trilhas?.materia || "Trilha de estudos",
        status: item.concluida ? "Concluída" : "Em andamento",
        date: item.updated_at,
        className: item.concluida ? "done" : "",
      })),
    ]
      .sort(
        (first, second) =>
          new Date(second.date || 0) - new Date(first.date || 0),
      )
      .slice(0, 12);
    elements.historyEmpty.classList.toggle("is-hidden", records.length > 0);
    elements.history.innerHTML = records
      .map(
        (record) => `
          <tr>
            <td>${escapeHTML(record.type)}</td>
            <td>
              ${escapeHTML(record.name)}
              <br>
              <small>${formatDate(record.date)}</small>
            </td>
            <td>${escapeHTML(record.detail)}</td>
            <td>
              <span class="status-pill ${record.className}">
                ${escapeHTML(record.status)}
              </span>
            </td>
          </tr>`,
      )
      .join("");
  };
  const loadEvolution = async () => {
    showState("loading");
    try {
      if (!api()?.configured)
        throw new Error("O Supabase não está configurado para este ambiente.");
      const session = await api().getSession();
      if (!session) {
        window.location.href = "../../login/code.html";
        return;
      }
      const [profile, notes, progress, redacoes, loans] = await Promise.all([
        api().getProfile(session.user.id),
        api().listStudentNotes(),
        api().listStudentProgress(),
        api().listStudentRedacoes(),
        api().listStudentLoans(),
      ]);
      window.profileName = profile?.nome || "Aluno";
      state.notes = notes || [];
      state.progress = progress || [];
      state.redacoes = redacoes || [];
      state.loans = (loans || []).filter((item) =>
        activeLoanStatuses.includes(item.status),
      );
      renderProfile();
      renderGamification();
      renderStats();
      renderNotesChart();
      renderProgressChart();
      renderHistory();
      showState("ready");
    } catch (error) {
      elements.errorMessage.textContent =
        error.message || "Tente novamente em alguns instantes.";
      showState("error");
    }
  };

  document
    .querySelector("[data-retry]")
    ?.addEventListener("click", loadEvolution);
  document.addEventListener("DOMContentLoaded", loadEvolution);
})();
