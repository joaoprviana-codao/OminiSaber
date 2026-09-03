(() => {
  const body = document.body;
  const menu = document.querySelector("[data-menu-toggle]");
  const toast = document.querySelector("[data-toast]");
  let toastTimer;
  const initials = (name = "") =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AL";
  window.StudentShell = {
    notify(message, type = "success") {
      if (!toast) return;
      toast.textContent = message;
      toast.className = `toast visible ${type}`;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.className = "toast";
      }, 3600);
    },
  };
  menu?.addEventListener("click", () => {
    body.classList.toggle("nav-open");
    menu.setAttribute(
      "aria-expanded",
      String(body.classList.contains("nav-open")),
    );
  });
  document.addEventListener("click", (event) => {
    if (
      innerWidth <= 900 &&
      body.classList.contains("nav-open") &&
      !event.target.closest(".app-sidebar") &&
      !event.target.closest("[data-menu-toggle]")
    )
      body.classList.remove("nav-open");
  });
  document.addEventListener("ominisaber:ready", async (event) => {
    if (!event.detail?.session) return;
    try {
      const profile = await window.OminiSaber.getProfile(
        event.detail.session.user.id,
      );
      const name = profile?.nome || event.detail.session.user.email || "Aluno";
      document.querySelectorAll("[data-shell-name]").forEach((node) => {
        node.textContent = name;
      });
      document.querySelectorAll("[data-shell-avatar]").forEach((node) => {
        node.textContent = profile?.avatar_url ? "" : initials(name);
        if (profile?.avatar_url)
          node.style.backgroundImage = `url("${String(profile.avatar_url).replace(/"/g, "")}")`;
      });
      document.querySelectorAll("[data-shell-class]").forEach((node) => {
        node.textContent = profile?.turmas?.serie
          ? `${profile.turmas.serie}º ano`
          : "Ensino Médio";
      });
    } catch {
      /* A página principal mostra o erro da operação relevante. */
    }
  });
})();
