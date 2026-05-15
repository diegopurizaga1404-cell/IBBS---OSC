/**
 * Toast notification utility
 * IBBS Gestión de Incidencias
 */
const Toast = (() => {
    let container;

    function init() {
        container = document.getElementById('toast-container');
    }

    function show(message, type = 'info', duration = 3500) {
        if (!container) container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✔', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all .3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    return { init, show };
})();
