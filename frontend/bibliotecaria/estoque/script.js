(() => {
  const api = window.OminiSaber;
  const state = {
    books: [],
    sections: [],
    exemplares: [],
    scannedIsbns: [],
    stream: null,
    detector: null,
    scanning: false,
    initialized: false,
  };
  const localKey = "ominisaber:bibliotecaria:estoque";
  const $ = (selector) => document.querySelector(selector);

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);

  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value;
  };

  const showToast = (message, type = "success") => {
    const element = $("[data-toast]");
    if (!element) return;
    element.textContent = message;
    element.className = `toast visible ${type}`;
    window.clearTimeout(element.timer);
    element.timer = window.setTimeout(() => {
      element.className = "toast";
    }, 4500);
  };

  const isOnline = () => Boolean(api?.configured && api.client);

  const readLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(localKey) || "{}") || {};
    } catch {
      return {};
    }
  };

  const saveLocal = () => {
    localStorage.setItem(localKey, JSON.stringify({
      books: state.books,
      sections: state.sections,
      exemplares: state.exemplares,
    }));
  };

  const newId = () => window.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random()}`;

  const loadData = async () => {
    if (!isOnline()) {
      const local = readLocal();
      state.books = local.books || [];
      state.sections = local.sections || [];
      state.exemplares = local.exemplares || [];
      showToast("Modo demonstração: dados salvos neste navegador.", "info");
      return;
    }

    const [booksResult, sectionsResult, copiesResult] = await Promise.all([
      api.client.from("livros").select("id, titulo, autor, genero, capa_url").order("titulo"),
      api.client.from("secoes_biblioteca").select("*").order("nome"),
      api.client.from("exemplares").select("id, livro_id, numero_serie, isbn_individual, secao_id, status").order("numero_serie"),
    ]);
    if (booksResult.error || sectionsResult.error || copiesResult.error) {
      throw booksResult.error || sectionsResult.error || copiesResult.error;
    }
    state.books = booksResult.data || [];
    state.sections = sectionsResult.data || [];
    state.exemplares = copiesResult.data || [];
  };

  const renderMetrics = () => {
    setText("[data-book-count]", state.books.length);
    setText("[data-copy-count]", state.exemplares.length);
    setText("[data-section-count]", state.sections.length);
    setText("[data-unassigned-count]", state.exemplares.filter((copy) => !copy.secao_id).length);
  };

  const renderSections = () => {
    const target = $("[data-sections]");
    if (!target) return;
    if (!state.sections.length) {
      target.innerHTML = '<p class="empty">Nenhuma seção criada ainda.</p>';
      return;
    }
    target.innerHTML = state.sections.map((section) => {
      const used = state.exemplares.filter((copy) => copy.secao_id === section.id).length;
      const capacity = Number(section.capacidade_maxima) || 1;
      const percentage = Math.min(100, Math.round((used / capacity) * 100));
      return `<div class="section-item">
        <strong>${escapeHtml(section.nome)}</strong>
        <span class="subject">${used}/${capacity}</span>
        <small>${escapeHtml(section.materia_associada || "Todos os gêneros")}</small>
        <div class="capacity"><span style="width: ${percentage}%"></span></div>
      </div>`;
    }).join("");
  };

  const renderCatalog = () => {
    const target = $("[data-catalog]");
    if (!target) return;
    const term = ($("[data-search]")?.value || "").toLowerCase().trim();
    const books = state.books.filter((book) => `${book.titulo} ${book.autor} ${book.genero}`.toLowerCase().includes(term));
    if (!books.length) {
      target.innerHTML = '<p class="empty">Nenhum título encontrado.</p>';
      return;
    }
    target.innerHTML = books.map((book) => {
      const copies = state.exemplares.filter((copy) => copy.livro_id === book.id);
      const rows = copies.length ? copies.map((copy) => {
        const section = state.sections.find((item) => item.id === copy.secao_id);
        return `<tr>
          <td><strong>${escapeHtml(copy.numero_serie)}</strong></td>
          <td>${escapeHtml(copy.isbn_individual || "Aguardando leitura")}</td>
          <td><span class="status ${escapeHtml(copy.status || "disponivel")}">${escapeHtml(copy.status || "disponivel")}</span></td>
          <td>${escapeHtml(section?.nome || "Sem seção")}</td>
                  <td>${escapeHtml(section ? `Retirar na ${section.nome}` : "Atribuir uma seção")}</td>
        </tr>`;
      }).join("") : '<tr><td colspan="4">Nenhum exemplar físico cadastrado.</td></tr>';
      return `<article class="book-row">
        <div class="book-summary" data-expand>
          <div><strong>${escapeHtml(book.titulo)}</strong><small>Gênero: ${escapeHtml(book.genero || "Não informado")} · ${copies.length} exemplar(es)</small></div>
          <span class="subject">${escapeHtml(book.genero || "Não informado")}</span>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        <div class="book-details"><table class="copy-table"><thead><tr><th>Série</th><th>ISBN individual</th><th>Status</th><th>Localização</th></tr></thead><tbody>${rows}</tbody></table></div>
      </article>`;
    }).join("");
  };

  const render = () => {
    renderMetrics();
    renderSections();
    renderCatalog();
  };

  const insertOne = async (table, payload) => {
    if (!isOnline()) return { ...payload, id: newId() };
    const { data, error } = await api.client.from(table).insert(payload).select().single();
    if (error) throw error;
    return data;
  };

  const distributeCopies = async (copies, genero) => {
    let offset = 0;
    for (const section of state.sections) {
      const used = state.exemplares.filter((copy) => copy.secao_id === section.id).length;
      const remaining = Math.max(0, Number(section.capacidade_maxima) - used);
      const matchesGenre = !section.materia_associada || section.materia_associada.toLowerCase() === genero.toLowerCase();
      if (!matchesGenre || !remaining) continue;
      const selected = copies.slice(offset, offset + remaining);
      offset += selected.length;
      for (const copy of selected) {
        copy.secao_id = section.id;
        if (isOnline()) {
          const { error } = await api.client.from("exemplares").update({ secao_id: section.id }).eq("id", copy.id);
          if (error) throw error;
        }
      }
      if (offset === copies.length) break;
    }
  };

  const updateBatchPreview = () => {
    const quantity = Math.max(1, Number($("[data-quantity]")?.value || 1));
    const prefix = ($( "[data-prefix]")?.value || "9873").replace(/\D/g, "").padStart(4, "0").slice(0, 4);
    const preview = $(`[data-batch-preview]`);
    if (preview) preview.textContent = `Série gerada: ${prefix}-001 até ${prefix}-${String(quantity).padStart(3, "0")}`;
    updateScanProgress();
  };

  const updateScanProgress = () => {
    const quantity = Number($("[data-quantity]")?.value || 1);
    setText("[data-scan-current]", `Exemplar ${Math.min(state.scannedIsbns.length + 1, quantity)}`);
    setText("[data-scan-count]", `${state.scannedIsbns.length} de ${quantity} ISBNs lidos`);
  };

  const handleBookSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(form));
    const quantity = Number(values.quantidade);
    if (!button || !quantity || quantity < 1) return;
    button.disabled = true;
    try {
      const book = await insertOne("livros", {
        titulo: values.titulo.trim(),
        autor: values.autor.trim(),
        genero: values.genero,
        capa_url: values.capa_url.trim() || null,
        quantidade_total: quantity,
        quantidade_disponivel: quantity,
      });
      const prefix = values.prefixo.replace(/\D/g, "").padStart(4, "0").slice(0, 4);
      const copies = [];
      for (let index = 0; index < quantity; index += 1) {
        const copy = await insertOne("exemplares", {
          livro_id: book.id,
          numero_serie: `${prefix}-${String(index + 1).padStart(3, "0")}`,
          isbn_individual: state.scannedIsbns[index] || null,
          status: "disponivel",
          secao_id: null,
        });
        copies.push(copy);
      }
      state.books.push(book);
      state.exemplares.push(...copies);
      await distributeCopies(copies, values.genero);
      saveLocal();
      form.reset();
      $("[data-quantity]").value = 1;
      $("[data-prefix]").value = "9873";
      state.scannedIsbns = [];
      updateBatchPreview();
      render();
      showToast(`${quantity} exemplar(es) cadastrado(s) com sucesso.`);
    } catch (error) {
      showToast(error.message || "Não foi possível cadastrar o lote.", "error");
    } finally {
      button.disabled = false;
    }
  };

  const setupBookForm = () => {
    const form = $("[data-book-form]");
    if (!form) return;
    $("[data-quantity]")?.addEventListener("input", updateBatchPreview);
    $("[data-prefix]")?.addEventListener("input", updateBatchPreview);
    form.addEventListener("submit", handleBookSubmit);
  };

  const setupSections = () => {
    const modal = $("[data-section-modal]");
    const form = $("[data-section-form]");
    $("[data-section-open]")?.addEventListener("click", () => modal?.showModal());
    document.querySelectorAll("[data-modal-close]").forEach((button) => button.addEventListener("click", () => modal?.close()));
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      try {
        const section = await insertOne("secoes_biblioteca", {
          nome: values.nome.trim(),
          materia_associada: values.materia_associada.trim() || null,
          capacidade_maxima: Number(values.capacidade_maxima),
        });
        state.sections.push(section);
        saveLocal();
        event.currentTarget.reset();
        modal?.close();
        render();
        showToast("Seção criada com sucesso.");
      } catch (error) {
        showToast(error.message || "Não foi possível criar a seção.", "error");
      }
    });
  };

  const setupCatalog = () => {
    $("[data-search]")?.addEventListener("input", renderCatalog);
    $("[data-catalog]")?.addEventListener("click", (event) => {
      const summary = event.target.closest("[data-expand]");
      if (summary) summary.parentElement.classList.toggle("open");
    });
  };

  const stopScanner = () => {
    state.scanning = false;
    state.stream?.getTracks().forEach((track) => track.stop());
    state.stream = null;
    const video = $("[data-scanner-video]");
    if (video) video.srcObject = null;
  };

  const scanFrame = async () => {
    if (!state.scanning || !state.detector || !state.stream) return;
    try {
      const codes = await state.detector.detect($("[data-scanner-video]"));
      const value = codes[0]?.rawValue;
      const quantity = Number($("[data-quantity]")?.value || 1);
      if (value && state.scannedIsbns.length < quantity && !state.scannedIsbns.includes(value)) {
        state.scannedIsbns.push(value);
        updateScanProgress();
        showToast(`ISBN lido para o exemplar ${state.scannedIsbns.length}.`);
      }
      if (state.scannedIsbns.length >= quantity) {
        state.scanning = false;
        $("[data-scanner-status]").textContent = "Todos os ISBNs deste lote foram lidos.";
        return;
      }
    } catch {
      // A câmera pode não entregar um quadro legível em cada tentativa.
    }
    if (state.scanning) window.requestAnimationFrame(scanFrame);
  };

  const setupScanner = () => {
    const modal = $("[data-scanner-modal]");
    $("[data-scan-open]")?.addEventListener("click", () => {
      state.scannedIsbns = [];
      updateScanProgress();
      modal?.showModal();
    });
    $("[data-scanner-close]")?.addEventListener("click", () => {
      stopScanner();
      modal?.close();
    });
    $("[data-scanner-start]")?.addEventListener("click", async () => {
      if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        $("[data-scanner-status]").textContent = "Este navegador não oferece leitura por câmera. Cadastre os ISBNs manualmente depois.";
        showToast("Leitura por câmera indisponível neste navegador.", "error");
        return;
      }
      try {
        state.detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128"] });
        state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        $("[data-scanner-video]").srcObject = state.stream;
        $("[data-scanner-status]").textContent = "Câmera ativa. Aponte para o código do próximo exemplar.";
        state.scanning = true;
        scanFrame();
      } catch (error) {
        $("[data-scanner-status]").textContent = "Não foi possível acessar a câmera. Verifique a permissão do dispositivo.";
        showToast(error.message || "Câmera indisponível.", "error");
      }
    });
  };

  const initialize = async () => {
    if (state.initialized) return;
    state.initialized = true;
    setupBookForm();
    setupSections();
    setupCatalog();
    setupScanner();
    try {
      await loadData();
      render();
    } catch {
      const local = readLocal();
      state.books = local.books || [];
      state.sections = local.sections || [];
      state.exemplares = local.exemplares || [];
      render();
      showToast("Acervo online indisponível. Exibindo dados locais.", "info");
    }
  };

  document.addEventListener("ominisaber:ready", initialize);
  document.addEventListener("DOMContentLoaded", initialize);
  $("[data-signout]")?.addEventListener("click", () => api?.signOut());
})();
