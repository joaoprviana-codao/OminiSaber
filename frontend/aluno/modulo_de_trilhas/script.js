(() => {
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
          character
        ],
    );

  const renderGrid = () => {
    const grid = document.querySelector("[data-discipline-grid]");
    const disciplinas = window.OMINI_DISCIPLINAS || {};
    const entries = Object.entries(disciplinas).sort(
      ([, a], [, b]) => Number(a.numero) - Number(b.numero),
    );
    document.querySelector("[data-total-count]").textContent = entries.length;
    grid.innerHTML = entries
      .map(
        ([slug, disciplina]) => `
        <a
          class="discipline-card ${escapeHTML(disciplina.categoria)}"
          data-discipline
          data-category="${escapeHTML(disciplina.categoria)}"
          href="../disciplina/index.html?materia=${encodeURIComponent(slug)}"
        >
          <span class="card-number">${escapeHTML(disciplina.numero)}</span>
          <span class="discipline-icon">${escapeHTML(disciplina.icone)}</span>
          <h2>${escapeHTML(disciplina.nome)}</h2>
          <p>${escapeHTML(disciplina.descricao)}</p>
          <span class="card-action"
            >Abrir percurso
            <span class="material-symbols-outlined">arrow_forward</span></span
          >
        </a>`,
      )
      .join("");
    bindCategoryFilter();
  };

  const bindCategoryFilter = () => {
    document.querySelectorAll("[data-category]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const category = button.dataset.category;
        document
          .querySelectorAll(".category-nav button")
          .forEach((item) => item.classList.toggle("is-active", item === button));
        document
          .querySelectorAll("[data-discipline]")
          .forEach((card) =>
            card.classList.toggle(
              "is-filtered",
              category !== "todos" && card.dataset.category !== category,
            ),
          );
      });
    });
  };

  document.addEventListener("DOMContentLoaded", async () => {
    renderGrid();
    if (!window.OminiSaber?.configured) return;
    const profile = await window.OminiSaber.getProfile().catch(() => null);
    const avatar = document.querySelector(".avatar");
    if (avatar && profile?.nome)
      avatar.textContent = profile.nome
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
  });
})();