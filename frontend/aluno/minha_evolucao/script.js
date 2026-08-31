(() => {
  const previewMode = new URLSearchParams(location.search).get("preview") === "1";
  const api = () => window.OminiSaber;
  const state = { loading: document.querySelector('[data-state="loading"]'), error: document.querySelector('[data-state="error"]'), evolution: document.querySelector("[data-evolution]") };
  const milestones = {
    1: ["Curiosa", "Primeiro acesso e primeira atividade concluída.", "Concluído", "flag"],
    2: ["Leitora", "Três leituras iniciadas e uma finalizada.", "Concluído", "menu_book"],
    3: ["Exploradora", "Dez atividades em três áreas do conhecimento.", "Concluído", "science"],
    4: ["Investigadora", "24 atividades e quatro áreas do conhecimento exploradas.", "Atual", "explore"],
    5: ["Especialista", "Alcance 2.000 XP e domínio acima de 75% em três matérias.", "Próximo", "psychology"],
    6: ["Mestre", "Complete 60 atividades e conquiste oito medalhas.", "Bloqueado", "workspace_premium"],
  };
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  const show = (name) => {
    state.loading.classList.toggle("is-hidden", name !== "loading");
    state.error.classList.toggle("is-hidden", name !== "error");
    state.evolution.classList.toggle("is-hidden", name !== "ready");
  };
  const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const renderProfile = (profile) => {
    const name = profile?.nome || "Marina Souza";
    setText("[data-profile-name]", name); setText("[data-initials]", initials(name)); setText("[data-greeting]", `Você está evoluindo, ${name.split(" ")[0]}`);
  };
  const renderRealProgress = ({ notes, progress, redacoes, loans }) => {
    const completed = progress.filter((item) => item.concluida).length;
    const xp = completed * 45 + redacoes.length * 80 + loans.filter((item) => item.status === "devolvido").length * 60;
    const level = Math.max(1, Math.min(6, Math.floor(xp / 500) + 1));
    const withinLevel = xp % 500;
    setText("[data-level-number]", level); setText("[data-level-title]", milestones[level][0]); setText("[data-xp-total]", xp.toLocaleString("pt-BR")); setText("[data-xp-detail]", `${500 - withinLevel} XP para o próximo nível`);
    const bar = document.querySelector("[data-xp-bar]"); bar.style.width = `${Math.round((withinLevel / 500) * 100)}%`; bar.parentElement.setAttribute("aria-valuenow", String(Math.round((withinLevel / 500) * 100)));
    if (notes.length) {
      const average = notes.reduce((sum, note) => sum + Number(note.valor || 0), 0) / notes.length;
      document.querySelector(".next-goal p:not(.eyebrow)").innerHTML = `Sua média atual é <strong>${average.toFixed(1).replace(".", ",")}</strong>. Continue praticando para ampliar seu domínio.`;
    }
  };
  const selectMilestone = (level) => {
    const info = milestones[level];
    document.querySelectorAll("[data-level]").forEach((button) => {
      const selected = button.dataset.level === String(level);
      button.setAttribute("aria-pressed", String(selected));
    });
    const detail = document.querySelector("[data-milestone-detail]");
    detail.querySelector(".material-symbols-outlined").textContent = info[3];
    detail.querySelector("strong").textContent = `${info[0]} · Nível ${level}`;
    detail.querySelector("p").textContent = info[1];
    detail.querySelector(".status").textContent = info[2];
  };
  const bind = () => {
    document.querySelector("[data-level-path]").addEventListener("click", (event) => {
      const button = event.target.closest("[data-level]");
      if (button) selectMilestone(Number(button.dataset.level));
    });
    document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-status]").forEach((card) => { card.hidden = button.dataset.filter !== "all" && card.dataset.status !== button.dataset.filter; });
    }));
    document.querySelector("[data-achievement-grid]").addEventListener("click", (event) => {
      const card = event.target.closest("[data-achievement]");
      if (!card) return;
      const text = card.classList.contains("locked") ? `${card.querySelector("strong").textContent}: continue avançando para desbloquear.` : `${card.querySelector("strong").textContent}: conquista adicionada à sua coleção.`;
      const toast = document.querySelector("[data-toast]"); toast.textContent = text; toast.classList.add("visible"); clearTimeout(toast.timer); toast.timer = setTimeout(() => toast.classList.remove("visible"), 3000);
    });
    const dialog = document.querySelector("[data-level-dialog]");
    document.querySelector("[data-level-open]").addEventListener("click", () => dialog.showModal());
    document.querySelector("[data-menu-toggle]").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  };
  const load = async () => {
    show("loading");
    try {
      if (previewMode || !api()?.configured) { renderProfile({ nome: "Marina Souza" }); show("ready"); return; }
      const session = await api().getSession();
      if (!session) { location.href = "../../login/index.html"; return; }
      const [profile, notes, progress, redacoes, loans] = await Promise.all([api().getProfile(session.user.id), api().listStudentNotes(), api().listStudentProgress(), api().listStudentRedacoes(), api().listStudentLoans()]);
      renderProfile(profile); renderRealProgress({ notes, progress, redacoes, loans }); show("ready");
    } catch (error) { document.querySelector("[data-error-message]").textContent = error.message || "Tente novamente."; show("error"); }
  };
  document.querySelector("[data-retry]").addEventListener("click", load);
  bind(); load();
})();
