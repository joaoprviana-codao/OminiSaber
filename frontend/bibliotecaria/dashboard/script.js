(() => {
  const previewMode = new URLSearchParams(location.search).get("preview") === "1";
  const api = () => window.OminiSaber;
  const demo = { pending: 6, pickup: 4, overdue: 3, available: 284 };
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  const toast = (message) => {
    const node = document.querySelector("[data-toast]"); node.textContent = message; node.classList.add("visible"); clearTimeout(node.timer); node.timer = setTimeout(() => node.classList.remove("visible"), 3200);
  };
  const render = (stats) => { setText("[data-pending]", stats.pending); setText("[data-pickup]", stats.pickup); setText("[data-overdue]", stats.overdue); setText("[data-available]", stats.available); };
  const load = async () => {
    if (previewMode || !api()?.configured) { render(demo); return; }
    try {
      const [{ data: books, error: bookError }, { data: requests, error: requestError }] = await Promise.all([
        api().client.from("livros").select("quantidade_disponivel"),
        api().client.from("solicitacoes_emprestimo").select("status,devolucao_prevista_em"),
      ]);
      if (bookError) throw bookError; if (requestError) throw requestError;
      render({
        pending: requests.filter((item) => item.status === "pendente").length,
        pickup: requests.filter((item) => item.status === "aprovado").length,
        overdue: requests.filter((item) => item.status === "emprestado" && new Date(item.devolucao_prevista_em) < new Date()).length,
        available: books.reduce((total, item) => total + Number(item.quantidade_disponivel || 0), 0),
      });
    } catch (error) { toast(error.message || "Não foi possível atualizar o resumo."); }
  };
  document.querySelector("[data-queue]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-queue-action]");
    if (!button) return;
    button.textContent = "Contato registrado"; button.disabled = true; button.closest("article").classList.add("resolved"); toast("Contato registrado na fila de acompanhamento.");
  });
  const search = document.querySelector("[data-global-search]");
  search?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !search.value.trim()) return;
    const dialog = document.querySelector("[data-search-dialog]");
    dialog.querySelector("[data-search-results]").innerHTML = `<article class="search-result"><strong>${search.value}</strong><span>Busca rápida pronta. Abra Empréstimos para consultar registros completos.</span></article>`;
    dialog.showModal();
  });
  document.querySelector("[data-menu-toggle]")?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.querySelector("[data-signout]")?.addEventListener("click", () => api()?.signOut());
  document.addEventListener("ominisaber:ready", load);
  load();
})();
