// ============================================
// Dashboard Principal - Script
// ============================================

class DashboardController {
    constructor() {
        this.supabase = null;
        this.profile = null;
        this.notes = [];
        this.progress = [];
        this.redacoes = [];
        this.loans = [];
        this.activities = [];
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoading();
            
            // Inicializar Supabase
            await this.initializeSupabase();
            
            // Verificar autenticação
            await this.checkAuth();
            
            // Carregar dados
            await this.loadDashboardData();
            
            // Renderizar dashboard
            this.renderDashboard();
            
            this.hideLoading();
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            this.showError(error.message);
        }
    }
    
    async initializeSupabase() {
        if (typeof window.supabaseClient === 'undefined') {
            throw new Error('Cliente Supabase não configurado');
        }
        
        this.supabase = window.supabaseClient;
    }
    
    async checkAuth() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        
        if (error || !user) {
            window.location.href = '../../../frontend/login/code.html';
            throw new Error('Usuário não autenticado');
        }
        
        // Buscar perfil
        const { data: profile, error: profileError } = await this.supabase
            .from('perfis')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            throw new Error('Erro ao carregar perfil');
        }
        
        if (profile.role !== 'aluno') {
            window.location.href = this.getRoleRedirect(profile.role);
            throw new Error('Acesso não autorizado');
        }
        
        this.profile = profile;
        this.updateUserInfo();
    }
    
    getRoleRedirect(role) {
        const redirects = {
            'professor': '../../../frontend/professor/dashboard/code.html',
            'gestor': '../../../frontend/gestor/dashboard/code.html',
            'bibliotecaria': '../../../frontend/bibliotecaria/dashboard/code.html'
        };
        
        return redirects[role] || '../../../frontend/erro/code.html';
    }
    
    updateUserInfo() {
        const { nome, matricula } = this.profile;
        
        // Atualizar nome
        document.querySelectorAll('#user-name').forEach(el => {
            el.textContent = nome || 'Estudante';
        });
        
        // Atualizar saudação
        const firstName = nome?.split(' ')[0] || 'Estudante';
        document.querySelector('#greeting-text').textContent = `Bem-vinda de volta, ${firstName}! 👋`;
        
        // Atualizar avatar (placeholder se não houver)
        const avatarUrl = this.profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome || 'Aluno');
        document.querySelectorAll('#user-avatar, #mobile-avatar').forEach(img => {
            img.src = avatarUrl;
        });
    }
    
    async loadDashboardData() {
        const [notes, progress, redacoes, loans] = await Promise.all([
            this.loadNotes(),
            this.loadProgress(),
            this.loadRedacoes(),
            this.loadLoans()
        ]);
        
        this.notes = notes;
        this.progress = progress;
        this.redacoes = redacoes;
        this.loans = loans;
        
        this.processActivities();
    }
    
    async loadNotes() {
        const { data, error } = await this.supabase
            .from('notas')
            .select('*')
            .eq('aluno_id', this.profile.id)
            .order('created_at', { ascending: false });
        
        if (error) throw new Error('Erro ao carregar notas');
        return data || [];
    }
    
    async loadProgress() {
        const { data, error } = await this.supabase
            .from('progresso_atividades')
            .select(`
                *,
                atividades (
                    id,
                    titulo,
                    descricao,
                    ordem,
                    trilha_id
                )
            `)
            .eq('aluno_id', this.profile.id);
        
        if (error) throw new Error('Erro ao carregar progresso');
        return data || [];
    }
    
    async loadRedacoes() {
        const { data, error } = await this.supabase
            .from('redacoes')
            .select('*')
            .eq('aluno_id', this.profile.id)
            .order('created_at', { ascending: false });
        
        if (error) throw new Error('Erro ao carregar redações');
        return data || [];
    }
    
    async loadLoans() {
        const { data, error } = await this.supabase
            .from('emprestimos')
            .select(`
                *,
                livros (
                    titulo,
                    autor
                )
            `)
            .eq('aluno_id', this.profile.id)
            .in('status', ['pendente', 'aguardando_retirada', 'ativo', 'atrasado'])
            .limit(1);
        
        if (error) throw new Error('Erro ao carregar empréstimos');
        return data || [];
    }
    
    processActivities() {
        // Processar progresso para criar lista de atividades
        this.activities = this.progress
            .filter(p => !p.concluida && p.atividades)
            .map(p => ({
                id: p.atividade_id,
                titulo: p.atividades.titulo,
                materia: this.getMateriaFromActivity(p.atividades),
                progresso: this.calculateProgress(p),
                icon: this.getActivityIcon(p.atividades.titulo)
            }))
            .slice(0, 3);
    }
    
    getMateriaFromActivity(activity) {
        // Esta função deve buscar a matéria da trilha relacionada
        // Por enquanto, retorna um placeholder
        return 'Matéria';
    }
    
    calculateProgress(progress) {
        // Lógica para calcular progresso
        return 0;
    }
    
    getActivityIcon(title) {
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('matem') || lowerTitle.includes('geomet')) {
            return {
                icon: 'functions',
                type: 'math'
            };
        } else if (lowerTitle.includes('bio') || lowerTitle.includes('genét')) {
            return {
                icon: 'biotech',
                type: 'biology'
            };
        } else {
            return {
                icon: 'menu_book',
                type: 'history'
            };
        }
    }
    
    renderDashboard() {
        this.renderAverageGrade();
        this.renderCompletedTrails();
        this.renderLevel();
        this.renderProgressChart();
        this.renderActivities();
        this.renderWarningBanner();
        
        // Mostrar conteúdo
        document.querySelector('#dashboard-content').classList.remove('hidden');
    }
    
    renderAverageGrade() {
        const averageEl = document.querySelector('#average-grade');
        
        if (this.notes.length === 0) {
            averageEl.textContent = '--';
            return;
        }
        
        const total = this.notes.reduce((sum, note) => sum + note.valor, 0);
        const average = (total / this.notes.length).toFixed(1);
        
        averageEl.textContent = average;
    }
    
    renderCompletedTrails() {
        const trailsEl = document.querySelector('#completed-trails');
        
        if (this.progress.length === 0) {
            trailsEl.textContent = '--/--';
            return;
        }
        
        const completed = this.progress.filter(p => p.concluida).length;
        const total = this.progress.length;
        
        trailsEl.textContent = `${completed}/${total}`;
    }
    
    renderLevel() {
        const levelEl = document.querySelector('#user-level');
        const xpEl = document.querySelector('#user-xp');
        
        // Nível baseado na média de notas (placeholder)
        if (this.notes.length === 0) {
            levelEl.textContent = 'Lvl --';
            xpEl.textContent = '+0 XP hoje';
            return;
        }
        
        const average = this.notes.reduce((sum, note) => sum + note.valor, 0) / this.notes.length;
        const level = Math.floor(average);
        
        levelEl.textContent = `Lvl ${level}`;
        xpEl.textContent = `+${this.notes.length * 10} XP hoje`;
    }
    
    renderProgressChart() {
        const chartEl = document.querySelector('#progress-chart');
        
        if (this.notes.length === 0) {
            chartEl.innerHTML = '<p style="color: #64748b; text-align: center; width: 100%;">Sem dados de desempenho ainda</p>';
            return;
        }
        
        // Agrupar notas por mês
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthData = {};
        
        this.notes.forEach(note => {
            const date = new Date(note.created_at);
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            const key = `${month}/${year}`;
            
            if (!monthData[key]) {
                monthData[key] = [];
            }
            
            monthData[key].push(note.valor);
        });
        
        // Pegar últimos 4 meses
        const recentMonths = Object.entries(monthData).slice(-4);
        
        if (recentMonths.length === 0) {
            chartEl.innerHTML = '<p style="color: #64748b; text-align: center; width: 100%;">Sem dados de desempenho ainda</p>';
            return;
        }
        
        const maxGrade = 10;
        const colors = ['#cfdaf2', '#3525cd', '#4f46e5', '#006c49'];
        
        chartEl.innerHTML = recentMonths.map(([month, grades], index) => {
            const average = grades.reduce((sum, g) => sum + g, 0) / grades.length;
            const heightPercent = (average / maxGrade) * 100;
            const isActive = index === recentMonths.length - 1;
            
            return `
                <div class="chart-bar-group">
                    <div class="chart-bar" style="height: ${heightPercent}%; background-color: ${colors[index % colors.length]};">
                        <span class="chart-bar-tooltip">${average.toFixed(1)}</span>
                    </div>
                    <span class="chart-label ${isActive ? 'active' : ''}">${month}</span>
                </div>
            `;
        }).join('');
    }
    
    renderActivities() {
        const activitiesList = document.querySelector('#activities-list');
        
        if (this.activities.length === 0) {
            activitiesList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #64748b;">
                    <span class="material-symbols-outlined" style="font-size: 2rem;">task_alt</span>
                    <p style="margin-top: 0.5rem;">Nenhuma atividade pendente!</p>
                </div>
            `;
            return;
        }
        
        activitiesList.innerHTML = this.activities.map(activity => {
            const progressColor = activity.progresso > 50 ? 'green' : activity.progresso > 0 ? 'red' : 'gray';
            
            return `
                <div class="activity-item">
                    <div class="activity-item-header">
                        <div class="activity-info">
                            <div class="activity-icon ${activity.icon.type}">
                                <span class="material-symbols-outlined">${activity.icon.icon}</span>
                            </div>
                            <div>
                                <span class="activity-badge ${activity.icon.type}">${activity.materia}</span>
                                <h4 class="activity-title">${activity.titulo}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="activity-progress">
                        <div class="progress-header">
                            <span>Progresso</span>
                            <span>${activity.progresso}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressColor}" style="width: ${activity.progresso}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderWarningBanner() {
        const banner = document.querySelector('#warning-banner');
        
        // Verificar redações próximas do prazo
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const urgentRedacao = this.redacoes.find(r => {
            if (!r.enviada_em && r.status === 'rascunho') {
                const createdAt = new Date(r.created_at);
                const daysSinceCreation = (today - createdAt) / (1000 * 60 * 60 * 24);
                return daysSinceCreation >= 6; // Redações com mais de 6 dias
            }
            return false;
        });
        
        if (urgentRedacao) {
            banner.classList.remove('hidden');
            document.querySelector('#warning-title').textContent = 'Sua redação vence amanhã!';
            document.querySelector('#warning-description').textContent = 
                `Tema: "${urgentRedacao.titulo}". Envie até as 23:59.`;
            
            const actionBtn = banner.querySelector('.warning-action');
            actionBtn.addEventListener('click', () => {
                window.location.href = '../laboratorio_de_redacao/index.html';
            });
        }
    }
    
    showLoading() {
        document.querySelector('#loading-state').classList.remove('hidden');
        document.querySelector('#error-state').classList.add('hidden');
        document.querySelector('#dashboard-content').classList.add('hidden');
    }
    
    hideLoading() {
        document.querySelector('#loading-state').classList.add('hidden');
    }
    
    showError(message) {
        document.querySelector('#loading-state').classList.add('hidden');
        document.querySelector('#error-state').classList.remove('hidden');
        document.querySelector('#error-message').textContent = message;
    }
}

