(() => {
  const api = window.OminiSaber;
  const previewMode = new URLSearchParams(window.location.search).get("preview") === "1";
  const previewRequests = [
    { id: "demo-1", status: "pendente", solicitado_em: "2026-08-30", perfis: { nome: "Camila Alves", turmas: { nome: "3º C" } }, livros: { titulo: "Quarto de Despejo", autor: "Carolina Maria de Jesus" } },
    { id: "demo-2", status: "aprovado", solicitado_em: "2026-08-30", perfis: { nome: "Pedro Lima", turmas: { nome: "1º A" } }, livros: { titulo: "O Cortiço", autor: "Aluísio Azevedo" } },
    { id: "demo-3", status: "emprestado", solicitado_em: "2026-08-21", devolucao_prevista_em: "2026-08-26", perfis: { nome: "Júlia Mendes", turmas: { nome: "2º B" } }, livros: { titulo: "Capitães da Areia", autor: "Jorge Amado" } },
    { id: "demo-4", status: "devolvido", solicitado_em: "2026-08-18", devolucao_prevista_em: "2026-08-28", perfis: { nome: "Rafael Nunes", turmas: { nome: "2º A" } }, livros: { titulo: "Vidas Secas", autor: "Graciliano Ramos" } },
  ];
  const toast = (message, type = "success") => {
    let element = document.querySelector("[data-toast]");
    if (!element) {
      element = document.createElement("div");
      element.dataset.toast = "";
      element.className = "toast";
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.className = `toast visible ${type}`;
    window.clearTimeout(element.timer);
    element.timer = window.setTimeout(() => {
      element.className = "toast";
    }, 4500);
  };
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
          new Date(value),
        )
      : "--";
  const getRequests = async (status) => {
    if (previewMode || !api?.configured) return previewRequests.filter((item) => status === "atrasado" ? item.status === "emprestado" : !status || item.status === status);
    let query = api.client
      .from("solicitacoes_emprestimo")
      .select(
        "*, livros(titulo, autor), perfis!solicitacoes_emprestimo_aluno_id_fkey(nome, turma_id, turmas(nome))",
      )
      .order("created_at", { ascending: false });
    if (status && status !== "atrasado") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
  const loadStats = async () => {
    if (previewMode || !api?.configured) {
      document.querySelector("[data-total]")?.replaceChildren("320");
      document.querySelector("[data-available]")?.replaceChildren("284");
      document.querySelector("[data-pending]")?.replaceChildren("6");
      document.querySelector("[data-overdue]")?.replaceChildren("3");
      return;
    }
    const [
      { data: books, error: bookError },
      { data: requests, error: requestError },
    ] = await Promise.all([
      api.client
        .from("livros")
        .select("quantidade_total, quantidade_disponivel"),
      api.client
        .from("solicitacoes_emprestimo")
        .select("status, devolucao_prevista_em"),
    ]);
    if (bookError) throw bookError;
    if (requestError) throw requestError;
    document.querySelector("[data-total]").textContent = books.reduce(
      (sum, item) => sum + item.quantidade_total,
      0,
    );
    document.querySelector("[data-available]").textContent = books.reduce(
      (sum, item) => sum + item.quantidade_disponivel,
      0,
    );
    document.querySelector("[data-pending]").textContent = requests.filter(
      (item) => item.status === "pendente",
    ).length;
    document.querySelector("[data-overdue]").textContent = requests.filter(
      (item) =>
        item.status === "emprestado" &&
        new Date(item.devolucao_prevista_em) < new Date(),
    ).length;
  };
  const action = async (rpc, id) => {
    if (previewMode || !api?.configured) {
      toast("Operação simulada com sucesso no modo de visualização.");
      window.dispatchEvent(new CustomEvent("library:refresh"));
      return;
    }
    const { data: session } = await api.client.auth.getSession();
    const args =
      rpc === "biblioteca_aprovar_solicitacao"
        ? { p_solicitacao_id: id, p_aprovado_por: session.session.user.id }
        : { p_solicitacao_id: id };
    const { error } = await api.client.rpc(rpc, args);
    if (error) throw error;
    toast("Operação concluída com sucesso.");
    window.dispatchEvent(new CustomEvent("library:refresh"));
  };
  const renderRequests = async (target, status, search = "") => {
    const requests = await getRequests(status);
    const term = search.toLowerCase().trim();
    const filtered = requests.filter((item) => {
      const matchesStatus =
        status !== "atrasado" ||
        (item.status === "emprestado" &&
          new Date(item.devolucao_prevista_em) < new Date());
      return (
        matchesStatus &&
        `${item.perfis?.nome} ${item.perfis?.turmas?.nome} ${item.livros?.titulo}`
          .toLowerCase()
          .includes(term)
      );
    });
    target.innerHTML = filtered.length
      ? filtered
          .map((item) => {
            const overdue =
              item.status === "emprestado" &&
              new Date(item.devolucao_prevista_em) < new Date();
            const label =
              item.status === "pendente"
                ? "Pendente"
                : item.status === "aprovado"
                  ? "Aguardando retirada"
                  : item.status === "emprestado"
                    ? overdue
                      ? "Atrasado"
                      : "Ativo"
                    : "Devolvido";
            const statusClass = overdue
              ? "danger"
              : item.status === "pendente"
                ? "warning"
                : "";
            const button =
              item.status === "pendente"
                ? `<button class="button secondary" data-action="approve" data-id="${item.id}">Aprovar</button>`
                : item.status === "aprovado"
                  ? `<button class="button" data-action="deliver" data-id="${item.id}">Confirmar entrega</button>`
                  : item.status === "emprestado"
                    ? `<button class="button danger" data-action="return" data-id="${item.id}">Dar baixa / devolver</button>`
                    : "";
            return `<tr><td><strong>${escape(item.perfis?.nome)}</strong><small>${escape(item.perfis?.turmas?.nome || "Turma não informada")}</small></td><td><strong>${escape(item.livros?.titulo)}</strong><small>${escape(item.livros?.autor)}</small></td><td><span class="badge ${statusClass}">${label}</span><small>${item.status === "emprestado" ? `Até ${date(item.devolucao_prevista_em)}` : date(item.solicitado_em)}</small></td><td>${button}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="4" class="empty">Nenhum registro encontrado.</td></tr>';
  };
  const bindActions = (root) =>
    root.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      button.disabled = true;
      const rpc = {
        approve: "biblioteca_aprovar_solicitacao",
        deliver: "biblioteca_confirmar_entrega",
        return: "biblioteca_registrar_devolucao",
      }[button.dataset.action];
      try {
        await action(rpc, button.dataset.id);
      } catch (error) {
        toast(error.message, "error");
        button.disabled = false;
      }
    });
  const setupManagement = () => {
    const table = document.querySelector("[data-requests]");
    if (!table) return;
    let current = "pendente";
    const search = document.querySelector("[data-search]");
    const render = () =>
      renderRequests(table, current, search.value).catch((error) =>
        toast(error.message, "error"),
      );
    document.querySelectorAll("[data-tab]").forEach((tab) =>
      tab.addEventListener("click", () => {
        current = tab.dataset.tab;
        document
          .querySelectorAll("[data-tab]")
          .forEach((item) => item.classList.toggle("active", item === tab));
        render();
      }),
    );
    search.addEventListener("input", render);
    bindActions(table);
    window.addEventListener("library:refresh", render);
    render();
  };
  const setupInventory = () => {
    const form = document.querySelector("[data-book-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button");
      button.disabled = true;
      const values = Object.fromEntries(new FormData(form));
      const total = Number(values.quantidade_total);
      try {
        const { error } = await api.client.from("livros").insert({
          titulo: values.titulo.trim(),
          autor: values.autor.trim(),
          isbn: values.isbn.trim() || null,
          materia: values.materia.trim() || "Geral",
          capa_url: values.capa_url.trim() || null,
          quantidade_total: total,
          quantidade_disponivel: total,
        });
        if (error) throw error;
        form.reset();
        toast("Título cadastrado no acervo.");
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  };
  const setupSettings = () => {
    const form = document.querySelector("[data-library-settings]");
    if (!form) return;
    if (previewMode || !api?.configured) return;
    api.client
      .from("configuracoes_biblioteca")
      .select("*")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data) {
          form.prazo_dias.value = data.prazo_dias;
          form.limite_livros.value = data.limite_livros;
        }
      });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const { error } = await api.client
        .from("configuracoes_biblioteca")
        .update({
          prazo_dias: Number(form.prazo_dias.value),
          limite_livros: Number(form.limite_livros.value),
        })
        .eq("id", true);
      if (error) toast(error.message, "error");
      else toast("Regras da biblioteca atualizadas.");
    });
  };
  const initialize = () => {
    loadStats().catch((error) => toast(error.message, "error"));
    setupManagement();
    setupInventory();
    setupSettings();
  };
  document.addEventListener("ominisaber:ready", initialize);
  if (previewMode || !api?.configured) initialize();
  document
    .querySelector("[data-signout]")
    ?.addEventListener("click", () => api.signOut());
})();
