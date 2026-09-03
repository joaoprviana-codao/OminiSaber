(() => {
  const groups = [
    [
      "Gestão acadêmica",
      ["dashboard", "turmas", "alunos", "professores", "vinculos"],
    ],
    ["Currículo e conteúdos", ["descritores", "conteudos-publicados"]],
    ["Segurança e acessos", ["acessos", "auditoria"]],
    ["Configurações", ["perfil"]],
  ];
  const nav = document.querySelector(".manager-nav");
  if (nav) {
    const links = [...nav.querySelectorAll("a")];
    nav.innerHTML = "";
    groups.forEach(([title, keys]) => {
      const box = document.createElement("div");
      box.className = "manager-nav-group";
      box.innerHTML = `<div class="manager-nav-title">${title}</div>`;
      keys.forEach((key) => {
        const link = links.find(
          (a) =>
            a.getAttribute("href")?.includes(`/${key}/`) ||
            (key === "dashboard" &&
              a.getAttribute("href")?.includes("/dashboard/")),
        );
        if (link) box.append(link);
      });
      nav.append(box);
    });
  }
  if (document.body.dataset.managerPage === "dashboard") {
    const h1 = document.querySelector(".title-wrap h1");
    if (h1) {
      const hour = new Date().getHours();
      h1.textContent = `${hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"}, Gestor`;
    }
    const actions = document.querySelector(".header-actions");
    if (actions && !actions.querySelector(".new-account")) {
      const link = document.createElement("a");
      link.className = "btn btn-primary new-account";
      link.href = "../acessos/index.html";
      link.innerHTML =
        '<span class="material-symbols-rounded">add</span> Nova conta';
      actions.append(link);
    }
  }

  window.renderManagerExecutiveDashboard = async ({
    api,
    content,
    route,
    icon,
    esc,
  }) => {
    const data = await api().getManagerOverview();
    const students = data.profiles.filter((x) => x.role === "aluno");
    const teachers = data.profiles.filter((x) => x.role === "professor");
    const activeStudents = students.filter((x) => x.ativo !== false);
    const linksByTeacher = new Set(data.links.map((x) => x.professor_id));
    const coveredCodes = new Set(
      data.trails
        .filter((x) => x.publicada && x.descritor_sedu)
        .map((x) => x.descritor_sedu),
    );
    const covered = data.descriptors.filter((x) =>
      coveredCodes.has(x.codigo),
    ).length;
    const coverage = data.descriptors.length
      ? Math.round((covered / data.descriptors.length) * 100)
      : 0;
    const components = [
      ["Português", "portugues_literatura"],
      ["Matemática", "matematica"],
      ["Física", "fisica"],
      ["Redação", "redacao"],
      ["Administração", "administracao"],
      ["Informática", "informatica"],
    ].map(([label, code]) => {
      const all = data.descriptors.filter((x) => x.materia_codigo === code),
        done = all.filter((x) => coveredCodes.has(x.codigo));
      return {
        label,
        code,
        total: all.length,
        covered: done.length,
        percent: all.length ? Math.round((done.length / all.length) * 100) : 0,
      };
    });
    const priorities = [
      {
        icon: "group_off",
        label: "Alunos sem turma",
        detail: "Necessitam de alocação",
        count: students.filter((x) => !x.turma_id).length,
        color: "red",
        to: "alunos",
      },
      {
        icon: "person_alert",
        label: "Professores sem vínculo",
        detail: "Necessitam de alocação",
        count: teachers.filter((x) => !linksByTeacher.has(x.id)).length,
        color: "orange",
        to: "vinculos",
      },
      {
        icon: "menu_book",
        label: "Descritores sem conteúdo",
        detail: "Aguardam publicação",
        count: data.descriptors.filter((x) => !coveredCodes.has(x.codigo))
          .length,
        color: "yellow",
        to: "descritores",
      },
      {
        icon: "lock_reset",
        label: "Redefinições de acesso",
        detail: "Solicitações pendentes",
        count: data.accesses.filter((x) => x.status === "pendente").length,
        color: "blue",
        to: "acessos",
      },
    ];
    const audit = await api()
      .listManagerAudit()
      .catch(() => []);
    const totalPriority = priorities.reduce((sum, x) => sum + x.count, 0);
    content().innerHTML = `<section class="executive-kpis">
      <a class="executive-kpi" href="${route("alunos")}"><span class="kpi-icon">${icon("groups")}</span><span class="kpi-copy"><small>Alunos ativos</small><span class="kpi-value">${activeStudents.length}</span><span>${students.length} matriculados</span></span></a>
      <a class="executive-kpi" href="${route("turmas")}"><span class="kpi-icon blue">${icon("co_present")}</span><span class="kpi-copy"><small>Turmas ativas</small><span class="kpi-value">${data.classes.length}</span><span>Ano letivo 2026</span></span></a>
      <a class="executive-kpi" href="${route("professores")}"><span class="kpi-icon purple">${icon("person")}</span><span class="kpi-copy"><small>Professores</small><span class="kpi-value">${teachers.length}</span><span>${linksByTeacher.size} com vínculo</span></span></a>
      <a class="executive-kpi" href="${route("descritores")}"><span class="kpi-icon green">${icon("verified")}</span><span class="kpi-copy"><small>Descritores cobertos</small><span class="kpi-value">${coverage}%</span><span>${covered} de ${data.descriptors.length}</span></span></a>
    </section><div class="executive-grid"><section class="coverage-card"><div class="card-head"><h2>Cobertura de descritores por componente curricular ${icon("info")}</h2><select class="field executive-filter" id="chart-mode"><option value="percent">% de cobertura</option><option value="count">Conteúdos publicados</option></select></div><div class="coverage-chart" id="coverage-chart"><div class="chart-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>${components.map((x) => `<button class="bar-item" data-code="${x.code}" title="${esc(x.label)}: ${x.percent}%"><span class="bar-value">${x.percent}%</span><span class="bar" style="height:${Math.max(x.percent, 1)}%"></span><span class="bar-label">${esc(x.label)}</span></button>`).join("")}</div><a class="card-link" href="${route("descritores")}">Ver todos os componentes</a></section><aside class="priority-card"><div class="card-head"><h2>Fila de prioridades <span class="priority-count">${totalPriority}</span></h2></div><div class="priority-list">${priorities.map((x) => `<a class="priority-row" href="${route(x.to)}"><span class="priority-icon ${x.color}">${icon(x.icon)}</span><span><b>${x.label}</b><p>${x.detail}</p></span><span class="priority-number ${x.color}">${x.count}</span>${icon("chevron_right")}</a>`).join("")}</div><a class="card-link" href="${route("auditoria")}">Ver todas as pendências</a></aside></div><section class="activity-card"><div class="card-head"><h2>Atividades recentes</h2><a class="card-link" style="border:0;padding:0" href="${route("auditoria")}">Ver todas</a></div>${
      audit.length
        ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Data e hora</th><th>Evento</th><th>Detalhes</th><th>Usuário</th></tr></thead><tbody>${audit
            .slice(0, 5)
            .map(
              (x) =>
                `<tr><td>${new Date(x.created_at).toLocaleString("pt-BR")}</td><td><span class="audit-event"><i class="audit-dot"></i>${esc(x.acao)}</span></td><td>${esc(x.recurso)}${x.recurso_id ? ` · ${esc(x.recurso_id)}` : ""}</td><td>${esc(x.perfis?.nome || "Sistema")}</td></tr>`,
            )
            .join("")}</tbody></table></div>`
        : `<div class="activity-empty">${icon("history")}<p>As próximas ações administrativas aparecerão aqui.</p></div>`
    }</section>`;
    const mode = document.querySelector("#chart-mode");
    mode.addEventListener("change", () => {
      const countMode = mode.value === "count";
      const max = Math.max(1, ...components.map((x) => x.covered));
      document.querySelectorAll(".bar-item").forEach((button, index) => {
        const x = components[index],
          value = countMode ? x.covered : x.percent,
          height = countMode ? Math.round((value / max) * 100) : value;
        button.querySelector(".bar-value").textContent = countMode
          ? String(value)
          : `${value}%`;
        button.querySelector(".bar").style.height = `${Math.max(height, 1)}%`;
        button.title = `${x.label}: ${countMode ? `${value} conteúdo(s)` : `${value}%`}`;
      });
    });
  };
})();
