(() => {
  const api = () => window.OminiSaber;
  const page = window.location.pathname.split('/').slice(-2, -1)[0];
  const currentPage = window.location.pathname;

  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const moneyNumber = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const empty = (message) => `<div class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500"><span class="material-symbols-outlined mb-2 text-3xl text-slate-400">inbox</span><p>${escapeHTML(message)}</p></div>`;
  const errorState = (message) => `<div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"><strong>Não foi possível carregar esta tela.</strong><p class="mt-1 text-sm">${escapeHTML(message)}</p><button data-retry class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Tentar novamente</button></div>`;
  const notify = (message, type = 'info') => api()?.notify(message, type);

  const layout = (title, description, content) => `<div class="mb-8"><h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">${escapeHTML(title)}</h1><p class="mt-2 font-body-lg text-body-lg text-slate-500">${escapeHTML(description)}</p></div>${content}`;
  const card = (title, body, extra = '') => `<section class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm ${extra}"><h2 class="font-headline-sm text-headline-sm text-on-surface">${escapeHTML(title)}</h2><div class="mt-4">${body}</div></section>`;

  const renderDashboard = async () => {
    const [profile, notes, progress, redacoes, loans] = await Promise.all([
      api().getProfile(), api().listStudentNotes(), api().listStudentProgress(), api().listStudentRedacoes(), api().listStudentLoans()
    ]);
    const average = notes.length ? notes.reduce((sum, note) => sum + Number(note.valor), 0) / notes.length : 0;
    const completed = progress.filter((item) => item.concluida).length;
    const activeLoan = loans.find((loan) => ['pendente', 'aguardando_retirada', 'ativo', 'atrasado'].includes(loan.status));
    const activity = progress.slice(0, 4).map((item) => `<li class="flex items-center justify-between border-b border-slate-100 py-3"><span class="text-sm text-slate-700">${escapeHTML(item.atividades?.titulo || 'Atividade')}</span><span class="text-xs font-semibold ${item.concluida ? 'text-emerald-600' : 'text-slate-500'}">${item.concluida ? 'Concluída' : 'Em andamento'}</span></li>`).join('') || '<li class="py-3 text-sm text-slate-500">Nenhuma atividade registrada.</li>';
    return layout(`Olá, ${profile?.nome || 'aluno'}`, 'Acompanhe seu progresso real na plataforma.', `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-xl bg-indigo-600 p-5 text-white"><p class="text-sm text-indigo-100">Média das notas</p><strong class="mt-2 block text-3xl">${moneyNumber(average)}</strong></div><div class="rounded-xl bg-white p-5 shadow-sm border border-slate-100"><p class="text-sm text-slate-500">Atividades concluídas</p><strong class="mt-2 block text-3xl text-slate-900">${completed}/${progress.length}</strong></div><div class="rounded-xl bg-white p-5 shadow-sm border border-slate-100"><p class="text-sm text-slate-500">Redações enviadas</p><strong class="mt-2 block text-3xl text-slate-900">${redacoes.length}</strong></div><div class="rounded-xl bg-white p-5 shadow-sm border border-slate-100"><p class="text-sm text-slate-500">Empréstimo atual</p><strong class="mt-2 block text-lg text-slate-900">${escapeHTML(activeLoan?.livros?.titulo || 'Nenhum')}</strong></div></div><div class="mt-6 grid gap-6 lg:grid-cols-2">${card('Atividades recentes', `<ul>${activity}</ul>`, 'h-full')}${card('Acesso rápido', '<div class="grid gap-3 sm:grid-cols-2"><a class="rounded-lg bg-indigo-50 p-4 font-semibold text-indigo-700" href="../modulo_de_trilhas/code.html">Abrir trilhas</a><a class="rounded-lg bg-emerald-50 p-4 font-semibold text-emerald-700" href="../laboratorio_de_redacao/code.html">Escrever redação</a><a class="rounded-lg bg-slate-100 p-4 font-semibold text-slate-700" href="../biblioteca_digital/code.html">Consultar biblioteca</a><a class="rounded-lg bg-slate-100 p-4 font-semibold text-slate-700" href="../minha_evolucao/index.html">Ver evolução</a></div>', 'h-full')}</div>`);
  };

  const renderTrilhas = async () => {
    const trilhas = await api().listTrilhas();
    const renderCards = (type = '') => {
      const filtered = type ? trilhas.filter((item) => item.tipo === type) : trilhas;
      return filtered.map((trilha) => `<article class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><span class="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">${escapeHTML(trilha.materia)}</span><span class="text-xs text-slate-500">${escapeHTML(trilha.descritor_sedu || 'Sem descritor')}</span></div><h2 class="mt-4 font-headline-sm text-headline-sm text-slate-900">${escapeHTML(trilha.titulo)}</h2><p class="mt-2 text-sm leading-6 text-slate-500">${escapeHTML(trilha.descricao || 'Sem descrição cadastrada.')}</p><div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span class="text-xs font-semibold text-slate-500">${trilha.atividades?.length || 0} atividades</span><button data-trilha-id="${trilha.id}" class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Abrir</button></div></article>`).join('') || empty('Nenhuma trilha publicada para sua turma.');
    };
    window.__ominisaberTrilhas = trilhas;
    return layout('Trilhas de estudo', 'Conteúdo publicado para sua turma, vindo do Supabase.', `<div class="mb-6 flex flex-wrap gap-2"><button data-trilha-filter="" class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Todas</button><button data-trilha-filter="obrigatoria" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Obrigatórias</button><button data-trilha-filter="aprendizagem" class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Aprendizagem</button></div><div data-trilha-list class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">${renderCards()}</div>`);
  };

  const renderBiblioteca = async () => {
    const [books, loans] = await Promise.all([api().listLivros(), api().listStudentLoans()]);
    const openLoan = loans.find((loan) => ['pendente', 'aguardando_retirada', 'ativo', 'atrasado'].includes(loan.status));
    const booksHTML = books.map((book) => `<article class="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><div class="flex-1"><span class="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">${book.quantidade_disponivel > 0 ? 'Disponível' : 'Indisponível'}</span><h2 class="mt-4 font-headline-sm text-headline-sm text-slate-900">${escapeHTML(book.titulo)}</h2><p class="mt-1 text-sm text-slate-500">${escapeHTML(book.autor)}</p><p class="mt-4 text-xs text-slate-500">${book.quantidade_disponivel} de ${book.quantidade_total} exemplares disponíveis</p></div><button data-book-id="${book.id}" ${book.quantidade_disponivel < 1 || openLoan ? 'disabled' : ''} class="mt-5 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">${openLoan ? 'Empréstimo em aberto' : book.quantidade_disponivel > 0 ? 'Solicitar empréstimo' : 'Indisponível'}</button></article>`).join('') || empty('Nenhum livro cadastrado no acervo.');
    return layout('Biblioteca digital', 'Consulte o acervo real e acompanhe suas solicitações.', `<div class="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5"><p class="text-sm font-semibold text-indigo-900">Empréstimo atual</p><p class="mt-1 text-sm text-indigo-700">${escapeHTML(openLoan?.livros?.titulo || 'Você não possui empréstimo em aberto.')}</p></div><div class="mb-5"><input data-book-search class="w-full rounded-lg border-slate-200 px-4 py-3" placeholder="Buscar por título ou autor"></div><div data-book-list class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">${booksHTML}</div>`);
  };

  const renderRedacao = async () => {
    const redacoes = await api().listStudentRedacoes();
    const history = redacoes.map((item) => `<li class="flex items-center justify-between border-b border-slate-100 py-3"><span class="text-sm text-slate-700">${escapeHTML(item.titulo)}</span><span class="text-xs font-semibold text-slate-500">${escapeHTML(item.status)}${item.nota !== null ? ` · ${item.nota}` : ''}</span></li>`).join('') || '<li class="py-3 text-sm text-slate-500">Nenhuma redação enviada.</li>';
    return layout('Laboratório de redação', 'Escreva e envie sua produção para correção.', `<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><section class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><label class="text-sm font-semibold text-slate-700">Título</label><input data-redacao-title class="mt-2 w-full rounded-lg border-slate-200 px-4 py-3" placeholder="Título da redação"><label class="mt-5 block text-sm font-semibold text-slate-700">Texto</label><textarea data-redacao-text class="mt-2 min-h-[22rem] w-full rounded-lg border-slate-200 px-4 py-3" placeholder="Comece a escrever..."></textarea><button data-submit-redacao class="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Enviar para correção</button></section>${card('Minhas redações', `<ul>${history}</ul>`)}</div>`);
  };

  const renderEvolucao = async () => {
    const [notes, progress, redacoes] = await Promise.all([api().listStudentNotes(), api().listStudentProgress(), api().listStudentRedacoes()]);
    const notesHTML = notes.map((note) => `<li class="flex justify-between border-b border-slate-100 py-3 text-sm"><span>${escapeHTML(note.materia)}</span><strong>${moneyNumber(note.valor)}</strong></li>`).join('') || '<li class="py-3 text-sm text-slate-500">Nenhuma nota lançada.</li>';
    const progressHTML = progress.map((item) => `<li class="border-b border-slate-100 py-3 text-sm"><div class="flex justify-between"><span>${escapeHTML(item.atividades?.trilhas?.titulo || item.atividades?.titulo || 'Atividade')}</span><strong>${item.concluida ? 'Concluída' : 'Em andamento'}</strong></div></li>`).join('') || '<li class="py-3 text-sm text-slate-500">Nenhum progresso registrado.</li>';
    return layout('Minha evolução', 'Boletim e histórico baseados nos seus registros reais.', `<div class="grid gap-6 lg:grid-cols-3">${card('Notas', `<ul>${notesHTML}</ul>`)}${card('Progresso', `<ul>${progressHTML}</ul>`)}${card('Redações', `<p class="text-3xl font-bold text-indigo-600">${redacoes.length}</p><p class="mt-2 text-sm text-slate-500">produção(ões) enviada(s)</p>`)}</div>`);
  };

  const renderConfiguracoes = async () => {
    const profile = await api().getProfile();
    return layout('Configurações', 'Atualize seus dados e preferências da conta.', `<div class="grid gap-6 lg:grid-cols-2"><section class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><h2 class="font-headline-sm text-headline-sm">Perfil</h2><label class="mt-5 block text-sm font-semibold text-slate-700">Nome</label><input data-profile-name-input value="${escapeHTML(profile?.nome || '')}" class="mt-2 w-full rounded-lg border-slate-200 px-4 py-3"><label class="mt-4 block text-sm font-semibold text-slate-700">E-mail</label><input data-profile-email value="${escapeHTML((await api().getSession())?.user?.email || '')}" type="email" class="mt-2 w-full rounded-lg border-slate-200 px-4 py-3"><button data-save-profile class="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Salvar alterações</button></section>${card('Aparência', '<div class="flex flex-wrap gap-2"><button data-student-theme="light" class="rounded-lg border px-4 py-2 text-sm">Claro</button><button data-student-theme="dark" class="rounded-lg border px-4 py-2 text-sm">Escuro</button><button data-student-theme="system" class="rounded-lg border px-4 py-2 text-sm">Sistema</button></div>')}</div>`);
  };

  const render = async () => {
    const main = document.querySelector('main');
    if (!main) return;
    if (!api()?.configured) {
      main.innerHTML = errorState('O Supabase não está configurado. Nenhum dado de demonstração é exibido.');
      return;
    }
    main.innerHTML = '<div class="flex min-h-[18rem] items-center justify-center text-slate-500"><span class="material-symbols-outlined mr-2 animate-spin">progress_activity</span>Carregando dados...</div>';
    try {
      const profile = await api().getProfile();
      document.querySelectorAll('aside span, aside p, aside h2, aside h3').forEach((element) => {
        if (['Ana Silva', 'Estudante Modelo'].includes(element.textContent.trim())) element.textContent = profile?.nome || 'Aluno';
        if (element.textContent.trim() === '3º Ano' || element.textContent.trim() === 'Ensino Médio') element.textContent = profile?.turma_id ? 'Turma cadastrada' : 'Turma não definida';
      });
      const views = { dashboard_principal: renderDashboard, modulo_de_trilhas: renderTrilhas, biblioteca_digital: renderBiblioteca, laboratorio_de_redacao: renderRedacao, minha_evolucao: renderEvolucao, configuracoes: renderConfiguracoes };
      if (!views[page]) return;
      main.innerHTML = await views[page]();
      bindActions();
    } catch (error) {
      main.innerHTML = errorState(error.message);
      main.querySelector('[data-retry]')?.addEventListener('click', render);
    }
  };

  const bindActions = () => {
    document.querySelector('[data-submit-redacao]')?.addEventListener('click', async (event) => { const button = event.currentTarget; const title = document.querySelector('[data-redacao-title]').value.trim(); const text = document.querySelector('[data-redacao-text]').value.trim(); if (!title || !text) return notify('Preencha título e texto.', 'error'); button.disabled = true; try { await api().createRedacao({ titulo: title, texto: text }); notify('Redação enviada.', 'success'); await render(); } catch (error) { notify(error.message, 'error'); button.disabled = false; } });
    document.querySelector('[data-save-profile]')?.addEventListener('click', async (event) => { const button = event.currentTarget; button.disabled = true; try { await api().updateProfile({ nome: document.querySelector('[data-profile-name-input]').value.trim(), email: document.querySelector('[data-profile-email]').value.trim() }); notify('Perfil atualizado.', 'success'); } catch (error) { notify(error.message, 'error'); } finally { button.disabled = false; } });
    document.querySelectorAll('[data-student-theme]').forEach((button) => button.addEventListener('click', () => { localStorage.setItem('ominisaber-theme', button.dataset.studentTheme); document.documentElement.classList.toggle('dark', button.dataset.studentTheme === 'dark'); notify('Tema atualizado.', 'success'); }));
    document.querySelectorAll('[data-book-id]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await api().requestLoan(button.dataset.bookId); notify('Empréstimo solicitado.', 'success'); await render(); } catch (error) { notify(error.message, 'error'); button.disabled = false; } }));
    document.querySelectorAll('[data-trilha-filter]').forEach((button) => button.addEventListener('click', () => { const cache = window.__ominisaberTrilhas || []; const list = document.querySelector('[data-trilha-list]'); const filtered = button.dataset.trilhaFilter ? cache.filter((item) => item.tipo === button.dataset.trilhaFilter) : cache; list.innerHTML = filtered.map((item) => `<article class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><span class="rounded bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">${escapeHTML(item.materia)}</span><h2 class="mt-4 font-headline-sm text-headline-sm">${escapeHTML(item.titulo)}</h2><p class="mt-2 text-sm text-slate-500">${escapeHTML(item.descricao || 'Sem descrição cadastrada.')}</p></article>`).join('') || empty('Nenhuma trilha encontrada.'); }));
    document.querySelector('[data-book-search]')?.addEventListener('input', async (event) => { const books = await api().listLivros(event.target.value); const list = document.querySelector('[data-book-list]'); list.innerHTML = books.map((book) => `<article class="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><h2 class="font-headline-sm">${escapeHTML(book.titulo)}</h2><p class="text-sm text-slate-500">${escapeHTML(book.autor)}</p><p class="mt-3 text-xs text-slate-500">${book.quantidade_disponivel} disponíveis</p></article>`).join('') || empty('Nenhum livro encontrado.'); });
  };

  document.addEventListener('ominisaber:ready', render);
  document.addEventListener('DOMContentLoaded', () => {
    if (!api()?.configured) render();
  });
})();
