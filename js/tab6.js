/**
 * tab6.js – Entidades: Tickets (tabla + modal de detalle)
 * IBBS Gestión de Incidencias
 */

const Tab6 = (() => {
    let _currentPage = 1;
    const PAGE_SIZE = 15;
    let _allTickets = [];
    let _activeId = null;
    let _editMode = false;

    // ── LocalStorage helpers for extended fields ─────────────
    function _getExt(id) {
        try { return JSON.parse(localStorage.getItem('ibbs_ext_' + id) || '{}'); }
        catch { return {}; }
    }
    function _setExt(id, data) {
        try {
            const cur = _getExt(id);
            localStorage.setItem('ibbs_ext_' + id, JSON.stringify({ ...cur, ...data }));
        } catch {}
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
    function init() {
        _bindControls();
        window.addEventListener('langChanged', () => render());
    }

    // ── Render table ─────────────────────────────────────────
    async function render() {
        _allTickets = await Store.getTickets('entidades');
        
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
              <td>${ext.fechaCierre ? _fmtFull(ext.fechaCierre) : (t.fechaCierre ? _fmtFull(t.fechaCierre) : '—')}</td>
              <td>${dur}</td>
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
              <th>${I18n.translate('T6_COL_CLOSE_TIME')}</th>
              <th>${I18n.translate('T6_COL_DURATION')}</th>
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
        return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
    }

    function _calcTeam(t, ext) {
        const wo = ext.woNumber || t.woNumber;
        const tt = t.ttNumber || ext.ttNumber;
        if (wo) return 'Team O&M';
        if (tt) return 'Team OSC';
        return '—';
    }

    function _fmtFull(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
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
        sel.innerHTML = `<option value="">${I18n.translate('T2_ALL_REGIONS')}</option>`;
        regions.forEach(r => {
            const o = document.createElement('option');
            o.value = o.textContent = r;
            if (r === cur) o.selected = true;
            sel.appendChild(o);
        });
    }

    // ── INTERACTION STATE ───────────────────────────────────────
    let _hasSavedData = false;
    let _isInteracting = false;

    function markInteraction() {
        if (!_isInteracting) _isInteracting = true;
        _updateFormButtons();
    }

    function _hasAnyDetail(t, ext) {
        const causa = ext.causaIncidencia || t.causaIncidencia || '';
        const resSOC = ext.resueltoRemotoSoc != null ? ext.resueltoRemotoSoc : t.resueltoRemotoSoc;
        const desc = t.socDetalles || '';
        const cc = t.ccNumber || '';
        const wo = ext.woNumber || t.woNumber || '';
        return !!(causa || (resSOC !== null && resSOC !== undefined) || desc.trim() || cc.trim() || wo.trim());
    }

    // ── OPEN / CLOSE DETAIL (inline swap) ───────────────────────
    function openModal(id) {
        const t = _allTickets.find(tk => tk.id === id);
        if (!t) return;
        _activeId = id;
        _editMode = false;
        
        const ext = _getExt(t.id);
        _hasSavedData = _hasAnyDetail(t, ext);
        _isInteracting = false;
        
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

        _setFieldsLocked(_hasSavedData);
        _renderTimeline(t, ext);
        _renderActivities(actividades);
        _renderHistory(t);
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
        markInteraction();
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
            <input type="radio" name="t6-msg" value="${m}" ${selected === m ? 'checked' : ''} onchange="Tab6.markInteraction()">
            <span>${m}</span></label>`).join('');
    }

    function selectSOC(btn) {
        document.querySelectorAll('.t6-soc-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        markInteraction();
    }

    // ── Field chain ───────────────────────────────────────────
    function onCCInput() {
        markInteraction();
        const cc = document.getElementById('t6-cc-field').value.trim();
        const ttF = document.getElementById('t6-tt-field');
        ttF.disabled = !cc;
        if (!cc) { ttF.value = ''; document.getElementById('t6-wo-field').disabled = true; document.getElementById('t6-wo-field').value = ''; }
    }

    function onTTInput() {
        markInteraction();
        const tt = document.getElementById('t6-tt-field').value.trim();
        const woF = document.getElementById('t6-wo-field');
        woF.disabled = !tt;
        if (!tt) woF.value = '';
    }

    // ── Lock/Unlock fields ────────────────────────────────────
    function _updateFormButtons() {
        const btnGuardar = document.getElementById('t6-btn-guardar');
        const btnCancelar = document.getElementById('t6-btn-cancelar');
        const btnEditar = document.getElementById('t6-btn-editar');
        const cc = document.getElementById('t6-cc-field').value.trim();

        if (_isInteracting) {
            btnGuardar.style.display = 'inline-flex';
            btnCancelar.style.display = 'inline-flex';
            btnEditar.style.display = 'none';

            if (!cc) {
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
            btnEditar.style.display = _hasSavedData ? 'inline-flex' : 'none';
        }
    }

    function _setFieldsLocked(locked) {
        const cc = document.getElementById('t6-cc-field').value.trim();
        const tt = document.getElementById('t6-tt-field').value.trim();
        document.getElementById('t6-desc-field').disabled = locked;
        document.getElementById('t6-cc-field').disabled = locked;
        document.getElementById('t6-tt-field').disabled = locked || !cc;
        document.getElementById('t6-wo-field').disabled = locked || !tt;
        
        document.querySelectorAll('.t6-cause-btn,.t6-soc-btn').forEach(b => {
            b.style.pointerEvents = locked ? 'none' : '';
            b.style.opacity = locked ? '0.65' : '';
        });
        document.querySelectorAll('.t6-msg-option input').forEach(inp => inp.disabled = locked);
        
        _updateFormButtons();
    }

    function enableEdit() { 
        _editMode = true; 
        _isInteracting = true;
        _setFieldsLocked(false); 
    }

    function cancelEdit() {
        _editMode = false;
        _isInteracting = false;
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (t) {
            const ext = _getExt(t.id);
            _hasSavedData = _hasAnyDetail(t, ext);
            _populateModal(t, ext);
        }
    }

    async function saveDetails() {
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
        _setExt(_activeId, {
            causaIncidencia:       causa,
            mensajePredeterminado: msgPred,
            resueltoRemotoSoc:     resSOC,
            woNumber:              wo,
            causaTs:  causa  ? (prevExt.causaTs  || now) : null,
            ccTs:     cc     ? (prevExt.ccTs     || now) : null,
            ttTs:     tt     ? (prevExt.ttTs     || now) : null,
            woTs:     (wo || resSOC) ? (prevExt.woTs || now) : null,
        });

        const user = Auth.getUser();
        const userName = user?.user_metadata?.full_name || user?.email || 'Usuario';
        _addActivity(_activeId, {
            tipo: 'Actualizado',
            autor: userName,
            fecha: new Date().toISOString(),
            descripcion: `Causa: ${causa || '—'} | Mensaje: ${msgPred || '—'} | CC: ${cc||'—'} | TT: ${tt||'—'} | WO: ${wo||'—'}`,
        });

        _editMode = false;
        _isInteracting = false;
        _hasSavedData = true;
        _setFieldsLocked(true);

        // Re-fetch and re-render
        _allTickets = await Store.getTickets('entidades');
        const updated = _allTickets.find(tk => tk.id === _activeId);
        if (updated) {
            const ext2 = _getExt(_activeId);
            _renderTimeline(updated, ext2);
            _renderActivities(ext2.actividades || []);
        }
        await render();
        Toast.show('Cambios guardados.', 'success');
    }

    function _addActivity(id, activity) {
        const ext = _getExt(id);
        const acts = Array.isArray(ext.actividades) ? ext.actividades : [];
        acts.unshift(activity);
        _setExt(id, { actividades: acts });
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

        const steps = [
            { label: 'REGISTRO',        time: t.createdAt,     done: true            },
            { label: 'CLASIFICACIÓN',   time: ext.causaTs,     done: !!causa         },
            { label: 'CC',              time: ext.ccTs,        done: !!cc            },
            { label: 'TT',              time: ext.ttTs,        done: !!tt            },
            { label: 'WO',              time: ext.woTs,        done: !!(wo || resSOC), noNeed: resSOC },
            { label: 'HORA DE CIERRE', time: fc,              done: !!fc            },
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
            return `
            <div class="tl2-step ${stepCls}">
                <div class="tl2-node">
                    <div class="tl2-dot ${dotCls}"></div>
                </div>
                <div class="tl2-body">
                    <div class="tl2-label">${s.label}</div>
                    ${subHTML}
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
              <th>Región</th><th>Fecha y hora de cierre</th><th>Duración</th>
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
            <div class="t6-section-header">👤 Registro</div>
            <div class="t6-reg-grid">
                <div class="t6-reg-field"><span class="t6-reg-label">Nombre Completo</span><span class="t6-reg-val">${t.nombre||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">DNI</span><span class="t6-reg-val">${t.dni||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Celular</span><span class="t6-reg-val">${t.cel||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Tiempo de Inicio</span><span class="t6-reg-val">${(t.fechaInc||'—')+' '+(t.horaInc||'')}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Región</span><span class="t6-reg-val">${t.region||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Provincia</span><span class="t6-reg-val">${t.provincia||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Localidad</span><span class="t6-reg-val">${t.localidad||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Tipo</span><span class="t6-reg-val">${t.tipo||'—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Descripción Reportada</span><span class="t6-reg-val">${t.descripcion||'—'}</span></div>
            </div>
        </div>

        <div class="t6-section-card">
            <div class="t6-section-header">📊 Clasificación y Seguimiento</div>
            <div class="t6-reg-grid">
                <div class="t6-reg-field"><span class="t6-reg-label">Estado</span><span class="ticket-badge ${bc}">${st}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Clasificación</span><span class="t6-reg-val">${causa}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">CC</span><span class="t6-reg-val">${cc}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">TT</span><span class="t6-reg-val">${tt}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">WO</span><span class="t6-reg-val">${resSOC ? '<em style="color:var(--gray-400)">NO NEED</em>' : wo}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Team Resolutor</span><span class="t6-reg-val">${team}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Cerrado por</span><span class="t6-reg-val">${cerradoPor}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Hora de Cierre</span><span class="t6-reg-val">${fc ? _fmtFull(fc) : '—'}</span></div>
                <div class="t6-reg-field"><span class="t6-reg-label">Duración</span><span class="t6-reg-val">${dur}</span></div>
            </div>
        </div>

        ${t.socDetalles ? `
        <div class="t6-section-card">
            <div class="t6-section-header">📝 Notas Técnicas</div>
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
        _setExt(_activeId, updates);

        _addActivity(_activeId, {
            tipo: newStatus === 'Cerrado' ? 'Cerrado' : 'Actualizado',
            autor: userName,
            fecha: new Date().toISOString(),
            descripcion: comment,
            cambioEstado: `${oldStatus} → ${newStatus}`,
        });

        closeUpdateModal();
        _allTickets = await Store.getTickets('entidades');
        const t = _allTickets.find(tk => tk.id === _activeId);
        if (t) {
            const ext2 = _getExt(_activeId);
            _populateModal(t, ext2); // Refresh the whole detail view
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
        init, render, goToPage, openModal, closeModal, enableEdit, cancelEdit, saveDetails,
        selectCausa, selectSOC, onCCInput, onTTInput, initDelete, cancelDelete, confirmDeleteTicket,
        openUpdateModal, closeUpdateModal, submitUpdate,
        exportExcel, markInteraction,
        openHistorialModal, closeHistorialModal
    };
})();
