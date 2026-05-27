/**
 * tab1.js – Entidades: Creación de Registro
 * IBBS Gestión de Incidencias
 */

const Tab1 = (() => {

    function init() {
        _buildCascade();
        _bindButtons();
        window.addEventListener('langChanged', () => {
            _buildCascade();
        });
    }

    // ── Cascade Selectors ────────────────────────────────────────
    function _buildCascade() {
        const selRegion = document.getElementById('t1-region');
        const selProv = document.getElementById('t1-provincia');
        const selLoc = document.getElementById('t1-localidad');
        const selTipo = document.getElementById('t1-tipo');
        const selInst = document.getElementById('t1-institucion');

        const allowedRegs = DataManager.getRegiones().filter(r => typeof Permissions !== 'undefined' ? Permissions.canViewRegion(r) : true);
        _populateSelect(selRegion, allowedRegs, 'PH_SELECT_REGION');
        
        selRegion.addEventListener('change', () => {
            _reset([selProv, selLoc, selTipo, selInst]);
            
            _populateSelect(selProv, DataManager.getProvincias(selRegion.value), 'PH_SELECT_PROVINCE');
            _populateSelect(selLoc, DataManager.getLocalidadesByRegion(selRegion.value), 'PH_SELECT_LOCALITY');
            
            _updateSteps(1);
        });

        selProv.addEventListener('change', () => {
            // Si el usuario elige la Provincia (ya sea primero o cambiando una deducida)
            _reset([selTipo, selInst]);

            const currentLoc = selLoc.value;
            const newProv = selProv.value;

            if (currentLoc) {
                // Ambiguous case: localidad already chosen → just load Tipo for the new province
                _populateSelect(selTipo, DataManager.getTipos(selRegion.value, newProv, currentLoc), 'PH_SELECT_TYPE');
                _updateSteps(3);
            } else {
                // Normal case: refiltrar Localidades basado en la provincia seleccionada
                _populateSelect(selLoc, DataManager.getLocalidades(selRegion.value, newProv), 'PH_SELECT_LOCALITY');
                _updateSteps(2);
            }
        });

        selLoc.addEventListener('change', () => {
            _reset([selTipo, selInst]);

            const loc = selLoc.value;
            if (!loc) return;

            const matchingProvs = DataManager.getProvinciasByLocalidad(selRegion.value, loc);

            if (matchingProvs.length === 1) {
                // ── Unique province: auto-select as before ──
                selProv.value = matchingProvs[0];
                selProv.disabled = false;
                _populateSelect(selTipo, DataManager.getTipos(selRegion.value, selProv.value, loc), 'PH_SELECT_TYPE');
                _updateSteps(3);
            } else if (matchingProvs.length > 1) {
                // ── Ambiguous: narrow province list and ask user to pick ──
                _populateSelect(selProv, matchingProvs, 'PH_SELECT_PROVINCE');
                selProv.disabled = false;
                // Steps only up to localidad (province still pending)
                _updateSteps(2);
            }
        });

        selTipo.addEventListener('change', () => {
            _reset([selInst]);
            _populateSelect(selInst, DataManager.getInstituciones(selRegion.value, selProv.value, selLoc.value, selTipo.value), 'PH_SELECT_ENTITY');
            _updateSteps(4);
        });

        selInst.addEventListener('change', () => _updateSteps(5));
    }

    function _populateSelect(sel, options, placeholder) {
        // Use translation if a key is provided or use the literal placeholder
        const translatedPlaceholder = placeholder.startsWith('PH_') ? I18n.translate(placeholder) : placeholder;
        sel.innerHTML = `<option value="">${translatedPlaceholder}</option>`;
        options.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            
            if (sel.id === 't1-institucion') {
                const info = DataManager.getColegioInfo(o);
                if (info) {
                    opt.textContent = `${o} - ${info.name} (${info.category})`;
                } else {
                    opt.textContent = o;
                }
            } else {
                opt.textContent = o;
            }
            
            sel.appendChild(opt);
        });
        sel.disabled = options.length === 0;
    }

    function _reset(selects) {
        selects.forEach(s => {
            s.innerHTML = `<option value="">--</option>`;
            s.disabled = true;
        });
        // keep lower step indicators
    }

    function _updateSteps(filled) {
        for (let i = 1; i <= 5; i++) {
            const step = document.getElementById(`t1-step-${i}`);
            if (step) step.classList.toggle('done', i <= filled);
        }
    }

    let _isSoloEntidades = false;

    // ── Buttons ────────────────────────────────────────────
    function _bindButtons() {
        document.getElementById('btn-t1-finalizar').addEventListener('click', _onFinalizar);
        
        const btnSoloEntidades = document.getElementById('btn-solo-entidades');
        if (btnSoloEntidades) {
            btnSoloEntidades.addEventListener('click', () => {
                _isSoloEntidades = !_isSoloEntidades;
                const panel = document.getElementById('t1-panel-solicitante');
                if (_isSoloEntidades) {
                    btnSoloEntidades.classList.remove('btn-outline');
                    btnSoloEntidades.classList.add('btn-primary'); // Make it look active
                    if (panel) panel.classList.add('panel-disabled');
                } else {
                    btnSoloEntidades.classList.add('btn-outline');
                    btnSoloEntidades.classList.remove('btn-primary');
                    if (panel) panel.classList.remove('panel-disabled');
                }
            });
        }
        
        const searchInput = document.getElementById('t1-search-entity');
        const searchBtn = document.getElementById('t1-btn-search');
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', _onSearchEntity);
            searchInput.addEventListener('input', _handleSearchInput);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    _onSearchEntity();
                }
            });
            // Hide on outside click
            document.addEventListener('click', (e) => {
                const results = document.getElementById('t1-search-results');
                if (results && !searchInput.contains(e.target) && !results.contains(e.target) && e.target !== searchBtn) {
                    results.style.display = 'none';
                }
            });
        }
    }

    function _handleSearchInput(e) {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById('t1-search-results');
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const matches = DataManager.findByInstitucion(query);
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 10px; font-size: 0.85rem; color: var(--gray-500); text-align: center;">No se encontraron entidades.</div>';
            resultsContainer.style.display = 'block';
            return;
        }

        resultsContainer.innerHTML = '';
        matches.forEach(entity => {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 8px 12px; font-size: 0.8rem; border-bottom: 1px solid var(--gray-100); cursor: pointer; display: flex; flex-direction: column; gap: 2px; transition: background 0.2s;';
            div.onmouseover = () => div.style.background = 'var(--gray-50)';
            div.onmouseout = () => div.style.background = 'transparent';
            
            // Name format
            const info = DataManager.getColegioInfo(entity.Institucion);
            const extra = info ? ` - ${info.name}` : '';
            
            div.innerHTML = `
                <div style="font-weight: 700; color: var(--brand-blue);">${entity.Institucion}${extra}</div>
                <div style="font-size: 0.7rem; color: var(--gray-500);">${entity.Region} > ${entity.Provincia} > ${entity.Localidad}</div>
            `;
            
            div.addEventListener('click', () => {
                document.getElementById('t1-search-entity').value = entity.Institucion;
                resultsContainer.style.display = 'none';
                _fillEntity(entity);
            });
            
            resultsContainer.appendChild(div);
        });
        resultsContainer.style.display = 'block';
    }

    function _fillEntity(entity) {
        const selRegion = document.getElementById('t1-region');
        const selProv = document.getElementById('t1-provincia');
        const selLoc = document.getElementById('t1-localidad');
        const selTipo = document.getElementById('t1-tipo');
        const selInst = document.getElementById('t1-institucion');

        selRegion.value = entity.Region;
        _populateSelect(selProv, DataManager.getProvincias(entity.Region), 'PH_SELECT_PROVINCE');
        selProv.value = entity.Provincia;
        
        _populateSelect(selLoc, DataManager.getLocalidadesByRegion(entity.Region), 'PH_SELECT_LOCALITY');
        selLoc.value = entity.Localidad;
        
        _populateSelect(selTipo, DataManager.getTipos(entity.Region, entity.Provincia, entity.Localidad), 'PH_SELECT_TYPE');
        selTipo.value = entity.Tipo;
        
        _populateSelect(selInst, DataManager.getInstituciones(entity.Region, entity.Provincia, entity.Localidad, entity.Tipo), 'PH_SELECT_ENTITY');
        selInst.value = entity.Institucion;

        _updateSteps(5);
        Toast.show('Entidad autocompletada correctamente.', 'success');
    }

    function _onSearchEntity() {
        const query = document.getElementById('t1-search-entity').value;
        if (!query) return;

        const entity = DataManager.getEntityByCode(query);
        if (!entity) {
            Toast.show('Entidad no encontrada.', 'error');
            return;
        }
        
        document.getElementById('t1-search-results').style.display = 'none';
        _fillEntity(entity);
    }

    async function _onFinalizar() {
        // Validate left-panel fields
        let nombre = document.getElementById('t1-nombre').value.trim();
        let dni = document.getElementById('t1-dni').value.trim();
        let cel = document.getElementById('t1-celular').value.trim();
        let fechaInc = document.getElementById('t1-fecha').value;
        let horaInc = document.getElementById('t1-hora').value;
        let email = document.getElementById('t1-email').value.trim();
        let descripcion = document.getElementById('t1-desc').value.trim();

        if (_isSoloEntidades) {
            nombre = "-";
            dni = "-";
            cel = "-";
            email = "";
            descripcion = "";
            const now = new Date();
            fechaInc = now.toISOString().split('T')[0];
            horaInc = now.toTimeString().split(' ')[0].substring(0, 5);
        } else if (!nombre || !dni || !cel || !fechaInc || !horaInc) {
            Toast.show('Nombre, DNI, Celular, Fecha y Hora son obligatorios.', 'error');
            return;
        }

        // Validate right-panel selectors
        const region = document.getElementById('t1-region').value;
        const provincia = document.getElementById('t1-provincia').value;
        const localidad = document.getElementById('t1-localidad').value;
        const tipo = document.getElementById('t1-tipo').value;
        const institucion = document.getElementById('t1-institucion').value;

        if (!region || !provincia || !localidad || !tipo || !institucion) {
            Toast.show('Completa todos los selectores de ubicación y entidad.', 'error');
            return;
        }

        const now = new Date();
        const user = Auth.getUser();
        const createdBy = user?.user_metadata?.full_name || user?.email || 'Usuario';

        const ticket = {
            id: 'ENT-' + Date.now(),
            tipo_tab: 'entidad',
            tipoRegistro: _isSoloEntidades ? 'IBBS Issues' : 'Usuario',
            nombre, dni, cel,
            email,
            fechaInc,
            horaInc,
            descripcion,
            region, provincia, localidad, tipo, institucion,
            createdAt: now.toISOString(),
            createdBy,
            generadoCC: false,
            resuelto: 'pendiente',
        };

        try {
            await Store.addTicket('entidades', ticket);
            Toast.show('Registro finalizado con éxito ✔', 'success');
            _resetForm();
            App.updateBadges();
        } catch (err) {
            const msg = err?.message || JSON.stringify(err);
            Toast.show('Error al guardar: ' + msg, 'error');
        }
    }

    function _resetForm() {
        _isSoloEntidades = false;
        const btnSoloEntidades = document.getElementById('btn-solo-entidades');
        const panel = document.getElementById('t1-panel-solicitante');
        if (btnSoloEntidades) {
            btnSoloEntidades.classList.add('btn-outline');
            btnSoloEntidades.classList.remove('btn-primary');
        }
        if (panel) {
            panel.classList.remove('panel-disabled');
        }

        ['t1-nombre', 't1-dni', 't1-celular', 't1-email', 't1-fecha', 't1-hora', 't1-desc'].forEach(id => {
            document.getElementById(id).value = '';
        });
        ['t1-region', 't1-provincia', 't1-localidad', 't1-tipo', 't1-institucion'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.selectedIndex = 0; }
        });
        ['t1-provincia', 't1-localidad', 't1-tipo', 't1-institucion'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = true; el.innerHTML = '<option>--</option>'; }
        });
        _updateSteps(0);
    }

    return { init };
})();
