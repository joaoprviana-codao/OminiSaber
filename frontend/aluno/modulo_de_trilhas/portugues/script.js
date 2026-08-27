(() => {
  const api = () => window.OminiSaber;
  const progress = document.querySelector("[data-progress]");
  const trailList = document.querySelector("[data-trails]");
  const definitions = {
    contexto: "O entorno que dá contorno e intenção a uma mensagem.",
    sentido:
      "O efeito de significado produzido pela relação entre palavras e leitor.",
    perceber: "Observar com atenção para encontrar o que não está explícito.",
  };
  document.querySelectorAll("[data-word]").forEach((button) =>
    button.addEventListener("click", () => {
      document
        .querySelectorAll("[data-word]")
        .forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      document.querySelector("[data-word-definition]").textContent =
        definitions[button.dataset.word];
    }),
  );
  document
    .querySelector("[data-reading-mode]")
    .addEventListener("click", () =>
      document.body.classList.toggle("reading-focus"),
    );
  document.addEventListener("DOMContentLoaded", async () => {
    if (!api()?.configured) {
      trailList.innerHTML =
        '<p class="loading">Configure o Supabase para carregar sua trilha.</p>';
      return;
    }
    try {
      const [trails, progressItems] = await Promise.all([
        api().listTrilhas(),
        api().listStudentProgress(),
      ]);
      const relevant = trails.filter((item) =>
        /portugu[eê]s/i.test(item.materia || ""),
      );
      const done = progressItems.filter(
        (item) =>
          /portugu[eê]s/i.test(item.atividades?.trilhas?.materia || "") &&
          item.concluida,
      ).length;
      const total = progressItems.filter((item) =>
        /portugu[eê]s/i.test(item.atividades?.trilhas?.materia || ""),
      ).length;
      progress.textContent = total
        ? `${Math.round((done / total) * 100)}%`
        : "0%";
      trailList.innerHTML =
        relevant
          .slice(0, 3)
          .map(
            (item) =>
              `<div class="trail-item"><strong>${item.titulo}</strong><span>${item.atividades?.length || 0} atividades · ${item.tipo || "aprendizagem"}</span></div>`,
          )
          .join("") ||
        '<p class="loading">Nenhuma trilha de Português publicada.</p>';
    } catch (error) {
      trailList.innerHTML = `<p class="loading">${error.message}</p>`;
    }
  });
})();
