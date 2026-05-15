/**
 * app.js – Main application router and initializer
 * IBBS Gestión de Incidencias
 */

const App = (() => {

    const TABS = {
        'tab-dashboard': { key: 'NAV_DASHBOARD', section: 'NAV_ENTITIES', onEnter: () => TabDashboard.render() },
        'tab1': { key: 'NAV_CREATE_REG', section: 'NAV_ENTITIES', onEnter: () => { } },
        'tab2': { key: 'NAV_REGISTRY', section: 'NAV_ENTITIES', onEnter: () => Tab2.render() },
        'tab6': { key: 'NAV_TICKETS', section: 'NAV_ENTITIES', onEnter: () => Tab6.render() },
        'tab3': { key: 'NAV_CREATE_REG', section: 'NAV_SOC_NODES', onEnter: () => { } },
        'tab4': { key: 'NAV_REGISTRY', section: 'NAV_SOC_NODES', onEnter: () => Tab4.render() },
        'tab5': { key: 'NAV_LIBRARY', section: 'NAV_SOC_LINKS', onEnter: () => Tab5.render() },
    };

    let _currentTab = 'tab1';

    function navigateTo(tabId) {
        if (!TABS[tabId]) return;
        _currentTab = tabId;

        // Update panes
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Update topbar
        const cfg = TABS[tabId];
        document.getElementById('topbar-title').textContent = I18n.translate(cfg.key);
        document.getElementById('topbar-section').textContent = I18n.translate(cfg.section);

        // Run onEnter hook
        cfg.onEnter();

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('open');
        }

        // Save current tab
        localStorage.setItem('ibbs_tab', tabId);
    }

    async function updateBadges() {
        const entCount = (await Store.getTickets('entidades')).filter(t => !(t.generadoCC && t.resuelto === 'confirmado')).length;
        const socCount = (await Store.getTickets('soc')).filter(t => t.resuelto !== 'confirmado').length;

        const b2 = document.getElementById('badge-tab2');
        const b6 = document.getElementById('badge-tab6');
        const b4 = document.getElementById('badge-tab4');

        if (b2) { b2.textContent = entCount || ''; b2.classList.toggle('hidden', entCount === 0); }
        if (b6) { b6.textContent = entCount || ''; b6.classList.toggle('hidden', entCount === 0); }
        if (b4) { b4.textContent = socCount || ''; b4.classList.toggle('hidden', socCount === 0); }
    }

    function _initSidebar() {
        // Nav item clicks
        document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', () => navigateTo(item.dataset.tab));
        });

        // Section collapse
        document.querySelectorAll('.nav-section-header').forEach(header => {
            header.addEventListener('click', () => {
                header.closest('.nav-section').classList.toggle('collapsed');
            });
        });

        // Mobile toggle
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    function initTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const iconBtn = document.getElementById('theme-icon');
        const savedTheme = localStorage.getItem('ibbs_theme');

        // Defaults to dark if system prefers dark and no saved pref
        const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            document.body.classList.add('dark-mode');
            if (iconBtn) iconBtn.textContent = '☀️';
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const dark = document.body.classList.contains('dark-mode');
                localStorage.setItem('ibbs_theme', dark ? 'dark' : 'light');
                if (iconBtn) iconBtn.textContent = dark ? '☀️' : '🌙';
                // Trigger chart refresh if needed
                window.dispatchEvent(new Event('themeChanged'));
            });
        }
    }

    function _initLangListener() {
        window.addEventListener('langChanged', () => {
            // Refresh topbar text
            const cfg = TABS[_currentTab];
            document.getElementById('topbar-title').textContent = I18n.translate(cfg.key);
            document.getElementById('topbar-section').textContent = I18n.translate(cfg.section);
        });
    }

    async function init() {
        // Show loading
        document.getElementById('app-loading').style.display = 'flex';

        // Wait for session config
        const isAuth = await Auth.checkSession();
        if(!isAuth) return;

        try {
            await DataManager.loadAll();
        } catch (e) {
            console.error('Error loading data:', e);
        }

        // Hide loading
        document.getElementById('app-loading').style.display = 'none';
        document.getElementById('app-root').style.display = 'flex';

        // Mostrar nombre del usuario
        const user = Auth.getUser();
        let displayName = user?.user_metadata?.full_name || user?.email || 'Usuario';
        
        // Translate common placeholder names
        if (displayName === 'Administrador') displayName = I18n.translate('ROLE_ADMIN');
        if (displayName === 'Usuario') displayName = I18n.translate('USER_DEFAULT');

        const userDisplayEl = document.getElementById('user-display-name');
        if (userDisplayEl) userDisplayEl.textContent = displayName;

        Toast.init();
        _initSidebar();
        initTheme();
        _initLangListener();
        Auth.initLogout();

        // Init all tabs safely to prevent cascading failures
        try { TabDashboard.init(); } catch(e) { console.error('Error init TabDashboard:', e); }
        try { Tab1.init(); } catch(e) { console.error('Error init Tab1:', e); }
        try { Tab2.init(); } catch(e) { console.error('Error init Tab2:', e); }
        try { Tab6.init(); } catch(e) { console.error('Error init Tab6:', e); }
        try { Tab3.init(); } catch(e) { console.error('Error init Tab3:', e); }
        try { Tab4.init(); } catch(e) { console.error('Error init Tab4:', e); }
        try { Tab5.init(); } catch(e) { console.error('Error init Tab5:', e); }

        // Always start at Create Record (tab1) on initial load
        navigateTo('tab1');

        await updateBadges();
    }

    return { init, navigateTo, updateBadges };
})();

// Boot
window.addEventListener('DOMContentLoaded', App.init);
