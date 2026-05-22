/**
 * tab3.js – SOC Nodos: Creación de Registro
 * IBBS Gestión de Incidencias
 */

const Tab3 = (() => {

    function init() {
        _buildCascade();
        _buildIncidentTypes();
        _bindRadios();
        _bindButtons();
        window.addEventListener('langChanged', () => {
            _buildCascade();
            _buildIncidentTypes();
        });
    }

    // ── Cascade Selectors ────────────────────────────────────────
    function _buildCascade() {
        const selRegion = document.getElementById('t3-region');
        const selTipo = document.getElementById('t3-tipo-nodo');
        const selCod = document.getElementById('t3-codigo');
        const selNombre = document.getElementById('t3-nombre-nodo');

        _populateSelect(selRegion, DataManager.getNodoRegiones(), I18n.translate('PH_SELECT_REGION'));

        selRegion.addEventListener('change', () => {
            _reset([selTipo, selCod]);
            selNombre.value = '';
            _populateSelect(selTipo, DataManager.getTiposNodo(selRegion.value), 'PH_SELECT_TYPE');
            _updateSteps(1);
        });

        selTipo.addEventListener('change', () => {
            _reset([selCod]);
            selNombre.value = '';
            _populateSelect(selCod, DataManager.getCodigos(selRegion.value, selTipo.value), 'PH_SELECT_CODE');
            _updateSteps(2);
        });

        selCod.addEventListener('change', () => {
            const nombre = DataManager.getNombreNodo(selRegion.value, selTipo.value, selCod.value);
            selNombre.value = nombre;
            _updateSteps(selCod.value ? 4 : 3);
        });
    }

    function _populateSelect(sel, options, placeholder) {
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
            s.innerHTML = '<option value="">--</option>';
            s.disabled = true;
        });
    }

    function _updateSteps(filled) {
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`t3-step-${i}`);
            if (step) step.classList.toggle('done', i <= filled);
        }
    }

    // ── Incident Types (multi-select chips) ──────────────────────
    function _buildIncidentTypes() {
        const types = [
            { key: 'T3_TYPE_DOOR', val: 'Alarma de puerta' },
            { key: 'T3_TYPE_SHELTER', val: 'Alarma de shelter' },
            { key: 'T3_TYPE_EQUIPMENT', val: 'Equipo averiado' },
            { key: 'T3_TYPE_CAMERA', val: 'Cámara sin gestión' },
            { key: 'T3_TYPE_THEFT', val: 'Robo' }
        ];
        const container = document.getElementById('t3-tipo-incidente');
        container.innerHTML = '';
        types.forEach(t => {
            const labelText = I18n.translate(t.key);
            const chip = document.createElement('label');
            chip.className = 'check-chip';
            chip.innerHTML = `<input type="checkbox" value="${t.val}"> ${labelText}`;
            chip.addEventListener('click', () => {
                setTimeout(() => chip.classList.toggle('selected', chip.querySelector('input').checked), 0);
            });
            container.appendChild(chip);
        });
    }

    // ── Radio Buttons ────────────────────────────────────────────
    function _bindRadios() {
        _bindRadioGroup('t3-detectado', ['tecnico', 'soc']);
        _bindRadioGroup('t3-grabacion', ['si', 'no']);
    }

    function _bindRadioGroup(containerId, values) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.radio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                btn.querySelector('input').checked = true;
            });
        });
    }

    function _getCheckedRadio(containerId) {
        const inp = document.querySelector(`#${containerId} input:checked`);
        return inp ? inp.value : '';
    }

    function _getSelectedChips() {
        const checked = document.querySelectorAll('#t3-tipo-incidente input:checked');
        return [...checked].map(c => c.value);
    }

    // ── Buttons ──────────────────────────────────────────────────
    function _bindButtons() {
        document.getElementById('btn-t3-finalizar').addEventListener('click', _onFinalizar);
    }

    async function _onFinalizar() {
        // Validate node selectors
        const region = document.getElementById('t3-region').value;
        const tipoNodo = document.getElementById('t3-tipo-nodo').value;
        const codigo = document.getElementById('t3-codigo').value;

        if (!region || !tipoNodo || !codigo) {
            Toast.show(I18n.translate('MSG_SELECT_FIELDS'), 'error');
            return;
        }

        const tiposSeleccionados = _getSelectedChips();
        if (tiposSeleccionados.length === 0) {
            Toast.show(I18n.translate('MSG_SELECT_INCIDENT'), 'error');
            return;
        }

        const user = Auth.getUser();
        const createdBy = user?.user_metadata?.full_name || user?.email || 'Usuario';

        const ticket = {
            id: 'SOC-' + Date.now(),
            tipo_tab: 'soc',
            region,
            tipoNodo,
            codigo,
            nombreNodo: document.getElementById('t3-nombre-nodo').value,
            fechaInc: document.getElementById('t3-fecha-inc').value,
            horaInc: document.getElementById('t3-hora-inc').value,
            fechaRep: document.getElementById('t3-fecha-rep').value,
            horaRep: document.getElementById('t3-hora-rep').value,
            detectadoPor: _getCheckedRadio('t3-detectado'),
            hayGrabacion: _getCheckedRadio('t3-grabacion'),
            tiposIncidente: tiposSeleccionados,
            descripcion: document.getElementById('t3-desc').value.trim(),
            createdAt: new Date().toISOString(),
            createdBy,
            resuelto: 'pendiente',
        };

        try {
            await Store.addTicket('soc', ticket);
            Toast.show(I18n.translate('MSG_SOC_SAVED'), 'success');
            _resetForm();
            App.updateBadges();
        } catch (err) {
            const msg = err?.message || JSON.stringify(err);
            Toast.show('Error al guardar: ' + msg, 'error');
        }
    }

    function _resetForm() {
        ['t3-fecha-inc', 't3-hora-inc', 't3-fecha-rep', 't3-hora-rep', 't3-desc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        ['t3-region', 't3-tipo-nodo', 't3-codigo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.selectedIndex = 0; }
        });
        document.getElementById('t3-nombre-nodo').value = '';
        ['t3-tipo-nodo', 't3-codigo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = true; el.innerHTML = '<option>--</option>'; }
        });
        document.querySelectorAll('#t3-tipo-incidente .check-chip').forEach(c => {
            c.classList.remove('selected');
            c.querySelector('input').checked = false;
        });
        document.querySelectorAll('#t3-detectado .radio-btn, #t3-grabacion .radio-btn').forEach(b => {
            b.classList.remove('selected');
            b.querySelector('input').checked = false;
        });
        _updateSteps(0);
    }

    return { init };
})();
