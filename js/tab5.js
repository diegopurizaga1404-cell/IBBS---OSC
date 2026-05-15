/**
 * tab5.js – Enlaces SOC (Editable block)
 * IBBS Gestión de Incidencias
 */

const Tab5 = (() => {

    function init() {
        const btnAgregar = document.getElementById('btn-t5-agregar');
        if (Auth.isAdmin() || Auth.getRole() === 'editor') {
            btnAgregar.addEventListener('click', openModal);
        } else {
            btnAgregar.style.display = 'none'; // Hide if not admin/editor
        }
        
        document.getElementById('btn-t5-modal-close').addEventListener('click', closeModal);
        document.getElementById('btn-t5-finalizar').addEventListener('click', _onFinalizar);

        document.getElementById('modal-t5').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
    }

    function openModal() {
        document.getElementById('t5-titulo').value = '';
        document.getElementById('t5-descripcion').value = '';
        document.getElementById('modal-t5').classList.add('open');
        setTimeout(() => document.getElementById('t5-titulo').focus(), 100);
    }

    function closeModal() {
        document.getElementById('modal-t5').classList.remove('open');
    }

    async function _onFinalizar() {
        const titulo = document.getElementById('t5-titulo').value.trim();
        const desc = document.getElementById('t5-descripcion').value.trim();

        if (!titulo) { Toast.show('El título es obligatorio.', 'error'); return; }

        const user = Auth.getUser();
        const createdBy = user?.user_metadata?.full_name || user?.email || 'Usuario';

        const enlace = {
            id: 'ENL-' + Date.now(),
            titulo,
            descripcion: desc,
            createdAt: new Date().toISOString(),
            createdBy,
        };

        await Store.addEnlace(enlace);
        closeModal();
        await render();
        Toast.show('Enlace registrado ✔', 'success');
    }

    async function render() {
        const enlaces = await Store.getEnlaces();
        const container = document.getElementById('t5-grid');
        container.innerHTML = '';

        if (enlaces.length === 0) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔗</div>
          <p>No hay enlaces registrados</p>
          <small>Haz clic en "Agregar información" para añadir el primer enlace.</small>
        </div>`;
            return;
        }

        enlaces.forEach(e => {
            const card = document.createElement('div');
            card.className = 'enlace-card';
            card.innerHTML = `
        <div class="enlace-title">${_escHtml(e.titulo)}</div>
        <div class="enlace-desc">${_linkify(_escHtml(e.descripcion))}</div>
        ${Auth.isAdmin() ? `<button class="enlace-delete" title="Eliminar" onclick="Tab5.deleteEnlace('${e.id}')">✕</button>` : ''}
        <div class="ticket-created-footer" style="margin-top: 12px; border-radius: 4px; padding: 4px 8px; font-size: 0.8rem;">
            <span>👤 ${e.createdBy || '—'}</span>
            <span>🕐 ${_fmtDateFull(e.createdAt)}</span>
        </div>
        `;
            container.appendChild(card);
        });
    }

    async function deleteEnlace(id) {
        if (!confirm('¿Eliminar este enlace?')) return;
        await Store.deleteEnlace(id);
        await render();
        Toast.show('Enlace eliminado.', 'success');
    }

    // Convert URLs to clickable links
    function _linkify(text) {
        const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
        return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
    }

    function _fmtDateFull(iso) {
        if (!iso) return '—';
        const lang = I18n.getLang() === 'es' ? 'es-PE' : 'en-US';
        return new Date(iso).toLocaleString(lang, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function _escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init, render, openModal, closeModal, deleteEnlace };
})();
