(() => {
  const api = window.OminiSaber;

  const showToast = (message, type = "success") => {
    const element = document.querySelector("[data-toast]");
    element.textContent = message;
    element.className = `toast visible ${type}`;
    window.clearTimeout(element.timer);
    element.timer = window.setTimeout(() => {
      element.className = "toast";
    }, 4500);
  };

  const loadStats = async () => {
    const [booksResult, requestsResult] = await Promise.all([
      api.client
        .from("livros")
        .select("quantidade_total, quantidade_disponivel"),
      api.client
        .from("solicitacoes_emprestimo")
        .select("status, devolucao_prevista_em"),
    ]);

    if (booksResult.error) throw booksResult.error;
    if (requestsResult.error) throw requestsResult.error;

    const books = booksResult.data || [];
    const requests = requestsResult.data || [];
    document.querySelector("[data-total]").textContent = books.reduce(
      (sum, book) => sum + Number(book.quantidade_total || 0),
      0,
    );
    document.querySelector("[data-available]").textContent = books.reduce(
      (sum, book) => sum + Number(book.quantidade_disponivel || 0),
      0,
    );
    document.querySelector("[data-pending]").textContent = requests.filter(
      (request) => request.status === "pendente",
    ).length;
    document.querySelector("[data-overdue]").textContent = requests.filter(
      (request) =>
        request.status === "emprestado" &&
        new Date(request.devolucao_prevista_em) < new Date(),
    ).length;
  };

  document.addEventListener("ominisaber:ready", () => {
    loadStats().catch(() => {
      showToast("Não foi possível atualizar os indicadores agora.", "error");
    });
  });

  document.querySelector("[data-signout]")?.addEventListener("click", () => {
    api.signOut();
  });
})();