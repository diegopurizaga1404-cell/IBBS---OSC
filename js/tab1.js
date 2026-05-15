/**
 * tab1.js – Entidades: Creación de Registro
 * IBBS Gestión de Incidencias
 */

const Tab1 = (() => {
    let _draft = null; // Stores data after "Generar mi registro"

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

        _populateSelect(selRegion, DataManager.getRegiones(), 'PH_SELECT_REGION');
        
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
            opt.value = opt.textContent = o;
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

    // ── Buttons ──────────────────────────────────────────────────
    function _bindButtons() {
        document.getElementById('btn-t1-generar').addEventListener('click', _onGenerar);
        document.getElementById('btn-t1-finalizar').addEventListener('click', _onFinalizar);
    }

    function _onGenerar() {
        const nombre = document.getElementById('t1-nombre').value.trim();
        const dni = document.getElementById('t1-dni').value.trim();
        const cel = document.getElementById('t1-celular').value.trim();
        const fechaInc = document.getElementById('t1-fecha').value;
        const horaInc = document.getElementById('t1-hora').value;

        if (!nombre || !dni || !cel || !fechaInc || !horaInc) {
            Toast.show('Nombre, DNI, Celular, Fecha y Hora son obligatorios.', 'error');
            return;
        }

        _draft = {
            nombre, dni, cel,
            email: document.getElementById('t1-email').value.trim(),
            fechaInc,
            horaInc,
            descripcion: document.getElementById('t1-desc').value.trim(),
        };

        document.getElementById('t1-draft-badge').classList.remove('hidden');
        Toast.show('Datos del solicitante guardados. Completa la ubicación y finaliza.', 'success');
    }

    async function _onFinalizar() {
        if (!_draft) {
            Toast.show('Primero genera tu registro con los datos del solicitante.', 'warning');
            return;
        }

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
            ..._draft,
            region, provincia, localidad, tipo, institucion,
            createdAt: now.toISOString(),
            createdBy,
            generadoCC: false,
            resuelto: 'pendiente',
        };

        try {
            await Store.addTicket('entidades', ticket);
            Toast.show('Registro finalizado con éxito ✔', 'success');

            // Reset
            _resetForm();
            _draft = null;
            document.getElementById('t1-draft-badge').classList.add('hidden');

            // Update badge indicator
            App.updateBadges();
        } catch (err) {
            const msg = err?.message || JSON.stringify(err);
            Toast.show('Error al guardar: ' + msg, 'error');
        }
    }

    function _resetForm() {
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
