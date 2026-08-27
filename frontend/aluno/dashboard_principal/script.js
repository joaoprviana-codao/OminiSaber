(() => {
  const activeLoanStatuses = [
    "pendente",
    "aguardando_retirada",
    "ativo",
    "atrasado",
  ];
  const elements = {
    loading: document.querySelector('[data-state="loading"]'),
    error: document.querySelector('[data-state="error"]'),
    errorMessage: document.querySelector("[data-error-message]"),
    dashboard: document.querySelector("[data-dashboard]"),
    activities: document.querySelector("[data-activities]"),
    chartWrap: document.querySelector("[data-chart-empty]"),
  };
  let radarChart;

  const api = () => window.OminiSaber;
  const setText = (selector, value) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  };
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'\"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  const formatNumber = (value) =>
    Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  const showState = (state) => {
    elements.loading.classList.toggle("is-hidden", state !== "loading");
    elements.error.classList.toggle("is-hidden", state !== "error");
    elements.dashboard.classList.toggle("is-hidden", state !== "ready");
  };

  const getInitials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "--";
  const calculateAverage = (notes) =>
    notes.length
      ? notes.reduce((sum, note) => sum + Number(note.valor || 0), 0) /
        notes.length
      : null;
  const subjectAverages = (notes) => {
    const grouped = notes.reduce((result, note) => {
      const subject = note.materia || "Sem matéria";
      result[subject] = result[subject] || [];
      result[subject].push(Number(note.valor || 0));
      return result;
    }, {});
    return Object.entries(grouped).map(([subject, values]) => ({
      subject,
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
    }));
  };

  const renderProfile = (profile) => {
    const name = profile?.nome || "estudante";
    const firstName = name.split(" ")[0];
    setText("[data-profile-name]", name);
    setText("[data-greeting]", `Olá, ${firstName}`);
    setText("[data-welcome]", `Continue avançando, ${firstName}.`);
    setText("[data-initials]", getInitials(name));
  };

  const renderMetrics = ({ notes, progress, redacoes, loans }) => {
    const average = calculateAverage(notes);
    const completed = progress.filter((item) => item.concluida).length;
    const loan = loans.find((item) => activeLoanStatuses.includes(item.status));
    setText("[data-average]", average === null ? "--" : formatNumber(average));
    setText(
      "[data-average-caption]",
      average === null
        ? "Sem notas lançadas"
        : `${notes.length} nota(s) avaliadas`,
    );
    setText("[data-completed]", `${completed}/${progress.length}`);
    setText(
      "[data-progress-caption]",
      progress.length
        ? `${Math.round((completed / progress.length) * 100)}% do seu progresso`
        : "Sem atividades registradas",
    );
    setText("[data-essays]", String(redacoes.length));
    setText("[data-loan]", loan?.livros?.titulo || "Nenhum");
    setText(
      "[data-loan-status]",
      loan
        ? loan.status === "atrasado"
          ? "Em atraso"
          : "Em andamento"
        : "Sem empréstimo aberto",
    );
  };

  const renderRadar = (notes) => {
    const averages = subjectAverages(notes);
    if (!averages.length || typeof window.Chart !== "function") {
      elements.chartWrap.classList.add("is-empty");
      return;
    }
    elements.chartWrap.classList.remove("is-empty");
    radarChart?.destroy();
    radarChart = new window.Chart(document.querySelector("#subject-radar"), {
      type: "radar",
      data: {
        labels: averages.map((item) => item.subject),
        datasets: [
          {
            label: "Média",
            data: averages.map((item) => item.average),
            fill: true,
            backgroundColor: "rgba(53, 37, 205, .16)",
            borderColor: "#3525cd",
            pointBackgroundColor: "#006c49",
            pointBorderColor: "#fff",
            pointRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              color: "#64748b",
              backdropColor: "transparent",
            },
            grid: { color: "#d8e3fb" },
            angleLines: { color: "#d8e3fb" },
            pointLabels: {
              color: "#111c2d",
              font: { family: "Inter", size: 12, weight: "600" },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (context) => ` ${formatNumber(context.raw)}` },
          },
        },
      },
    });
  };

  const renderActivities = (progress) => {
    const items = progress.slice(0, 4);
    if (!items.length) {
      elements.activities.innerHTML =
        '<li class="empty-list">Nenhuma atividade registrada ainda.</li>';
      return;
    }
    elements.activities.innerHTML = items
      .map((item) => {
        const title = item.atividades?.titulo || "Atividade";
        const subject =
          item.atividades?.trilhas?.materia || "Trilha de estudos";
        const done = Boolean(item.concluida);
        return `
          <li class="activity-item">
            <span class="activity-icon material-symbols-outlined">
              ${done ? "check_circle" : "play_circle"}
            </span>
            <div>
              <h3>${escapeHTML(title)}</h3>
              <p>${escapeHTML(subject)}</p>
            </div>
            <span class="activity-status${done ? "" : " pending"}">
              ${done ? "Concluída" : "Em andamento"}
            </span>
          </li>`;
      })
      .join("");
  };

  const loadDashboard = async () => {
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
      renderProfile(profile);
      renderMetrics({ notes, progress, redacoes, loans });
      renderRadar(notes);
      renderActivities(progress);
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
  document
    .querySelector("[data-menu-toggle]")
    ?.addEventListener("click", () =>
      document.body.classList.toggle("menu-open"),
    );
  document.addEventListener("DOMContentLoaded", loadDashboard);
})();