// ============================================
// Theme Management
// ============================================

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        this.bindEvents();
    }
    
    applyTheme() {
        const html = document.documentElement;
        
        if (this.theme === 'dark') {
            html.classList.add('dark');
            html.classList.remove('light');
        } else if (this.theme === 'light') {
            html.classList.add('light');
            html.classList.remove('dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.classList.toggle('dark', prefersDark);
            html.classList.toggle('light', !prefersDark);
        }
        
        this.updateThemeIcons();
    }
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }
    
    updateThemeIcons() {
        const isDark = document.documentElement.classList.contains('dark');
        
        document.querySelectorAll('.theme-toggle, .shared-theme-toggle').forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            }
        });
    }
    
    bindEvents() {
        // Header theme toggle
        document.querySelectorAll('.theme-toggle, .shared-theme-toggle').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTheme());
        });
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.theme === 'system') {
                    this.applyTheme();
                }
            });
        }
    }
}

// ============================================
// Sidebar Management
// ============================================

class SidebarManager {
    constructor() {
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.bindEvents();
        this.applyState();
    }
    
    applyState() {
        const body = document.body;
        
        if (this.isCollapsed) {
            body.classList.add('sidebar-collapsed');
        } else {
            body.classList.remove('sidebar-collapsed');
        }
    }
    
    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
        localStorage.setItem('sidebarCollapsed', this.isCollapsed);
        this.applyState();
    }
    
    openSidebar() {
        this.isCollapsed = false;
        localStorage.setItem('sidebarCollapsed', this.isCollapsed);
        this.applyState();
    }
    
    bindEvents() {
        // Desktop sidebar toggle
        const sidebarToggle = document.querySelector('#sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Edge reveal button
        const edgeReveal = document.querySelector('#sidebar-edge-reveal');
        if (edgeReveal) {
            edgeReveal.addEventListener('click', () => this.openSidebar());
        }
        
        // Mobile menu button
        const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
    }
}

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    const themeManager = new ThemeManager();
    
    // Initialize sidebar manager
    const sidebarManager = new SidebarManager();
    
    // Initialize dashboard controller
    const dashboard = new DashboardController();
    
    // Retry button
    document.querySelector('#retry-btn')?.addEventListener('click', () => {
        dashboard.init();
    });
    
    // View all activities button
    document.querySelector('#view-all-btn')?.addEventListener('click', () => {
        window.location.href = '../modulo_de_trilhas/code.html';
    });
    
    // Notification button
    document.querySelector('.notification-btn')?.addEventListener('click', () => {
        // TODO: Implement notifications
        console.log('Notificações');
    });
    
    // Settings button
    document.querySelector('.settings-btn')?.addEventListener('click', () => {
        window.location.href = '../configuracoes/code.html';
    });
    
    // Export instances for debugging
    window.dashboardController = dashboard;
    window.themeManager = themeManager;
    window.sidebarManager = sidebarManager;
});