(() => {
  const form = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('togglePassword');
  const loginError = document.getElementById('loginError');
  const submitButton = form?.querySelector('button[type="submit"]');
  const rememberInput = document.getElementById('remember-me');
  const savedEmail = localStorage.getItem('edutech-login-email');

  if (!form || !passwordInput || !passwordToggle || !loginError || !submitButton) return;

  if (savedEmail) {
    document.getElementById('email').value = savedEmail;
    rememberInput.checked = true;
  }

  const showError = (message) => {
    loginError.textContent = message;
    loginError.hidden = false;
    // Foca no erro para leitores de tela
    loginError.focus(); 
  };

  const clearError = () => {
    loginError.textContent = '';
    loginError.hidden = true;
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
      localStorage.setItem('edutech-login-email', email);
    } else {
      localStorage.removeItem('edutech-login-email');
    }

    // Estado de Loading
    submitButton.disabled = true;
    submitButton.textContent = 'Autenticando...';

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
        professor: '../professor/dashboard/code.html',
        gestor: '../gestor/dashboard/code.html'
      };
      
      window.location.href = routes[profile?.role] || routes.aluno;

    } catch (error) {
      const message = /matr[ií]cula/i.test(error.message || '')
        ? 'Credenciais incorretas. Verifique seu e-mail ou matrícula.'
        : 'Ocorreu um erro ao tentar entrar. Verifique seus dados.';
        
      showError(message);
      if (window.OminiSaber?.notify) window.OminiSaber.notify(message, 'error');
      
    } finally {
      // O bloco finally garante que o botão SEMPRE volte ao normal, mesmo se o try falhar
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar';
    }
  });
})();