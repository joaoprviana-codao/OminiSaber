(() => {
  const themeKey = 'ominisaber_theme';
  const validThemes = ['light', 'dark'];
  const profileForm = document.querySelector('[data-profile-form]');
  const passwordForm = document.querySelector('[data-password-form]');
  const avatar = document.querySelector('[data-avatar]');
  const toast = document.querySelector('[data-toast]');
  let toastTimer;

  const getTheme = () => {
    const storedTheme = localStorage.getItem(themeKey);
    return validThemes.includes(storedTheme) ? storedTheme : 'light';
  };

  const notify = (message, type = 'success') => {
    toast.textContent = message;
    toast.className = `toast visible ${type}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.className = 'toast'; }, 5000);
  };

  const setTheme = (theme) => {
    if (!validThemes.includes(theme)) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
    localStorage.setItem('ominisaber-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  };

  const setAvatar = (url, name = '') => {
    const safeUrl = typeof url === 'string' && /^https?:\/\/[^\s]+$/i.test(url) ? url : '';
    avatar.textContent = safeUrl ? '' : (name.trim().slice(0, 2) || '--').toUpperCase();
    avatar.classList.toggle('has-image', Boolean(safeUrl));
    avatar.style.backgroundImage = safeUrl ? `url("${safeUrl.replace(/"/g, '')}")` : '';
  };

  const sanitizeName = (value) => value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  const sanitizeUrl = (value) => {
    const url = value.trim();
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  };

  const profileError = (error) => {
    if (/duplicate|already registered/i.test(error.message || '')) return 'Este e-mail já está sendo usado.';
    return error.message || 'Não foi possível atualizar o perfil.';
  };

  const loadProfile = async () => {
    const session = await window.OminiSaber?.getSession();
    if (!session) return;
    const profile = await window.OminiSaber.getProfile(session.user.id);
    const nameInput = profileForm.elements.nome;
    const emailInput = profileForm.elements.email;
    const avatarInput = profileForm.elements.avatar_url;
    nameInput.value = profile?.nome || session.user.user_metadata?.nome || '';
    emailInput.value = session.user.email || '';
    avatarInput.value = profile?.avatar_url || '';
    setAvatar(avatarInput.value, nameInput.value);
    if (validThemes.includes(profile?.tema_preferido) && !localStorage.getItem(themeKey)) setTheme(profile.tema_preferido);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const button = profileForm.querySelector('[type="submit"]');
    const nome = sanitizeName(profileForm.elements.nome.value);
    const email = profileForm.elements.email.value.trim().toLowerCase();
    const avatarUrl = sanitizeUrl(profileForm.elements.avatar_url.value);
    if (nome.length < 2) return notify('Informe um nome válido.', 'error');
    if (!profileForm.elements.email.checkValidity()) return notify('Informe um e-mail válido.', 'error');
    if (profileForm.elements.avatar_url.value.trim() && !avatarUrl) return notify('Informe uma URL de avatar válida.', 'error');
    button.disabled = true;
    try {
      const session = await window.OminiSaber.getSession();
      if (!session) throw new Error('Sessão expirada. Entre novamente.');
      const { error } = await window.OminiSaber.client.from('perfis').update({ nome, avatar_url: avatarUrl }).eq('id', session.user.id);
      if (error) throw error;
      if (email !== session.user.email) {
        const { error: authError } = await window.OminiSaber.client.auth.updateUser({ email });
        if (authError) throw authError;
      }
      profileForm.elements.nome.value = nome;
      profileForm.elements.avatar_url.value = avatarUrl || '';
      setAvatar(avatarUrl, nome);
      notify(email !== session.user.email ? 'Perfil salvo. Confirme o novo e-mail na sua caixa de entrada.' : 'Perfil atualizado com sucesso.');
    } catch (error) {
      notify(profileError(error), 'error');
    } finally {
      button.disabled = false;
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    const button = passwordForm.querySelector('[type="submit"]');
    const currentPassword = passwordForm.elements.current_password.value;
    const newPassword = passwordForm.elements.new_password.value;
    const confirmation = passwordForm.elements.confirm_password.value;
    if (newPassword.length < 6) return notify('A nova senha deve ter no mínimo 6 caracteres.', 'error');
    if (newPassword !== confirmation) return notify('A confirmação da senha não confere.', 'error');
    button.disabled = true;
    try {
      const session = await window.OminiSaber.getSession();
      if (!session?.user?.email) throw new Error('Sessão expirada. Entre novamente.');
      const { error: reauthError } = await window.OminiSaber.client.auth.signInWithPassword({ email: session.user.email, password: currentPassword });
      if (reauthError) throw new Error('Senha atual incorreta.');
      const { error } = await window.OminiSaber.client.auth.updateUser({ password: newPassword });
      if (error) throw error;
      passwordForm.reset();
      notify('Senha alterada com sucesso.');
    } catch (error) {
      notify(error.message || 'Não foi possível alterar a senha.', 'error');
    } finally {
      button.disabled = false;
    }
  };
// Não toque, nem eu sei oque eu fiz
  setTheme(getTheme());
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', async () => {
      const theme = button.dataset.themeChoice;
      setTheme(theme);
      const feedback = document.querySelector('[data-theme-feedback]');
      try {
        const session = await window.OminiSaber?.getSession();
        if (!session) throw new Error('Sessão expirada. Entre novamente.');
        const { error } = await window.OminiSaber.client.from('perfis').update({ tema_preferido: theme }).eq('id', session.user.id);
        if (error) throw error;
        feedback.textContent = 'Preferência sincronizada com sua conta.';
      } catch (error) {
        feedback.textContent = 'Tema salvo neste dispositivo; sincronização pendente.';
        notify(error.message || 'Não foi possível sincronizar o tema.', 'error');
      }
    });
  });
  document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
    document.querySelector(`[data-theme-choice="${nextTheme}"]`).click();
  });
  profileForm.addEventListener('submit', saveProfile);
  passwordForm.addEventListener('submit', savePassword);
  profileForm.elements.avatar_url.addEventListener('input', () => setAvatar(profileForm.elements.avatar_url.value, profileForm.elements.nome.value));
  profileForm.elements.nome.addEventListener('input', () => setAvatar(profileForm.elements.avatar_url.value, profileForm.elements.nome.value));
  loadProfile().catch((error) => notify(error.message || 'Não foi possível carregar o perfil.', 'error'));
})();
