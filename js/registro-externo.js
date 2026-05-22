/**
 * registro-externo.js – Versión independiente de "Creación de Registro"
 * Diseñado para ser embebido mediante iframe en otra plataforma.
 */

const RegistroExterno = (() => {
    let _draft = null;
    let _operadorExterno = "Operador Desconocido";

    function init() {
        // Obtener el nombre del operador desde la URL (ej: ?operador=Juan+Perez)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('operador')) {
            _operadorExterno = urlParams.get('operador');
        }

        _buildCascade();
        _bindButtons();
        
        // Listeners adicionales
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
            _reset([selTipo, selInst]);

            const currentLoc = selLoc.value;
            const newProv = selProv.value;

            if (currentLoc) {
                _populateSelect(selTipo, DataManager.getTipos(selRegion.value, newProv, currentLoc), 'PH_SELECT_TYPE');
                _updateSteps(3);
            } else {
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
                selProv.value = matchingProvs[0];
                selProv.disabled = false;
                _populateSelect(selTipo, DataManager.getTipos(selRegion.value, selProv.value, loc), 'PH_SELECT_TYPE');
                _updateSteps(3);
            } else if (matchingProvs.length > 1) {
                _populateSelect(selProv, matchingProvs, 'PH_SELECT_PROVINCE');
                selProv.disabled = false;
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
        
        // Usamos el operador capturado de la URL como el creador del registro
        const createdBy = _operadorExterno;

        const ticket = {
            id: 'ENT-' + Date.now(),
            tipo_tab: 'entidad',
            ..._draft,
            region, provincia, localidad, tipo, institucion,
            createdAt: now.toISOString(),
            createdBy, // Este es el nombre tomado de la otra plataforma
            generadoCC: false,
            resuelto: 'pendiente',
        };

        try {
            // Deshabilitar botón para evitar doble envío
            const btn = document.getElementById('btn-t1-finalizar');
            btn.disabled = true;
            btn.innerHTML = 'Guardando...';

            await Store.addTicket('entidades', ticket);
            Toast.show('Registro finalizado con éxito ✔', 'success');

            // Reset UI
            _resetForm();
            _draft = null;
            document.getElementById('t1-draft-badge').classList.add('hidden');
            
            btn.disabled = false;
            btn.innerHTML = '✓ Finalizar mi registro';
        } catch (err) {
            const msg = err?.message || JSON.stringify(err);
            Toast.show('Error al guardar: ' + msg, 'error');
            
            const btn = document.getElementById('btn-t1-finalizar');
            btn.disabled = false;
            btn.innerHTML = '✓ Finalizar mi registro';
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

// Auto-init when script loads
document.addEventListener('DOMContentLoaded', () => {
    RegistroExterno.init();
});
