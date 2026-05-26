/**
 * tabAdmin.js – Panel de Administración: Directorio y Gestión de Usuarios
 * IBBS Gestión de Incidencias
 *
 * Solo visible para usuarios con rol 'admin'.
 * Permite gestionar el directorio de usuarios y todas las solicitudes de acceso al sistema.
 */

const TabAdmin = (() => {

    const EDGE_FUNCTION_URL = 'https://nxvgyredtsktgrqkfczg.supabase.co/functions/v1/create-user';

    // ── Fetch all requests ───────────────────────────────────
    async function _getSolicitudes() {
        const { data, error } = await window.supabaseDb
            .from('solicitudes_registro')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) { console.error('TabAdmin: error loading solicitudes', error); return []; }
        return data || [];
    }

    // ── Fetch all actual registered users from Supabase Auth via Edge Function ─────
    async function _getSupabaseUsers() {
        try {
            const session = (await window.supabaseDb.auth.getSession()).data.session;
            const res = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ action: 'list' })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error fetching users');
            return result.users || [];
        } catch (err) {
            console.error('TabAdmin: error loading Supabase users', err);
            return [];
        }
    }

    // ── Approve: call Edge Function to create user ───────────
    async function _aprobar(solicitud, btnAprobar, btnRechazar) {
        btnAprobar.disabled = true;
        btnRechazar.disabled = true;
        btnAprobar.innerHTML = '⏳ Creando...';

        try {
            const selectEl = document.getElementById(`role-select-${solicitud.id}`);
            const assignedRole = selectEl ? selectEl.value : 'editor';

            const wasPasswordGenerated = !solicitud.password_temp;
            // Generate a secure temporary password: Ibbs + random 6 chars + *
            const generatedPassword = 'Ibbs' + Math.random().toString(36).substring(2, 8) + '*';
            const passwordToUse = solicitud.password_temp || generatedPassword;

            const session = (await window.supabaseDb.auth.getSession()).data.session;
            const res = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    nombre: solicitud.nombre,
                    email: solicitud.email,
                    password: passwordToUse,
                    solicitudId: solicitud.id,
                    role: assignedRole,
                    action: 'create'
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error desconocido');

            // If the password was generated, save it back to the database solicitudes_registro table
            if (wasPasswordGenerated) {
                await window.supabaseDb
                    .from('solicitudes_registro')
                    .update({ password_temp: passwordToUse })
                    .eq('id', solicitud.id);
            }

            if (wasPasswordGenerated) {
                try {
                    await navigator.clipboard.writeText(passwordToUse);
                    Toast.show(`✅ Usuario "${solicitud.nombre}" creado con rol "${assignedRole}". Contraseña copiada al portapapeles: ${passwordToUse}`, 'success');
                } catch (e) {
                    Toast.show(`✅ Usuario "${solicitud.nombre}" creado con rol "${assignedRole}". Contraseña: ${passwordToUse}`, 'success');
                }
            } else {
                Toast.show(`✅ Usuario "${solicitud.nombre}" creado exitosamente con rol "${assignedRole}".`, 'success');
            }

            await render(); // Refresh list
            await _updateAdminBadge();

        } catch (err) {
            console.error('TabAdmin: error aprobando solicitud', err);
            Toast.show(`❌ Error al crear usuario: ${err.message}`, 'error');
            btnAprobar.disabled = false;
            btnRechazar.disabled = false;
            btnAprobar.innerHTML = '✅ Aprobar';
        }
    }

    // ── Reject: mark as rejected in DB (Instantly, no confirm popup) ──────────────────────
    async function _rechazar(solicitud, card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';

        const user = (await window.supabaseDb.auth.getSession()).data.session?.user;
        const { error } = await window.supabaseDb
            .from('solicitudes_registro')
            .update({
                estado: 'rechazada',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.email || 'admin'
            })
            .eq('id', solicitud.id);

        if (error) {
            Toast.show('❌ Error al rechazar la solicitud.', 'error');
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            return;
        }

        Toast.show(`🚫 Solicitud de "${solicitud.nombre}" rechazada.`, 'info');
        await render(); // Refresh list
        await _updateAdminBadge();
    }

    // ── Disable user: call Edge Function ─────────────────────
    async function _disableUser(solicitud, btnDisable, card) {
        btnDisable.disabled = true;
        btnDisable.innerHTML = '⏳...';
        card.style.opacity = '0.7';

        try {
            const session = (await window.supabaseDb.auth.getSession()).data.session;
            const res = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: solicitud.email,
                    solicitudId: solicitud.id,
                    action: 'disable'
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error desconocido');

            Toast.show(`🚫 Usuario "${solicitud.nombre}" deshabilitado correctamente.`, 'info');
            await render(); // Refresh list
        } catch (err) {
            console.error('TabAdmin: error deshabilitando usuario', err);
            Toast.show(`❌ Error al deshabilitar: ${err.message}`, 'error');
            btnDisable.disabled = false;
            btnDisable.innerHTML = '🚫 Deshabilitar';
            card.style.opacity = '1';
        }
    }

    // ── Enable user: call Edge Function ──────────────────────
    async function _enableUser(solicitud, btnEnable, card) {
        btnEnable.disabled = true;
        btnEnable.innerHTML = '⏳...';
        card.style.opacity = '0.7';

        try {
            const session = (await window.supabaseDb.auth.getSession()).data.session;
            const res = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: solicitud.email,
                    solicitudId: solicitud.id,
                    action: 'enable'
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error desconocido');

            Toast.show(`✅ Usuario "${solicitud.nombre}" habilitado correctamente.`, 'success');
            await render(); // Refresh list
        } catch (err) {
            console.error('TabAdmin: error habilitando usuario', err);
            Toast.show(`❌ Error al habilitar: ${err.message}`, 'error');
            btnEnable.disabled = false;
            btnEnable.innerHTML = '✅ Habilitar';
            card.style.opacity = '1';
        }
    }

    // ── Delete user: call Edge Function & Database client directly ──────────────────────
    async function _deleteUser(solicitud, btnDelete, card) {
        btnDelete.disabled = true;
        btnDelete.innerHTML = '⏳...';
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';

        try {
            const isManual = solicitud.isManual || String(solicitud.id).startsWith('auth-');
            
            // 1. Delete from database table (solicitudes_registro) directly from the client
            if (!isManual) {
                const { error: dbError } = await window.supabaseDb
                    .from('solicitudes_registro')
                    .delete()
                    .eq('id', solicitud.id);

                if (dbError) {
                    console.error('TabAdmin: DB delete error', dbError);
                    throw new Error('Error al eliminar la solicitud de la base de datos: ' + dbError.message);
                }
            }

            // 2. If the user existed in Supabase Auth (approved, suspended, or manual), call Edge Function to delete from Auth
            if (solicitud.estado !== 'rechazada') {
                const session = (await window.supabaseDb.auth.getSession()).data.session;
                const res = await fetch(EDGE_FUNCTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        email: solicitud.email,
                        solicitudId: solicitud.id,
                        action: 'delete'
                    })
                });

                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Error al eliminar de Supabase Auth');
            }

            Toast.show(`🗑️ Usuario "${solicitud.nombre}" y solicitud eliminados exitosamente.`, 'info');
            await render(); // Refresh list
            await _updateAdminBadge();
        } catch (err) {
            console.error('TabAdmin: error eliminando usuario/solicitud', err);
            Toast.show(`❌ Error al eliminar: ${err.message}`, 'error');
            btnDelete.disabled = false;
            btnDelete.innerHTML = '🗑️ Eliminar';
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    }


    // ── Update role: call Edge Function ─────────────────────
    async function _updateUserRole(solicitud, newRole, selectEl) {
        selectEl.disabled = true;
        const originalVal = selectEl.value;

        try {
            const session = (await window.supabaseDb.auth.getSession()).data.session;
            const res = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: solicitud.email,
                    solicitudId: solicitud.id,
                    role: newRole,
                    action: 'update-role'
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Error desconocido');

            Toast.show(`✅ Rol de "${solicitud.nombre}" actualizado a "${newRole}" correctamente.`, 'success');
            await render(); // Refresh list
        } catch (err) {
            console.error('TabAdmin: error actualizando rol', err);
            Toast.show(`❌ Error al cambiar rol: ${err.message}`, 'error');
            selectEl.value = originalVal;
            selectEl.disabled = false;
        }
    }

    // ── Format date helper ───────────────────────────────────
    function _formatDate(isoStr) {
        if (!isoStr) return '–';
        const d = new Date(isoStr);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ── Render a single solicitud card ───────────────────────
    function _renderCard(sol) {
        const card = document.createElement('div');
        card.className = 'admin-request-card';
        card.dataset.id = sol.id;

        const isPending = sol.estado === 'pendiente';
        const isApproved = sol.estado === 'aprobada';
        const isSuspended = sol.estado === 'suspendida';
        const isRejected = sol.estado === 'rechazada';

        const statusColor = { 
            pendiente: '#f59e0b', 
            aprobada: '#10b981', 
            suspendida: '#f59e0b', 
            rechazada: '#ef4444' 
        }[sol.estado] || '#94a3b8';

        const statusLabel = { 
            pendiente: I18n.translate('ADMIN_STATUS_PENDING'), 
            aprobada: I18n.translate('ADMIN_STATUS_APPROVED'), 
            suspendida: I18n.translate('ADMIN_STATUS_SUSPENDED'), 
            rechazada: I18n.translate('ADMIN_STATUS_REJECTED') 
        }[sol.estado] || sol.estado;

        // Check if this item is the currently logged in admin
        const currentSessionEmail = (Auth.getUser()?.email || '').trim();
        const isSelf = currentSessionEmail && currentSessionEmail.toLowerCase() === sol.email.toLowerCase() && sol.estado === 'aprobada';

        card.innerHTML = `
            <div class="admin-request-avatar">${sol.nombre.charAt(0).toUpperCase()}</div>
            <div class="admin-request-info">
                <div class="admin-request-name" style="display:flex; align-items:center; gap:8px;">
                    ${sol.nombre}
                    ${isSelf ? `<span class="badge-self">${I18n.translate('ADMIN_YOU')}</span>` : ''}
                    ${sol.isManual ? `<span class="badge-direct">Directo Auth</span>` : ''}
                    ${sol.role ? `<span class="badge-role badge-role-${sol.role}">${sol.role}</span>` : ''}
                </div>
                <div class="admin-request-email">${sol.email}</div>
                <div class="admin-request-date">🕒 ${I18n.translate('ADMIN_REQUESTED_AT')}: ${_formatDate(sol.created_at)}</div>
            </div>
            <div class="admin-request-right">
                <span class="admin-request-status status-${sol.estado}">
                    ${statusLabel}
                </span>
                
                <div class="admin-request-actions" style="align-items: center;"></div>
            </div>
        `;

        const actionsContainer = card.querySelector('.admin-request-actions');

        function renderConfirmActions(type) {
            const isDelete = type === 'delete';
            const promptText = isDelete ? I18n.translate('ADMIN_CONFIRM_DELETE') : I18n.translate('ADMIN_CONFIRM_REJECT');
            const confirmBtnText = isDelete ? I18n.translate('ADMIN_CONFIRM_YES_DELETE') : I18n.translate('ADMIN_CONFIRM_YES_REJECT');

            actionsContainer.innerHTML = `
                <span class="confirm-prompt-text">${promptText}</span>
                <button class="btn-confirm-yes">${confirmBtnText}</button>
                <button class="btn-confirm-cancel">${I18n.translate('ADMIN_CONFIRM_CANCEL')}</button>
            `;

            const yesBtn = actionsContainer.querySelector('.btn-confirm-yes');
            const cancelBtn = actionsContainer.querySelector('.btn-confirm-cancel');

            yesBtn.addEventListener('click', () => {
                if (isDelete) {
                    _deleteUser(sol, yesBtn, card);
                } else {
                    _rechazar(sol, card);
                }
            });

            cancelBtn.addEventListener('click', () => {
                renderNormalActions();
            });
        }

        function renderNormalActions() {
            if (isSelf) {
                actionsContainer.innerHTML = `
                    <select class="form-select role-edit-select" disabled>
                        <option selected>${I18n.translate('ADMIN_ROLE_ADMIN')}</option>
                    </select>
                    <span class="active-admin-badge">${I18n.translate('ADMIN_ACTIVE_ADMIN')}</span>
                `;
                return;
            }

            if (isPending) {
                actionsContainer.innerHTML = `
                    <select class="form-select role-edit-select" id="role-select-${sol.id}">
                        <option value="user">${I18n.translate('ADMIN_ROLE_USER')}</option>
                        <option value="editor" selected>${I18n.translate('ADMIN_ROLE_EDITOR')}</option>
                        <option value="admin">${I18n.translate('ADMIN_ROLE_ADMIN')}</option>
                    </select>
                    <button class="btn-approve">${I18n.translate('ADMIN_APPROVE')}</button>
                    <button class="btn-reject">${I18n.translate('ADMIN_REJECT')}</button>
                `;
                const btnAprobar = actionsContainer.querySelector('.btn-approve');
                const btnRechazar = actionsContainer.querySelector('.btn-reject');
                btnAprobar.addEventListener('click', () => _aprobar(sol, btnAprobar, btnRechazar));
                btnRechazar.addEventListener('click', () => renderConfirmActions('reject'));
            } else if (isApproved) {
                actionsContainer.innerHTML = `
                    <select class="form-select role-edit-select" style="margin-right: 8px;">
                        <option value="user" ${sol.role === 'user' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_USER')}</option>
                        <option value="editor" ${sol.role === 'editor' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_EDITOR')}</option>
                        <option value="tecnico" ${sol.role === 'tecnico' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_TECNICO')}</option>
                        <option value="admin" ${sol.role === 'admin' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_ADMIN')}</option>
                    </select>
                    <button class="btn-primary btn-permisos" style="padding: 4px 10px; font-size: 0.8rem; margin-right: 8px;" title="Configurar Permisos">⚙️ Permisos</button>
                    <button class="btn-disable">${I18n.translate('ADMIN_BTN_DISABLE')}</button>
                    <button class="btn-delete">${I18n.translate('ADMIN_BTN_DELETE')}</button>
                `;
                const roleSelect = actionsContainer.querySelector('.role-edit-select');
                const btnPermisos = actionsContainer.querySelector('.btn-permisos');
                const btnDisable = actionsContainer.querySelector('.btn-disable');
                const btnDelete = actionsContainer.querySelector('.btn-delete');
                
                roleSelect.addEventListener('change', (e) => _updateUserRole(sol, e.target.value, roleSelect));
                btnPermisos.addEventListener('click', () => _openPermissionsModal(sol));
                btnDisable.addEventListener('click', () => _disableUser(sol, btnDisable, card));
                btnDelete.addEventListener('click', () => renderConfirmActions('delete'));
            } else if (isSuspended) {
                actionsContainer.innerHTML = `
                    <select class="form-select role-edit-select" style="margin-right: 8px;">
                        <option value="user" ${sol.role === 'user' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_USER')}</option>
                        <option value="editor" ${sol.role === 'editor' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_EDITOR')}</option>
                        <option value="tecnico" ${sol.role === 'tecnico' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_TECNICO')}</option>
                        <option value="admin" ${sol.role === 'admin' ? 'selected' : ''}>${I18n.translate('ADMIN_ROLE_ADMIN')}</option>
                    </select>
                    <button class="btn-enable">${I18n.translate('ADMIN_BTN_ENABLE')}</button>
                    <button class="btn-delete">${I18n.translate('ADMIN_BTN_DELETE')}</button>
                `;
                const roleSelect = actionsContainer.querySelector('.role-edit-select');
                const btnEnable = actionsContainer.querySelector('.btn-enable');
                const btnDelete = actionsContainer.querySelector('.btn-delete');
                
                roleSelect.addEventListener('change', (e) => _updateUserRole(sol, e.target.value, roleSelect));
                btnEnable.addEventListener('click', () => _enableUser(sol, btnEnable, card));
                btnDelete.addEventListener('click', () => renderConfirmActions('delete'));
            } else if (isRejected) {
                actionsContainer.innerHTML = `
                    <button class="btn-delete">${I18n.translate('ADMIN_BTN_DELETE')}</button>
                `;
                const btnDelete = actionsContainer.querySelector('.btn-delete');
                btnDelete.addEventListener('click', () => renderConfirmActions('delete'));
            }
        }

        renderNormalActions();

        return card;
    }

    // ── Update sidebar badge ─────────────────────────────────
    async function _updateAdminBadge() {
        const solicitudes = await _getSolicitudes();
        const pendingCount = solicitudes.filter(s => s.estado === 'pendiente').length;
        const badge = document.getElementById('badge-tab-admin');
        if (badge) {
            badge.textContent = pendingCount || '';
            badge.classList.toggle('hidden', pendingCount === 0);
        }
    }

    // ── Main render ──────────────────────────────────────────
    async function render() {
        const container = document.getElementById('admin-requests-list');
        const emptyState = document.getElementById('admin-requests-empty');
        const countEl = document.getElementById('admin-pending-count');

        if (!container) return;

        // Loading state
        container.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; padding: 20px; color: #94a3b8; font-size: 0.9rem;">
                <div class="spinner" style="display:block;border-color:rgba(148,163,184,0.3);border-top-color:#94a3b8;"></div>
                Cargando directorio de usuarios...
            </div>
        `;

        // Fetch both requests and auth users in parallel
        const [solicitudes, authUsers] = await Promise.all([
            _getSolicitudes(),
            _getSupabaseUsers()
        ]);

        const mergedList = [];
        const processedEmails = new Set();

        // 1. Process all pending requests from database (these don't exist in Auth yet)
        const pendingRequests = solicitudes.filter(s => s.estado === 'pendiente');
        pendingRequests.forEach(sol => {
            mergedList.push({
                id: sol.id,
                nombre: sol.nombre,
                email: sol.email,
                created_at: sol.created_at,
                estado: 'pendiente',
                isManual: false,
                role: '',
                password_temp: sol.password_temp
            });
            processedEmails.add(sol.email.toLowerCase());
        });

        // 2. Process all users who exist in Supabase Auth
        authUsers.forEach(user => {
            const emailKey = user.email.toLowerCase();
            const matchedSol = solicitudes.find(s => s.email.toLowerCase() === emailKey);
            
            // Check if they are suspended (either marked in DB or banned_until in auth is in the future)
            const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
            const estado = (isBanned || (matchedSol && matchedSol.estado === 'suspendida')) ? 'suspendida' : 'aprobada';

            mergedList.push({
                id: matchedSol ? matchedSol.id : `auth-${user.id}`,
                nombre: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                email: user.email,
                created_at: user.created_at,
                estado: estado,
                isManual: !matchedSol,
                role: user.user_metadata?.role || 'editor'
            });
            processedEmails.add(emailKey);
        });

        // 3. Process any other DB requests (like rejected)
        const rejectedRequests = solicitudes.filter(s => s.estado === 'rechazada');
        rejectedRequests.forEach(sol => {
            const emailKey = sol.email.toLowerCase();
            if (!processedEmails.has(emailKey)) {
                mergedList.push({
                    id: sol.id,
                    nombre: sol.nombre,
                    email: sol.email,
                    created_at: sol.created_at,
                    estado: 'rechazada',
                    isManual: false,
                    role: ''
                });
                processedEmails.add(emailKey);
            }
        });

        container.innerHTML = '';

        const pending = mergedList.filter(u => u.estado === 'pendiente');
        const others = mergedList.filter(u => u.estado !== 'pendiente');

        if (countEl) countEl.textContent = pending.length;

        if (mergedList.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Render pending first, then others
        [...pending, ...others].forEach(item => {
            container.appendChild(_renderCard(item));
        });
    }

    // ── Permissions Modal ─────────────────────────────────────────

    const PERM_KEYS = [
        'perm_dashboard', 'perm_entidades_crear', 'perm_entidades_tickets',
        'perm_biblioteca',
        'region_todas', 'region_ar', 'region_an', 'region_ll', 'region_sm',
        'edit_clasificacion', 'edit_notas_tecnicas', 'edit_tickets_seguimiento',
        'edit_datos_om',
        'view_cronograma_evento', 'view_cronograma_actividades'
    ];

    async function _openPermissionsModal(sol) {
        // Populate header
        document.getElementById('perm-modal-user-name').textContent = sol.nombre;
        document.getElementById('perm-modal-user-email').textContent = sol.email;
        const initials = sol.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('perm-modal-avatar').textContent = initials;

        // Load existing permissions or fall back to role preset
        const { data } = await window.supabaseDb
            .from('user_permissions')
            .select('*')
            .eq('user_email', sol.email)
            .maybeSingle();

        const presets = Permissions.getPresets();
        const current = data || presets[sol.role] || presets.editor;

        // Set checkbox states
        PERM_KEYS.forEach(key => {
            const el = document.querySelector(`#perm-modal input[name="${key}"]`);
            if (el) el.checked = current[key] !== false;
        });

        // Interactivity for Regions
        const cbTodas = document.querySelector('#perm-modal input[name="region_todas"]');
        const cbRegions = [
            document.querySelector('#perm-modal input[name="region_ar"]'),
            document.querySelector('#perm-modal input[name="region_an"]'),
            document.querySelector('#perm-modal input[name="region_ll"]'),
            document.querySelector('#perm-modal input[name="region_sm"]')
        ].filter(Boolean);

        if (cbTodas) {
            cbTodas.onchange = (e) => {
                if (e.target.checked) {
                    cbRegions.forEach(cb => cb.checked = true);
                }
            };
        }

        cbRegions.forEach(cb => {
            cb.onchange = (e) => {
                if (!e.target.checked && cbTodas) {
                    cbTodas.checked = false;
                }
            };
        });

        // Set preset selector to match saved preset or detect
        const presetSel = document.getElementById('perm-preset-select');
        let roleVal = (data && data.role_preset) ? data.role_preset : sol.role;
        // Compatibilidad con roles antiguos en base de datos
        if (roleVal === 'tecnico_om') roleVal = 'tecnico';
        
        presetSel.value = roleVal;

        // Wire save button
        document.getElementById('perm-save-btn').onclick = () => _savePermissions(sol);

        // Show modal
        document.getElementById('perm-modal').style.display = 'flex';
    }

    function _applyPreset(presetName) {
        const preset = Permissions.getPreset(presetName);
        if (!preset) return;
        PERM_KEYS.forEach(key => {
            const el = document.querySelector(`#perm-modal input[name="${key}"]`);
            if (el) el.checked = preset[key] !== false;
        });
    }

    async function _savePermissions(sol) {
        const saveBtn = document.getElementById('perm-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';

        const updates = {
            user_email: sol.email,
            role_preset: document.getElementById('perm-preset-select').value,
            updated_at: new Date().toISOString()
        };
        PERM_KEYS.forEach(key => {
            const el = document.querySelector(`#perm-modal input[name="${key}"]`);
            if (el) updates[key] = el.checked;
        });

        const { error } = await window.supabaseDb
            .from('user_permissions')
            .upsert(updates, { onConflict: 'user_email' });

        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Guardar Permisos';

        if (error) {
            Toast.show('❌ Error al guardar permisos: ' + error.message, 'error');
        } else {
            Toast.show(`✅ Permisos de "${sol.nombre}" actualizados correctamente.`, 'success');
            document.getElementById('perm-modal').style.display = 'none';
            if (sol.email === Auth.getUser()?.email) {
                setTimeout(() => window.location.reload(), 1000);
            }
        }
    }

    function _initPermissionsModal() {
        // Close button
        document.getElementById('perm-modal-close')?.addEventListener('click', () => {
            document.getElementById('perm-modal').style.display = 'none';
        });
        // Close on backdrop click
        document.getElementById('perm-modal')?.addEventListener('click', (e) => {
            if (e.target === document.getElementById('perm-modal')) {
                document.getElementById('perm-modal').style.display = 'none';
            }
        });
        // Cancel button
        document.getElementById('perm-cancel-btn')?.addEventListener('click', () => {
            document.getElementById('perm-modal').style.display = 'none';
        });
        // Preset selector
        document.getElementById('perm-preset-select')?.addEventListener('change', (e) => {
            if (e.target.value) _applyPreset(e.target.value);
        });
    }

    // ── Init ─────────────────────────────────────────────────
    function init() {
        if (!Auth.isAdmin()) return; // Guard: only admins
        _updateAdminBadge();
        _initPermissionsModal();
        window.addEventListener('langChanged', () => render());
    }

    return { init, render, updateBadge: _updateAdminBadge, openPermissions: _openPermissionsModal };
})();
