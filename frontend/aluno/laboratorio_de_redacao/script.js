/* ===== script.js ===== */

document.addEventListener('DOMContentLoaded', () => {
    initEditor();
    initThemeTabs();
    initThemeCards();
    initNavigation();
    initModals();
    initToasts();
    initHeaderActions();
});

/* ===== Editor ===== */
function initEditor() {
    const editor = document.getElementById('editor-content');
    const titleInput = document.getElementById('redacao-title');
    const wordCountSpan = document.getElementById('word-count');
    const saveIndicator = document.getElementById('save-indicator');
    let saveTimeout;
    let initialized = false;

    // Atualizar contagem de palavras
    function updateWordCount() {
        const text = editor.textContent.trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        wordCountSpan.textContent = words;
    }

    // Restaurar rascunho salvo
    function restoreDraft() {
        try {
            const draft = localStorage.getItem('redacao-draft');
            if (draft) {
                const { title, content, updatedAt } = JSON.parse(draft);
                if (title !== undefined) titleInput.value = title;
                if (content !== undefined) editor.innerHTML = content;
                if (updatedAt) {
                    saveIndicator.textContent = 'Rascunho restaurado';
                }
                updateWordCount();
            }
        } catch (e) {
            console.warn('Não foi possível restaurar o rascunho.', e);
        }
        initialized = true;
    }

    // Salvar rascunho
    function saveDraft() {
        const draft = {
            title: titleInput.value,
            content: editor.innerHTML,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('redacao-draft', JSON.stringify(draft));
        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        saveIndicator.textContent = `Rascunho Salvo às ${time}`;
        saveIndicator.style.animation = 'fadeInUp 0.3s ease';
        setTimeout(() => saveIndicator.style.animation = '', 300);
    }

    // Eventos de entrada
    editor.addEventListener('input', () => {
        updateWordCount();
        if (!initialized) return;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveDraft, 800);
    });

    titleInput.addEventListener('input', () => {
        if (!initialized) return;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveDraft, 800);
    });

    // Botões de formatação
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.dataset.command;
            editor.focus();
            document.execCommand(command, false, null);
            updateWordCount();
            // Mostrar feedback visual
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = '', 150);
        });
    });

    // Submissão
    const submitBtn = document.getElementById('submit-redacao');
    const submitModal = document.getElementById('submit-modal');
    const confirmSubmit = document.getElementById('confirm-submit');
    const modalTitle = document.getElementById('modal-title');
    const modalWordCount = document.getElementById('modal-word-count');

    submitBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const text = editor.textContent.trim();
        if (!title || !text) {
            showToast('Preencha o título e o texto antes de enviar.', 'error');
            return;
        }
        modalTitle.textContent = title;
        modalWordCount.textContent = wordCountSpan.textContent;
        openModal(submitModal);
    });

    confirmSubmit.addEventListener('click', () => {
        const originalText = confirmSubmit.innerHTML;
        confirmSubmit.disabled = true;
        confirmSubmit.innerHTML = '<span class="spinner"></span> Enviando...';

        setTimeout(() => {
            confirmSubmit.disabled = false;
            confirmSubmit.innerHTML = originalText;
            closeModal(submitModal);
            showToast('Redação enviada com sucesso!', 'success');

            // Limpar editor e rascunho
            titleInput.value = '';
            editor.innerHTML = '';
            updateWordCount();
            localStorage.removeItem('redacao-draft');
            saveIndicator.textContent = 'Rascunho Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }, 2000);
    });

    // Inicializar
    restoreDraft();
    updateWordCount();
}

/* ===== Banco de Temas ===== */
function initThemeTabs() {
    const tabs = document.querySelectorAll('.theme-tab');
    const cards = document.querySelectorAll('.theme-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter;

            cards.forEach(card => {
                const category = card.dataset.category;
                const shouldShow = filter === 'all' || category === filter;
                if (shouldShow) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeInUp 0.4s ease both';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

function initThemeCards() {
    const cards = document.querySelectorAll('.theme-card');
    const titleInput = document.getElementById('redacao-title');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const themeTitle = card.querySelector('.theme-title').textContent;
            titleInput.value = themeTitle;
            titleInput.focus();
            showToast('Tema selecionado! Comece a escrever.', 'info');
            document.querySelector('.editor-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
}

/* ===== Navegação ===== */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const bottomLinks = document.querySelectorAll('.bottom-nav-link');

    function activateLink(links, target) {
        links.forEach(link => {
            if (link === target) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateLink(sidebarLinks, link);
            showToast('Navegação em demonstração.', 'info');
        });
    });

    bottomLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateLink(bottomLinks, link);
            showToast('Navegação em demonstração.', 'info');
        });
    });

    // Botão "Falar com Tutor"
    const tutorBtn = document.querySelector('.tutor-btn');
    if (tutorBtn) {
        tutorBtn.addEventListener('click', () => {
            showToast('Tutor online disponível em breve.', 'info');
        });
    }

    // Botão "Ver todos" do banco de temas
    const seeAllBtn = document.querySelector('.see-all');
    if (seeAllBtn) {
        seeAllBtn.addEventListener('click', () => {
            showToast('Todos os temas serão exibidos em breve.', 'info');
        });
    }
}

/* ===== Modais ===== */
function initModals() {
    const overlays = document.querySelectorAll('.modal-overlay');

    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });

        overlay.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(overlay);
            });
        });
    });
}

function openModal(modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

/* ===== Toasts ===== */
function initToasts() {
    // Container já existe
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }, 3000);
}

/* ===== Ações do Header ===== */
function initHeaderActions() {
    const notifBtn = document.getElementById('notif-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');

    notifBtn.addEventListener('click', () => {
        showToast('Você tem 3 notificações não lidas.', 'info');
    });

    settingsBtn.addEventListener('click', () => {
        openModal(settingsModal);
    });
}