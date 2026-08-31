(() => {
  const mockBooks = [
    {
      id: "mock-dom-casmurro",
      titulo: "Dom Casmurro",
      autor: "Machado de Assis",
      materia: "Literatura Obrigatória",
      categoria: "Literatura Obrigatória",
      palavras_chave: "realismo, narrador, clássico",
      sinopse:
        "Bentinho revisita sua história e tenta reconstruir as relações, as suspeitas e as escolhas que marcaram sua vida.",
      paginas: 256,
      capa_url: "",
      pdf_url: "https://pt.wikisource.org/wiki/Dom_Casmurro",
    },
    {
      id: "mock-capitaes-areia",
      titulo: "Capitães da Areia",
      autor: "Jorge Amado",
      materia: "Literatura Obrigatória",
      categoria: "Literatura Obrigatória",
      palavras_chave: "modernismo, desigualdade, infância",
      sinopse:
        "A vida de um grupo de meninos nas ruas de Salvador revela vínculos, conflitos e as desigualdades do Brasil urbano.",
      paginas: 280,
      capa_url: "",
      pdf_url: "",
    },
    {
      id: "mock-fisica-movimento",
      titulo: "Física em Movimento",
      autor: "Coleção OminiSaber",
      materia: "Física",
      categoria: "Didáticos",
      palavras_chave: "força, energia, velocidade",
      sinopse:
        "Um guia visual para compreender movimento, energia e as leis que conectam teoria e experiências cotidianas.",
      paginas: 142,
      capa_url: "",
      pdf_url: "",
    },
    {
      id: "mock-biologia-celula",
      titulo: "A célula por dentro",
      autor: "Coleção OminiSaber",
      materia: "Biologia",
      categoria: "Apostilas",
      palavras_chave: "célula, genética, vida",
      sinopse:
        "Diagramas e explicações para investigar as estruturas celulares e os processos que sustentam a vida.",
      paginas: 96,
      capa_url: "",
      pdf_url: "",
    },
    {
      id: "mock-matematica-algebra",
      titulo: "Álgebra para pensar",
      autor: "Coleção OminiSaber",
      materia: "Matemática",
      categoria: "Didáticos",
      palavras_chave: "equações, álgebra, problemas",
      sinopse:
        "Problemas graduais, estratégias e exemplos para transformar relações algébricas em ferramentas de raciocínio.",
      paginas: 188,
      capa_url: "",
      pdf_url: "",
    },
    {
      id: "mock-quadrinhos-ciencia",
      titulo: "Ciência em quadrinhos",
      autor: "Núcleo de Divulgação Científica",
      materia: "Biologia",
      categoria: "HQ/Gibi Educativo",
      palavras_chave: "ciência, quadrinhos, curiosidade",
      sinopse:
        "Conceitos científicos ganham personagens e situações para tornar a investigação uma experiência divertida.",
      paginas: 64,
      capa_url: "",
      pdf_url: "",
    },
  ];
  const state = {
    books: [],
    readings: new Map(),
    selectedBook: null,
    filter: "todos",
    search: "",
    usingFallback: false,
  };
  const elements = {
    search: document.querySelector("[data-search]"),
    catalog: document.querySelector("[data-catalog]"),
    shelf: document.querySelector("[data-shelf]"),
    resultCount: document.querySelector("[data-result-count]"),
    readingCount: document.querySelector("[data-reading-count]"),
    dialog: document.querySelector("[data-dialog]"),
    toast: document.querySelector("[data-toast]"),
  };

  const api = () => window.OminiSaber;
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[character],
    );
  const normalize = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const showToast = (message) => {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(
      () => elements.toast.classList.remove("is-visible"),
      3200,
    );
  };
  const currentReading = (book) => state.readings.get(String(book.id));
  const getBookStatus = (book) => currentReading(book)?.status || "disponivel";
  const getStatusLabel = (book) =>
    ({ lendo: "Em leitura", concluido: "Concluído", disponivel: "Disponível" })[
      getBookStatus(book)
    ] || "Disponível";
  const getCover = (book, compact = false) => {
    const fallback = `<span class="material-symbols-outlined">menu_book</span>`;
    const coverClass = compact ? "shelf-cover" : "book-cover";
    const statusClass =
      getBookStatus(book) === "lendo"
        ? "reading"
        : getBookStatus(book) === "concluido"
          ? "done"
          : "";
    const image = book.capa_url
      ? `<img src="${escapeHTML(book.capa_url)}" alt="Capa de ${escapeHTML(book.titulo)}" onerror="this.remove()">`
      : "";
    return `
      <div class="${coverClass}">
        ${image}
        ${fallback}
        <span class="book-status ${statusClass}">${getStatusLabel(book)}</span>
      </div>`;
  };
  const filteredBooks = () =>
    state.books.filter((book) => {
      const query = normalize(state.search);
      const matchesSearch =
        !query ||
        normalize(
          `${book.titulo} ${book.autor} ${book.materia} ${book.categoria} ${book.palavras_chave}`,
        ).includes(query);
      const matchesFilter =
        state.filter === "todos" ||
        normalize(book.materia) === normalize(state.filter) ||
        normalize(book.categoria) === normalize(state.filter);
      return matchesSearch && matchesFilter;
    });
  const renderCatalog = () => {
    const books = filteredBooks();
    const resultLabel = books.length === 1 ? "material" : "materiais";
    elements.resultCount.textContent = `${books.length} ${resultLabel}`;
    elements.catalog.innerHTML = books.length
      ? books
          .map(
            (book) => `
              <article class="book-card">
                <button class="book-cover-button" type="button" data-book-id="${escapeHTML(book.id)}">
                  ${getCover(book)}
                </button>
                <h3>${escapeHTML(book.titulo)}</h3>
                <p class="book-author">${escapeHTML(book.autor)}</p>
                <div class="book-footer">
                  <span class="subject-tag">${escapeHTML(book.materia || book.categoria || "Material")}</span>
                  <button class="details-button" type="button" data-book-id="${escapeHTML(book.id)}">
                    Ver detalhes
                    <span class="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </article>`,
          )
          .join("")
      : '<p class="empty">Nenhum material encontrado para esta busca.</p>';
    bindBookButtons();
  };
  const renderShelf = () => {
    const readingBooks = state.books.filter((book) =>
      ["lendo", "concluido"].includes(getBookStatus(book)),
    );
    elements.readingCount.textContent = `${readingBooks.length} ${readingBooks.length === 1 ? "leitura" : "leituras"}`;
    elements.shelf.innerHTML = readingBooks.length
      ? readingBooks
          .map((book) => {
            const reading = currentReading(book);
            const progress = Number(reading?.progresso_pct || 0);
            const actionLabel =
              getBookStatus(book) === "concluido" ? "Rever" : "Continuar";
            return `
              <article class="shelf-card">
                ${getCover(book, true)}
                <div class="shelf-info">
                  <strong>${escapeHTML(book.titulo)}</strong>
                  <span>${progress}% concluído</span>
                  <div class="reading-bar">
                    <span style="width:${progress}%"></span>
                  </div>
                </div>
                <button class="continue-button" type="button" data-book-id="${escapeHTML(book.id)}">
                  ${actionLabel}
                </button>
              </article>`;
          })
          .join("")
      : '<p class="empty">Sua estante está esperando a primeira leitura.</p>';
    bindBookButtons();
  };
  const bindBookButtons = () =>
    document.querySelectorAll("[data-book-id]").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => openBook(button.dataset.bookId));
    });
  const openBook = (bookId) => {
    const book = state.books.find((item) => String(item.id) === String(bookId));
    if (!book) return;
    state.selectedBook = book;
    document.querySelector("[data-dialog-cover]").innerHTML = getCover(book);
    document.querySelector("[data-dialog-subject]").textContent =
      book.materia || book.categoria || "Material";
    document.querySelector("[data-dialog-title]").textContent = book.titulo;
    document.querySelector("[data-dialog-author]").textContent =
      book.autor || "Autor não informado";
    document.querySelector("[data-dialog-synopsis]").textContent =
      book.sinopse || "Sinopse ainda não cadastrada para este material.";
    document.querySelector("[data-dialog-pages]").textContent = book.paginas
      ? `${book.paginas} páginas`
      : "Não informado";
    document.querySelector("[data-dialog-category]").textContent =
      book.categoria || "Material de apoio";
    const reading = currentReading(book);
    const action = document.querySelector("[data-reading-action]");
    action.textContent =
      reading?.status === "lendo"
        ? "Marcar como concluído"
        : reading?.status === "concluido"
          ? "Concluído"
          : "Marcar como lendo";
    const link = document.querySelector("[data-material-link]");
    link.href = book.pdf_url || "#";
    link.setAttribute("aria-disabled", String(!book.pdf_url));
    link.classList.toggle("is-disabled", !book.pdf_url);
    elements.dialog.showModal();
  };
  const saveReading = async () => {
    const book = state.selectedBook;
    if (!book || state.usingFallback) {
      showToast("O modo catálogo não permite salvar leituras agora.");
      return;
    }
    const existing = currentReading(book);
    const nextStatus = existing?.status === "lendo" ? "concluido" : "lendo";
    const progress =
      nextStatus === "concluido" ? 100 : Number(existing?.progresso_pct || 0);
    try {
      const session = await api().getSession();
      if (!session) throw new Error("Sessão expirada. Entre novamente.");
      const payload = {
        aluno_id: session.user.id,
        livro_id: book.id,
        status: nextStatus,
        progresso_pct: progress,
        atualizado_em: new Date().toISOString(),
      };
      const { data, error } = await api()
        .client.from("leituras_aluno")
        .upsert(payload, { onConflict: "aluno_id,livro_id" })
        .select()
        .single();
      if (error) throw error;
      state.readings.set(String(book.id), data || payload);
      renderShelf();
      renderCatalog();
      openBook(book.id);
      showToast(
        nextStatus === "lendo"
          ? "Livro adicionado à sua estante."
          : "Leitura concluída. Parabéns!",
      );
    } catch (error) {
      showToast("Não foi possível salvar sua leitura agora.");
    }
  };
  const loadData = async () => {
    try {
      if (!api()?.configured || !api().client)
        throw new Error("Supabase indisponível");
      const [books, session] = await Promise.all([
        api().listLivros(),
        api().getSession(),
      ]);
      state.books = books?.length
        ? books.map((book) => ({
            ...book,
            categoria: book.categoria || "Didáticos",
            palavras_chave: book.palavras_chave || "",
          }))
        : mockBooks;
      if (!session) throw new Error("Sessão ausente");
      const { data, error } = await api()
        .client.from("leituras_aluno")
        .select("*")
        .eq("aluno_id", session.user.id);
      if (error) throw error;
      (data || []).forEach((reading) =>
        state.readings.set(String(reading.livro_id), reading),
      );
    } catch (error) {
      state.usingFallback = true;
      state.books = mockBooks;
      state.readings.set("mock-dom-casmurro", {
        livro_id: "mock-dom-casmurro",
        status: "lendo",
        progresso_pct: 42,
      });
    }
    renderShelf();
    renderCatalog();
  };
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderCatalog();
  });
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((item) => item.classList.toggle("is-active", item === button));
      renderCatalog();
    }),
  );
  document
    .querySelector("[data-close-dialog]")
    .addEventListener("click", () => elements.dialog.close());
  document
    .querySelector("[data-reading-action]")
    .addEventListener("click", saveReading);
  document
    .querySelector("[data-material-link]")
    .addEventListener("click", (event) => {
      if (event.currentTarget.classList.contains("is-disabled")) {
        event.preventDefault();
        showToast("Este material ainda não possui um link cadastrado.");
      }
    });
  document.addEventListener("DOMContentLoaded", loadData);
})();
