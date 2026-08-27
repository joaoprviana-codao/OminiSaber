(() => {
  const base = document.querySelector("[data-base]");
  const height = document.querySelector("[data-height]");
  const result = document.querySelector("[data-result]");
  const update = () => {
    document.querySelector("[data-base-value]").textContent = base.value;
    document.querySelector("[data-height-value]").textContent = height.value;
    result.textContent = `${base.value * height.value} u²`;
  };
  base.addEventListener("input", update);
  height.addEventListener("input", update);
  document.addEventListener("DOMContentLoaded", async () => {
    const list = document.querySelector("[data-trails]");
    if (!window.OminiSaber?.configured) {
      list.textContent = "Configure o Supabase para carregar seu percurso.";
      return;
    }
    try {
      const [trails, progress] = await Promise.all([
        window.OminiSaber.listTrilhas(),
        window.OminiSaber.listStudentProgress(),
      ]);
      const items = progress.filter((item) =>
        /matemática/i.test(item.atividades?.trilhas?.materia || ""),
      );
      const done = items.filter((item) => item.concluida).length;
      document.querySelector("[data-progress]").textContent =
        `${items.length ? Math.round((done / items.length) * 100) : 0}%`;
      list.innerHTML =
        trails
          .filter((item) => /matemática/i.test(item.materia || ""))
          .slice(0, 3)
          .map(
            (item) =>
              `<div class="trail-item"><strong>${item.titulo}</strong><span>${item.atividades?.length || 0} desafios</span></div>`,
          )
          .join("") || "Nenhuma trilha publicada.";
    } catch (error) {
      list.textContent = error.message;
    }
  });
})();
