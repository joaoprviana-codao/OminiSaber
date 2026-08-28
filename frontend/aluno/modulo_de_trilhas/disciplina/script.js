(() => {
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>'"]/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
          character
        ],
    );

  const slug = new URLSearchParams(window.location.search).get("materia");
  const disciplina = slug ? window.OMINI_DISCIPLINAS?.[slug] : null;

  if (!disciplina) {
    document.querySelector('[data-state="notfound"]').hidden = false;
    return;
  }

  // --- Tema: aplica as cores da disciplina como CSS custom properties ---
  const tema = disciplina.tema || {};
  const root = document.documentElement.style;
  Object.entries(tema).forEach(([key, value]) => root.setProperty(`--${key}`, value));

  // --- Cabeçalho e hero ---
  document.title = `${disciplina.nome} | EduTech`;
  document.querySelector("[data-title]").textContent = `${disciplina.nome} | EduTech`;
  document.querySelector("[data-nome]").textContent = disciplina.nome.toUpperCase();
  document.querySelector("[data-kicker]").textContent = disciplina.kicker || "";
  document.querySelector("[data-tagline]").textContent = disciplina.tagline || disciplina.nome;
  document.querySelector("[data-descricao]").textContent = disciplina.descricao || "";
  document.querySelector("[data-app]").hidden = false;

  // === Registry de widgets: 5 tipos cobrem as 16 disciplinas ===

  function renderEquationCheck(container, cfg) {
    container.innerHTML = `
      <div class="equation-controls">
        <label>Valor de x
          <input type="number" value="${cfg.valorInicial}" data-x />
        </label>
        <span data-check></span>
      </div>
      <p class="equation-feedback" data-feedback></p>`;
    const input = container.querySelector("[data-x]");
    const check = container.querySelector("[data-check]");
    const feedback = container.querySelector("[data-feedback]");
    const update = () => {
      const x = Number(input.value);
      const resultado = cfg.coef * x + cfg.const;
      check.textContent = cfg.template(x, resultado);
      feedback.textContent =
        resultado === cfg.alvo ? cfg.sucesso(x) : cfg.falha;
    };
    input.addEventListener("input", update);
    update();
  }

  function renderSliderCalc(container, cfg) {
    const slidersHTML = cfg.sliders
      .map(
        (s) => `
        <div class="slider-field">
          <span>${escapeHTML(s.label)}</span>
          <input type="range" min="${s.min}" max="${s.max}" value="${s.default}" data-slider="${s.key}" />
          <output data-output="${s.key}">${s.default}</output>
        </div>`,
      )
      .join("");
    const visualHTML =
      cfg.visual === "bar"
        ? `<div class="slider-visual" data-visual><i></i></div>`
        : cfg.visual === "triangle"
          ? `<div class="slider-visual is-triangle" data-visual><i></i></div>`
          : "";
    container.innerHTML = `
      ${cfg.descricao ? `<p class="widget-copy">${escapeHTML(cfg.descricao)}</p>` : ""}
      ${slidersHTML}
      ${visualHTML}
      <div class="slider-result">
        <span>${escapeHTML(cfg.resultLabel || "resultado")}</span>
        <strong data-result></strong>
      </div>
      ${cfg.formatText ? `<p class="widget-copy" data-format></p>` : ""}`;

    const values = {};
    cfg.sliders.forEach((s) => (values[s.key] = s.default));
    const resultEl = container.querySelector("[data-result]");
    const formatEl = container.querySelector("[data-format]");
    const visualEl = container.querySelector("[data-visual] i");

    const update = () => {
      const resultado = cfg.compute(values);
      resultEl.textContent = `${resultado} ${cfg.unit || ""}`.trim();
      if (formatEl) formatEl.textContent = cfg.formatText(values, resultado);
      if (visualEl && cfg.visual === "bar") {
        visualEl.style.width = `${Math.min(100, values[cfg.sliders[0].key] * 5)}%`;
      }
      if (visualEl && cfg.visual === "triangle") {
        const base = values.base ?? values[cfg.sliders[0].key];
        const altura = values.altura ?? values[cfg.sliders[1]?.key] ?? base;
        visualEl.style.borderLeftWidth = `${base * 10}px`;
        visualEl.style.borderRightWidth = `${base * 10}px`;
        visualEl.style.borderBottomWidth = `${altura * 16}px`;
      }
    };

    cfg.sliders.forEach((s) => {
      const input = container.querySelector(`[data-slider="${s.key}"]`);
      const output = container.querySelector(`[data-output="${s.key}"]`);
      input.addEventListener("input", () => {
        values[s.key] = Number(input.value);
        output.textContent = input.value;
        update();
      });
    });
    update();
  }

  function renderPickerInfo(container, cfg) {
    container.innerHTML = `
      ${cfg.bodyText ? `<p class="widget-copy">${escapeHTML(cfg.bodyText)}</p>` : ""}
      ${cfg.leadingQuote ? `<blockquote class="widget-quote">${escapeHTML(cfg.leadingQuote)}</blockquote>` : ""}
      <div class="picker-row layout-${cfg.layout || "row"}" data-picker></div>
      <div class="picker-output ${cfg.displayMode === "quote" ? "is-quote" : ""}" data-picker-output>
        ${escapeHTML(cfg.placeholder || "Escolha uma opção para começar.")}
      </div>`;
    const pickerEl = container.querySelector("[data-picker]");
    const outputEl = container.querySelector("[data-picker-output]");
    let defaultButton = null;

    cfg.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = item.label;
      if (cfg.layout === "swatches" && item.color) {
        button.style.setProperty("--swatch-color", item.color);
      }
      button.addEventListener("click", () => {
        pickerEl.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
        button.classList.add("selected");
        outputEl.innerHTML = item.title
          ? `<strong>${escapeHTML(item.title)}</strong>${escapeHTML(item.info)}`
          : escapeHTML(item.info);
      });
      pickerEl.appendChild(button);
      if (cfg.defaultKey && item.key === cfg.defaultKey) defaultButton = button;
    });

    if (defaultButton) defaultButton.click();
  }

  function renderFlashcards(container, cfg) {
    container.innerHTML = `
      <div class="card-face" data-face></div>
      <p class="card-translation" data-translation></p>
      <div class="card-actions">
        <button type="button" data-flip>Virar cartão</button>
        <button type="button" data-next>Próxima palavra</button>
      </div>`;
    let index = 0;
    let flipped = false;
    const face = container.querySelector("[data-face]");
    const translation = container.querySelector("[data-translation]");
    const render = () => {
      const card = cfg.cards[index];
      face.textContent = flipped ? card.back : card.front;
      translation.textContent = card.translation;
    };
    container.querySelector("[data-flip]").addEventListener("click", () => {
      flipped = !flipped;
      render();
    });
    container.querySelector("[data-next]").addEventListener("click", () => {
      index = (index + 1) % cfg.cards.length;
      flipped = false;
      render();
    });
    render();
  }

  function renderThesisCounter(container, cfg) {
    container.innerHTML = `
      <div class="thesis-field">
        <textarea placeholder="${escapeHTML(cfg.placeholder || "")}" data-draft></textarea>
      </div>
      <div class="thesis-actions">
        <button type="button" data-count>Contar palavras</button>
        <span data-result>0 palavras</span>
        ${cfg.labFuncional ? `<a class="thesis-lab-link" href="${cfg.labFuncional}">${escapeHTML(cfg.labLabel || "Abrir laboratório")} →</a>` : ""}
      </div>`;
    const draft = container.querySelector("[data-draft]");
    const result = container.querySelector("[data-result]");
    container.querySelector("[data-count]").addEventListener("click", () => {
      const count = draft.value.trim() ? draft.value.trim().split(/\s+/).length : 0;
      result.textContent = `${count} palavra${count === 1 ? "" : "s"}`;
    });
  }

  const widgetRenderers = {
    "equation-check": renderEquationCheck,
    "slider-calc": renderSliderCalc,
    "picker-info": renderPickerInfo,
    flashcards: renderFlashcards,
    "thesis-counter": renderThesisCounter,
  };

  // --- Renderiza o widget configurado para esta disciplina ---
  const widget = disciplina.widget;
  document.querySelector("[data-widget-kicker]").textContent = widget.kicker || "";
  document.querySelector("[data-widget-titulo]").textContent = widget.titulo || "";
  const widgetBody = document.querySelector("[data-widget-body]");
  const renderer = widgetRenderers[widget.type];
  if (renderer) {
    renderer(widgetBody, widget);
  } else {
    widgetBody.innerHTML = `<p class="widget-copy">Widget "${escapeHTML(widget.type)}" não implementado.</p>`;
  }

  // --- Trilhas e progresso: mesmo contrato público de sempre ---
  const trailsList = document.querySelector("[data-trails]");
  const progressEl = document.querySelector("[data-progress]");

  document.addEventListener("DOMContentLoaded", async () => {
    if (!window.OminiSaber?.configured) {
      trailsList.textContent = "Supabase não configurado.";
      return;
    }
    try {
      const [trails, progress] = await Promise.all([
        window.OminiSaber.listTrilhas(),
        window.OminiSaber.listStudentProgress(),
      ]);
      const pattern = disciplina.aliasPattern;
      const relevantTrails = trails.filter((item) => pattern.test(item.materia || ""));
      const relevantProgress = progress.filter((item) =>
        pattern.test(item.atividades?.trilhas?.materia || ""),
      );
      progressEl.textContent = relevantProgress.length
        ? `${Math.round(
            (relevantProgress.filter((item) => item.concluida).length /
              relevantProgress.length) *
              100,
          )}%`
        : "0%";
      trailsList.innerHTML =
        relevantTrails
          .map(
            (item) => `
            <div class="trail-item">
              ${escapeHTML(item.titulo)}
              <span>${item.atividades?.length || 0} atividade${item.atividades?.length === 1 ? "" : "s"} · ${escapeHTML(item.tipo || "aprendizagem")}</span>
            </div>`,
          )
          .join("") || "Nenhuma trilha publicada.";
    } catch (error) {
      trailsList.textContent = error.message;
    }
  });
})();