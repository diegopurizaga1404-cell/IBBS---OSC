/**
 * tab4.js – SOC Nodos: Registro (Ticket List)
 * IBBS Gestión de Incidencias
 */

const Tab4 = (() => {
  let _editingId = null;
  let _tempDesc = '';
  let _currentPage = 1;
  const PAGE_SIZE = 9;

  function init() {
    _bindControls();
    window.addEventListener('langChanged', () => render());
  }

  async function render() {
    const tickets = await Store.getTickets('soc');
    const sortOrder = document.getElementById('t4-sort').value;
    const filterStatus = document.getElementById('t4-filter-status').value;
    const filterRegion = document.getElementById('t4-filter-region').value;
    const filterTipo = document.getElementById('t4-filter-tipo').value;
    const filterDate = document.getElementById('t4-filter-date').value;

    _populateRegionFilter(tickets);
    _populateTipoFilter(tickets);

    let sorted = [...tickets].sort((a, b) => {
      const da = new Date(a.createdAt);
      const db = new Date(b.createdAt);
      return sortOrder === 'asc' ? da - db : db - da;
    });

    if (filterStatus !== 'all') {
      sorted = sorted.filter(t => t.resuelto === filterStatus);
    }

    if (filterRegion) {
      sorted = sorted.filter(t => t.region === filterRegion);
    }

    if (filterTipo) {
      sorted = sorted.filter(t => t.tiposIncidente && t.tiposIncidente.includes(filterTipo));
    }

    if (filterDate) {
      sorted = sorted.filter(t => {
        const tDate = t.fechaInc || new Date(t.createdAt).toISOString().split('T')[0];
        return tDate === filterDate;
      });
    }

    const container = document.getElementById('t4-list');
    container.innerHTML = '';

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <p>${I18n.translate('T4_EMPTY')}</p>
          <small>${I18n.translate('T4_EMPTY_SUB')}</small>
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
      const isConfirmed = t.resuelto === 'confirmado';
      const statusClass = isConfirmed ? 'status-confirmed' : 'status-pending';
      const badgeClass = isConfirmed ? 'badge-confirmed' : 'badge-pending';
      const badgeText = isConfirmed ? `✔ ${I18n.translate('STATUS_RESOLVED')}` : `⏳ ${I18n.translate('STATUS_PENDING')}`;
      const tipos = (t.tiposIncidente || []).join(', ');

      const item = document.createElement('div');
      item.className = `ticket-item ${statusClass}`;
      item.dataset.id = t.id;

      item.innerHTML = `
        <div class="ticket-header" onclick="Tab4.toggleDetail('${t.id}')">
          <div class="ticket-status-bar"></div>
          <span class="ticket-id">${t.id}</span>
          <div class="ticket-info">
            <div class="ticket-name">${t.nombreNodo || t.codigo}</div>
            <div class="ticket-meta">
              <span>📅 ${_fmtDate(t.createdAt)}</span>
              <span>📍 ${t.region}</span>
              <span>📡 ${t.tipoNodo}</span>
              <span>⚠ ${tipos || '—'}</span>
            </div>
          </div>
          <span class="ticket-badge ${badgeClass}">${badgeText}</span>
          <span class="ticket-chevron">›</span>
        </div>
        <div class="ticket-detail" id="detail4-${t.id}">
          <div class="detail-grid">
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_CODE')}</label><p>${t.codigo}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_NODE_NAME')}</label><p>${t.nombreNodo || '—'}</p></div>
            <div class="detail-field"><label>${I18n.translate('DETAIL_REGION')}</label><p>${t.region}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_NODE_TYPE')}</label><p>${t.tipoNodo}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_DATE_INC')}</label><p>${t.fechaInc || '—'} ${t.horaInc || ''}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_DATE_REP')}</label><p>${t.fechaRep || '—'} ${t.horaRep || ''}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_DETECTED')}</label><p>${_translateDetectado(t.detectadoPor) || '—'}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_RECORDING')}</label><p>${_translateGrabacion(t.hayGrabacion) || '—'}</p></div>
            <div class="detail-field"><label>${I18n.translate('T3_LABEL_INCIDENT_TYPE')}</label><p>${_translateTipos(tipos) || '—'}</p></div>
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
                <button class="btn btn-success btn-sm" onclick="Tab4.saveDesc('${t.id}')">${I18n.translate('BTN_SAVE')}</button>
                <button class="btn btn-secondary btn-sm" onclick="Tab4.cancelEdit()">${I18n.translate('BTN_CANCEL')}</button>
              </div>
            ` : `
              <div class="detail-desc">${t.descripcion || `<em style="color:var(--gray-400)">${I18n.translate('DETAIL_EMPTY_DESC')}</em>`}</div>
            `}
          </div>
          ${ (Auth.isAdmin() || Auth.getRole() === 'editor') ? `
          <div class="ticket-actions">
            <button class="btn btn-primary" onclick="Tab4.editDesc('${t.id}')">${I18n.translate('BTN_EDIT_DESC')}</button>

            ${Auth.isAdmin() ? `
              <button class="btn btn-danger" id="del-btn-${t.id}" onclick="_confirmDelete('${t.id}', Tab4.deleteTicket)">${I18n.translate('BTN_DELETE')}</button>
              <span id="del-conf-${t.id}" style="display:none;align-items:center;gap:8px;">
                <span style="font-size:.82rem;font-weight:600;color:var(--gray-600);">${I18n.translate('CONFIRM_DELETE')}</span>
                <button class="btn btn-danger" onclick="Tab4.deleteTicket('${t.id}')">${I18n.translate('BTN_YES_DELETE')}</button>
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
    const existing = document.getElementById('t4-pagination');
    if (existing) existing.remove();
    if (totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.id = 't4-pagination';
    nav.className = 'pagination-bar';
    nav.innerHTML = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''}
        onclick="Tab4.goToPage(${currentPage - 1})">&#8249; ${I18n.translate('T2_PAG_PREV')}</button>
      <span class="page-info">${I18n.translate('T2_PAG_PAGE')} <strong>${currentPage}</strong> ${I18n.translate('T2_PAG_OF')} <strong>${totalPages}</strong></span>
      <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''}
        onclick="Tab4.goToPage(${currentPage + 1})">${I18n.translate('T2_PAG_NEXT')} &#8250;</button>
    `;
    document.getElementById('t4-list').after(nav);
  }

  function goToPage(page) {
    _currentPage = page;
    render();
  }

  function toggleDetail(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.classList.toggle('expanded');
  }

  async function setStatus(id, status) {
    await Store.updateTicket('soc', id, { resuelto: status });
    await render();
    App.updateBadges();
  }

  async function deleteTicket(id) {
    await Store.deleteTicket('soc', id);
    await render();
    App.updateBadges();
    Toast.show('Registro eliminado.', 'success');
  }

  async function editDesc(id) {
    const tickets = await Store.getTickets('soc');
    const t = tickets.find(x => x.id === id);
    if (!t) return;
    
    _editingId = id;
    _tempDesc = t.descripcion || '';
    await render();

    // Keep the panel expanded after re-render
    const item = document.querySelector(`[data-id="${id}"]`);
    if (item) item.classList.add('expanded');

    // Focus textarea
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
    await Store.updateTicket('soc', id, { descripcion: newVal });
    _editingId = null;
    _tempDesc = '';
    await render();
    Toast.show('Descripción actualizada.', 'success');
  }

  function _populateRegionFilter(tickets) {
    const sel = document.getElementById('t4-filter-region');
    const cur = sel.value;
    const regions = [...new Set(tickets.map(t => t.region))].sort();
    sel.innerHTML = `<option value="">${I18n.translate('T2_ALL_REGIONS')}</option>`;
    regions.forEach(r => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = r;
      if (r === cur) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function _populateTipoFilter(tickets) {
    const sel = document.getElementById('t4-filter-tipo');
    const cur = sel.value;
    const tipos = [...new Set(tickets.flatMap(t => t.tiposIncidente || []))].sort();
    sel.innerHTML = `<option value="">${I18n.translate('ALL_TYPES')}</option>`;
    tipos.forEach(tp => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = tp;
      if (tp === cur) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  async function exportExcel() {
    const tickets = await Store.getTickets('soc');
    if (tickets.length === 0) { Toast.show('No hay registros para exportar.', 'warning'); return; }

    const rows = tickets.map(t => ({
      'ID': t.id,
      'Región': t.region,
      'Tipo Nodo': t.tipoNodo,
      'Código': t.codigo,
      'Nombre Nodo': t.nombreNodo || '-',
      'Fecha Incidente': _fmtDate(t.fechaInc),
      'Hora Incidente': t.horaInc || '-',
      'Fecha Reporte': _fmtDate(t.fechaRep),
      'Hora Reporte': t.horaRep || '-',
      'Detectado por': _capitalize(t.detectadoPor) || '-',
      '¿Hay Grabación?': _capitalize(t.hayGrabacion) || '-',
      'Tipo Incidente': (t.tiposIncidente || []).join(', ') || '-',
      'Descripción': t.descripcion || '-',
      'Creado por': t.createdBy || '-',
      'Estado': t.resuelto === 'confirmado' ? 'Confirmado' : 'Pendiente',
      'Fecha Creación (Sistema)': new Date(t.createdAt).toLocaleString('es-PE'),
    }));

    Exporter.downloadExcel('SOC Nodos', rows, `IBBS_SOCNodos_${Date.now()}.xlsx`);
    Toast.show('Excel de SOC Nodos exportado exitosamente. ✔', 'success');
  }

  function _bindControls() {
    const resetAndRender = () => { _currentPage = 1; render(); };
    document.getElementById('t4-sort').addEventListener('change', resetAndRender);
    document.getElementById('t4-filter-status').addEventListener('change', resetAndRender);
    document.getElementById('t4-filter-region').addEventListener('change', resetAndRender);
    document.getElementById('t4-filter-tipo').addEventListener('change', resetAndRender);
    document.getElementById('t4-filter-date').addEventListener('change', resetAndRender);
    document.getElementById('btn-t4-export').addEventListener('click', exportExcel);
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

  function _translateDetectado(val) {
      if (!val) return val;
      return val === 'tecnico' ? I18n.translate('T3_BTN_TECH') : I18n.translate('T3_BTN_SOC');
  }

  function _translateGrabacion(val) {
      if (!val) return val;
      return val === 'si' ? I18n.translate('T3_BTN_YES') : I18n.translate('T3_BTN_NO');
  }

  function _translateTipos(tiposStr) {
      if (!tiposStr) return tiposStr;
      const map = {
          'Alarma de puerta': 'T3_TYPE_DOOR',
          'Alarma de shelter': 'T3_TYPE_SHELTER',
          'Equipo averiado': 'T3_TYPE_EQUIPMENT',
          'Cámara sin gestión': 'T3_TYPE_CAMERA',
          'Robo': 'T3_TYPE_THEFT'
      };
      return tiposStr.split(', ').map(t => I18n.translate(map[t]) || t).join(', ');
  }

  function _capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return { init, render, toggleDetail, setStatus, deleteTicket, editDesc, cancelEdit, saveDesc, exportExcel, goToPage };
})();
