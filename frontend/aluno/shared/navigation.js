(() => {
  const frontendIndex = window.location.pathname.indexOf('/frontend/');
  const frontendRoot = frontendIndex >= 0 ? window.location.pathname.slice(0, frontendIndex) + '/frontend/' : '/frontend/';
  const routes = {
    dashboard: `${frontendRoot}aluno/dashboard_principal/index.html`,
    inicio: `${frontendRoot}aluno/dashboard_principal/index.html`,
    trilhas: `${frontendRoot}aluno/modulo_de_trilhas/index.html`,
    redacao: `${frontendRoot}aluno/laboratorio_de_redacao/index.html`,
    evolucao: `${frontendRoot}aluno/minha_evolucao/code.html`,
    biblioteca: `${frontendRoot}aluno/biblioteca_digital/index.html`,
    configuracoes: `${frontendRoot}aluno/configuracoes/index.html`,
    login: `${frontendRoot}login/index.html`,
    error: `${frontendRoot}erro/code.html`,
    professor: `${frontendRoot}professor/dashboard/code.html`,
    bibliotecaria: `${frontendRoot}bibliotecaria/dashboard/code.html`,
    gestor: `${frontendRoot}gestor/dashboard/code.html`
  };

  const normalize = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const applyRoute = (link) => {
    const label = normalize(link.textContent);
    const routeKey = Object.keys(routes).find((key) => label.includes(key));

    if (routeKey) {
      link.href = routes[routeKey];
    }
  };

  const applyTheme = (theme) => {
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      const active = button.dataset.themeChoice === theme;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('theme-choice-active', active);
    });
  };

  const createThemeToggle = (container, extraClass = '') => {
    if (container.querySelector('[data-theme-toggle]')) return container.querySelector('[data-theme-toggle]');

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.themeToggle = 'true';
    button.className = `shared-theme-toggle ${extraClass}`.trim();
    button.setAttribute('aria-label', 'Alternar tema claro e escuro');
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">dark_mode</span>';
    button.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('edutech-theme', nextTheme);
      applyTheme(nextTheme);
    });
    container.appendChild(button);
    return button;
  };

  const setupHeaderTheme = () => {
    const headerActions = document.querySelector('header > div > div:last-child, header > div:last-child');
    if (!headerActions) return;

    const button = createThemeToggle(headerActions, 'header-theme-toggle');
    const firstAction = headerActions.querySelector('button:not([data-theme-toggle])');
    if (firstAction && button) headerActions.insertBefore(button, firstAction);
  };

  const setupSidebar = () => {
    const sidebar = document.querySelector('aside.h-screen.w-64.fixed, nav.h-screen.w-64.fixed');
    if (!sidebar) return;

    sidebar.dataset.sharedSidebar = 'true';
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.sidebarToggle = 'true';
    button.className = 'shared-sidebar-toggle';
    button.setAttribute('aria-label', 'Recolher menu lateral');
    button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu_open</span>';
    button.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('sidebar-collapsed');
      button.setAttribute('aria-label', collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral');
      button.querySelector('span').textContent = collapsed ? 'menu' : 'menu_open';
    });
    sidebar.prepend(button);

    const navigation = sidebar.querySelector('nav, ul, [role="navigation"]') || (sidebar.tagName === 'NAV' ? sidebar : null);
    if (navigation && !navigation.querySelector('[data-settings-link]')) {
      const link = document.createElement('a');
      link.href = routes.configuracoes;
      link.dataset.settingsLink = 'true';
      link.className = 'flex items-center gap-md px-4 py-3 text-on-surface-variant hover:bg-slate-50 rounded-lg transition-colors duration-200';
      link.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">settings</span><span class="font-label-md text-label-md">Configurações</span>';
      navigation.appendChild(link);
    }

    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'sidebar-edge-reveal';
    reveal.setAttribute('aria-label', 'Expandir menu lateral');
    reveal.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">school</span>';
    reveal.addEventListener('click', () => {
      document.body.classList.remove('sidebar-collapsed');
      button.setAttribute('aria-label', 'Recolher menu lateral');
      button.querySelector('span').textContent = 'menu_open';
    });
    document.body.appendChild(reveal);
  };

  const setupThemeChoices = () => {
    document.querySelectorAll('.grid-cols-3 button').forEach((button) => {
      const label = normalize(button.textContent);
      const theme = label.includes('escuro') ? 'dark' : label.includes('sistema') ? 'system' : label.includes('claro') ? 'light' : null;
      if (theme) {
        button.dataset.themeChoice = theme;
        button.addEventListener('click', () => {
          localStorage.setItem('edutech-theme', theme);
          applyTheme(theme);
        });
      }
    });
  };

  document.querySelectorAll('a[href="#"]').forEach(applyRoute);
  document.querySelectorAll('button').forEach((button) => {
    if (normalize(button.textContent).includes('settings')) {
      button.addEventListener('click', () => { window.location.href = routes.configuracoes; });
    }
  });

  setupSidebar();
  setupHeaderTheme();
  setupThemeChoices();
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = loginForm.querySelector('[name="email"]')?.value.trim();
      const password = loginForm.querySelector('[name="password"]')?.value;
      if (window.OminiSaber?.configured) {
        const submit = loginForm.querySelector('[type="submit"]');
        if (submit) submit.disabled = true;
        window.OminiSaber.signIn(email, password).then(async ({ data, error }) => {
          if (error) throw error;
          const profile = await window.OminiSaber.getProfile(data.user.id);
          window.location.href = routes[profile?.role] || routes.dashboard;
        }).catch((error) => {
          const message = /matr[ií]cula/i.test(error.message || '')
            ? 'Confira a matrícula informada ou use o e-mail cadastrado.'
            : 'Confira seus dados e tente novamente.';
          const loginError = document.getElementById('loginError');
          if (loginError) {
            loginError.textContent = message;
            loginError.classList.remove('hidden');
          }
          window.OminiSaber.notify(message, 'error');
          if (submit) submit.disabled = false;
        });
      } else {
        window.location.href = routes.dashboard;
      }
    });
  }
  const theme = localStorage.getItem('edutech-theme') || 'system';
  applyTheme(theme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('edutech-theme') || 'system') === 'system') applyTheme('system');
  });
})();
