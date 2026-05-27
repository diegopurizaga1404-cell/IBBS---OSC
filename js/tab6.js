/**
 * tab6.js – Entidades: Tickets (tabla + modal de detalle)
 * IBBS Gestión de Incidencias
 */

const Tab6 = (() => {
    let _currentPage = 1;
    const PAGE_SIZE = 15;
    let _allTickets = [];
    let _activeId = null;
    let _editModeSOC = false;
    let _editModeOM = false;

    // ── Supabase-backed helpers for extended fields ─────────────
    function _getExt(id) {
        const t = _allTickets.find(tk => tk.id === id);
        if (!t) return {};
        const acts = t.actividades;
        return {
            estado: t.estado || 'Abierto',
            causaIncidencia: t.causaIncidencia,
            mensajePredeterminado: t.mensajePredeterminado,
            resueltoRemotoSoc: t.resueltoRemotoSoc,
            woNumber: t.woNumber,
            cerradoPor: t.cerradoPor,
            fechaCierre: t.fechaCierre,
            equipoRegistro: t.equipoRegistro,
            equipoResolutor: t.equipoResolutor,
            actividades: acts ? (typeof acts === 'string' ? JSON.parse(acts) : acts) : [],
            omHoraContacto: t.omHoraContacto,
            omDiaVisita: t.omDiaVisita,
            causaTs: t.causaTs,
            ccTs: t.ccTs,
            ttTs: t.ttTs,
            woTs: t.woTs,
            omHoraTs: t.omHoraTs,
            omVisitaTs: t.omVisitaTs,
        };
    }
    async function _setExt(id, data) {
        // Update local cache immediately
        const t = _allTickets.find(tk => tk.id === id);
        if (t) Object.assign(t, data);
        // Persist to Supabase
        try {
            await Store.updateTicket('entidades', id, data);
        } catch (e) {
            console.error('Error saving ext data to Supabase:', e);
        }
    }

    // ── One-time migration: localStorage → Supabase ──────────
    async function _migrateLocalStorage() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('ibbs_ext_')) keys.push(k);
        }
        if (!keys.length) return;
        console.log(`[IBBS] Migrating ${keys.length} localStorage entries to Supabase...`);
        
        const validKeys = [
            'estado', 'causaIncidencia', 'mensajePredeterminado', 'resueltoRemotoSoc',
            'woNumber', 'cerradoPor', 'fechaCierre', 'equipoRegistro', 'equipoResolutor',
            'actividades', 'omHoraContacto', 'omDiaVisita', 'causaTs', 'ccTs', 'ttTs',
            'woTs', 'omHoraTs', 'omVisitaTs'
        ];

        for (const k of keys) {
            const id = k.replace('ibbs_ext_', '');
            try {
                const rawData = JSON.parse(localStorage.getItem(k) || '{}');
                const cleanData = {};
                
                // Map old keys to new if needed
                if (rawData.omHora && !rawData.omHoraContacto) cleanData.omHoraContacto = rawData.omHora;
                if (rawData.omVisita && !rawData.omDiaVisita) cleanData.omDiaVisita = rawData.omVisita;
                if (rawData.resSOC !== undefined && rawData.resueltoRemotoSoc === undefined) cleanData.resueltoRemotoSoc = rawData.resSOC;
                
                // Only keep valid columns
                for (const vk of validKeys) {
                    if (rawData[vk] !== undefined) cleanData[vk] = rawData[vk];
                }

                if (Object.keys(cleanData).length) {
                    await Store.updateTicket('entidades', id, cleanData);
                }
                localStorage.removeItem(k);
                console.log(`[IBBS] Migrated: ${id}`);
            } catch (e) {
                console.warn(`[IBBS] Failed to migrate ${id}:`, e);
            }
        }
        console.log('[IBBS] Migration complete.');
    }

    // ── Delete Ticket ────────────────────────────────────────
    function initDelete() {
        document.getElementById('t6-btn-delete-init').style.display = 'none';
        document.getElementById('t6-delete-confirm-ui').style.display = 'flex';
    }

    function cancelDelete() {
        document.getElementById('t6-btn-delete-init').style.display = 'inline-block';
        document.getElementById('t6-delete-confirm-ui').style.display = 'none';
    }

    async function confirmDeleteTicket() {
        if (!_activeId) return;
        if (!Auth.isAdmin()) {
            alert('Solo los administradores pueden eliminar tickets.');
            return;
        }

        try {
            await Store.deleteTicket('entidades', _activeId);
            localStorage.removeItem(`ibbs_ext_${_activeId}`);
            closeModal();
            await render();
        } catch (err) {
            console.error('Error deleting ticket:', err);
            alert('Ocurrió un error al intentar eliminar el ticket.');
        }
    }

    // ── Init ─────────────────────────────────────────────────
    async function init() {
        _bindControls();
        window.addEventListener('langChanged', () => render());
        // Migrate localStorage data to Supabase (runs once)
        await _migrateLocalStorage();
    }

    // ── Render table ─────────────────────────────────────────
    async function render() {
        const rawTickets = await Store.getTickets('entidades');
        _allTickets = rawTickets.filter(t => typeof Permissions !== 'undefined' ? Permissions.canViewRegion(t.region) : true);
        
        // Update KPI Summary Cards
        let abierto = 0, enCurso = 0, cerrado = 0;
        _allTickets.forEach(t => {
            const ext = _getExt(t.id);
            const st = ext.estado || t.estado || 'Abierto';
            if (st === 'Abierto') abierto++;
            else if (st === 'En curso') enCurso++;
            else if (st === 'Cerrado') cerrado++;
        });
        
        document.querySelector('#t6-kpi-abierto .t6-kpi-value').textContent = abierto;
        document.querySelector('#t6-kpi-curso .t6-kpi-value').textContent = enCurso;
        document.querySelector('#t6-kpi-cerrado .t6-kpi-value').textContent = cerrado;

        const sortOrder = document.getElementById('t6-sort').value;
        const filterStatus = document.getElementById('t6-filter-status').value;
        const filterRegion = document.getElementById('t6-filter-region').value;
        const filterDate = document.getElementById('t6-filter-date').value;
        const searchText = document.getElementById('t6-search').value.toLowerCase().trim();

        _populateRegionFilter(_allTickets);

        let sorted = [..._allTickets].sort((a, b) => {
            const da = new Date(a.createdAt), db = new Date(b.createdAt);
            return sortOrder === 'asc' ? da - db : db - da;
        });

        if (filterStatus !== 'all') {
            sorted = sorted.filter(t => {
                const ext = _getExt(t.id);
                const st = ext.estado || t.estado || 'Abierto';
                return st === filterStatus;
            });
        }
        if (filterRegion) sorted = sorted.filter(t => t.region === filterRegion);
        if (filterDate) {
            sorted = sorted.filter(t => {
                const d = t.fechaInc || new Date(t.createdAt).toISOString().split('T')[0];
                return d === filterDate;
            });
        }
        if (searchText) {
            sorted = sorted.filter(t => {
                const ext = _getExt(t.id);
                const institucion = (t.institucion || '').toLowerCase();
                const cc = (t.ccNumber || '').toLowerCase();
                const tt = (t.ttNumber || '').toLowerCase();
                const wo = (ext.woNumber || t.woNumber || '').toLowerCase();
                const nombre = (t.nombre || '').toLowerCase();
                return institucion.includes(searchText) || 
                       cc.includes(searchText) || 
                       tt.includes(searchText) || 
                       wo.includes(searchText) ||
                       nombre.includes(searchText);
            });
        }

        const wrapper = document.getElementById('t6-table-wrapper');
        const existing = document.getElementById('t6-pagination');
        if (existing) existing.remove();

        if (sorted.length === 0) {
            wrapper.innerHTML = `<div class="empty-state"><div class="empty-icon">🗂</div><p>No hay tickets registrados.</p><small>Los tickets aparecerán aquí cuando se creen registros.</small></div>`;
            return;
        }

        const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
        if (_currentPage > totalPages) _currentPage = totalPages;
        const paginated = sorted.slice((_currentPage - 1) * PAGE_SIZE, _currentPage * PAGE_SIZE);

        const rows = paginated.map(t => {
            const ext = _getExt(t.id);
            const estado = ext.estado || t.estado || 'Abierto';
            const bc = estado === 'Cerrado' ? 'badge-confirmed' : estado === 'En curso' ? 'badge-progress' : 'badge-pending';
            const dur = _calcDuration(t.createdAt, ext.fechaCierre);
            const statusLabel = (estado === 'Abierto') ? I18n.translate('T6_KPI_OPEN') : 
                               (estado === 'En curso') ? I18n.translate('T6_KPI_PROGRESS') : 
                               I18n.translate('T6_KPI_CLOSED');
            const typeLabel = _translateType(t.tipo);
            return `<tr>
              <td><span class="t6-entity-link" onclick="Tab6.openModal('${t.id}')">${t.institucion || '—'}</span></td>
              <td>${typeLabel}</td>
              <td>${t.region || '—'}</td>
              <td>${_fmtFull(t.createdAt)}</td>
              <td><span class="ticket-badge ${bc}">${statusLabel}</span></td>
              <td>${t.ccNumber || '—'}</td>
              <td>${t.ttNumber || '—'}</td>
              <td>${ext.woNumber || t.woNumber || '—'}</td>
              <td>${ext.equipoRegistro || t.createdBy || '—'}</td>
              <td>${_calcTeam(t, ext)}</td>
              <td style="text-align: center;">${ext.omHoraContacto ? _fmtFull(ext.omHoraContacto) : '—'}</td>
              <td style="text-align: center;">${ext.omDiaVisita ? _fmtFull(ext.omDiaVisita) : '—'}</td>
              <td>${ext.fechaCierre ? _fmtFull(ext.fechaCierre) : (t.fechaCierre ? _fmtFull(t.fechaCierre) : '—')}</td>
              <td style="text-align: center;">${dur}</td>
              <td class="t6-desc-cell" title="${(t.socDetalles||t.descripcion||'').replace(/"/g,'&quot;')}">${t.socDetalles || t.descripcion || '—'}</td>
            </tr>`;
        }).join('');

        wrapper.innerHTML = `
          <table class="t6-table">
            <thead><tr>
              <th>${I18n.translate('COL_ENTITY')}</th>
              <th>${I18n.translate('COL_TYPE')}</th>
              <th>${I18n.translate('COL_REGION')}</th>
              <th>${I18n.translate('T6_COL_START_TIME')}</th>
              <th>${I18n.translate('COL_STATUS')}</th>
              <th>CC</th>
              <th>TT</th>
              <th>WO</th>
              <th>${I18n.translate('T6_COL_TEAM_REG')}</th>
              <th>${I18n.translate('T6_COL_TEAM_RES')}</th>
              <th style="text-align: center;">${I18n.translate('T6_COL_LLAMADA_ENTIDAD').toUpperCase()}</th>
              <th style="text-align: center;">${I18n.translate('T6_COL_VISITA_PREVISTA').toUpperCase()}</th>
              <th>${I18n.translate('T6_COL_CLOSE_TIME')}</th>
              <th style="text-align: center;">${I18n.translate('T6_COL_DURATION')}</th>
              <th>${I18n.translate('DETAIL_DESC')}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`;

        // Paginación
        const oldP = document.getElementById('t6-pagination-container');
        if (oldP) oldP.remove();

        if (sorted.length > 0) {
            const container = document.createElement('div');
            container.id = 't6-pagination-container';
            container.className = 't6-pagination-wrapper';

            // Texto de información (Izquierda)
            const from = (Math.max(1, _currentPage) - 1) * PAGE_SIZE + 1;
            const to = Math.min(_currentPage * PAGE_SIZE, sorted.length);
            const info = document.createElement('div');
            info.className = 't6-pagination-info';
            const sShowing = I18n.translate('T6_PAGING_SHOWING');
            const sTo = I18n.translate('T6_PAGING_TO');
            const sOf = I18n.translate('T6_PAGING_OF');
            const sRes = I18n.translate('T6_PAGING_RESULTS');
            info.textContent = `${sShowing} ${from} ${sTo} ${to} ${sOf} ${sorted.length} ${sRes}`;
            container.appendChild(info);

            // Controles de página (Derecha)
            if (totalPages > 1) {
                const nav = document.createElement('div');
                nav.id = 't6-pagination';
                nav.className = 'pagination-modern';

                const createBtn = (p, label, cls = '') => {
                    const active = p === _currentPage ? 'active' : '';
                    return `<button class="page-num ${cls} ${active}" onclick="Tab6.goToPage(${p})">${label}</button>`;
                };

                let html = '';
                html += `<button class="page-num prev" ${_currentPage === 1 ? 'disabled' : ''} onclick="Tab6.goToPage(${_currentPage - 1})">‹</button>`;

                const pages = new Set();
                pages.add(1);
                if (totalPages > 1) pages.add(2);
                pages.add(_currentPage);
                if (_currentPage > 1) pages.add(_currentPage - 1);
                if (_currentPage < totalPages) pages.add(_currentPage + 1);
                pages.add(totalPages);

                const sortedPages = [...pages].filter(p => p > 0 && p <= totalPages).sort((a, b) => a - b);
                let lastP = 0;
                sortedPages.forEach(p => {
                    if (lastP > 0 && p - lastP > 1) {
                        html += `<span class="page-dots">...</span>`;
                    }
                    html += createBtn(p, p);
                    lastP = p;
                });

                html += `<button class="page-num next" ${_currentPage === totalPages ? 'disabled' : ''} onclick="Tab6.goToPage(${_currentPage + 1})">›</button>`;
                nav.innerHTML = html;
                container.appendChild(nav);
            }
            
            wrapper.after(container);
        }
    }

    function goToPage(p) { _currentPage = p; render(); }

    // ── Helpers ───────────────────────────────────────────────
    function _calcDuration(createdAt, fechaCierre) {
        const s = new Date(createdAt), e = fechaCierre ? new Date(fechaCierre) : new Date();
        const ms = e - s;
        if (isNaN(ms) || ms < 0) return '—';
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        if (h >= 24) {
            const d = Math.floor(h / 24);
            const rem_h = h % 24;
            return `${d}d ${rem_h}h`;
        }
        return `${h}h ${m}m`;
    }

    function _calcTeam(t, ext) {
        const wo = ext.woNumber || t.woNumber;
        if (wo) return 'Team O&M';
        return 'Team OSC';
    }

    function _fmtFull(iso) {
        if (!iso) return '—';
        if (iso === 'N/A') return 'N/A';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        // Formato: DD/MM/YYYY HH:mm (24h)
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function _translateType(type) {
        if (!type) return '—';
        if (type === 'Institución Educativa') return I18n.translate('TYPE_IE');
        if (type === 'Comisaría') return I18n.translate('TYPE_COMISARIA');
        if (type === 'Hospital') return I18n.translate('TYPE_HOSPITAL');
        if (type === 'CAD Tipo B' || type === 'CAD Type B') return I18n.translate('TYPE_CAD');
        if (type === 'Plaza') return I18n.translate('TYPE_PLAZA');
        return type;
    }

    function _populateRegionFilter(tickets) {
        const sel = document.getElementById('t6-filter-region');
        const cur = sel.value;
        const regions = [...new Set(tickets.map(t => t.region).filter(Boolean))].sort();
        if (regions.length === 1) {
            sel.innerHTML = `<option value="">${regions[0]}</option>`;
        } else {
            sel.innerHTML = `<option value="">${I18n.translate('T2_ALL_REGIONS')}</option>`;
            regions.forEach(r => {
                const o = document.createElement('option');
                o.value = o.textContent = r;
                if (r === cur) o.selected = true;
                sel.appendChild(o);
            });
        }
    }

    // ── INTERACTION STATE ───────────────────────────────────────
    let _hasSavedDataSOC = false;
    let _hasSavedDataOM = false;
    let _isInteractingSOC = false;
    let _isInteractingOM = false;

    function markInteractionSOC() {
        _isInteractingSOC = true;
        _updateFormButtonsSOC();
    }

    function markInteractionOM() {
        if (!_isInteractingOM) { _isInteractingOM = true; _updateFormButtonsOM(); }
    }

    function _hasAnyDetailSOC(t, ext) {
        const causa = ext.causaIncidencia || t.causaIncidencia || '';
        const resSOC = ext.resueltoRemotoSoc != null ? ext.resueltoRemotoSoc : t.resueltoRemotoSoc;
        const desc = t.socDetalles || '';
        const cc = t.ccNumber || '';
        const wo = ext.woNumber || t.woNumber || '';
        return !!(causa || (resSOC !== null && resSOC !== undefined) || desc.trim() || cc.trim() || wo.trim());
    }

    function _hasAnyDetailOM(t, ext) {
        return !!(ext.omHoraContacto || ext.omDiaVisita || ext.omHora || ext.omVisita);
    }

    // ── OPEN / CLOSE DETAIL (inline swap) ───────────────────────
    function openModal(id) {
        try {
            const t = _allTickets.find(tk => tk.id === id);
            if (!t) return;
            _activeId = id;
            _editModeSOC = false;
            _editModeOM = false;
            
            const ext = _getExt(t.id);
            _hasSavedDataSOC = _hasAnyDetailSOC(t, ext);
            _hasSavedDataOM = _hasAnyDetailOM(t, ext);
            _isInteractingSOC = false;
            _isInteractingOM = false;
            
            _populateModal(t, ext);

            const deleteContainer = document.getElementById('t6-delete-container');
            if (deleteContainer) {
                deleteContainer.style.display = Auth.isAdmin() ? 'flex' : 'none';
                document.getElementById('t6-btn-delete-init').style.display = 'inline-block';
                document.getElementById('t6-delete-confirm-ui').style.display = 'none';
            }

            // Swap: hide list, show inline detail
            document.getElementById('t6-list-view').style.display = 'none';
            document.getElementById('t6-detail-inline').style.display = 'flex';
            window.scrollTo(0, 0);
        } catch (e) {
            alert("Error in openModal: " + e.stack);
            console.error(e);
        }
    }

    function closeModal() {
        document.getElementById('t6-detail-inline').style.display = 'none';
        document.getElementById('t6-list-view').style.display = '';
        _activeId = null;
    }

    function _populateModal(t, ext) {
        if (!ext) ext = _getExt(t.id);
        const causa = ext.causaIncidencia || t.causaIncidencia || '';
        const msgPred = ext.mensajePredeterminado || t.mensajePredeterminado || '';
        const resSOC = ext.resueltoRemotoSoc != null ? ext.resueltoRemotoSoc : t.resueltoRemotoSoc;
        const wo = ext.woNumber || t.woNumber || '';
        const actividades = ext.actividades || (t.actividades ? JSON.parse(t.actividades) : []);

        // Header
        const st = ext.estado || t.estado || 'Abierto';
        const bc = st === 'Cerrado' ? 'badge-confirmed' : st === 'En curso' ? 'badge-progress' : 'badge-pending';
        document.getElementById('t6-modal-title').textContent = t.institucion || 'Sin Entidad';
        document.getElementById('t6-header-status-badge').innerHTML = `<span class="ticket-badge ${bc}" style="margin:0">${st}</span>`;
        document.getElementById('t6-modal-createdby').textContent = t.createdBy || '—';
        document.getElementById('t6-modal-createdat').textContent = _fmtFull(t.createdAt);

        // Registro
        document.getElementById('t6-reg-nombre').textContent = t.nombre || '—';
        document.getElementById('t6-reg-dni').textContent = t.dni || '—';
        document.getElementById('t6-reg-cel').textContent = t.cel || '—';
        document.getElementById('t6-reg-email').textContent = t.email || '—';
        document.getElementById('t6-reg-fecha').textContent = (t.fechaInc || '—') + ' ' + (t.horaInc || '');
        document.getElementById('t6-reg-region').textContent = t.region || '—';
        document.getElementById('t6-reg-provincia').textContent = t.provincia || '—';
        document.getElementById('t6-reg-localidad').textContent = t.localidad || '—';
        document.getElementById('t6-reg-tipo').textContent = t.tipo || '—';
        document.getElementById('t6-reg-desc').textContent = t.descripcion || '—';

        // Causa buttons
        document.querySelectorAll('.t6-cause-btn').forEach(b => b.classList.toggle('active', b.dataset.causa === causa));
        _renderMensajes(causa, msgPred);

        // SOC buttons
        document.querySelectorAll('.t6-soc-btn').forEach(b => {
            const v = b.dataset.val === 'true';
            b.classList.toggle('active', resSOC === v);
        });

        // Fields
        document.getElementById('t6-desc-field').value = t.socDetalles || '';
        document.getElementById('t6-cc-field').value = t.ccNumber || '';
        document.getElementById('t6-tt-field').value = t.ttNumber || '';
        document.getElementById('t6-wo-field').value = wo;

        // Populating O&M
        const omHora = ext.omHoraContacto || '';
        const omVisita = ext.omDiaVisita || '';
        const inputHoraFecha = document.getElementById('t6-om-hora-contacto-fecha');
        const inputHoraHora = document.getElementById('t6-om-hora-contacto-hora');
        const inputVisitaFecha = document.getElementById('t6-om-dia-visita-fecha');
        const inputVisitaHora = document.getElementById('t6-om-dia-visita-hora');
        
        if (inputHoraFecha && inputHoraHora && inputVisitaFecha && inputVisitaHora) {
            let omHoraFecha = '';
            let omHoraHora = '';
            if (omHora === 'N/A') {
                omHoraFecha = 'N/A';
                omHoraHora = 'N/A';
            } else if (omHora.includes('T')) {
                const parts = omHora.split('T');
                omHoraFecha = parts[0];
                omHoraHora = parts[1];
            } else {
                omHoraFecha = omHora;
            }

            let omVisitaFecha = '';
            let omVisitaHora = '';
            if (omVisita === 'N/A') {
                omVisitaFecha = 'N/A';
                omVisitaHora = 'N/A';
            } else if (omVisita.includes('T')) {
                const parts = omVisita.split('T');
                omVisitaFecha = parts[0];
                omVisitaHora = parts[1];
            } else {
                omVisitaFecha = omVisita;
            }

            inputHoraFecha.dataset.savedValue = (omHoraFecha !== 'N/A') ? omHoraFecha : '';
            inputHoraHora.dataset.savedValue = (omHoraHora !== 'N/A') ? omHoraHora : '';
            inputVisitaFecha.dataset.savedValue = (omVisitaFecha !== 'N/A') ? omVisitaFecha : '';
            inputVisitaHora.dataset.savedValue = (omVisitaHora !== 'N/A') ? omVisitaHora : '';
            
            if (resSOC === true) {
                inputHoraFecha.type = 'text'; inputHoraFecha.value = 'N/A';
                inputHoraHora.type = 'text';  inputHoraHora.value = 'N/A';
                inputVisitaFecha.type = 'text'; inputVisitaFecha.value = 'N/A';
                inputVisitaHora.type = 'text';  inputVisitaHora.value = 'N/A';
            } else {
                inputHoraFecha.type = 'date'; inputHoraFecha.value = (omHoraFecha === 'N/A') ? '' : omHoraFecha;
                inputHoraHora.type = 'time';  inputHoraHora.value = (omHoraHora === 'N/A') ? '' : omHoraHora;
                inputVisitaFecha.type = 'date'; inputVisitaFecha.value = (omVisitaFecha === 'N/A') ? '' : omVisitaFecha;
                inputVisitaHora.type = 'time';  inputVisitaHora.value = (omVisitaHora === 'N/A') ? '' : omVisitaHora;
            }
        }

        _setFieldsLockedSOC(_hasSavedDataSOC);
        _setFieldsLockedOM(_hasSavedDataOM);
        _renderTimeline(t, ext);
        _renderActivities(actividades);
        _renderHistory(t);

        // Aplicar restricciones de edición según permisos del usuario
        _applyBlockPermissions();
    }

    // ── Aplica permisos de edición a bloques del ticket ──────────
    function _applyBlockPermissions() {
        const canEditClasif    = Permissions.canEdit('edit_clasificacion');
        const canEditNotas     = Permissions.canEdit('edit_notas_tecnicas');
        const canEditTickets   = Permissions.canEdit('edit_tickets_seguimiento');
        const canEditOM        = Permissions.canEdit('edit_datos_om');
        const canEditAnySOC    = canEditClasif || canEditNotas || canEditTickets;

        // ── Bloque 1: Clasificación (botones causa + SOC resuelto) ──
        const lockedSOC = _hasSavedDataSOC && !_editModeSOC;
        document.querySelectorAll('.t6-cause-btn, .t6-soc-btn').forEach(b => {
            if (!canEditClasif) {
                b.style.pointerEvents = 'none';
                b.style.opacity = '0.5';
                b.style.filter = 'grayscale(100%)';
                b.title = 'Sin permiso de edición';
            } else {
                b.style.pointerEvents = lockedSOC ? 'none' : '';
                b.style.opacity = lockedSOC ? '0.5' : '';
                b.style.filter = lockedSOC ? 'grayscale(100%)' : '';
                b.title = '';
            }
        });
        document.querySelectorAll('.t6-msg-option').forEach(lbl => {
            const inp = lbl.querySelector('input');
            if (inp) inp.disabled = !canEditClasif || lockedSOC;
            lbl.style.pointerEvents = (!canEditClasif || lockedSOC) ? 'none' : '';
            lbl.style.opacity = (!canEditClasif || lockedSOC) ? '0.5' : '';
            lbl.style.filter = (!canEditClasif || lockedSOC) ? 'grayscale(100%)' : '';
        });

        // ── Bloque 2: Notas Técnicas (textarea de observaciones) ───
        const descField = document.getElementById('t6-desc-field');
        if (descField) {
            if (!canEditNotas) {
                descField.disabled = true;
                descField.style.opacity = '0.85';
                descField.title = 'Sin permiso de edición';
            } else {
                descField.disabled = _hasSavedDataSOC && !_editModeSOC;
                descField.style.opacity = '';
                descField.title = '';
            }
        }

        // ── Bloque 3: Tickets de Seguimiento (CC / TT / WO) ────────
        // Mostrar valores como texto de solo lectura si no tiene permiso de edición
        ['t6-cc-field', 't6-tt-field', 't6-wo-field'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!canEditTickets) {
                // Solo lectura: mostrar valor claramente pero sin poder editar
                el.disabled = true;
                el.style.backgroundColor = 'transparent';
                el.style.border = '1px solid var(--gray-300)';
                el.style.opacity = '1'; // valor completamente visible
                el.style.cursor = 'default';
                el.style.fontWeight = '500';
                el.title = 'Solo lectura – Sin permiso de edición';
            } else {
                el.disabled = _hasSavedDataSOC && !_editModeSOC;
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.opacity = '';
                el.style.cursor = '';
                el.style.fontWeight = '';
                el.title = '';
            }
        });

        // ── Botón "Editar SOC": visible solo si puede editar algún sub-bloque ──
        const btnEditarSOC = document.getElementById('t6-btn-editar-soc');
        if (btnEditarSOC) {
            if (!canEditAnySOC) {
                btnEditarSOC.style.display = 'none';
            }
            // Si sí puede, el estado normal lo maneja _updateFormButtonsSOC()
        }

        // ── Etiqueta de solo lectura en el bloque SOC si no puede editar ──
        _ensureReadonlyBadge('t6-modern-col-right', canEditAnySOC);

        // ── Botones Guardar/Cancelar SOC: ocultar si no puede editar nada ──
        if (!canEditAnySOC) {
            const btnGuardarSOC  = document.getElementById('t6-btn-guardar-soc');
            const btnCancelarSOC = document.getElementById('t6-btn-cancelar-soc');
            if (btnGuardarSOC)  btnGuardarSOC.style.display  = 'none';
            if (btnCancelarSOC) btnCancelarSOC.style.display = 'none';
        }

        // ── Bloque 4: Datos O&M ─────────────────────────────────────
        ['t6-om-hora-contacto-fecha', 't6-om-hora-contacto-hora',
         't6-om-dia-visita-fecha',   't6-om-dia-visita-hora'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (!canEditOM) {
                el.disabled = true;
                el.style.opacity = '0.85';
                el.title = 'Sin permiso de edición';
            } else {
                el.disabled = _hasSavedDataOM && !_editModeOM;
                el.style.opacity = '';
                el.title = '';
            }
        });

        // ── Visibilidad de Cronogramas ──
        const canViewCronogramaEvento = typeof Permissions !== 'undefined' ? Permissions.canView('view_cronograma_evento') : true;
        const canViewCronogramaAct = typeof Permissions !== 'undefined' ? Permissions.canView('view_cronograma_actividades') : true;

        document.querySelectorAll('#t6-timeline-container').forEach(container => {
            container.style.display = canViewCronogramaEvento ? 'block' : 'none';
        });

        document.querySelectorAll('#t6-activities-container').forEach(container => {
            container.style.display = canViewCronogramaAct ? 'block' : 'none';
        });

        // ── Botón "Editar OM": visible solo si tiene permiso ────────
        const btnEditarOM = document.getElementById('t6-btn-editar-om');
        if (btnEditarOM) {
            if (!canEditOM) {
                btnEditarOM.style.display = 'none';
            } else {
                // Restaurar si tiene permiso (puede haber sido ocultado antes)
                if (btnEditarOM.style.display === 'none') {
                    btnEditarOM.style.display = _hasSavedDataOM ? 'inline-flex' : 'none';
                }
            }
        }

        // ── Botones Guardar/Cancelar OM: ocultar si no puede editar ─
        if (!canEditOM) {
            const btnGuardarOM   = document.getElementById('t6-btn-guardar-om');
            const btnCancelarOM  = document.getElementById('t6-btn-cancelar-om');
            if (btnGuardarOM)  btnGuardarOM.style.display  = 'none';
            if (btnCancelarOM) btnCancelarOM.style.display = 'none';
        }
    }

    // ── Helper: Inserta o quita pastilla "Solo lectura" ──
    function _ensureReadonlyBadge(containerId, canEdit) {
        // Limpiar badge anterior dondequiera que esté
        document.querySelectorAll('.t6-readonly-badge').forEach(b => b.remove());

        if (!canEdit) {
            const detailForm = document.getElementById('t6-detail-form');
            if (!detailForm) return;

            const leftCard = detailForm.querySelector('.t6-modern-card');
            if (!leftCard) return;

            // Envolver la tarjeta izquierda en una columna flex para poder poner cosas debajo sin romper la grilla
            let colLeft = leftCard.parentElement;
            if (!colLeft.classList.contains('t6-modern-col-left')) {
                colLeft = document.createElement('div');
                colLeft.className = 't6-modern-col-left';
                colLeft.style.cssText = 'display: flex; flex-direction: column; gap: 16px; align-self: start;';
                leftCard.parentNode.insertBefore(colLeft, leftCard);
                colLeft.appendChild(leftCard);
                // Restaurar el align-self de la tarjeta si lo tenía
                leftCard.style.alignSelf = 'stretch';
            }

            const badge = document.createElement('div');
            badge.className = 't6-readonly-badge';
            badge.innerHTML = '🔒 Solo lectura';
            badge.style.cssText =
                'display:inline-flex;align-items:center;justify-content:center;gap:6px;' +
                'background:rgba(220,38,38,0.09);color:#dc2626;' +
                'border:1px solid rgba(220,38,38,0.25);' +
                'border-radius:100px;padding:6px 16px;' +
                'font-size:0.8rem;font-weight:600;' +
                'width: fit-content;';
            
            colLeft.appendChild(badge);
        }
    }


    // ── Causa & Mensajes ──────────────────────────────────────
    const MENSAJES = {
        fallo_red: ['Dependencia caída', 'Otro'],
        falla_iao: ['HBS averiado','HSU averiado','CPE averiado','OS averiado','AP averiado','Configuración errónea', 'Otro'],
        incidentes: ['Cambio de contraseña','Hardware','Software','Permisos','Ancho de banda', 'Otro'],
    };

    function selectCausa(btn) {
        document.querySelectorAll('.t6-cause-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _renderMensajes(btn.dataset.causa, '');
        markInteractionSOC();
    }

    function _renderMensajes(causa, selected) {
        const list = MENSAJES[causa] || [];
        const c = document.getElementById('t6-mensaje-container');
        const grp = document.getElementById('t6-mensaje-group');
        if (!list.length) {
            if (grp) grp.style.display = 'none';
            c.innerHTML = '';
            return;
        }
        if (grp) grp.style.display = 'block';
        c.innerHTML = list.map(m => `<label class="t6-msg-option">
            <input type="radio" name="t6-msg" value="${m}" ${selected === m ? 'checked' : ''} onchange="Tab6.markInteractionSOC()">
            <span>${m}</span></label>`).join('');
    }

    function selectSOC(btn) {
        document.querySelectorAll('.t6-soc-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _updateOMFields();
        markInteractionSOC();
    }

    function onOMInput(input) {
        input.dataset.savedValue = input.value;
        markInteractionOM();
    }

    function _updateOMFields() {
        const socBtn = document.querySelector('.t6-soc-btn.active');
        const resSOC = socBtn ? socBtn.dataset.val === 'true' : null;
        
        const inputHoraFecha = document.getElementById('t6-om-hora-contacto-fecha');
        const inputHoraHora = document.getElementById('t6-om-hora-contacto-hora');
        const inputVisitaFecha = document.getElementById('t6-om-dia-visita-fecha');
        const inputVisitaHora = document.getElementById('t6-om-dia-visita-hora');
        if (!inputHoraFecha || !inputHoraHora || !inputVisitaFecha || !inputVisitaHora) return;

        const formLocked = _hasSavedDataOM && !_editModeOM;

        const updateField = (el, typeName) => {
            el.disabled = formLocked || (resSOC === true);
            if (resSOC === true) {
                el.type = 'text';
                el.value = 'N/A';
            } else if (formLocked) {
                el.type = 'text';
                el.value = el.dataset.savedValue || '';
            } else {
                const currentVal = el.value;
                el.type = typeName;
                el.value = (el.type === typeName && currentVal && currentVal !== 'N/A') ? currentVal : (el.dataset.savedValue || '');
            }
        };

        updateField(inputHoraFecha, 'date');
        updateField(inputHoraHora, 'time');
        updateField(inputVisitaFecha, 'date');
        updateField(inputVisitaHora, 'time');
    }

    // ── Field chain ───────────────────────────────────────────
    function onCCInput() {
        markInteractionSOC();
        const cc = document.getElementById('t6-cc-field').value.trim();
        const ttF = document.getElementById('t6-tt-field');
        ttF.disabled = !cc;
        if (!cc) { ttF.value = ''; document.getElementById('t6-wo-field').disabled = true; document.getElementById('t6-wo-field').value = ''; }
        _updateFormButtonsSOC();
    }

    function onTTInput() {
        markInteractionSOC();
        const tt = document.getElementById('t6-tt-field').value.trim();
        const woF = document.getElementById('t6-wo-field');
        woF.disabled = !tt;
        if (!tt) woF.value = '';
        _updateFormButtonsSOC();
    }

    // ── Lock/Unlock fields ────────────────────────────────────
    function _updateFormButtonsSOC() {
        const btnGuardar = document.getElementById('t6-btn-guardar-soc');
        const btnCancelar = document.getElementById('t6-btn-cancelar-soc');
        const btnEditar = document.getElementById('t6-btn-editar-soc');
        
        const cc = document.getElementById('t6-cc-field').value.trim();
        const tt = document.getElementById('t6-tt-field').value.trim();
        const wo = document.getElementById('t6-wo-field').value.trim();
        
        const causaActive = document.querySelector('.t6-cause-btn.active');
        const socActive = document.querySelector('.t6-soc-btn.active');
        const msgGroup = document.getElementById('t6-mensaje-group');
        const msgChecked = document.querySelector('input[name="t6-msg"]:checked');
        const msgValid = (msgGroup && msgGroup.style.display !== 'none') ? !!msgChecked : true;
        
        const allValid = causaActive && msgValid && socActive && cc;

        if (_isInteractingSOC) {
            btnGuardar.style.display = 'inline-flex';
            btnCancelar.style.display = 'inline-flex';
            btnEditar.style.display = 'none';

            if (!allValid) {
                btnGuardar.disabled = true;
                btnGuardar.style.opacity = '0.5';
                btnGuardar.style.cursor = 'not-allowed';
            } else {
                btnGuardar.disabled = false;
                btnGuardar.style.opacity = '1';
                btnGuardar.style.cursor = 'pointer';
            }
        } else {
            btnGuardar.style.display = 'none';
            btnCancelar.style.display = 'none';
            // Mostrar "Editar SOC" si tiene algún permiso SOC (haya o no datos previos)
            const canEditAnySOC = Permissions.canEdit('edit_clasificacion') ||
                                  Permissions.canEdit('edit_notas_tecnicas') ||
                                  Permissions.canEdit('edit_tickets_seguimiento');
            btnEditar.style.display = canEditAnySOC ? 'inline-flex' : 'none';
        }
    }

    function _updateFormButtonsOM() {
        const btnGuardar = document.getElementById('t6-btn-guardar-om');
        const btnCancelar = document.getElementById('t6-btn-cancelar-om');
        const btnEditar = document.getElementById('t6-btn-editar-om');

        if (_isInteractingOM) {
            btnGuardar.style.display = 'inline-flex';
            btnCancelar.style.display = 'inline-flex';
            btnEditar.style.display = 'none';
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = '1';
            btnGuardar.style.cursor = 'pointer';
        } else {
            btnGuardar.style.display = 'none';
            btnCancelar.style.display = 'none';
            // Mostrar "Editar O&M" si tiene permiso (haya o no datos previos)
            const canEdit = Permissions.canEdit('edit_datos_om');
            btnEditar.style.display = canEdit ? 'inline-flex' : 'none';
        }
    }

    function _setFieldsLockedSOC(locked) {
        const cc = document.getElementById('t6-cc-field').value.trim();
        const tt = document.getElementById('t6-tt-field').value.trim();
        document.getElementById('t6-desc-field').disabled = locked;
        document.getElementById('t6-cc-field').disabled = locked;
        document.getElementById('t6-tt-field').disabled = locked || !cc;
        document.getElementById('t6-wo-field').disabled = locked || !tt;
        
        document.querySelectorAll('.t6-cause-btn,.t6-soc-btn').forEach(b => {
            b.style.pointerEvents = locked ? 'none' : '';
            b.style.opacity = locked ? '0.5' : '';
            b.style.filter = locked ? 'grayscale(100%)' : '';
        });
        document.querySelectorAll('.t6-msg-option').forEach(lbl => {
            const inp = lbl.querySelector('input');
            if (inp) inp.disabled = locked;
            lbl.style.pointerEvents = locked ? 'none' : '';
            lbl.style.opacity = locked ? '0.5' : '';
            lbl.style.filter = locked ? 'grayscale(100%)' : '';
        });
        
        _updateFormButtonsSOC();
        _updateOMFields();
    }

    function _setFieldsLockedOM(locked) {
        _updateOMFields();
        _updateFormButtonsOM();
    }

    function enableEditSOC() { 
        _editModeSOC = true; 
        _isInteractingSOC = true;
        _setFieldsLockedSOC(false); 
    }

    function cancelEditSOC() {
        _editModeSOC = false;
        _isInteractingSOC = false;
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (t) {
            const ext = _getExt(t.id);
            _hasSavedDataSOC = _hasAnyDetailSOC(t, ext);
            _populateModal(t, ext);
        }
    }

    function enableEditOM() { 
        _editModeOM = true; 
        _isInteractingOM = true;
        _setFieldsLockedOM(false); 
    }

    function cancelEditOM() {
        _editModeOM = false;
        _isInteractingOM = false;
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (t) {
            const ext = _getExt(t.id);
            _hasSavedDataOM = _hasAnyDetailOM(t, ext);
            _populateModal(t, ext);
        }
    }

    async function saveDetailsSOC() {
        if (!_activeId) return;
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (!t) return;

        const causa = document.querySelector('.t6-cause-btn.active')?.dataset.causa || '';
        const msgChecked = document.querySelector('input[name="t6-msg"]:checked');
        const msgPred = msgChecked ? msgChecked.value : '';
        const socBtn = document.querySelector('.t6-soc-btn.active');
        const resSOC = socBtn ? socBtn.dataset.val === 'true' : null;
        const desc = document.getElementById('t6-desc-field').value.trim();
        const cc = document.getElementById('t6-cc-field').value.trim();
        const tt = document.getElementById('t6-tt-field').value.trim();
        const wo = document.getElementById('t6-wo-field').value.trim();

        try { await Store.updateTicket('entidades', _activeId, { socDetalles: desc, ccNumber: cc, ttNumber: tt }); }
        catch (e) { console.warn('Supabase update partial error:', e); }

        const now = new Date().toISOString();
        const prevExt = _getExt(_activeId);

        const user = Auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';
        
        await _setExt(_activeId, {
            causaIncidencia:       causa,
            mensajePredeterminado: msgPred,
            resueltoRemotoSoc:     resSOC,
            woNumber:              wo,
            ccNumber:              cc,
            ttNumber:              tt,
            socDetalles:           desc,
            causaTs:  causa  ? (prevExt.causaTs  || now) : null,
            ccTs:     cc     ? (prevExt.ccTs     || now) : null,
            ttTs:     tt     ? (prevExt.ttTs     || now) : null,
            woTs:     (wo || resSOC) ? (prevExt.woTs || now) : null,
            estado:   'En curso'
        });

        const oldStatus = prevExt.estado || 'Abierto';
        
        await _addActivity(_activeId, {
            tipo: 'Actualizado',
            autor: userName,
            fecha: new Date().toISOString(),
            descripcion: 'diagnostico tecnico inicial',
            cambioEstado: `${oldStatus} → En curso`,
        });

        _editModeSOC = false;
        _isInteractingSOC = false;
        _hasSavedDataSOC = true;
        _setFieldsLockedSOC(true);

        // Re-fetch and re-render
        const updated = _allTickets.find(tk => tk.id === _activeId);
        if (updated) {
            const ext2 = _getExt(_activeId);
            _populateModal(updated, ext2);
        }
        await render();
        Toast.show('Detalles SOC guardados.', 'success');
    }

    async function saveDetailsOM() {
        if (!_activeId) return;
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (!t) return;

        const socBtn = document.querySelector('.t6-soc-btn.active');
        const resSOC = socBtn ? socBtn.dataset.val === 'true' : null;

        // Always read input values regardless of SOC state
        const dateH = document.getElementById('t6-om-hora-contacto-fecha')?.value || '';
        const timeH = document.getElementById('t6-om-hora-contacto-hora')?.value || '';
        const dateV = document.getElementById('t6-om-dia-visita-fecha')?.value || '';
        const timeV = document.getElementById('t6-om-dia-visita-hora')?.value || '';

        let omHora = '';
        let omVisita = '';
        if (resSOC === true) {
            omHora = 'N/A';
            omVisita = 'N/A';
        } else {
            omHora = (dateH || timeH) ? `${dateH}T${timeH}` : '';
            omVisita = (dateV || timeV) ? `${dateV}T${timeV}` : '';
        }

        const prevExt = _getExt(_activeId);
        const now = new Date().toISOString();

        await _setExt(_activeId, {
            omHoraContacto:        omHora,
            omDiaVisita:           omVisita,
            omHoraTs:              omHora ? (prevExt.omHoraTs || now) : null,
            omVisitaTs:            omVisita ? (prevExt.omVisitaTs || now) : null
        });

        const user = Auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';
        await _addActivity(_activeId, {
            tipo: 'Actualizado',
            autor: userName,
            fecha: new Date().toISOString(),
            descripcion: `Actualización O&M - Contacto: ${omHora||'—'} | Visita: ${omVisita||'—'}`,
        });

        _editModeOM = false;
        _isInteractingOM = false;
        const updated = _allTickets.find(tk => tk.id === _activeId);
        if (updated) {
            const ext2 = _getExt(_activeId);
            _hasSavedDataOM = _hasAnyDetailOM(updated, ext2);
            _setFieldsLockedOM(_hasSavedDataOM);
            _populateModal(updated, ext2);
        }
        await render();
        Toast.show('Datos O&M guardados.', 'success');
    }

    async function _addActivity(id, activity) {
        const ext = _getExt(id);
        const acts = Array.isArray(ext.actividades) ? [...ext.actividades] : [];
        acts.unshift(activity);
        await _setExt(id, { actividades: acts });
    }

    // ── Timeline ──────────────────────────────────────────────
    function _renderTimeline(t, ext) {
        const causa  = ext.causaIncidencia || t.causaIncidencia || null;
        const cc     = t.ccNumber  || null;
        const tt     = t.ttNumber  || null;
        const wo     = ext.woNumber || t.woNumber || null;
        const resSOC = ext.resueltoRemotoSoc != null ? ext.resueltoRemotoSoc : t.resueltoRemotoSoc;
        const fc     = ext.fechaCierre || t.fechaCierre || null;
        const dur    = _calcDuration(t.createdAt, fc);
        const team   = _calcTeam(t, ext);
        const cerradoPor = ext.cerradoPor || t.cerradoPor || '—';

        const acts = Array.isArray(ext.actividades) ? ext.actividades : [];
        function findUser(ts, explicitUser) {
            if (explicitUser) return explicitUser;
            if (!ts) return null;
            const tTime = new Date(ts).getTime();
            for (let a of acts) {
                if (Math.abs(new Date(a.fecha).getTime() - tTime) < 3000) return a.autor;
            }
            return null;
        }

        const steps = [
            { label: 'REGISTRO',        time: t.createdAt,     done: true,             user: t.createdBy },
            { label: 'CLASIFICACIÓN',   time: ext.causaTs,     done: !!causa,          user: findUser(ext.causaTs, ext.causaUser) },
            { label: 'CC',              time: ext.ccTs,        done: !!cc,             user: findUser(ext.ccTs, ext.ccUser) },
            { label: 'TT',              time: ext.ttTs,        done: !!tt,             user: findUser(ext.ttTs, ext.ttUser) },
            { label: 'WO',              time: ext.woTs,        done: !!(wo || resSOC), noNeed: resSOC, user: findUser(ext.woTs, ext.woUser) },
            { label: 'HORA DE CIERRE',  time: fc,              done: !!fc,             user: cerradoPor },
        ];

        const stepsHTML = steps.map((s, i) => {
            const stepCls = s.done ? (s.noNeed ? 'tl2-step--grey' : 'tl2-step--done') : 'tl2-step--pending';
            const dotCls  = s.done ? (s.label === 'HORA DE CIERRE' ? 'tl2-dot--close' : s.noNeed ? 'tl2-dot--grey' : 'tl2-dot--done') : 'tl2-dot--pending';
            let subHTML;
            if (s.noNeed) {
                subHTML = `<div class="tl2-pending-badge" style="color:var(--gray-500)">NO NEED</div>`;
            } else if (s.time) {
                subHTML = `<div class="tl2-time">${_fmtFull(s.time)}</div>`;
            } else if (!s.done) {
                subHTML = `<div class="tl2-pending-badge">Pendiente</div>`;
            } else {
                subHTML = '';
            }

            let durationHTML = '';
            if (s.time && s.done && !s.noNeed) {
                // Find next valid step
                let nextValidStep = null;
                let stepDiff = 0;
                for (let j = i + 1; j < steps.length; j++) {
                    if (steps[j].done && !steps[j].noNeed && steps[j].time) {
                        nextValidStep = steps[j];
                        stepDiff = j - i;
                        break;
                    }
                }
                
                if (nextValidStep) {
                    const ms = new Date(nextValidStep.time) - new Date(s.time);
                    if (ms >= 0) {
                        const h = Math.floor(ms / 3600000);
                        const m = Math.floor((ms % 3600000) / 60000);
                        let durText = '';
                        if (h >= 24) {
                            const d = Math.floor(h / 24);
                            const rem_h = h % 24;
                            durText = `${d}d ${rem_h}h`;
                        } else {
                            durText = `${h}h ${m}m`;
                        }
                        
                        const w = stepDiff * 100;
                        const r = (stepDiff * 100) - 50;
                        durationHTML = `<div class="tl2-duration" style="width: ${w}%; right: -${r}%;">${durText}</div>`;
                    }
                }
            }

            return `
            <div class="tl2-step ${stepCls}">
                <div class="tl2-node">
                    <div class="tl2-dot ${dotCls}"></div>
                    ${durationHTML}
                </div>
                <div class="tl2-body">
                    <div class="tl2-label">${s.label}</div>
                    ${subHTML}
                    ${s.user && s.done && !s.noNeed ? `<div class="tl2-user">${s.user}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        document.getElementById('t6-timeline-container').innerHTML = `
        <div class="t6-section-block">
            <div class="t6-section-label">CRONOGRAMA DEL EVENTO</div>
            <div class="tl2-timeline">${stepsHTML}</div>
            <div class="t6-metrics-row">
                <div class="t6-metric-card">
                    <div class="t6-metric-head">MÉTRICAS CLAVE</div>
                    <div class="t6-metric-item"><span>⏱ Duración:</span><strong>${dur}</strong></div>
                    <div class="t6-metric-item"><span>👥 Equipo:</span><strong>${team}</strong></div>
                </div>
                <div class="t6-metric-card">
                    <div class="t6-metric-head">CERRADO POR</div>
                    <div class="t6-metric-item"><span>👤 Usuario:</span><strong>${cerradoPor}</strong></div>
                </div>
            </div>
        </div>`;
    }

    function _step(label, value, dotClass, extraClass) {
        return `<div class="t6-tl-step ${extraClass||''}">
          <div class="t6-tl-dot t6-dot-${dotClass}"></div>
          <div class="t6-tl-info">
            <div class="t6-tl-label">${label}</div>
            <div class="t6-tl-val">${value}</div>
          </div>
        </div>`;
    }

    // ── Activities ────────────────────────────────────────────
    function _renderActivities(acts) {
        const c = document.getElementById('t6-activities-list');
        if (!acts || !acts.length) {
            c.innerHTML = '<em style="color:var(--gray-400);font-size:.85rem">Sin actividades registradas.</em>';
            return;
        }
        c.innerHTML = acts.map(a => `
        <div class="t6-act-card">
          <div class="t6-act-header">
            <strong class="t6-act-type">${a.tipo}</strong>
            <span class="t6-act-by">por ${a.autor}</span>
            <span class="t6-act-date">${_fmtFull(a.fecha)}</span>
          </div>
          ${a.cambioEstado ? `<div class="t6-act-estado">ESTADO: ${a.cambioEstado}</div>` : ''}
          <div class="t6-act-desc">${(a.descripcion||'').replace(/\n/g,'<br>')}</div>
        </div>`).join('');
    }

    // ── History ───────────────────────────────────────────────
    function _renderHistory(currentT) {
        const same = _allTickets.filter(t => t.id !== currentT.id && t.institucion === currentT.institucion);
        const c = document.getElementById('t6-history-wrapper');
        if (!same.length) {
            c.innerHTML = '<em style="color:var(--gray-400);font-size:.85rem">Sin incidencias previas para esta entidad.</em>';
            return;
        }
        const rows = same.map(t => {
            const ext = _getExt(t.id);
            const st = ext.estado || t.estado || 'Abierto';
            const bc = st === 'Cerrado' ? 'badge-confirmed' : st === 'En curso' ? 'badge-progress' : 'badge-pending';
            return `<tr>
              <td><span class="t6-entity-link t6-hist-link" onclick="Tab6.openHistorialModal('${t.id}')">${t.institucion||'—'}</span></td>
              <td><span class="ticket-badge ${bc}">${st}</span></td>
              <td>${t.ttNumber||'—'}</td>
              <td>${ext.woNumber||t.woNumber||'—'}</td>
              <td>${ext.causaIncidencia||t.causaIncidencia||'—'}</td>
              <td>${t.region||'—'}</td>
              <td>${(ext.fechaCierre||t.fechaCierre) ? _fmtFull(ext.fechaCierre||t.fechaCierre) : '—'}</td>
              <td>${_calcDuration(t.createdAt, ext.fechaCierre||t.fechaCierre)}</td>
              <td>${_calcTeam(t,ext)}</td>
              <td class="t6-desc-cell" title="${(t.descripcion||'').replace(/"/g,'&quot;')}">${t.descripcion||'—'}</td>
              <td>${ext.cerradoPor||t.cerradoPor||'—'}</td>
            </tr>`;
        }).join('');
        c.innerHTML = `<div class="t6-hist-scroll">
          <table class="t6-table t6-hist-table">
            <thead><tr>
              <th>Entidad</th><th>Estado</th><th>TT</th><th>WO</th><th>Tipo de fallo</th>
              <th>Región</th><th>Tiempo de fin</th><th>Duración</th>
              <th>Team resolutor</th><th>Descripción</th><th>Usuario resolutor</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table></div>`;
    }

    // ── Historial Overlay Modal ────────────────────────────
    function openHistorialModal(id) {
        const t = _allTickets.find(tk => tk.id === id);
        if (!t) return;
        const ext = _getExt(t.id);
        const causa = ext.causaIncidencia || t.causaIncidencia || '—';
        const cc    = t.ccNumber || '—';
        const tt    = t.ttNumber || '—';
        const wo    = ext.woNumber || t.woNumber || '—';
        const resSOC = ext.resueltoRemotoSoc != null ? ext.resueltoRemotoSoc : t.resueltoRemotoSoc;
        const fc    = ext.fechaCierre || t.fechaCierre;
        const st    = ext.estado || t.estado || 'Abierto';
        const bc    = st === 'Cerrado' ? 'badge-confirmed' : st === 'En curso' ? 'badge-progress' : 'badge-pending';
        const dur   = _calcDuration(t.createdAt, fc);
        const team  = _calcTeam(t, ext);
        const cerradoPor = ext.cerradoPor || t.cerradoPor || '—';

        document.getElementById('t6-hm-title').textContent      = t.institucion || 'Sin Entidad';
        document.getElementById('t6-hm-createdby').textContent  = t.createdBy || '—';
        document.getElementById('t6-hm-createdat').textContent  = _fmtFull(t.createdAt);

        document.getElementById('t6-hm-body').innerHTML = `
        <div class="t6-section-card">
            <div class="t6-section-header">👤 ${I18n.translate('T6_HM_REGISTRO')}</div>
            <div class="t6-reg-grid">
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_NOMBRE')}</span><span class="t6-reg-val">${t.nombre||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_DNI')}</span><span class="t6-reg-val">${t.dni||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_CELULAR')}</span><span class="t6-reg-val">${t.cel||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_EMAIL')}</span><span class="t6-reg-val">${t.email||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_TIEMPO_INICIO')}</span><span class="t6-reg-val">${(t.fechaInc||'—')+' '+(t.horaInc||'')}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_REGION')}</span><span class="t6-reg-val">${t.region||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_PROVINCIA')}</span><span class="t6-reg-val">${t.provincia||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_LOCALIDAD')}</span><span class="t6-reg-val">${t.localidad||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_TIPO')}</span><span class="t6-reg-val">${t.tipo||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_DESC_REPORTADA')}</span><span class="t6-reg-val">${t.descripcion||'—'}</span></div>
            </div>
        </div>

        <div class="t6-section-card">
            <div class="t6-section-header">📊 ${I18n.translate('T6_HM_CLASIF_SEGUIMIENTO')}</div>
            <div class="t6-reg-grid">
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_ESTADO')}</span><span class="ticket-badge ${bc}">${st}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_CLASIFICACION')}</span><span class="t6-reg-val">${causa}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">CC</span><span class="t6-reg-val">${cc}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">TT</span><span class="t6-reg-val">${tt}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">WO</span><span class="t6-reg-val">${resSOC ? '<em style="color:var(--gray-400)">NO NEED</em>' : wo}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_TEAM_RES')}</span><span class="t6-reg-val">${team}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_CERRADO_POR')}</span><span class="t6-reg-val">${cerradoPor}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_HORA_CIERRE')}</span><span class="t6-reg-val">${fc ? _fmtFull(fc) : '—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_DURACION')}</span><span class="t6-reg-val">${dur}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_HORA_CONTACTO')}</span><span class="t6-reg-val">${ext.omHoraContacto === 'N/A' ? 'N/A' : (ext.omHoraContacto ? _fmtFull(ext.omHoraContacto) : '—')}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">${I18n.translate('T6_HM_DIA_VISITA')}</span><span class="t6-reg-val">${ext.omDiaVisita === 'N/A' ? 'N/A' : (ext.omDiaVisita ? _fmtFull(ext.omDiaVisita) : '—')}</span></div>
            </div>
        </div>

        ${t.socDetalles ? `
        <div class="t6-section-card">
            <div class="t6-section-header">📝 ${I18n.translate('T6_HM_NOTAS_TEC')}</div>
            <p style="font-size:.85rem;color:var(--gray-700);line-height:1.6;white-space:pre-wrap;margin:0">${t.socDetalles}</p>
        </div>` : ''}`;

        document.getElementById('t6-hm-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeHistorialModal() {
        document.getElementById('t6-hm-overlay').classList.remove('open');
        document.body.style.overflow = '';
    }

    // ── Update status sub-modal ───────────────────────────────
    function openUpdateModal() {
        document.getElementById('modal-t6-update').classList.add('open');
    }

    function closeUpdateModal() {
        document.getElementById('modal-t6-update').classList.remove('open');
        document.getElementById('t6-upd-comment').value = '';
        document.getElementById('t6-upd-status').value = 'Abierto';
    }

    async function submitUpdate() {
        if (!_activeId) return;
        const newStatus = document.getElementById('t6-upd-status').value;
        const comment = document.getElementById('t6-upd-comment').value.trim();
        if (!comment) { Toast.show('El comentario es obligatorio.', 'error'); return; }

        const ext = _getExt(_activeId);
        const oldStatus = ext.estado || 'Abierto';
        const user = Auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';

        const updates = { estado: newStatus };
        if (newStatus === 'Cerrado') {
            updates.fechaCierre = new Date().toISOString();
            updates.cerradoPor = userName;
            // Update Supabase resuelto field
            try { await Store.updateTicket('entidades', _activeId, { resuelto: 'confirmado', finalizado: true, generadoCC: true }); }
            catch (e) { console.warn(e); }
        }
        await _setExt(_activeId, updates);

        await _addActivity(_activeId, {
            tipo: newStatus === 'Cerrado' ? 'Cerrado' : 'Actualizado',
            autor: userName,
            fecha: new Date().toISOString(),
            descripcion: comment,
            cambioEstado: `${oldStatus} → ${newStatus}`,
        });

        closeUpdateModal();
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (t) {
            _populateModal(t, _getExt(t.id));
        }
        await render();
        App.updateBadges();
        Toast.show('Estado actualizado.', 'success');
    }

    // ── Export ────────────────────────────────────────────────
    function exportExcel() {
        try {
            const tickets = _allTickets || [];
            if (!tickets.length) { Toast.show('No hay tickets para exportar.', 'warning'); return; }
            const rows = tickets.map(t => {
                const ext = _getExt(t.id);
                return {
                    'ID': t.id,
                    'Nombre Completo': t.nombre || '—',
                    'DNI': t.dni || '—',
                    'Celular': t.cel || '—',
                    'Tiempo de Inicio': t.createdAt ? _fmtFull(t.createdAt) : '—',
                    'Región': t.region || '—',
                    'Provincia': t.provincia || '—',
                    'Localidad': t.localidad || '—',
                    'Tipo Entidad': t.tipo || '—',
                    'Entidad': t.institucion || '—',
                    'Estado': ext.estado || 'Abierto',
                    'Causa Incidencia': ext.causaIncidencia || t.causaIncidencia || '—',
                    'CC': t.ccNumber || '—',
                    'TT': t.ttNumber || '—',
                    'WO': ext.woNumber || t.woNumber || '—',
                    'Team Resolvió': _calcTeam(t, ext),
                    'Usuario Resolutor': ext.cerradoPor || t.cerradoPor || '—',
                    'Hora de Cierre': ext.fechaCierre ? _fmtFull(ext.fechaCierre) : '—',
                    'Duración': _calcDuration(t.createdAt, ext.fechaCierre),
                    'Descripción Reportada': t.descripcion || '—',
                    'Detalles SOC': t.socDetalles || '—',
                    'Hora Contacto Entidad': ext.omHoraContacto === 'N/A' ? 'N/A' : (ext.omHoraContacto ? _fmtFull(ext.omHoraContacto) : '—'),
                    'Día Visita Técnica Previsto': ext.omDiaVisita === 'N/A' ? 'N/A' : (ext.omDiaVisita ? _fmtFull(ext.omDiaVisita) : '—'),
                };
            });
            Exporter.downloadExcel('Tickets', rows, `IBBS_Tickets_${Date.now()}.xlsx`);
            Toast.show('Excel exportado correctamente.', 'success');
        } catch (e) {
            console.error('Error exportando Excel:', e);
            Toast.show('Error al generar el Excel: ' + e.message, 'error');
        }
    }

    // ── Controls ──────────────────────────────────────────────
    function _bindControls() {
        const reset = () => { _currentPage = 1; render(); };
        document.getElementById('t6-sort').addEventListener('change', reset);
        document.getElementById('t6-filter-status').addEventListener('change', reset);
        document.getElementById('t6-filter-region').addEventListener('change', reset);
        document.getElementById('t6-filter-date').addEventListener('change', reset);
        document.getElementById('btn-t6-export').addEventListener('click', exportExcel);

        // Search events
        document.getElementById('t6-btn-search').addEventListener('click', reset);
        document.getElementById('t6-search').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') reset();
        });
    }

    return {
        init, render, goToPage, openModal, closeModal, 
        enableEditSOC, cancelEditSOC, saveDetailsSOC,
        enableEditOM, cancelEditOM, saveDetailsOM,
        selectCausa, selectSOC, onCCInput, onTTInput, onOMInput, initDelete, cancelDelete, confirmDeleteTicket,
        openUpdateModal, closeUpdateModal, submitUpdate,
        exportExcel, markInteractionSOC, markInteractionOM,
        openHistorialModal, closeHistorialModal
    };
})();
