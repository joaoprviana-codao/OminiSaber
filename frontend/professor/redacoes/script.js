(() => {
  const teacher = () => window.OminiProfessor;
  const api = () => window.OminiSaber;
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  const submissions = [
    { id: "1", student: "Júlia Mendes", className: "3º C", title: "Desafios da educação midiática no Brasil", words: 687, time: "ontem às 19:42", text: ["A democratização do acesso à informação transformou a forma como os brasileiros participam da vida pública. Entretanto, a circulação acelerada de conteúdos falsos demonstra que o acesso, isoladamente, não garante uma sociedade bem informada.", "Nesse contexto, a educação midiática precisa integrar o cotidiano escolar. Ao compreender como fontes são produzidas e quais interesses podem orientar uma publicação, o estudante desenvolve autonomia para avaliar argumentos e reconhecer manipulações.", "Portanto, cabe às redes de ensino promover oficinas interdisciplinares de leitura crítica, com participação de professores e comunicadores, a fim de fortalecer o uso responsável das plataformas digitais e a cidadania."] },
    { id: "2", student: "Pedro Lima", className: "3º C", title: "Desafios da educação midiática no Brasil", words: 612, time: "ontem às 21:08", text: ["A presença constante das redes sociais tornou o acesso às notícias mais rápido, mas também aumentou a exposição a informações sem fonte.", "A escola pode atuar como espaço de formação crítica, ensinando os estudantes a comparar versões, identificar interesses e verificar a origem de conteúdos.", "Assim, secretarias de educação devem oferecer projetos de leitura midiática com atividades práticas e participação das famílias."] },
    { id: "3", student: "Camila Alves", className: "2º B", title: "Inclusão digital no cotidiano brasileiro", words: 574, time: "há 2 dias", text: ["A tecnologia conecta pessoas e serviços, porém parte da população ainda enfrenta barreiras de acesso e formação.", "O investimento em infraestrutura precisa ser acompanhado por iniciativas de letramento digital nas escolas e comunidades.", "Dessa forma, governos e instituições podem ampliar laboratórios públicos e cursos gratuitos para promover autonomia."] },
    { id: "4", student: "Rafael Santos", className: "2º A", title: "Cultura e lazer nas periferias", words: 641, time: "há 2 dias", text: ["O acesso à cultura é um direito, mas equipamentos e investimentos permanecem concentrados em algumas regiões das cidades.", "Projetos comunitários revelam a força criativa das periferias e devem receber apoio contínuo.", "Portanto, prefeituras devem descentralizar recursos e criar editais acessíveis para artistas e coletivos locais."] }
  ];
  let currentIndex = 0;
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const renderSubmission = (index) => {
    currentIndex = (index + submissions.length) % submissions.length;
    const item = submissions[currentIndex];
    document.querySelectorAll("[data-submission]").forEach((button) => button.classList.toggle("selected", button.dataset.id === item.id));
    document.querySelector("[data-essay-student]").textContent = item.student;
    document.querySelector("[data-essay-meta]").textContent = `${item.className} · ${item.words} palavras · enviada ${item.time}`;
    document.querySelector("[data-essay-title]").textContent = item.title;
    document.querySelector("[data-essay-text]").innerHTML = item.text.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
  };
  document.querySelectorAll("[data-submission]").forEach((button) => button.addEventListener("click", () => renderSubmission(submissions.findIndex((item) => item.id === button.dataset.id))));
  document.querySelector("[data-prev]")?.addEventListener("click", () => renderSubmission(currentIndex - 1));
  document.querySelector("[data-next]")?.addEventListener("click", () => renderSubmission(currentIndex + 1));
  const updateScore = () => {
    let total = 0;
    document.querySelectorAll("[data-score]").forEach((range) => { range.nextElementSibling.value = range.value; total += Number(range.value); });
    document.querySelector("[data-total-score]").textContent = total;
  };
  document.querySelectorAll("[data-score]").forEach((range) => range.addEventListener("input", updateScore));
  const tabs = [...document.querySelectorAll("[data-view]")];
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((item) => { const active = item === tab; item.classList.toggle("active", active); item.setAttribute("aria-selected", String(active)); });
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== tab.dataset.view));
  }));
  const applyFilters = () => {
    const search = document.querySelector("[data-search]").value.trim().toLowerCase();
    const className = document.querySelector("[data-class-filter]").value;
    document.querySelectorAll("[data-submission]").forEach((item) => {
      const matchesSearch = !search || item.textContent.toLowerCase().includes(search);
      const matchesClass = className === "all" || item.dataset.class === className;
      item.hidden = !(matchesSearch && matchesClass);
    });
  };
  document.querySelector("[data-search]")?.addEventListener("input", applyFilters);
  document.querySelector("[data-class-filter]")?.addEventListener("change", applyFilters);
  const promptDialog = document.querySelector("[data-prompt-dialog]");
  const promptFormGrid = promptDialog?.querySelector(".form-grid");
  if (promptFormGrid && !promptDialog.querySelector('[name="pinned"]')) {
    const pinnedLabel = document.createElement("label");
    pinnedLabel.className = "wide";
    pinnedLabel.innerHTML = '<span><input type="checkbox" name="pinned"> Fixar esta proposta no topo do laboratório dos alunos</span>';
    promptFormGrid.appendChild(pinnedLabel);
  }
  document.querySelectorAll("[data-prompt-open], [data-edit-prompt]").forEach((button) => button.addEventListener("click", () => promptDialog.showModal()));
  document.querySelector("[data-rubric-open]")?.addEventListener("click", () => document.querySelector("[data-rubric-dialog]").showModal());
  document.querySelector("[data-prompt-title]")?.addEventListener("input", (event) => {
    const marker = document.querySelector("[data-check-title] i");
    marker.textContent = event.target.value.trim().length > 12 ? "check_circle" : "radio_button_unchecked";
  });
  document.querySelector("[data-add-motivator]")?.addEventListener("click", (event) => {
    const label = document.createElement("label");
    label.innerHTML = 'Texto complementar<textarea name="motivator3" rows="3" placeholder="Inclua fonte e contexto."></textarea>';
    event.currentTarget.before(label);
    event.currentTarget.disabled = true;
  });
  const savePrompt = async (publish) => {
    const form = promptDialog.querySelector("form");
    const title = form.elements.title.value.trim();
    const command = form.elements.command.value.trim();
    if (publish && (title.length < 12 || command.length < 20)) {
      teacher()?.showToast("Complete um tema objetivo e um comando de produção antes de publicar.");
      return false;
    }
    const data = { title, command, category: form.elements.category.value, className: form.elements.class.value, deadline: form.elements.deadline.value || null, rubric: form.elements.rubric.value, motivators: [form.elements.motivator1.value, form.elements.motivator2.value].filter(Boolean), published: publish, pinned: Boolean(form.elements.pinned?.checked) };
    if (!preview && api()?.configured && api().createWritingPrompt) await api().createWritingPrompt(data);
    teacher()?.showToast(publish ? "Proposta publicada para a turma." : "Rascunho da proposta salvo.");
    promptDialog.close(publish ? "publish" : "draft");
    return true;
  };
  document.querySelector("[data-publish-prompt]")?.addEventListener("click", async (event) => { event.preventDefault(); await savePrompt(true); });
  document.querySelector("[data-save-prompt-draft]")?.addEventListener("click", async (event) => { event.preventDefault(); await savePrompt(false); });
  document.querySelector("[data-save-draft]")?.addEventListener("click", () => teacher()?.showToast("Correção salva como rascunho."));
  document.querySelector("[data-submit-correction]")?.addEventListener("click", async () => {
    const score = Number(document.querySelector("[data-total-score]").textContent);
    const feedback = document.querySelector("[data-feedback]").value.trim();
    if (feedback.length < 30) return teacher()?.showToast("Inclua uma devolutiva mais orientadora antes de enviar.");
    if (!preview && api()?.configured && api().correctEssay) await api().correctEssay(submissions[currentIndex].id, { score, feedback });
    teacher()?.showToast(`Redação devolvida para ${submissions[currentIndex].student} com ${score} pontos.`);
    renderSubmission(currentIndex + 1);
  });
  document.querySelectorAll("[data-duplicate]").forEach((button) => button.addEventListener("click", () => teacher()?.showToast("Proposta duplicada como rascunho.")));
  document.querySelector("[data-activity-suggestion]")?.addEventListener("click", () => teacher()?.showToast("Atividade de argumentação criada como rascunho."));
  if (location.hash === "#nova") setTimeout(() => promptDialog.showModal(), 100);
  updateScore();
})();
