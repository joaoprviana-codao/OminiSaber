(() => {
  const form = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('togglePassword');
  const loginError = document.getElementById('loginError');
  const submitButton = form?.querySelector('button[type="submit"]');
  const btnLabel = submitButton?.querySelector('.btn-label');
  const rememberInput = document.getElementById('remember-me');
  const savedEmail = localStorage.getItem('ominisaber-login-email');

  if (!form || !passwordInput || !passwordToggle || !loginError || !submitButton || !btnLabel) return;

  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    rememberInput.checked = true;
  }

  const showError = (message) => {
    loginError.textContent = message;
    loginError.hidden = false;

    // Reinicia a animação de "shake" mesmo se o erro já estiver visível
    loginError.classList.remove('is-shaking');
    // Força reflow para permitir reexecutar a animação
    void loginError.offsetWidth;
    loginError.classList.add('is-shaking');

    // Foca no erro para leitores de tela
    loginError.focus();
  };

  const clearError = () => {
    loginError.textContent = '';
    loginError.hidden = true;
    loginError.classList.remove('is-shaking');
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    btnLabel.textContent = isLoading ? 'Autenticando...' : 'Entrar';
  };

  const setSuccess = () => {
    submitButton.classList.remove('is-loading');
    submitButton.classList.add('is-success');
    btnLabel.textContent = 'Tudo certo! Redirecionando...';
  };

  passwordToggle.addEventListener('click', () => {
    const isShowing = passwordInput.type === 'text';
    passwordInput.type = isShowing ? 'password' : 'text';

    // Atualiza atributos de acessibilidade e ícone
    passwordToggle.setAttribute('aria-pressed', String(!isShowing));
    passwordToggle.setAttribute('aria-label', isShowing ? 'Mostrar senha' : 'Ocultar senha');
    passwordToggle.querySelector('.material-symbols-outlined').textContent = isShowing ? 'visibility' : 'visibility_off';
  });

  document.querySelector('[data-forgot-password]').addEventListener('click', (event) => {
    event.preventDefault();
    showError('A recuperação de senha será disponibilizada em breve.');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const formData = new FormData(form);
    const email = formData.get('email')?.toString().trim();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      showError('Por favor, preencha todos os campos.');
      return;
    }

    // Gerencia o "Lembrar-me"
    if (rememberInput.checked) {
      localStorage.setItem('ominisaber-login-email', email);
    } else {
      localStorage.removeItem('ominisaber-login-email');
    }

    setLoading(true);

    try {
      if (!window.OminiSaber?.configured) {
        throw new Error('Sistema indisponível no momento. Tente novamente mais tarde.');
      }

      const { data, error } = await window.OminiSaber.signIn(email, password);
      if (error) throw error;

      const profile = await window.OminiSaber.getProfile(data.user.id);

      const routes = {
        aluno: '../aluno/dashboard_principal/index.html',
        bibliotecaria: '../bibliotecaria/dashboard/index.html',
        gestor: '../gestor/dashboard/index.html'
      };

      const teacherRoutes = {
        matematica: '../professor/professor_matematica/dashboard/index.html',
        portugues: '../professor/professor_portugues/dashboard/index.html',
        tecnico_administracao: '../professor/professor_tecnico_administracao/dashboard/index.html',
        tecnico_informatica: '../professor/professor_tecnico_informatica/dashboard/index.html'
      };

      setSuccess();
      window.location.href = profile?.role === 'professor'
        ? teacherRoutes[profile?.tipo_professor] || '../erro/index.html?code=teacher-specialty'
        : routes[profile?.role] || routes.aluno;
      return;

    } catch (error) {
      const message = /matr[ií]cula/i.test(error.message || '')
        ? 'Credenciais incorretas. Verifique seu e-mail ou matrícula.'
        : 'Ocorreu um erro ao tentar entrar. Verifique seus dados.';

      showError(message);
      if (window.OminiSaber?.notify) window.OminiSaber.notify(message, 'error');

    } finally {
      // Só reverte o botão se não estivermos no caminho de sucesso (que já está redirecionando)
      if (!submitButton.classList.contains('is-success')) {
        setLoading(false);
      }
    }
  });
})();
