/**
 * tab2.js – Entidades: Registro (Ticket List)
 * IBBS Gestión de Incidencias
 */

// Custom confirm helper – avoids browser popup suppression
function _confirmDelete(id, deleteFn) {
  const btn = document.getElementById(`del-btn-${id}`);
  const conf = document.getElementById(`del-conf-${id}`);
  if (!btn || !conf) return;
  btn.style.display = 'none';
  conf.style.display = 'flex';
}

const Tab2 = (() => {
  let _editingId = null;
  let _tempDesc = '';
  let _currentPage = 1;
  const PAGE_SIZE = 9;

  function init() {
    _buildFilterRegions();
    _bindControls();
    window.addEventListener('langChanged', () => {
      _buildFilterRegions();
      if (document.getElementById('tab2').classList.contains('active')) render();
    });
  }

  async function render() {
    const ticketsRaw = await Store.getTickets('entidades');
    const tickets = ticketsRaw.filter(t => typeof Permissions !== 'undefined' ? Permissions.canViewRegion(t.region) : true);
    const sortOrder = document.getElementById('t2-sort').value;
    const filterStatus = document.getElementById('t2-filter-status').value;
    const filterRegion = document.getElementById('t2-filter-region').value;
    const filterDate = document.getElementById('t2-filter-date').value;

    // Populate region filter
    _populateRegionFilter(tickets);

    // Sort
    let sorted = [...tickets].sort((a, b) => {
      const da = new Date(a.createdAt);
      const db = new Date(b.createdAt);
      return sortOrder === 'asc' ? da - db : db - da;
    });

    // Filter
    if (filterStatus !== 'all') {
      sorted = sorted.filter(t => {
        const isConfirmed = t.generadoCC && t.resuelto === 'confirmado';
        return filterStatus === 'confirmado' ? isConfirmed : !isConfirmed;
      });
    }
    if (filterRegion) {
      sorted = sorted.filter(t => t.region === filterRegion);
    }

    if (filterDate) {
      sorted = sorted.filter(t => {
        const tDate = t.fechaInc || new Date(t.createdAt).toISOString().split('T')[0];
        return tDate === filterDate;
      });
    }

    const container = document.getElementById('t2-list');
    container.innerHTML = '';

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>${I18n.translate('DB_LATEST')}</p>
          <small>${I18n.translate('T2_SUBTITLE')}</small>
        </div>`;
      _renderPagination(0, 0);
      return;
    }

    // Pagination
    const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
    if (_currentPage > totalPages) _currentPage = totalPages;
    const start = (_currentPage - 1) * PAGE_SIZE;
    const paginated = sorted.slice(start, start + PAGE_SIZE);

    paginated.forEach(t => {
      const isConfirmed = t.generadoCC && t.resuelto === 'confirmado';
      const statusClass = isConfirmed ? 'status-confirmed' : 'status-pending';
      const badgeClass = isConfirmed ? 'badge-confirmed' : 'badge-pending';
      const badgeText = isConfirmed ? `✔ ${I18n.translate('STATUS_RESOLVED')}` : `⏳ ${I18n.translate('STATUS_PENDING')}`;

      const item = document.createElement('div');
      item.className = `ticket-item ${statusClass}`;
      item.dataset.id = t.id;

      item.innerHTML = `
        <div class="ticket-header" onclick="Tab2.toggleDetail('${t.id}')">
          <div class="ticket-status-bar"></div>
          <span class="ticket-id">${t.id}</span>
          <div class="ticket-info">
            <div class="ticket-name">${t.nombre}</div>
            <div class="ticket-meta">
              <span>📅 ${_fmtDate(t.createdAt)}</span>
              <span>📍 ${t.region} › ${t.provincia}</span>
              <span>🏥 ${t.tipo}</span>
            </div>
          </div>
          <span class="ticket-badge ${badgeClass}">${badgeText}</span>
          <span class="ticket-chevron">›</span>
        </div>
        <div class="ticket-detail" id="detail-${t.id}">
          <div class="detail-grid">
            <div class="detail-field"><label>${I18n.translate('DETAIL_NAME')}</label><p>${t.nombre}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_DNI')}</label><p>${t.dni}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_PHONE')}</label><p>${t.cel}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_EMAIL')}</label><p>${t.email || '—'}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_DATE')}</label><p>${t.fechaInc || '—'} ${t.horaInc || ''}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_REGION')}</label><p>${t.region}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_PROVINCE')}</label><p>${t.provincia}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_LOCALITY')}</label><p>${t.localidad}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_TYPE')}</label><p>${t.tipo}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_ENTITY')}</label><p>${t.institucion}</p></div>
          </div>
          <div class="ticket-created-footer">
            <span>👤 ${t.createdBy || '—'}</span>
            <span>🕐 ${_fmtDateFull(t.createdAt)}</span>
          </div>
          <div class="form-label" style="margin-bottom:4px">${I18n.translate('DETAIL_DESC')}</div>
          <div class="detail-desc-container" id="desc-cont-${t.id}">
            ${_editingId === t.id ? `
              <textarea class="form-textarea" id="edit-area-${t.id}" style="min-height:80px; margin-bottom:8px;">${_tempDesc}</textarea>
              <div style="display:flex; gap:8px; justify-content:flex-start; align-items:center; margin-bottom: 12px;">
                <button class="btn btn-success btn-sm" onclick="Tab2.saveDesc('${t.id}')">${I18n.translate('BTN_SAVE')}</button>
                <button class="btn btn-secondary btn-sm" onclick="Tab2.cancelEdit()">❌ ${I18n.translate('BTN_CANCEL')}</button>
              </div>
            ` : `
              <div class="detail-desc">${t.descripcion || `<em style="color:var(--gray-400)">${I18n.translate('DETAIL_EMPTY_DESC')}</em>`}</div>
            `}
          </div>
          ${ (Auth.isAdmin() || Auth.getRole() === 'editor') ? `
          <div class="ticket-actions">
            <button class="btn btn-primary" onclick="Tab2.editDesc('${t.id}')">${I18n.translate('BTN_EDIT_DESC')}</button>
            
            ${Auth.isAdmin() ? `
              <button class="btn btn-danger" id="del-btn-${t.id}" onclick="_confirmDelete('${t.id}', Tab2.deleteTicket)">${I18n.translate('BTN_DELETE')}</button>
              <span id="del-conf-${t.id}" style="display:none;align-items:center;gap:8px;">
                <span style="font-size:.82rem;font-weight:600;color:var(--gray-600);">${I18n.translate('CONFIRM_DELETE')}</span>
                <button class="btn btn-danger" onclick="Tab2.deleteTicket('${t.id}')">${I18n.translate('BTN_YES_DELETE')}</button>
                <button class="btn btn-secondary" onclick="document.getElementById('del-btn-${t.id}').style.display='';document.getElementById('del-conf-${t.id}').style.display='none';">${I18n.translate('BTN_CANCEL')}</button>
              </span>
            ` : ''}
          </div>
          ` : `<div class="ticket-actions"><small style="color:var(--gray-500)">${I18n.translate('DETAIL_ADMIN_ONLY')}</small></div>`}
        </div>`;
      container.appendChild(item);
    });

    _renderPagination(_currentPage, totalPages);
  }

  function _renderPagination(currentPage, totalPages) {
    const existing = document.getElementById('t2-pagination');
    if (existing) existing.remove();
    if (totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.id = 't2-pagination';
    nav.className = 'pagination-bar';
    nav.innerHTML = `
      <button class="page-btn" id="t2-prev" ${currentPage === 1 ? 'disabled' : ''}
        onclick="Tab2.goToPage(${currentPage - 1})">‹ ${I18n.translate('T2_PAG_PREV')}</button>
      <span class="page-info">${I18n.translate('T2_PAG_PAGE')} <strong>${currentPage}</strong> ${I18n.translate('T2_PAG_OF')} <strong>${totalPages}</strong></span>
      <button class="page-btn" id="t2-next" ${currentPage === totalPages ? 'disabled' : ''}
        onclick="Tab2.goToPage(${currentPage + 1})">${I18n.translate('T2_PAG_NEXT')} ›</button>
    `;
    document.getElementById('t2-list').after(nav);
  }

  function goToPage(page) {
    _currentPage = page;
    render();
  }

  function toggleDetail(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.classList.toggle('expanded');
  }

  async function toggleCC(id, label) {
    const checkbox = label.querySelector('input[type="checkbox"]');
    const newVal = !checkbox.checked;
    checkbox.checked = newVal;
    await Store.updateTicket('entidades', id, { generadoCC: newVal });
    await Tab2.render();
    App.updateBadges();
  }

  async function setStatus(id, status) {
    await Store.updateTicket('entidades', id, { resuelto: status });
    await render();
    App.updateBadges();
  }

  async function deleteTicket(id) {
    await Store.deleteTicket('entidades', id);
    await render();
    App.updateBadges();
    Toast.show('Registro eliminado.', 'success');
  }

  async function editDesc(id) {
    const tickets = await Store.getTickets('entidades');
    const t = tickets.find(x => x.id === id);
    if (!t) return;
    
    _editingId = id;
    _tempDesc = t.descripcion || '';
    await render();
    
    // Keep the panel expanded after re-render
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.classList.add('expanded');

    setTimeout(() => {
        const area = document.getElementById(`edit-area-${id}`);
        if(area) area.focus();
    }, 50);
  }

  function cancelEdit() {
    _editingId = null;
    _tempDesc = '';
    render();
  }

  async function saveDesc(id) {
    const area = document.getElementById(`edit-area-${id}`);
    if (!area) return;
    
    const newVal = area.value.trim();
    await Store.updateTicket('entidades', id, { descripcion: newVal });
    _editingId = null;
    _tempDesc = '';
    await render();
    Toast.show('Descripción actualizada.', 'success');
  }

  function _populateRegionFilter(tickets) {
    const sel = document.getElementById('t2-filter-region');
    const currentVal = sel.value;
    const regions = [...new Set(tickets.map(t => t.region))].sort();
    if (regions.length === 1) {
      sel.innerHTML = `<option value="">${regions[0]}</option>`;
    } else {
      sel.innerHTML = `<option value="">${I18n.translate('T2_ALL_REGIONS')}</option>`;
      regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = r;
        if (r === currentVal) opt.selected = true;
        sel.appendChild(opt);
      });
    }
  }

  async function exportExcel() {
    const tickets = await Store.getTickets('entidades');
    if (tickets.length === 0) { Toast.show('No hay registros para exportar.', 'warning'); return; }

    const rows = tickets.map(t => ({
      'ID': t.id,
      'Nombre Completo': t.nombre,
      'DNI': t.dni,
      'Celular': t.cel,
      'Correo Electrónico': t.email || '-',
      'Fecha Incidente': _fmtDate(t.fechaInc),
      'Hora Incidente': t.horaInc || '-',
      'Región': t.region,
      'Provincia': t.provincia,
      'Localidad': t.localidad,
      'Tipo Entidad': t.tipo,
      'Entidad (Código/Nombre)': t.institucion,
      'Descripción': t.descripcion || '-',
      '¿Generó CC?': t.generadoCC ? 'Sí' : 'No',
      'Estado': t.resuelto === 'confirmado' ? 'Confirmado' : 'Pendiente',
      'Fecha Creación (Sistema)': new Date(t.createdAt).toLocaleString('es-PE'),
    }));

    Exporter.downloadExcel('Entidades', rows, `IBBS_Entidades_${Date.now()}.xlsx`);
    Toast.show('Excel de Entidades exportado exitosamente. ✔', 'success');
  }

  function _bindControls() {
    const resetAndRender = () => { _currentPage = 1; render(); };
    document.getElementById('t2-sort').addEventListener('change', resetAndRender);
    document.getElementById('t2-filter-status').addEventListener('change', resetAndRender);
    document.getElementById('t2-filter-region').addEventListener('change', resetAndRender);
    document.getElementById('t2-filter-date').addEventListener('change', resetAndRender);
    document.getElementById('btn-t2-export').addEventListener('click', exportExcel);
  }

  function _fmtDate(iso) {
    if (!iso) return '—';
    const lang = I18n.getLang() === 'es' ? 'es-PE' : 'en-US';
    return new Date(iso).toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _fmtDateFull(iso) {
    if (!iso) return '—';
    const lang = I18n.getLang() === 'es' ? 'es-PE' : 'en-US';
    return new Date(iso).toLocaleString(lang, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return { init, render, toggleDetail, toggleCC, setStatus, deleteTicket, editDesc, cancelEdit, saveDesc, exportExcel, goToPage };
})();
