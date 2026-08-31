(() => {
  const previewMode = new URLSearchParams(location.search).get("preview") === "1";
  const toast = document.querySelector("[data-toast]");
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.classList.remove("visible"), 3000);
  };
  document.querySelector("[data-menu-toggle]")?.addEventListener("click", (event) => {
    document.body.classList.toggle("menu-open");
    event.currentTarget.setAttribute("aria-expanded", String(document.body.classList.contains("menu-open")));
  });
  document.querySelector("[data-role-signout]")?.addEventListener("click", () => {
    if (previewMode) return showToast("No modo de demonstração, a sessão permanece ativa.");
    window.OminiSaber?.signOut();
  });
  document.querySelectorAll(".segmented button").forEach((button) => button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    showToast(`Período alterado para ${button.textContent.toLowerCase()}.`);
  }));
  window.OminiProfessor = { previewMode, showToast };
})();
