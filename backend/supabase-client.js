(() => {
  const config = window.OMINI_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.anonKey && window.supabase);
  const client = configured ? window.supabase.createClient(config.url, config.anonKey) : null;

  const frontendIndex = window.location.pathname.indexOf('/frontend/');
  const frontendRoot = frontendIndex >= 0 ? window.location.pathname.slice(0, frontendIndex) + '/frontend/' : '/frontend/';
  const routes = {
    login: `${frontendRoot}login/index.html`,
    dashboard: `${frontendRoot}aluno/dashboard_principal/code.html`,
    error: `${frontendRoot}erro/code.html`
  };

  const currentPage = window.location.pathname;
  const isLoginPage = currentPage.includes('/login/');
  const isPublicAuthPage = isLoginPage || currentPage.includes('/cadastro/');

  const notify = (message, type = 'info') => {
    const event = new CustomEvent('ominisaber:notification', { detail: { message, type } });
    document.dispatchEvent(event);

    let element = document.querySelector('[data-backend-status]');
    if (!element) {
      element = document.createElement('div');
      element.dataset.backendStatus = 'true';
      element.className = 'backend-status';
      element.innerHTML = '<span class="backend-status-icon" aria-hidden="true"></span><div class="backend-status-content"><strong class="backend-status-title"></strong><p class="backend-status-message"></p></div><button type="button" class="backend-status-close" aria-label="Fechar mensagem">&times;</button>';
      element.querySelector('.backend-status-close').addEventListener('click', () => { element.hidden = true; });
      document.body.appendChild(element);
    }
    const titles = { error: 'Não foi possível concluir', warning: 'Atenção', success: 'Tudo certo', info: 'Informação' };
    const icons = { error: '!', warning: '!', success: '✓', info: 'i' };
    element.querySelector('.backend-status-title').textContent = titles[type] || titles.info;
    element.querySelector('.backend-status-message').textContent = message;
    element.querySelector('.backend-status-icon').textContent = icons[type] || icons.info;
    element.dataset.type = type;
    element.hidden = false;
    window.clearTimeout(element._hideTimer);
    element._hideTimer = window.setTimeout(() => { element.hidden = true; }, 5000);
  };

  const ensureConfigured = () => {
    if (!configured) {
      notify('Conexão Supabase não configurada. Preencha backend/supabase-config.js.', 'warning');
      return false;
    }
    return true;
  };

  const getSession = async () => {
    if (!configured) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  };

  const getProfile = async (userId) => {
    if (!ensureConfigured()) return null;
    const id = userId || (await getSession())?.user?.id;
    if (!id) return null;
    const { data, error } = await client.from('perfis').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  };

  const requireRole = async (allowedRoles) => {
    const profile = await getProfile();
    if (!profile || !allowedRoles.includes(profile.role)) {
      notify('Você não possui permissão para acessar esta área.', 'error');
      window.location.href = `${routes.error}?code=forbidden`;
      return false;
    }
    return true;
  };

  const signIn = async (email, password) => {
    if (!ensureConfigured()) return { data: null, error: new Error('Supabase não configurado') };
    let loginEmail = email;
    if (!email.includes('@')) {
      const { data, error } = await client.rpc('email_por_matricula', { matricula_input: email });
      if (error) return { data: null, error };
      if (!data) return { data: null, error: new Error('Matrícula não encontrada.') };
      loginEmail = data;
    }
    return client.auth.signInWithPassword({ email: loginEmail, password });
  };

  const signUp = async ({ nome, matricula, email, password }) => {
    if (!ensureConfigured()) return { data: null, error: new Error('Supabase não configurado') };
    return client.auth.signUp({
      email,
      password,
      options: { data: { nome, matricula } }
    });
  };

  const signOut = async () => {
    if (!configured) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
    window.location.href = routes.login;
  };

  const listTrilhas = async ({ tipo } = {}) => {
    if (!ensureConfigured()) return [];
    const profile = await getProfile();
    let query = client.from('trilhas').select('*, atividades(*)').eq('publicada', true).order('created_at', { ascending: false });
    if (profile?.turma_id) query = query.or(`turma_id.eq.${profile.turma_id},turma_id.is.null`);
    if (tipo) query = query.eq('tipo', tipo);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const listStudentNotes = async () => {
    if (!ensureConfigured()) return [];
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('notas').select('*').eq('aluno_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const listStudentProgress = async () => {
    if (!ensureConfigured()) return [];
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('progresso_atividades').select('*, atividades(id, trilha_id, titulo, trilhas(id, titulo, materia, tipo))').eq('aluno_id', session.user.id);
    if (error) throw error;
    return data || [];
  };

  const listStudentRedacoes = async () => {
    if (!ensureConfigured()) return [];
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('redacoes').select('*').eq('aluno_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const listStudentLoans = async () => {
    if (!ensureConfigured()) return [];
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('emprestimos').select('*, livros(id, titulo, autor)').eq('aluno_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };

  const listLivros = async (search = '') => {
    if (!ensureConfigured()) return [];
    let query = client.from('livros').select('*').order('titulo');
    if (search.trim()) query = query.or(`titulo.ilike.%${search.trim()}%,autor.ilike.%${search.trim()}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const createRedacao = async ({ titulo, texto, trilhaId = null }) => {
    if (!ensureConfigured()) return null;
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('redacoes').insert({
      aluno_id: session.user.id,
      titulo,
      texto,
      trilha_id: trilhaId,
      status: 'enviada',
      enviada_em: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  };

  const updateProfile = async ({ nome, email }) => {
    if (!ensureConfigured()) return null;
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('perfis').update({ nome }).eq('id', session.user.id).select().single();
    if (error) throw error;
    if (email && email !== session.user.email) {
      const { error: authError } = await client.auth.updateUser({ email });
      if (authError) throw authError;
      notify('Perfil salvo. Confirme o novo e-mail na sua caixa de entrada.', 'success');
    }
    return data;
  };

  const requestLoan = async (livroId) => {
    if (!ensureConfigured()) return null;
    const session = await getSession();
    if (!session) throw new Error('Sessão expirada. Entre novamente.');
    const { data, error } = await client.from('emprestimos').insert({ livro_id: livroId, aluno_id: session.user.id }).select().single();
    if (error) throw error;
    return data;
  };

  const bindProfileActions = () => {
    const saveButton = document.querySelector('[data-save-profile]');
    if (!saveButton || saveButton.dataset.bound) return;
    saveButton.dataset.bound = 'true';
    saveButton.addEventListener('click', async () => {
      const name = document.querySelector('[data-profile-name-input]')?.value.trim();
      const email = document.querySelector('[data-profile-email]')?.value.trim();
      if (!name) return notify('Informe seu nome completo.', 'error');
      saveButton.disabled = true;
      try {
        await updateProfile({ nome: name, email });
        notify('Perfil atualizado com sucesso.', 'success');
      } catch (error) {
        notify(error.message, 'error');
      } finally {
        saveButton.disabled = false;
      }
    });
  };

  const bindRedacaoActions = () => {
    const submitButton = document.querySelector('[data-submit-redacao]');
    if (!submitButton || submitButton.dataset.bound) return;
    submitButton.dataset.bound = 'true';
    submitButton.addEventListener('click', async () => {
      const title = document.querySelector('[data-redacao-title]')?.value.trim();
      const text = document.querySelector('[data-redacao-text]')?.value.trim();
      if (!title || !text) return notify('Preencha o título e o texto antes de enviar.', 'error');
      submitButton.disabled = true;
      try {
        await createRedacao({ titulo: title, texto: text });
        notify('Redação enviada para correção.', 'success');
      } catch (error) {
        notify(error.message, 'error');
      } finally {
        submitButton.disabled = false;
      }
    });
  };

  const bindLibraryActions = async () => {
    const articles = [...document.querySelectorAll('article')];
    if (!articles.length) return;
    const books = await listLivros();
    articles.forEach((article) => {
      const title = article.querySelector('h3')?.textContent.trim();
      const book = books.find((item) => item.titulo.toLowerCase() === title?.toLowerCase());
      const button = [...article.querySelectorAll('button')].find((item) => /solicitar empréstimo/i.test(item.textContent));
      if (!book || !button || button.dataset.bound) return;
      button.dataset.bound = 'true';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await requestLoan(book.id);
          button.textContent = 'Solicitação enviada';
          notify('Empréstimo solicitado. Aguarde a confirmação da bibliotecária.', 'success');
        } catch (error) {
          button.disabled = false;
          notify(error.message, 'error');
        }
      });
    });
  };

  const loadPageData = async () => {
    bindProfileActions();
    bindRedacaoActions();
    if (currentPage.includes('/biblioteca_digital/')) await bindLibraryActions();
    if (currentPage.includes('/modulo_de_trilhas/')) {
      const trilhas = await listTrilhas();
      document.querySelectorAll('[data-trilhas-count]').forEach((element) => { element.textContent = trilhas.length; });
    }
  };

  const mount = async () => {
    if (!configured) {
      if (isPublicAuthPage) return;
      notify('Modo demonstração: configure o Supabase para salvar e carregar dados.', 'warning');
      return;
    }

    const session = await getSession();
    if (!session && !isPublicAuthPage) {
      window.location.href = routes.login;
      return;
    }

    if (session) {
      const profile = await getProfile(session.user.id);
      document.querySelectorAll('[data-profile-name]').forEach((element) => {
        element.textContent = profile?.nome || session.user.email;
      });
      document.querySelectorAll('[data-profile-email]').forEach((element) => {
        element.value = session.user.email || '';
      });
      const roleByDirectory = currentPage.includes('/bibliotecaria/')
        ? ['bibliotecaria', 'gestor']
        : currentPage.includes('/professor/')
          ? ['professor', 'gestor']
          : currentPage.includes('/gestor/')
            ? ['gestor']
            : null;
      const requiredRole = document.body.dataset.requiredRole;
      const allowedRoles = requiredRole ? requiredRole.split(',').map((role) => role.trim()) : roleByDirectory;
      if (allowedRoles && !(await requireRole(allowedRoles))) return;
    }

    document.dispatchEvent(new CustomEvent('ominisaber:ready', { detail: { client, session } }));
    await loadPageData();
  };

  window.OminiSaber = {
    client,
    configured,
    notify,
    getSession,
    getProfile,
    requireRole,
    signIn,
    signUp,
    signOut,
    listTrilhas,
    listStudentNotes,
    listStudentProgress,
    listStudentRedacoes,
    listStudentLoans,
    listLivros,
    createRedacao,
    updateProfile,
    requestLoan
  };

  window.addEventListener('DOMContentLoaded', () => { mount().catch((error) => notify(error.message, 'error')); });
})();
